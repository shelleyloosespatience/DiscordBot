const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors, Messages } = require('../../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Create a poll')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The poll question')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('options')
                .setDescription('Poll options (separate with commas)')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const question = interaction.options.getString('question');
            const options = interaction.options.getString('options').split(',').map(opt => opt.trim());

            if (options.length < 2 || options.length > 10) {
                return interaction.reply({
                    content: 'Please provide between 2 and 10 options.',
                    ephemeral: true
                });
            }

            const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            const pollOptions = options.map((opt, i) => `${emojis[i]} ${opt}`).join('\n\n');

            const embed = new EmbedBuilder()
                .setColor(Colors.INFO)
                .setTitle('📊 Poll: ' + question)
                .setDescription(pollOptions)
                .setFooter({ text: `Created by ${interaction.user.tag}` });

            const message = await interaction.reply({ embeds: [embed], fetchReply: true });

            // Add reaction options
            for (let i = 0; i < options.length; i++) {
                await message.react(emojis[i]);
            }
        } catch (error) {
            console.error('Error in poll command:', error);
            await interaction.reply({
                content: Messages.ERROR,
                ephemeral: true
            });
        }
    }
};