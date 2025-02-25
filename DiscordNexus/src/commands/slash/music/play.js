const { SlashCommandBuilder } = require('@discordjs/builders');
const { Colors, Messages } = require('../../../utils/constants');
const logger = require('../../../utils/logger');
const ytsr = require('ytsr');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song from YouTube or Spotify')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Song name or URL (YouTube/Spotify)')
                .setRequired(true)),

    async execute(interaction) {
        try {
            const query = interaction.options.getString('query');
            const voiceChannel = interaction.member.voice.channel;

            logger.info(`Play command triggered - Guild: ${interaction.guildId}, Query: ${query}`);

            if (!voiceChannel) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ You need to be in a voice channel!'
                    }],
                    ephemeral: true
                });
            }

            // Check bot permissions for voice channel
            const permissions = voiceChannel.permissionsFor(interaction.client.user);
            if (!permissions.has('Connect') || !permissions.has('Speak')) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ I need permissions to join and speak in your voice channel!'
                    }],
                    ephemeral: true
                });
            }

            await interaction.deferReply();

            try {
                let searchResult;
                // If not a URL, search for the song
                if (!query.startsWith('http')) {
                    const searchOptions = {
                        limit: 1,
                        filter: 'audioonly',
                    };

                    await interaction.followUp({
                        embeds: [{
                            color: Colors.INFO,
                            description: '🔎 Searching for your song...'
                        }]
                    });

                    const results = await ytsr(query, searchOptions);
                    if (!results.items.length) {
                        return interaction.followUp({
                            embeds: [{
                                color: Colors.ERROR,
                                description: '❌ No results found!'
                            }],
                            ephemeral: true
                        });
                    }
                    searchResult = results.items[0].url;

                    logger.info(`Found song: ${results.items[0].title} for query: ${query}`);
                } else {
                    searchResult = query;
                }

                // Play the song
                await interaction.client.distube.play(voiceChannel, searchResult, {
                    member: interaction.member,
                    textChannel: interaction.channel,
                    interaction
                });

                // Send initial confirmation
                await interaction.followUp({
                    embeds: [{
                        color: Colors.SUCCESS,
                        description: '🎵 Request added to queue!'
                    }]
                });
            } catch (error) {
                logger.error('Error playing music:', error);
                await interaction.followUp({
                    embeds: [{
                        color: Colors.ERROR,
                        description: `❌ Error: ${error.message}`
                    }],
                    ephemeral: true
                });
            }
        } catch (error) {
            logger.error('Error in play command:', error);
            if (!interaction.deferred) {
                await interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: Messages.ERROR
                    }],
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    embeds: [{
                        color: Colors.ERROR,
                        description: Messages.ERROR
                    }],
                    ephemeral: true
                });
            }
        }
    }
};