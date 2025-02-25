const { SlashCommandBuilder } = require('@discordjs/builders');
const { Colors, Messages } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current song'),

    async execute(interaction) {
        try {
            const queue = interaction.client.distube.getQueue(interaction.guildId);
            const voiceChannel = interaction.member.voice.channel;

            logger.info(`Pause command triggered - Guild: ${interaction.guildId}`);

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
                        description: '❌ There is nothing playing!'
                    }],
                    ephemeral: true
                });
            }

            if (queue.paused) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ The music is already paused!'
                    }],
                    ephemeral: true
                });
            }

            queue.pause();
            await interaction.reply({
                embeds: [{
                    color: Colors.SUCCESS,
                    description: '⏸️ Paused the music!'
                }]
            });
        } catch (error) {
            logger.error('Error in pause command:', error);
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