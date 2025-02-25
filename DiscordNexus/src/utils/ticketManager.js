const fs = require('fs').promises;
const path = require('path');
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { Colors } = require('./constants');
const ticketConfig = require('./ticketConfig');

class TicketManager {
    constructor() {
        this.tickets = new Map();
        this.dataPath = path.join(process.cwd(), 'data', 'tickets.json');
        this.client = null;
        this.init();
    }

    async init() {
        try {
            await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
            await fs.mkdir(path.join(process.cwd(), 'data', 'transcripts'), { recursive: true });
            await this.loadTickets();
        } catch (error) {
            console.error('Error initializing TicketManager:', error);
        }
    }

    setClient(client) {
        this.client = client;
    }

    async loadTickets() {
        try {
            const data = await fs.readFile(this.dataPath, 'utf-8');
            const tickets = JSON.parse(data);
            this.tickets = new Map(Object.entries(tickets));
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error loading tickets:', error);
            }
            await this.saveTickets();
        }
    }

    async saveTickets() {
        try {
            const ticketData = Object.fromEntries(this.tickets);
            await fs.mkdir(path.dirname(this.dataPath), { recursive: true });
            await fs.writeFile(this.dataPath, JSON.stringify(ticketData, null, 2));
        } catch (error) {
            console.error('Error saving tickets:', error);
        }
    }

    createTicketEmbed(guild, user, description, claimed = false, claimedBy = null) {
        const config = ticketConfig.getGuildConfig(guild.id);
        const embed = new EmbedBuilder()
            .setColor(config.embedSettings.color || Colors.INFO)
            .setTitle('🎫 Support Ticket')
            .setDescription(description)
            .addFields(
                { name: 'Created by', value: user.tag, inline: true },
                { name: 'Status', value: claimed ? `📌 Claimed by ${claimedBy.tag}` : '📖 Open', inline: true }
            )
            .setTimestamp();

        if (guild.iconURL()) {
            embed.setThumbnail(guild.iconURL());
        }

        return embed;
    }

    createTicketButtons(claimed = false) {
        const buttons = [];

        if (!claimed) {
            buttons.push(
                new ButtonBuilder()
                    .setCustomId('ticket_claim')
                    .setLabel('Claim Ticket')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📌')
            );
        }

        buttons.push(
            new ButtonBuilder()
                .setCustomId('ticket_close')
                .setLabel('Close Ticket')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🔒'),
            new ButtonBuilder()
                .setCustomId('ticket_transcript')
                .setLabel('Save Transcript')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('📑')
        );

        return new ActionRowBuilder().addComponents(buttons);
    }

    async createSetupMessage(channel, config) {
        const embed = new EmbedBuilder()
            .setColor(config.embedSettings.color)
            .setTitle(config.embedSettings.title)
            .setDescription(config.embedSettings.description);

        if (channel.guild.iconURL()) {
            embed.setThumbnail(channel.guild.iconURL());
        }

        const button = new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel(config.buttonSettings.label)
            .setStyle(ButtonStyle.Primary)
            .setEmoji(config.buttonSettings.emoji);

        const row = new ActionRowBuilder().addComponents(button);

        return await channel.send({ embeds: [embed], components: [row] });
    }

    async createTicket(guild, user, reason) {
        try {
            const config = ticketConfig.getGuildConfig(guild.id);
            const ticketCount = Array.from(this.tickets.values())
                .filter(t => t.guildId === guild.id).length + 1;

            const channelName = config.ticketSettings.nameFormat.replace('{number}', ticketCount);

            const permissionOverwrites = [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                    ],
                },
                {
                    id: this.client?.user?.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory,
                        PermissionFlagsBits.ManageChannels,
                    ],
                }
            ];

            // Add support role permissions
            if (config.supportRoles) {
                for (const roleId of config.supportRoles) {
                    permissionOverwrites.push({
                        id: roleId,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                        ],
                    });
                }
            }

            const ticketChannel = await guild.channels.create({
                name: channelName,
                type: 0,
                permissionOverwrites
            });

            const embed = this.createTicketEmbed(guild, user, reason);
            const buttons = this.createTicketButtons();

            const message = await ticketChannel.send({
                content: config.supportRoles ? config.supportRoles.map(role => `<@&${role}>`).join(' ') : null,
                embeds: [embed],
                components: [buttons]
            });

            this.tickets.set(ticketChannel.id, {
                userId: user.id,
                channelId: ticketChannel.id,
                guildId: guild.id,
                reason,
                messages: [],
                status: 'open',
                createdAt: Date.now(),
                messageId: message.id,
                claimed: false,
                claimedBy: null
            });

            await this.saveTickets();
            return ticketChannel;
        } catch (error) {
            console.error('Error creating ticket:', error);
            throw error;
        }
    }

    async claimTicket(channelId, staff) {
        const ticket = this.tickets.get(channelId);
        if (!ticket || ticket.claimed) return false;

        ticket.claimed = true;
        ticket.claimedBy = staff.id;

        const channel = await this.client.channels.fetch(channelId);
        if (!channel) return false;

        const message = await channel.messages.fetch(ticket.messageId);
        if (!message) return false;

        const embed = this.createTicketEmbed(
            channel.guild,
            await this.client.users.fetch(ticket.userId),
            ticket.reason,
            true,
            staff
        );

        const buttons = this.createTicketButtons(true);

        await message.edit({ embeds: [embed], components: [buttons] });
        await this.saveTickets();

        return true;
    }

    async closeTicket(channelId) {
        try {
            const ticket = this.tickets.get(channelId);
            if (!ticket) return false;

            // Save transcript before closing
            const transcriptPath = await this.saveTranscript(channelId);

            if (transcriptPath) {
                const guild = await this.client.guilds.fetch(ticket.guildId);
                const config = ticketConfig.getGuildConfig(guild.id);

                if (config.transcriptChannel) {
                    const transcriptChannel = await guild.channels.fetch(config.transcriptChannel);
                    if (transcriptChannel) {
                        const transcriptContent = await fs.readFile(transcriptPath, 'utf-8');
                        const transcriptData = JSON.parse(transcriptContent);

                        const transcriptEmbed = new EmbedBuilder()
                            .setColor(Colors.INFO)
                            .setTitle(`Ticket Transcript - #${ticket.channelId}`)
                            .setDescription(`Ticket created by <@${ticket.userId}>`)
                            .addFields(
                                { name: 'Reason', value: ticket.reason },
                                { name: 'Status', value: 'Closed' },
                                { name: 'Created At', value: new Date(ticket.createdAt).toLocaleString() }
                            );

                        await transcriptChannel.send({
                            embeds: [transcriptEmbed],
                            files: [transcriptPath]
                        });
                    }
                }
            }

            ticket.status = 'closed';
            await this.saveTickets();
            return true;
        } catch (error) {
            console.error('Error closing ticket:', error);
            return false;
        }
    }

    async saveTranscript(channelId) {
        try {
            if (!this.client) {
                throw new Error('Discord client not initialized in TicketManager');
            }

            const ticket = this.tickets.get(channelId);
            if (!ticket) return null;

            const channel = await this.client.channels.fetch(channelId);
            if (!channel) return null;

            const messages = await channel.messages.fetch();
            const transcript = Array.from(messages.values())
                .reverse()
                .map(msg => ({
                    author: msg.author.tag,
                    content: msg.content,
                    timestamp: msg.createdAt.toISOString(),
                    attachments: Array.from(msg.attachments.values()).map(a => a.url),
                }));

            const transcriptDir = path.join(process.cwd(), 'data', 'transcripts');
            await fs.mkdir(transcriptDir, { recursive: true });

            const transcriptPath = path.join(transcriptDir, `ticket-${channelId}.json`);
            await fs.writeFile(transcriptPath, JSON.stringify({
                ticketInfo: ticket,
                messages: transcript,
            }, null, 2));

            return transcriptPath;
        } catch (error) {
            console.error('Error saving transcript:', error);
            return null;
        }
    }
}

module.exports = new TicketManager();