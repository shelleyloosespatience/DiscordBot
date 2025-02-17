const { Collection, PermissionsBitField } = require('discord.js');
const path = require('path');
const fs = require('fs/promises');
const winston = require('winston'); // For better logging

class AntiRaidManager {
    constructor() {
        this.CONFIG_PATH = path.join(process.cwd(), 'data', 'antiraid-config.json');
        this.activityTrackers = new Collection();
        this.cooldowns = new Collection();
        
        // Setup logger
        this.logger = winston.createLogger({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ filename: 'logs/antiraid.log' }),
                new winston.transports.Console()
            ]
        });

        // Default configuration
        this.defaultConfig = {
            enabled: false,
            thresholds: {
                channelDelete: { limit: 3, window: 300000 }, // 5 minutes
                roleDelete: { limit: 2, window: 300000 },
                memberBan: { limit: 3, window: 600000 }, // 10 minutes
                memberKick: { limit: 3, window: 600000 }
            },
            action: {
                type: 'ban',
                duration: 86400000, // 1 day in ms
                notifyChannel: null
            },
            whitelist: [],
            lockdown: {
                enabled: false,
                threshold: 5,
                duration: 1800000 // 30 minutes
            }
        };

        this.config = { guilds: {} };
    }

    async initialize() {
        try {
            await this.loadConfig();
            // Clean up old data every 15 minutes
            setInterval(() => this.cleanupOldData(), 900000);
            this.logger.info('AntiRaid system initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize AntiRaid system:', error);
            throw error;
        }
    }

    async loadConfig() {
        try {
            const data = await fs.readFile(this.CONFIG_PATH, 'utf8');
            this.config = JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                await this.saveConfig();
            } else {
                this.logger.error('Error loading config:', error);
                throw error;
            }
        }
    }

    async saveConfig() {
        try {
            await fs.mkdir(path.dirname(this.CONFIG_PATH), { recursive: true });
            await fs.writeFile(this.CONFIG_PATH, JSON.stringify(this.config, null, 2));
        } catch (error) {
            this.logger.error('Error saving config:', error);
            throw error;
        }
    }

    getGuildConfig(guildId) {
        if (!this.config.guilds[guildId]) {
            this.config.guilds[guildId] = JSON.parse(JSON.stringify(this.defaultConfig));
        }
        return this.config.guilds[guildId];
    }

    getActivityTracker(guildId, userId, actionType) {
        const key = `${guildId}-${userId}-${actionType}`;
        if (!this.activityTrackers.has(key)) {
            this.activityTrackers.set(key, {
                count: 0,
                actions: [],
                lastReset: Date.now()
            });
        }
        return this.activityTrackers.get(key);
    }

    async handleRaidAction(guild, executor, actionType, targetId) {
        if (!guild || !executor) return;

        const config = this.getGuildConfig(guild.id);
        if (!config.enabled) return;

        // Check whitelist
        if (config.whitelist.includes(executor.id)) return;

        const tracker = this.getActivityTracker(guild.id, executor.id, actionType);
        const threshold = config.thresholds[actionType];

        // Add action to tracker
        tracker.actions.push({
            timestamp: Date.now(),
            targetId: targetId
        });

        // Clean old actions
        tracker.actions = tracker.actions.filter(action => 
            action.timestamp > Date.now() - threshold.window
        );

        // Check if threshold exceeded
        if (tracker.actions.length >= threshold.limit) {
            await this.punishRaider(guild, executor, actionType, config);
            if (this.shouldEnableLockdown(guild.id)) {
                await this.enableLockdown(guild);
            }
        }
    }

    async punishRaider(guild, member, actionType, config) {
        if (!guild.members.me.permissions.has(PermissionsBitField.Flags.Administrator)) {
            this.logger.warn(`Missing permissions to punish raider in guild ${guild.id}`);
            return;
        }

        try {
            const reason = `AntiRaid: Multiple ${actionType} actions detected`;
            
            switch (config.action.type) {
                case 'ban':
                    await member.ban({ reason });
                    break;
                case 'kick':
                    await member.kick(reason);
                    break;
                case 'timeout':
                    await member.timeout(config.action.duration, reason);
                    break;
            }

            // Notify if channel is set
            if (config.action.notifyChannel) {
                const channel = await guild.channels.fetch(config.action.notifyChannel);
                if (channel?.isText()) {
                    await channel.send({
                        embeds: [{
                            color: 0xFF0000,
                            title: '🛡️ Anti-Raid Action Taken',
                            description: `User ${member.user.tag} was ${config.action.type}ned for suspicious activity`,
                            fields: [
                                { name: 'Action Type', value: actionType, inline: true },
                                { name: 'Punishment', value: config.action.type, inline: true }
                            ],
                            timestamp: new Date()
                        }]
                    });
                }
            }

            this.logger.info('Anti-raid action taken', {
                guildId: guild.id,
                userId: member.id,
                action: config.action.type,
                actionType
            });

        } catch (error) {
            this.logger.error('Failed to execute punishment:', error);
        }
    }

    shouldEnableLockdown(guildId) {
        const recentIncidents = Array.from(this.activityTrackers.values())
            .filter(tracker => 
                tracker.actions.some(action => 
                    action.timestamp > Date.now() - 300000 // Last 5 minutes
                )
            );

        return recentIncidents.length >= this.getGuildConfig(guildId).lockdown.threshold;
    }

    async enableLockdown(guild) {
        const config = this.getGuildConfig(guild.id);
        if (!config.lockdown.enabled) return;

        try {
            // Enable server lockdown
            await Promise.all(guild.channels.cache.map(async channel => {
                if (channel.isText() || channel.isVoice()) {
                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: false,
                        Connect: false
                    });
                }
            }));

            // Schedule lockdown removal
            setTimeout(() => this.disableLockdown(guild), config.lockdown.duration);

            this.logger.info(`Lockdown enabled in guild ${guild.id}`);
        } catch (error) {
            this.logger.error('Failed to enable lockdown:', error);
        }
    }

    async disableLockdown(guild) {
        try {
            await Promise.all(guild.channels.cache.map(async channel => {
                if (channel.isText() || channel.isVoice()) {
                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: null,
                        Connect: null
                    });
                }
            }));

            this.logger.info(`Lockdown disabled in guild ${guild.id}`);
        } catch (error) {
            this.logger.error('Failed to disable lockdown:', error);
        }
    }

    cleanupOldData() {
        const now = Date.now();
        this.activityTrackers.forEach((tracker, key) => {
            if (now - tracker.lastReset > 3600000) { // 1 hour
                this.activityTrackers.delete(key);
            }
        });
    }
}

module.exports = new AntiRaidManager();