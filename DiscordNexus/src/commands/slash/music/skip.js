const { SlashCommandBuilder } = require('@discordjs/builders');
const { Colors, Messages } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip the current song'),

    async execute(interaction) {
        try {
            const queue = interaction.client.distube.getQueue(interaction.guildId);
            const voiceChannel = interaction.member.voice.channel;

            logger.info(`Skip command triggered - Guild: ${interaction.guildId}`);

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

            if (queue.songs.length === 1) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ There are no more songs in the queue!'
                    }],
                    ephemeral: true
                });
            }

            try {
                const currentSong = queue.songs[0];
                await queue.skip();
                await interaction.reply({
                    embeds: [{
                        color: Colors.SUCCESS,
                        description: `⏭️ Skipped **${currentSong.name}**`,
                        thumbnail: { url: currentSong.thumbnail }
                    }]
                });
            } catch (error) {
                logger.error('Error skipping song:', error);
                await interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: `❌ Error: ${error.message}`
                    }],
                    ephemeral: true
                });
            }
        } catch (error) {
            logger.error('Error in skip command:', error);
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