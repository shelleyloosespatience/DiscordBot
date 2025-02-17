const fs = require("fs").promises
const path = require("path")
const prefix = "m"
let commandCache = new Map()
async function loadCommands(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      await loadCommands(fullPath)
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      try {
        const cmd = require(fullPath)
        if (cmd && cmd.name) commandCache.set(cmd.name.toLowerCase(), cmd)
      } catch (err) {}
    }
  }
}
(async () => {
  const baseDir = path.join(__dirname, "..", "commands", "prefix")
  await loadCommands(baseDir)
})()
module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot) return
    if (!message.content.startsWith(prefix)) return
    try {
      const args = message.content.slice(prefix.length).trim().split(/ +/)
      const commandName = args.shift().toLowerCase()
      const command = commandCache.get(commandName)
      if (command && typeof command.execute === "function") {
        await command.execute(message, args)
      } else if (command) {
        await message.reply("Command exists but has no execute method.")
      } else {
        await message.reply("Unknown command.")
      }
    } catch (error) {
      try {
        await message.reply("An error occurred while executing the command.")
      } catch (err) {}
      console.error("Error in messageCreate event:", error)
    }
  }
}