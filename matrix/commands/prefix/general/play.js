const { Manager } = require("erela.js");

module.exports = {
  name: "play",
  description: "Plays a song using Lavalink",
  async execute(message, args, client) {
    // Check if the member is in a voice channel.
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.channel.send("You need to be in a voice channel to play music.");
    }

    // Ensure a search query or URL is provided.
    const query = args.join(" ");
    if (!query) {
      return message.channel.send("Please provide a song name or URL to play.");
    }

    // Initialize the manager if it hasn't been already.
    if (!client.manager) {
      client.manager = new Manager({
        nodes: [
          {
            host: "lava-v4.ajieblogs.eu.org",
            port: 443,
            password: "https://dsc.gg/ajidevserver", // That's your password, right?
            secure: true,
          },
        ],
        // This send function is required so Erela.js can communicate with Discord.
        send(id, payload) {
          const guild = client.guilds.cache.get(id);
          if (guild) guild.shard.send(payload);
        },
      });

      // Listen for node events.
      client.manager.on("nodeConnect", (node) =>
        console.log(`Node "${node.options.host}" connected.`)
      );
      client.manager.on("nodeError", (node, error) =>
        console.error(`Node "${node.options.host}" encountered an error: ${error.message}`)
      );

      // Initialize the manager with your bot's client ID.
      client.manager.init(client.user.id);
    }

    // Create or get a player for the guild.
    let player = client.manager.players.get(message.guild.id);
    if (!player) {
      player = client.manager.create({
        guild: message.guild.id,
        voiceChannel: voiceChannel.id,
        textChannel: message.channel.id,
        selfDeafen: true,
      });
      player.connect();
    }

    try {
      // Search for the track(s) using the query.
      const res = await client.manager.search(query, message.author);
      if (res.loadType === "NO_MATCHES") {
        return message.channel.send("No matches found for your query.");
      } else if (res.loadType === "LOAD_FAILED") {
        return message.channel.send("Failed to load the track. Please try again.");
      }

      // Add track(s) to the queue.
      if (res.loadType === "PLAYLIST_LOADED") {
        player.queue.add(res.tracks);
        message.channel.send(
          `Playlist **${res.playlist.name}** added to the queue (${res.tracks.length} tracks).`
        );
      } else {
        player.queue.add(res.tracks[0]);
        message.channel.send(`Added **${res.tracks[0].title}** to the queue.`);
      }

      // Start playing if not already.
      if (!player.playing && !player.paused) {
        player.play();
      }
    } catch (error) {
      console.error("Error in play command:", error);
      message.channel.send("There was an error trying to play that song.");
    }
  },
};
