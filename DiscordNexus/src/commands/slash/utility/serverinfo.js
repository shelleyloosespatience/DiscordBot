const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors, Messages } = require('../../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display information about the server'),

    async execute(interaction) {
        try {
            const { guild } = interaction;

            const totalMembers = guild.memberCount;
            const totalChannels = guild.channels.cache.size;
            const totalRoles = guild.roles.cache.size;
            const serverCreated = guild.createdAt.toLocaleDateString();

            const embed = new EmbedBuilder()
                .setColor(Colors.INFO)
                .setTitle(`${guild.name} Server Information`)
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .addFields(
                    { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
                    { name: '👥 Members', value: totalMembers.toString(), inline: true },
                    { name: '📜 Roles', value: totalRoles.toString(), inline: true },
                    { name: '💬 Channels', value: totalChannels.toString(), inline: true },
                    { name: '🌍 Region', value: guild.preferredLocale, inline: true },
                    { name: '📅 Created On', value: serverCreated, inline: true },
                    { name: '🔒 Verification Level', value: guild.verificationLevel.toString().toLowerCase(), inline: true },
                    { name: '💎 Boost Level', value: `Level ${guild.premiumTier}`, inline: true },
                    { name: '🚀 Boosts', value: guild.premiumSubscriptionCount.toString(), inline: true }
                )
                .setFooter({ text: `Server ID: ${guild.id}` });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in serverinfo command:', error);
            await interaction.reply({
                content: Messages.ERROR,
                ephemeral: true
            });
        }
    }
};