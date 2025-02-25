const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

async function loadEvents(client) {
    try {
        const eventsPath = path.join(__dirname, '../events');
        const eventFiles = (await fs.readdir(eventsPath)).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            const event = require(path.join(eventsPath, file));
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
        }

        logger.info('Events loaded successfully');
    } catch (error) {
        logger.error('Error loading events:', error);
        throw error;
    }
}

module.exports = { loadEvents };
