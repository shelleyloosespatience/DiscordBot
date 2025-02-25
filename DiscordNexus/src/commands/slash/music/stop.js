const { SlashCommandBuilder } = require('@discordjs/builders');
const { Colors, Messages } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music and clear the queue'),

    async execute(interaction) {
        try {
            const queue = interaction.client.distube.getQueue(interaction.guildId);
            const voiceChannel = interaction.member.voice.channel;

            logger.info(`Stop command triggered - Guild: ${interaction.guildId}`);

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

            await queue.stop();
            await interaction.reply({
                embeds: [{
                    color: Colors.SUCCESS,
                    description: '⏹️ Stopped the music and cleared the queue!'
                }]
            });
        } catch (error) {
            logger.error('Error in stop command:', error);
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