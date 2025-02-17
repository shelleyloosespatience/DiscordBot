const path = require("path")
module.exports = {
  name: "ready",
  once: true,
  async execute(client) {
    try {
      const loadCommands = require(path.join(__dirname, "..", "loader", "loadcommands.js"))
      await loadCommands(client)
      console.log("Commands loaded")
    } catch (error) {
      console.error("Error triggering loadcommands.js", error)
      process.exit(1)
    }
    console.log(`${client.user.tag} ready`)
  }
}