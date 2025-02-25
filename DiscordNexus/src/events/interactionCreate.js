const logger = require('../utils/logger');
const { Messages } = require('../utils/constants');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isCommand()) return;

        const command = interaction.client.slashCommands.get(interaction.commandName);

        if (!command) {
            logger.error(`Command not found: ${interaction.commandName}`);
            return;
        }

        // Debug logging
        logger.info(`Executing command: ${interaction.commandName}`);
        logger.info(`Command structure: ${JSON.stringify({
            hasData: !!command.data,
            hasExecute: typeof command.execute === 'function',
            properties: Object.keys(command)
        })}`);

        try {
            await command.execute(interaction);
        } catch (error) {
            logger.error(`Error executing slash command ${interaction.commandName}:`, error);
            logger.error(`Command object: ${JSON.stringify(command, (key, value) => 
                typeof value === 'function' ? '[Function]' : value
            )}`);

            // Only reply if we haven't already
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: Messages.ERROR,
                    flags: { ephemeral: true }
                });
            }
        }
    }
};