const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const { Colors, Messages } = require('../../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout (mute) a member')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The member to timeout')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('Timeout duration (e.g., 1h, 30m, 1d)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the timeout')),

    async execute(interaction) {
        try {
            // Check if user has permission to moderate members
            if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ You do not have permission to timeout members.'
                    }],
                    ephemeral: true
                });
            }

            const target = interaction.options.getMember('target');
            const durationStr = interaction.options.getString('duration');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Parse duration
            const durationRegex = /^(\d+)([mhd])$/;
            const match = durationStr.match(durationRegex);

            if (!match) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ Invalid duration format. Use something like 1h, 30m, or 1d.'
                    }],
                    ephemeral: true
                });
            }

            const [, amount, unit] = match;
            const multiplier = {
                'm': 60 * 1000,
                'h': 60 * 60 * 1000,
                'd': 24 * 60 * 60 * 1000
            };

            const duration = parseInt(amount) * multiplier[unit];
            if (duration > 28 * 24 * 60 * 60 * 1000) { // Max 28 days per Discord's limit
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ Timeout duration cannot exceed 28 days.'
                    }],
                    ephemeral: true
                });
            }

            // Check if target is valid and can be timed out
            if (!target) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ Could not find that member.'
                    }],
                    ephemeral: true
                });
            }

            if (!target.moderatable) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ I cannot timeout this user. They may have a higher role than me.'
                    }],
                    ephemeral: true
                });
            }

            if (target.id === interaction.user.id) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ You cannot timeout yourself.'
                    }],
                    ephemeral: true
                });
            }

            // Execute timeout
            await target.timeout(duration, reason);

            // Send success message
            await interaction.reply({
                embeds: [{
                    color: Colors.SUCCESS,
                    description: `✅ Successfully timed out ${target.user.tag} for ${amount}${unit}\nReason: ${reason}`
                }]
            });

            // Log the timeout if possible
            const logChannel = interaction.guild.channels.cache.find(
                channel => channel.name === 'mod-logs'
            );

            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        color: Colors.WARNING,
                        title: '🔇 Member Timed Out',
                        description: `**Member:** ${target.user.tag} (${target.id})\n**Moderator:** ${interaction.user.tag}\n**Duration:** ${amount}${unit}\n**Reason:** ${reason}`,
                        timestamp: new Date()
                    }]
                });
            }
        } catch (error) {
            console.error('Error in timeout command:', error);
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
