module.exports = {
    name: "ping",
    async execute(message, args) {
      try {
        const sent = await message.reply("Pinging...");
        const ping = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(message.client.ws.ping);
        await sent.edit(`Pong! Latency: ${ping}ms | API Latency: ${apiLatency}ms`);
      } catch (error) {
        try {
          await message.reply("An error occurred while calculating latency.");
        } catch (err) {}
        console.error(error);
      }
    }
  }