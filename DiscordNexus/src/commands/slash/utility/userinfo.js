const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors } = require('../../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display information about a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to get info about')
                .setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getUser('target') || interaction.user;
        const member = await interaction.guild.members.fetch(target.id);

        const embed = new EmbedBuilder()
            .setColor(Colors.INFO)
            .setTitle('User Information')
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: 'Username', value: target.tag, inline: true },
                { name: 'ID', value: target.id, inline: true },
                { name: 'Joined Server', value: member.joinedAt.toLocaleDateString(), inline: true },
                { name: 'Account Created', value: target.createdAt.toLocaleDateString(), inline: true },
                { name: 'Roles', value: member.roles.cache.map(role => role.name).join(', ') }
            );

        await interaction.reply({ embeds: [embed] });
    }
};
