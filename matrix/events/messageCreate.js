// messageCreate.js
module.exports = {
  name: "messageCreate",
  async execute(message) {
    const prefix = "."; // or load from your config
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    // Parse the command name and args
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    // Look up the command in your prefix command cache
    const command = message.client.prefixCommands.get(commandName);
    if (!command) {
      return message.reply("Unknown command.");
    }

    try {
      // Execute the command (pass message, args, and client as needed)
      await command.execute(message, args, message.client);
    } catch (error) {
      console.error(`Error executing command '${commandName}': ${error.message}`);
      message.reply("There was an error executing that command.");
    }
  },
};
