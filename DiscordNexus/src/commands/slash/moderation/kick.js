const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const { Colors, Messages } = require('../../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')),

    async execute(interaction) {
        try {
            // Check if user has permission to kick
            if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ You do not have permission to kick members.'
                    }],
                    ephemeral: true
                });
            }

            const target = interaction.options.getMember('target');
            const reason = interaction.options.getString('reason') || 'No reason provided';

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

            // Check if target is kickable
            if (!target.kickable) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ I cannot kick this user. They may have a higher role than me.'
                    }],
                    ephemeral: true
                });
            }

            // Check if user is trying to kick themselves
            if (target.id === interaction.user.id) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ You cannot kick yourself.'
                    }],
                    ephemeral: true
                });
            }

            // Execute kick
            await target.kick(reason);

            // Send success message
            await interaction.reply({
                embeds: [{
                    color: Colors.SUCCESS,
                    description: `✅ Successfully kicked ${target.user.tag}\nReason: ${reason}`
                }]
            });

            // Log the kick if possible
            const logChannel = interaction.guild.channels.cache.find(
                channel => channel.name === 'mod-logs'
            );

            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        color: Colors.WARNING,
                        title: '👢 Member Kicked',
                        description: `**Member:** ${target.user.tag} (${target.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`,
                        timestamp: new Date()
                    }]
                });
            }
        } catch (error) {
            console.error('Error in kick command:', error);
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
