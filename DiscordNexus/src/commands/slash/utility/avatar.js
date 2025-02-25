const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors } = require('../../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Display user\'s avatar')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user whose avatar you want to see')
                .setRequired(false)),

    async execute(interaction) {
        const target = interaction.options.getUser('target') || interaction.user;
        
        const embed = new EmbedBuilder()
            .setColor(Colors.INFO)
            .setTitle(`${target.username}'s Avatar`)
            .setImage(target.displayAvatarURL({ size: 1024, dynamic: true }))
            .setFooter({ text: `Requested by ${interaction.user.tag}` });

        await interaction.reply({ embeds: [embed] });
    }
};
