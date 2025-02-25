const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors, Messages } = require('../../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Ask the magic 8ball a question')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The question you want to ask')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const responses = [
                "It is certain.",
                "It is decidedly so.",
                "Without a doubt.",
                "Yes definitely.",
                "You may rely on it.",
                "As I see it, yes.",
                "Most likely.",
                "Outlook good.",
                "Yes.",
                "Signs point to yes.",
                "Reply hazy, try again.",
                "Ask again later.",
                "Better not tell you now.",
                "Cannot predict now.",
                "Concentrate and ask again.",
                "Don't count on it.",
                "My reply is no.",
                "My sources say no.",
                "Outlook not so good.",
                "Very doubtful."
            ];

            const question = interaction.options.getString('question');
            const response = responses[Math.floor(Math.random() * responses.length)];

            const embed = new EmbedBuilder()
                .setColor(Colors.INFO)
                .setTitle('🎱 Magic 8Ball')
                .addFields(
                    { name: 'Question', value: question },
                    { name: 'Answer', value: response }
                )
                .setFooter({ text: `Asked by ${interaction.user.tag}` });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in 8ball command:', error);
            await interaction.reply({
                content: Messages.ERROR,
                ephemeral: true
            });
        }
    }
};