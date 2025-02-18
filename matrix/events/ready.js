// events/ready.js
const path = require("path");

module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    try {
      const loadCommands = require(path.join(__dirname, "..", "loader", "loadcommands.js"));
      await loadCommands(client);
      console.log("Commands loaded successfully.");
    } catch (error) {
      console.error("Error loading commands:", error);
      process.exit(1);
    }
    console.log(`${client.user.tag} is ready.`);
  }
};
