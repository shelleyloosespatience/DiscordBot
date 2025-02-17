const AntiRaidManager = require('../models/AntiRaidManager');

module.exports = {
    name: 'auditLogEntryCreate',
    async execute(auditLogEntry, client) {
        if (!auditLogEntry || !auditLogEntry.executor) return;

        const actionTypes = {
            CHANNEL_DELETE: 'channelDelete',
            ROLE_DELETE: 'roleDelete',
            MEMBER_BAN_ADD: 'memberBan',
            MEMBER_KICK: 'memberKick'
        };

        const actionType = actionTypes[auditLogEntry.action];
        if (!actionType) return;

        const guild = client.guilds.cache.get(auditLogEntry.guildId);
        if (!guild) return;

        try {
            const executor = await guild.members.fetch(auditLogEntry.executor.id);
            await AntiRaidManager.handleRaidAction(
                guild,
                executor,
                actionType,
                auditLogEntry.targetId
            );
        } catch (error) {
            client.logger.error('Error in anti-raid handler:', error);
        }
    }
};