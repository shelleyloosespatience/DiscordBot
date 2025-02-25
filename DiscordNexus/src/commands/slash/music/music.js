const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle 
  } = require('discord.js');
  const ytsr = require('ytsr');
  const { registerButton } = require('../../../handlers/buttonHandler');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('music')
      .setDescription('Music commands powered by ayumi')
      .addSubcommand(subcommand =>
        subcommand
          .setName('play')
          .setDescription('Play a song from a name or URL')
          .addStringOption(option =>
            option
              .setName('query')
              .setDescription('The song name or URL')
              .setRequired(true)
          )
      )
      .addSubcommand(subcommand =>
        subcommand.setName('skip').setDescription('Skip the current song')
      )
      .addSubcommand(subcommand =>
        subcommand.setName('stop').setDescription('Stop the music and clear the queue')
      )
      .addSubcommand(subcommand =>
        subcommand.setName('queue').setDescription('Display the current queue')
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('loop')
          .setDescription('Set loop mode')
          .addStringOption(option =>
            option
              .setName('mode')
              .setDescription('Loop mode: Off, Song, or Queue')
              .setRequired(true)
              .addChoices(
                { name: 'Off', value: '0' },
                { name: 'Song', value: '1' },
                { name: 'Queue', value: '2' }
              )
          )
      )
      .addSubcommand(subcommand =>
        subcommand.setName('shuffle').setDescription('Shuffle the queue')
      )
      .addSubcommand(subcommand =>
        subcommand.setName('nowplaying').setDescription('Display the currently playing song')
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName('volume')
          .setDescription('Set the volume')
          .addIntegerOption(option =>
            option
              .setName('percent')
              .setDescription('Volume percentage (0-100)')
              .setRequired(true)
          )
      ),
  
    async execute(interaction) {
      const sub = interaction.options.getSubcommand();
      const client = interaction.client;
  
      if (!client.distube) {
        return interaction.reply({ content: 'Music system is not configured!', ephemeral: true });
      }
  
      const member = interaction.member;
      const voiceChannel = member.voice?.channel;
      let nowPlayingMessage; // Will hold the Now Playing embed message
  
      // Helper to update the Now Playing embed.
      const updateNowPlaying = async () => {
        const currentQueue = client.distube.getQueue(voiceChannel);
        if (!currentQueue || !currentQueue.songs.length) return;
  
        const currentSong = currentQueue.songs[0];
        const volumeLevel = currentQueue.volume || 100;
        const isLoop = currentQueue.repeatMode && currentQueue.repeatMode !== 0;
        const isAutoplay = currentQueue.autoplay;
  
        const npEmbed = new EmbedBuilder()
          .setTitle(`<a:ehe:1338415077170085939> Now Playing: ${currentSong.name}`)
          .setDescription(`[${currentSong.name}](${currentSong.url})\n**Duration:** \`${currentSong.formattedDuration}\``)
          .addFields(
            { name: '🔊 Volume', value: `\`${volumeLevel}%\``, inline: true }
          )
          .setThumbnail(currentSong.thumbnail || '')
          .setFooter({ text: 'Enjoy the music!' })
          .setColor('#5865F2')
          .setTimestamp();
  
        // Control row for volume.
        const controlRow1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('music_volume_down')
            .setLabel('Volume -')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('music_volume_up')
            .setLabel('Volume +')
            .setStyle(ButtonStyle.Secondary)
        );
  
        // Control row for loop and autoplay. Disable one if the other is active.
        const controlRow2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('music_loop_toggle')
            .setLabel('Loop')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(isAutoplay),
          new ButtonBuilder()
            .setCustomId('music_autoplay_toggle')
            .setLabel('Autoplay')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(isLoop)
        );
  
        // Stop button row.
        const controlRow3 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('music_stop_button')
            .setLabel('Stop')
            .setStyle(ButtonStyle.Danger)
        );
  
        try {
          if (nowPlayingMessage) {
            await nowPlayingMessage.edit({ embeds: [npEmbed], components: [controlRow1, controlRow2, controlRow3] });
          } else {
            nowPlayingMessage = await interaction.channel.send({ embeds: [npEmbed], components: [controlRow1, controlRow2, controlRow3] });
          }
        } catch (err) {
          // If editing fails (e.g. message was deleted), send a new one.
          nowPlayingMessage = await interaction.channel.send({ embeds: [npEmbed], components: [controlRow1, controlRow2, controlRow3] });
        }
      };
  
      // Check for voice channel when needed.
      if (sub === 'play' && !voiceChannel) {
        return interaction.reply({ content: '<a:Ehe:1327983123924783155> You need to be in a voice channel to listen to music!', ephemeral: true });
      }
  
      const queue = client.distube.getQueue(interaction);
  
      try {
        if (sub === 'play') {
          const query = interaction.options.getString('query');
          await interaction.deferReply({ ephemeral: true });
  
          // Use ytsr for a lighter search
          const searchResults = await ytsr(query, { limit: 10 });
          const videos = searchResults.items.filter(item => item.type === 'video').slice(0, 5);
          if (!videos || videos.length === 0) {
            return interaction.followUp({ content: '😕 No results found.', ephemeral: true });
          }
  
          const embed = new EmbedBuilder()
            .setTitle('Select a Song <a:eh:1338415227154202638>')
            .setDescription(
              videos
                .map((video, index) =>
                  `**${index + 1}.** [${video.title}](${video.url}) - \`${video.duration || 'N/A'}\``
                )
                .join('\n')
            )
            .setFooter({ text: 'Click one of the buttons below to select your song.' })
            .setColor('#5865F2');
  
          const row = new ActionRowBuilder().addComponents(
            videos.map((video, index) =>
              new ButtonBuilder()
                .setCustomId(`music_select_${index}`)
                .setLabel(`${index + 1}`)
                .setStyle(ButtonStyle.Primary)
            )
          );
  
          await interaction.followUp({ embeds: [embed], components: [row], ephemeral: true });
  
          videos.forEach((video, index) => {
            registerButton(`music_select_${index}`, [interaction.user.id], async (btnInteraction) => {
              try {
                await btnInteraction.update({ content: `You selected: **${video.title}**`, embeds: [], components: [] });
                await client.distube.play(voiceChannel, video.url, {
                  interaction,
                  member: interaction.member,
                  textChannel: interaction.channel,
                });
  
                await updateNowPlaying();
  
                // Register controls if not already registered
                registerButton('music_loop_toggle', [], async (btnInteraction) => {
                  try {
                    const currentQueue = client.distube.getQueue(voiceChannel);
                    const currentMode = currentQueue?.repeatMode || 0;
                    const newMode = (currentMode + 1) % 3;
                    const modeNames = ['Off', 'Repeat Song', 'Repeat Queue'];
                    await client.distube.setRepeatMode(voiceChannel, newMode);
                    await btnInteraction.reply({ content: `🔁 Loop mode set to **${modeNames[newMode]}**.`, ephemeral: true });
                    updateNowPlaying();
                  } catch (err) {
                    console.error('Loop toggle error:', err);
                    await btnInteraction.reply({ content: '⚠️ Failed to toggle loop mode.', ephemeral: true });
                  }
                });
  
                registerButton('music_autoplay_toggle', [], async (btnInteraction) => {
                  try {
                    const newState = client.distube.toggleAutoplay(voiceChannel);
                    await btnInteraction.reply({ content: `<a:eh:1332327335201869884> Autoplay is now **${newState ? 'Enabled' : 'Disabled'}**.`, ephemeral: true });
                    updateNowPlaying();
                  } catch (err) {
                    console.error('Autoplay toggle error:', err);
                    await btnInteraction.reply({ content: '⚠️ Failed to toggle autoplay.', ephemeral: true });
                  }
                });
  
                registerButton('music_volume_down', [], async (btnInteraction) => {
                  try {
                    const currentQueue = client.distube.getQueue(voiceChannel);
                    const currentVolume = currentQueue?.volume || 100;
                    const newVolume = Math.max(currentVolume - 10, 0);
                    await client.distube.setVolume(voiceChannel, newVolume);
                    await btnInteraction.reply({ content: `🔉 Volume set to \`${newVolume}%\`.`, ephemeral: true });
                    updateNowPlaying();
                  } catch (err) {
                    console.error('Volume down error:', err);
                    await btnInteraction.reply({ content: '⚠️ Failed to lower volume.', ephemeral: true });
                  }
                });
  
                registerButton('music_volume_up', [], async (btnInteraction) => {
                  try {
                    const currentQueue = client.distube.getQueue(voiceChannel);
                    const currentVolume = currentQueue?.volume || 100;
                    const newVolume = Math.min(currentVolume + 10, 100);
                    await client.distube.setVolume(voiceChannel, newVolume);
                    await btnInteraction.reply({ content: `🔊 Volume set to \`${newVolume}%\`.`, ephemeral: true });
                    updateNowPlaying();
                  } catch (err) {
                    console.error('Volume up error:', err);
                    await btnInteraction.reply({ content: '⚠️ Failed to increase volume.', ephemeral: true });
                  }
                });
  
                registerButton('music_stop_button', [], async (btnInteraction) => {
                  try {
                    const currentQueue = client.distube.getQueue(voiceChannel);
                    if (!currentQueue) return btnInteraction.reply({ content: '❌ There is nothing playing!', ephemeral: true });
                    client.distube.stop(interaction);
                    await btnInteraction.reply({ content: '⏹️ Stopped the music and cleared the queue.', ephemeral: true });
                    // Remove the now playing message if needed.
                    if (nowPlayingMessage) nowPlayingMessage.delete().catch(() => {});
                  } catch (err) {
                    console.error('Stop button error:', err);
                    await btnInteraction.reply({ content: '⚠️ Failed to stop the music.', ephemeral: true });
                  }
                });
              } catch (err) {
                console.error('Error processing button interaction:', err);
                await btnInteraction.update({ content: '⚠️ An error occurred while processing your selection.', components: [] });
              }
            });
          });
        } else if (sub === 'skip') {
          if (!queue) return interaction.reply({ content: 'There is nothing playing!', ephemeral: true });
          await client.distube.skip(interaction);
          await interaction.reply({ content: '⏩ Skipped the current song!' });
          await updateNowPlaying();
        } else if (sub === 'stop') {
          if (!queue) return interaction.reply({ content: '❌ There is nothing playing!', ephemeral: true });
          client.distube.stop(interaction);
          await interaction.reply({ content: '⏹️ Stopped the music and cleared the queue.' });
          if (nowPlayingMessage) nowPlayingMessage.delete().catch(() => {});
        } else if (sub === 'queue') {
          if (!queue || !queue.songs.length) return interaction.reply({ content: '❌ The queue is empty!', ephemeral: true });
          const queueEmbed = new EmbedBuilder()
            .setTitle('<a:ehe:1338415077170085939> Music Queue')
            .setDescription(
              queue.songs
                .map((song, index) =>
                  `**${index + 1}.** [${song.name}](${song.url}) - \`${song.formattedDuration}\``
                )
                .join('\n')
            )
            .setFooter({ text: `Now playing: ${queue.songs[0].name}` })
            .setColor('#5865F2');
          await interaction.reply({ embeds: [queueEmbed] });
        } else if (sub === 'loop') {
          if (!queue) return interaction.reply({ content: '❌ There is nothing playing!', ephemeral: true });
          const mode = parseInt(interaction.options.getString('mode'));
          const modeNames = ['Off', 'Repeat Song', 'Repeat Queue'];
          const currentMode = await client.distube.setRepeatMode(interaction, mode);
          await interaction.reply({ content: `🔁 Loop mode set to **${modeNames[currentMode]}**.` });
          updateNowPlaying();
        } else if (sub === 'shuffle') {
          if (!queue) return interaction.reply({ content: '❌ There is nothing playing!', ephemeral: true });
          await client.distube.shuffle(interaction);
          await interaction.reply({ content: '🔀 Shuffled the queue!' });
          updateNowPlaying();
        } else if (sub === 'nowplaying') {
          if (!queue || !queue.songs.length) return interaction.reply({ content: '❌ There is nothing playing!', ephemeral: true });
          await updateNowPlaying();
          await interaction.reply({ content: 'Now Playing updated in chat.' });
        } else if (sub === 'volume') {
          if (!queue) return interaction.reply({ content: '<a:eh:1338415227154202638> There is nothing playing!', ephemeral: true });
          const volume = interaction.options.getInteger('percent');
          if (volume < 0 || volume > 100) return interaction.reply({ content: '<a:eh:1338415227154202638> Volume must be between 0 and 100.', ephemeral: true });
          await client.distube.setVolume(interaction, volume);
          await interaction.reply({ content: `<a:eh:1333359147655106581> Volume set to ${volume}%!` });
          updateNowPlaying();
        }
      } catch (error) {
        console.error(`Error executing music command: ${error.message}`);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '<a:eh:1333359147655106581> An error occurred while processing your command!', ephemeral: true });
        }
      }
    },
  };