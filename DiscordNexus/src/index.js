require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const logger = require('./utils/logger');
const setupDistube = require('./utils/setupDistube');
const ticketManager = require('./utils/ticketManager');
const loadCommands = require('./loader/loadcommands');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping
    ],
    partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction
    ]
});

if (!process.env.DISCORD_TOKEN) {
    logger.error("DISCORD_TOKEN not defined in environment variables");
    process.exit(1);
}

// Global error handling
process.on("unhandledRejection", error => {
    logger.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", error => {
    logger.error("Uncaught exception:", error);
    process.exit(1);
});

// Set up DisTube
setupDistube(client);

// Initialize collections
client.slashCommands = new Map();
client.prefixCommands = new Map();

// Load event handlers first
try {
    require("./loader/loadevents")(client);
} catch (error) {
    logger.error("Error loading event handlers:", error);
    process.exit(1);
}

// Voice state update handling for music
client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.member.id === client.user.id && !newState.channelId) {
        const queue = client.distube?.getQueue(oldState.guild.id);
        if (queue) {
            queue.stop();
        }
    }
});

// Initialize ticket manager and load commands after client is ready
client.once('ready', async () => {
    try {
        ticketManager.setClient(client);
        // Load and register commands after client is ready
        await loadCommands(client);
        logger.info(`Logged in as ${client.user.tag}!`);
    } catch (error) {
        logger.error("Failed to initialize bot:", error);
        process.exit(1);
    }
});

// Clean up when things go south
process.on("SIGINT", () => {
    logger.info("Shutting down...");
    client.distube?.queues.forEach(queue => queue.stop());
    process.exit();
});

client.login(process.env.DISCORD_TOKEN).catch(error => {
    logger.error("Login failed:", error);
    process.exit(1);
});