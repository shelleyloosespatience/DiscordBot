const { SlashCommandBuilder } = require('@discordjs/builders');
const { Colors, Messages } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the paused song'),

    async execute(interaction) {
        try {
            const queue = interaction.client.distube.getQueue(interaction.guildId);
            const voiceChannel = interaction.member.voice.channel;

            logger.info(`Resume command triggered - Guild: ${interaction.guildId}`);

            if (!voiceChannel) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ You need to be in a voice channel!'
                    }],
                    ephemeral: true
                });
            }

            if (!queue) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ There is nothing to resume!'
                    }],
                    ephemeral: true
                });
            }

            if (!queue.paused) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ The music is already playing!'
                    }],
                    ephemeral: true
                });
            }

            queue.resume();
            await interaction.reply({
                embeds: [{
                    color: Colors.SUCCESS,
                    description: '▶️ Resumed the music!'
                }]
            });
        } catch (error) {
            logger.error('Error in resume command:', error);
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