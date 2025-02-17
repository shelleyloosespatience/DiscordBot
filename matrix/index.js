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
try {
  require("./loader/loadevents.js")(client)
} catch (error) {
  console.error("Error loading events:", error)
  process.exit(1)
}
client.login(process.env.BOT_TOKEN).catch(error => {
  console.error("Login failed:", error)
  process.exit(1)
})