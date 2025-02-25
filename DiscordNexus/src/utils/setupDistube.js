const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { YouTubePlugin } = require('@distube/youtube');
const { createAudioPlayer } = require('@discordjs/voice');
const logger = require('./logger');
const { Colors } = require('./constants');

function setupDistube(client) {
    client.distube = new DisTube(client, {
        emitNewSongOnly: true,      // Emits only when a new song starts.
        nsfw: false,                // Don't allow NSFW content
        savePreviousSongs: true,    // Remember the history of played songs
        plugins: [
            new SpotifyPlugin(),
            new YouTubePlugin(),
        ],
    });

    client.distube
        .on('playSong', (queue, song) => {
            logger.info(`Playing: ${song.name} in guild: ${queue.textChannel?.guild.id || 'unknown'}`);
            logger.info(`Song details - URL: ${song.url}, Duration: ${song.formattedDuration}`);

            if (queue.textChannel) {
                const embed = {
                    color: Colors.SUCCESS,
                    title: '🎵 Now Playing',
                    description: `[${song.name}](${song.url})`,
                    fields: [
                        { name: 'Duration', value: song.formattedDuration, inline: true },
                        { name: 'Requested by', value: song.user.tag, inline: true },
                        { name: 'Views', value: song.views?.toLocaleString() || 'N/A', inline: true },
                        { name: 'Uploader', value: song.uploader?.name || 'Unknown', inline: true }
                    ],
                    thumbnail: { url: song.thumbnail }
                };
                queue.textChannel.send({ embeds: [embed] }).catch(err => {
                    logger.error("Error sending playSong message:", err);
                    // Try sending a simpler message if the embed fails
                    queue.textChannel.send({
                        embeds: [{
                            color: Colors.SUCCESS,
                            description: `🎵 Now playing: ${song.name}`
                        }]
                    }).catch(err => logger.error("Failed to send fallback message:", err));
                });
            } else {
                logger.error("Text channel not found for playSong event");
            }
        })
        .on('addSong', (queue, song) => {
            try {
                logger.info(`Song added to queue - Name: ${song.name}, Guild: ${queue.textChannel?.guild.id || 'unknown'}`);

                if (queue.songs?.length > 1 && queue.textChannel) {
                    queue.textChannel.send({
                        embeds: [{
                            color: Colors.SUCCESS,
                            description: `📝 Added [${song.name}](${song.url}) - \`${song.formattedDuration}\` to the queue`,
                            thumbnail: { url: song.thumbnail }
                        }]
                    }).catch(err => logger.error("Error sending addSong message:", err));
                }
            } catch (err) {
                logger.error("Error in addSong event:", err);
            }
        })
        .on('error', (channel, error) => {
            logger.error('DisTube error:', error);
            try {
                if (channel?.send) {
                    const errorMessage = error.errorCode === 'MUSIC_START'
                        ? "❌ Couldn't join the voice channel. Please check permissions."
                        : error.errorCode === 'NO_UP_NEXT'
                        ? "❌ There are no more songs in the queue."
                        : `❌ An error occurred: ${error.message}`;

                    channel.send({
                        embeds: [{
                            color: Colors.ERROR,
                            description: errorMessage
                        }]
                    }).catch(err => logger.error("Failed to send error message:", err));
                }
            } catch (err) {
                logger.error("Error in error handler:", err);
            }
        })
        .on('initQueue', (queue) => {
            queue.autoplay = false;    // Disable autoplay by default
            queue.volume = 100;        // Set default volume
            logger.info(`Queue initialized for guild: ${queue.textChannel?.guild.id || 'unknown'}`);
        })
        .on('disconnect', (queue) => {
            logger.info(`Bot disconnected from voice channel in guild: ${queue.textChannel?.guild.id || 'unknown'}`);
        })
        .on('deleteQueue', (queue) => {
            logger.info(`Queue deleted for guild: ${queue.textChannel?.guild.id || 'unknown'}`);
        })
        .on('finish', (queue) => {
            try {
                logger.info(`Queue finished for guild: ${queue.textChannel?.guild.id || 'unknown'}`);
                if (queue.textChannel) {
                    queue.textChannel.send({
                        embeds: [{
                            color: Colors.SUCCESS,
                            description: '✅ Queue finished! Thanks for listening.'
                        }]
                    }).catch(err => logger.error("Error sending finish message:", err));
                }
            } catch (err) {
                logger.error("Error in finish event:", err);
            }
        });

    logger.info('DisTube setup completed');
}

module.exports = setupDistube;