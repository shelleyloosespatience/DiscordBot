const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Colors, Messages } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the music queue'),

    async execute(interaction) {
        try {
            const queue = interaction.client.distube.getQueue(interaction.guildId);
            logger.info(`Queue command triggered - Guild: ${interaction.guildId}`);

            if (!queue) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.ERROR,
                        description: '❌ There is nothing playing!'
                    }],
                    ephemeral: true
                });
            }

            const embed = new EmbedBuilder()
                .setTitle('📑 Current Queue')
                .setColor(Colors.SUCCESS)
                .addFields(
                    { name: 'Now Playing', value: `[${queue.songs[0].name}](${queue.songs[0].url}) - \`${queue.songs[0].formattedDuration}\`` }
                );

            const tracks = queue.songs.slice(1).map((song, id) => 
                `**${id + 1}**. [${song.name}](${song.url}) - \`${song.formattedDuration}\` - Requested by ${song.user.tag}`
            );

            const chunkedTracks = tracks.slice(0, 10); // Show first 10 tracks
            if (chunkedTracks.length > 0) {
                embed.addFields({ name: 'Up Next', value: chunkedTracks.join('\n') });
            }

            if (tracks.length > 10) {
                embed.setFooter({ text: `And ${tracks.length - 10} more songs...` });
            }

            embed.addFields(
                { name: 'Total Duration', value: queue.formattedDuration, inline: true },
                { name: 'Total Songs', value: queue.songs.length.toString(), inline: true }
            );

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            logger.error('Error in queue command:', error);
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