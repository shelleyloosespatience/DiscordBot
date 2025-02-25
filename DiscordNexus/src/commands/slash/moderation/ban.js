const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const { Colors, Messages } = require('../../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the ban'))
        .addNumberOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete')
                .setMinValue(0)
                .setMaxValue(7)),

    async execute(interaction) {
        try {
            // Check if user has permission to ban
            if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ You do not have permission to ban members.'
                    }],
                    ephemeral: true
                });
            }

            const target = interaction.options.getMember('target');
            const reason = interaction.options.getString('reason') || 'No reason provided';
            const days = interaction.options.getNumber('days') || 0;

            // Check if target is valid
            if (!target) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ Could not find that member.'
                    }],
                    ephemeral: true
                });
            }

            // Check if target is banable
            if (!target.bannable) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ I cannot ban this user. They may have a higher role than me.'
                    }],
                    ephemeral: true
                });
            }

            // Check if user is trying to ban themselves
            if (target.id === interaction.user.id) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ You cannot ban yourself.'
                    }],
                    ephemeral: true
                });
            }

            // Execute ban
            await target.ban({ reason: reason, deleteMessageDays: days });

            // Send success message
            await interaction.reply({
                embeds: [{
                    color: Colors.SUCCESS,
                    description: `✅ Successfully banned ${target.user.tag}\nReason: ${reason}`
                }]
            });

            // Log the ban if possible
            const logChannel = interaction.guild.channels.cache.find(
                channel => channel.name === 'mod-logs'
            );

            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        color: Colors.WARNING,
                        title: '🔨 Member Banned',
                        description: `**Member:** ${target.user.tag} (${target.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}\n**Message History Deleted:** ${days} days`,
                        timestamp: new Date()
                    }]
                });
            }
        } catch (error) {
            console.error('Error in ban command:', error);
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
