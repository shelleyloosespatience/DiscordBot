const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors } = require('../../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('When to remind you (e.g., 1h, 30m)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reminder')
                .setDescription('What to remind you about')
                .setRequired(true)),

    async execute(interaction) {
        const timeStr = interaction.options.getString('time');
        const reminder = interaction.options.getString('reminder');

        // Parse time
        const timeRegex = /^(\d+)([mhd])$/;
        const match = timeStr.match(timeRegex);

        if (!match) {
            return interaction.reply({
                content: 'Invalid time format. Use something like 1h, 30m, or 2d.',
                ephemeral: true
            });
        }

        const [, amount, unit] = match;
        const multiplier = {
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        };

        const ms = parseInt(amount) * multiplier[unit];
        if (ms > 7 * 24 * 60 * 60 * 1000) { // Max 1 week
            return interaction.reply({
                content: 'Reminder time cannot exceed 1 week.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.SUCCESS)
            .setTitle('⏰ Reminder Set')
            .setDescription(`I'll remind you about: ${reminder}`)
            .addFields({ name: 'Time', value: `In ${amount}${unit}` })
            .setFooter({ text: `Requested by ${interaction.user.tag}` });

        await interaction.reply({ embeds: [embed] });

        // Set the reminder
        setTimeout(async () => {
            const reminderEmbed = new EmbedBuilder()
                .setColor(Colors.INFO)
                .setTitle('⏰ Reminder!')
                .setDescription(reminder)
                .setFooter({ text: `Set ${timeStr} ago` });

            await interaction.user.send({ embeds: [reminderEmbed] }).catch(() => {
                interaction.channel.send({
                    content: `<@${interaction.user.id}>`,
                    embeds: [reminderEmbed]
                });
            });
        }, ms);
    }
};
