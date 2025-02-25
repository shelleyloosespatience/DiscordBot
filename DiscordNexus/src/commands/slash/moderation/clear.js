const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord.js');
const { Colors, Messages } = require('../../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear messages from the channel')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to clear')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),

    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ You do not have permission to manage messages.'
                    }],
                    ephemeral: true
                });
            }

            const amount = interaction.options.getInteger('amount');

            const deleted = await interaction.channel.bulkDelete(amount, true);

            await interaction.reply({
                embeds: [{
                    color: Colors.SUCCESS,
                    description: `✅ Successfully deleted ${deleted.size} messages.`
                }],
                ephemeral: true
            });

            const logChannel = interaction.guild.channels.cache.find(
                channel => channel.name === 'mod-logs'
            );

            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        color: Colors.WARNING,
                        title: '🗑️ Messages Cleared',
                        description: `**Channel:** ${interaction.channel}\n**Moderator:** ${interaction.user.tag}\n**Amount:** ${deleted.size} messages`,
                        timestamp: new Date()
                    }]
                });
            }
        } catch (error) {
            console.error('Error in clear command:', error);
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