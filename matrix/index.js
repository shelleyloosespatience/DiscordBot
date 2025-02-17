require("dotenv").config()
const { Client, GatewayIntentBits } = require("discord.js")
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences
  ]
})
if (!process.env.BOT_TOKEN) {
  console.error("BOT_TOKEN not defined in environment variables")
  process.exit(1)
}
process.on("unhandledRejection", error => {
  console.error("Unhandled promise rejection:", error)
})
process.on("uncaughtException", error => {
  console.error("Uncaught exception:", error)
  process.exit(1)
})
try {
  require("./loader/loadevents.js")(client)
  require("./loader/loadcommands.js")(client)
} catch (error) {
  console.error("Error loading files:", error)
  process.exit(1)
}
client.once("ready", () => {
  console.log(`${client.user.tag} connected`)
  setInterval(() => {
    console.log("Heartbeat: bot is alive")
  }, 60000)
})
client.login(process.env.BOT_TOKEN).catch(error => {
  console.error("Login failed:", error)
  process.exit(1)
})