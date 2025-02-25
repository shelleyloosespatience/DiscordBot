const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

async function loadCommands(client) {
    try {
        // Load prefix commands
        const prefixCommandsPath = path.join(__dirname, '../commands/prefix');
        const prefixCategories = await fs.readdir(prefixCommandsPath);

        for (const category of prefixCategories) {
            const categoryPath = path.join(prefixCommandsPath, category);
            const commandFiles = (await fs.readdir(categoryPath)).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const command = require(path.join(categoryPath, file));
                client.prefixCommands.set(command.name, command);
            }
        }

        // Load slash commands
        const slashCommandsPath = path.join(__dirname, '../commands/slash');
        const slashCategories = await fs.readdir(slashCommandsPath);

        for (const category of slashCategories) {
            const categoryPath = path.join(slashCommandsPath, category);
            const commandFiles = (await fs.readdir(categoryPath)).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const command = require(path.join(categoryPath, file));
                client.slashCommands.set(command.data.name, command);
            }
        }

        logger.info('Commands loaded successfully');
    } catch (error) {
        logger.error('Error loading commands:', error);
        throw error;
    }
}

module.exports = { loadCommands };
