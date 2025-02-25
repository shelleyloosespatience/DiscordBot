const antiRaid = require('../utils/antiRaid');
const logger = require('../utils/logger');

module.exports = {
    name: 'guildMemberAdd',
    async execute(member) {
        try {
            // Check for potential raid
            if (antiRaid.checkJoinRaid(member)) {
                logger.warn(`Potential raid detected - rapid joins in ${member.guild.name}`);
                return;
            }

            // Welcome message
            const welcomeChannel = member.guild.channels.cache.find(
                channel => channel.name === 'welcome'
            );

            if (welcomeChannel) {
                welcomeChannel.send(
                    `Welcome to the server, ${member}! Please read our rules and enjoy your stay! 🎉`
                );
            }
        } catch (error) {
            logger.error('Error in guildMemberAdd event:', error);
        }
    }
};
