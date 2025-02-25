const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const { Colors, Messages } = require('../../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Manage channel settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Lock a channel')
                .addChannelOption(option =>
                    option.setName('target')
                        .setDescription('The channel to lock (defaults to current channel)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for locking the channel')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Unlock a channel')
                .addChannelOption(option =>
                    option.setName('target')
                        .setDescription('The channel to unlock (defaults to current channel)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for unlocking the channel'))),

    async execute(interaction) {
        try {
            // Check if user has permission to manage channels
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ You do not have permission to manage channels.'
                    }],
                    ephemeral: true
                });
            }

            const subcommand = interaction.options.getSubcommand();
            const targetChannel = interaction.options.getChannel('target') || interaction.channel;
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Check if bot has permission to manage the target channel
            if (!targetChannel.manageable) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ I cannot manage this channel. I may not have the required permissions.'
                    }],
                    ephemeral: true
                });
            }

            const everyoneRole = interaction.guild.roles.everyone;

            if (subcommand === 'lock') {
                await targetChannel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false,
                    AddReactions: false
                });

                await interaction.reply({
                    embeds: [{
                        color: Colors.SUCCESS,
                        description: `🔒 Channel ${targetChannel} has been locked.\nReason: ${reason}`
                    }]
                });
            } else if (subcommand === 'unlock') {
                await targetChannel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: null,
                    AddReactions: null
                });

                await interaction.reply({
                    embeds: [{
                        color: Colors.SUCCESS,
                        description: `🔓 Channel ${targetChannel} has been unlocked.\nReason: ${reason}`
                    }]
                });
            }

            // Log the action if possible
            const logChannel = interaction.guild.channels.cache.find(
                channel => channel.name === 'mod-logs'
            );

            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        color: Colors.WARNING,
                        title: `🔧 Channel ${subcommand === 'lock' ? 'Locked' : 'Unlocked'}`,
                        description: `**Channel:** ${targetChannel}\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`,
                        timestamp: new Date()
                    }]
                });
            }
        } catch (error) {
            console.error('Error in channel command:', error);
            await interaction.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: Messages.ERROR
                }],
                ephemeral: true
            });
        }
    }
};
