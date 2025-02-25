const { Collection, PermissionsBitField } = require('discord.js');
const logger = require('./logger');

class AntiRaidSystem {
    constructor() {
        this.joinedMembers = new Collection();
        this.spamCache = new Collection();
        this.warnedUsers = new Collection();
        this.raidMode = false;
        this.joinThreshold = 5; // Number of joins within timeframe to trigger raid mode
        this.joinTimeframe = 10000; // Timeframe in milliseconds (10 seconds)
        this.messageSpamThreshold = 5; // Number of messages within timeframe to be considered spam
        this.messageTimeframe = 5000; // Message timeframe in milliseconds (5 seconds)
    }

    async checkJoinRaid(member) {
        const now = Date.now();
        this.joinedMembers.set(member.id, now);

        // Clean up old entries
        this.joinedMembers.sweep(timestamp => now - timestamp > this.joinTimeframe);

        // Check for bot joins
        if (member.user.bot) {
            await this.handleBotJoin(member);
            return true;
        }

        if (this.joinedMembers.size >= this.joinThreshold) {
            this.enableRaidMode(member.guild);
            return true;
        }
        return false;
    }

    async handleBotJoin(botMember) {
        try {
            const guild = botMember.guild;
            const botAddAuditLog = (await guild.fetchAuditLogs({
                type: 'BOT_ADD',
                limit: 1
            })).entries.first();

            const addedBy = botAddAuditLog?.executor;
            if (!addedBy) return;

            // Check if the user who added the bot is the owner
            if (addedBy.id !== guild.ownerId) {
                // Strip bot's permissions
                await this.stripBotPermissions(botMember);

                // Notify owner and admins
                await this.notifyAdmins(guild, botMember, addedBy);

                logger.warn(`Unauthorized bot ${botMember.user.tag} added by ${addedBy.tag} in ${guild.name}`);
            }
        } catch (error) {
            logger.error('Error handling bot join:', error);
        }
    }

    async stripBotPermissions(botMember) {
        try {
            // Remove all roles except the everyone role
            const roles = botMember.roles.cache.filter(role => role.id !== botMember.guild.id);
            await botMember.roles.remove(roles);

            logger.info(`Stripped roles from bot ${botMember.user.tag} in ${botMember.guild.name}`);
        } catch (error) {
            logger.error('Error stripping bot permissions:', error);
        }
    }

    async notifyAdmins(guild, botMember, addedBy) {
        const message = `🚨 **Security Alert**\n\nUnauthorized bot addition detected:\n` +
            `Bot: ${botMember.user.tag} (${botMember.id})\n` +
            `Added by: ${addedBy.tag} (${addedBy.id})\n\n` +
            `Action taken: All roles and permissions have been removed from the bot.\n` +
            `Please review this bot's permissions and roles if you want to authorize it.`;

        try {
            // DM owner
            const owner = await guild.fetchOwner();
            await owner.send(message).catch(() => {});

            // DM admins
            const adminRole = guild.roles.cache.find(role => 
                role.permissions.has(PermissionsBitField.Flags.Administrator)
            );
            if (adminRole) {
                const admins = adminRole.members.filter(m => !m.user.bot);
                for (const [, admin] of admins) {
                    if (admin.id !== owner.id) {
                        await admin.send(message).catch(() => {});
                    }
                }
            }
        } catch (error) {
            logger.error('Error notifying admins:', error);
        }
    }

    async enableRaidMode(guild) {
        if (this.raidMode) return;

        this.raidMode = true;
        logger.warn(`Raid mode enabled in guild ${guild.name}`);

        try {
            await guild.setVerificationLevel('HIGH');
            const logChannel = guild.channels.cache.find(c => c.name === 'mod-logs');
            if (logChannel) {
                logChannel.send('🚨 **RAID MODE ENABLED** - High join rate or unauthorized bot detected!');
            }
        } catch (error) {
            logger.error('Error enabling raid mode:', error);
        }

        // Disable raid mode after 5 minutes
        setTimeout(() => this.disableRaidMode(guild), 300000);
    }

    async disableRaidMode(guild) {
        if (!this.raidMode) return;

        this.raidMode = false;
        this.joinedMembers.clear();
        logger.info(`Raid mode disabled in guild ${guild.name}`);

        try {
            await guild.setVerificationLevel('MEDIUM');
            const logChannel = guild.channels.cache.find(c => c.name === 'mod-logs');
            if (logChannel) {
                logChannel.send('✅ Raid mode disabled - returning to normal operations');
            }
        } catch (error) {
            logger.error('Error disabling raid mode:', error);
        }
    }

    checkSpam(message) {
        if (message.member.permissions.has('ADMINISTRATOR')) return false;

        const now = Date.now();
        const userMessages = this.spamCache.get(message.author.id) || [];
        userMessages.push(now);

        // Clean up old messages
        const recentMessages = userMessages.filter(timestamp => now - timestamp < this.messageTimeframe);
        this.spamCache.set(message.author.id, recentMessages);

        return recentMessages.length > this.messageSpamThreshold;
    }

    async handleSpam(message) {
        const warnsCount = this.warnedUsers.get(message.author.id) || 0;
        this.warnedUsers.set(message.author.id, warnsCount + 1);

        if (warnsCount >= 2) {
            try {
                await message.member.timeout(300000, 'Spam detection');
                message.channel.send(`${message.author} has been timed out for spamming.`);
            } catch (error) {
                logger.error('Error timing out member:', error);
            }
        } else {
            message.channel.send(`${message.author} please stop spamming! Warning ${warnsCount + 1}/3`);
        }

        // Clean up messages if possible
        try {
            const messages = await message.channel.messages.fetch({ 
                limit: 10, 
                author: message.author.id 
            });
            await message.channel.bulkDelete(messages);
        } catch (error) {
            logger.error('Error cleaning spam messages:', error);
        }
    }
}

module.exports = new AntiRaidSystem();