const { Collection } = require('discord.js');
const logger = require('./logger');

class WarningManager {
    constructor() {
        this.warnings = new Collection();
    }

    getWarnings(guildId, userId) {
        const key = `${guildId}-${userId}`;
        return this.warnings.get(key) || [];
    }

    addWarning(guildId, userId, moderatorId, reason) {
        const key = `${guildId}-${userId}`;
        const warnings = this.getWarnings(guildId, userId);
        
        const warning = {
            id: warnings.length + 1,
            moderatorId,
            reason,
            timestamp: Date.now()
        };

        warnings.push(warning);
        this.warnings.set(key, warnings);
        logger.info(`Warning added for user ${userId} in guild ${guildId}`);
        
        return warnings.length;
    }

    removeWarning(guildId, userId, warningId) {
        const key = `${guildId}-${userId}`;
        const warnings = this.getWarnings(guildId, userId);
        
        const index = warnings.findIndex(w => w.id === warningId);
        if (index === -1) return false;

        warnings.splice(index, 1);
        this.warnings.set(key, warnings);
        logger.info(`Warning ${warningId} removed for user ${userId} in guild ${guildId}`);
        
        return true;
    }

    clearWarnings(guildId, userId) {
        const key = `${guildId}-${userId}`;
        this.warnings.delete(key);
        logger.info(`All warnings cleared for user ${userId} in guild ${guildId}`);
        return true;
    }
}

module.exports = new WarningManager();
