const { prefix } = require('../config');
const logger = require('../utils/logger');
const { Messages } = require('../utils/constants');
const antiRaid = require('../utils/antiRaid');
const { autoReactChannels } = require('../commands/slash/utility/autoreact');

module.exports = {
    name: 'messageCreate',
    async execute(message) {
        if (message.author.bot) return;

        // Check for spam
        if (antiRaid.checkSpam(message)) {
            await antiRaid.handleSpam(message);
            return;
        }

        // Auto-reactions
        if (message.guild && autoReactChannels.has(message.channel.id)) {
            const reactions = autoReactChannels.get(message.channel.id);
            for (const reaction of reactions) {
                try {
                    await message.react(reaction);
                } catch (error) {
                    logger.error(`Failed to add auto-reaction ${reaction}:`, error);
                }
            }
        }

        // Handle commands
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        const command = message.client.prefixCommands.get(commandName);
        if (!command) return;

        try {
            await command.execute(message, args);
        } catch (error) {
            logger.error(`Error executing command ${commandName}:`, error);
            await message.reply(Messages.ERROR);
        }
    }
};