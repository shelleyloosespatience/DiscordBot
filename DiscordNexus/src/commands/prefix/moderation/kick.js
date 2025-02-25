const { Permissions, Messages } = require('../../../utils/constants');

module.exports = {
    name: 'kick',
    description: 'Kick a member from the server',
    usage: '!kick <user> [reason]',
    category: 'moderation',
    async execute(message, args) {
        if (!message.member.permissions.has(Permissions.KICK_MEMBERS)) {
            return message.reply(Messages.NO_PERMISSION);
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('Please mention a member to kick');
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await member.kick(reason);
            await message.reply(`Successfully kicked ${member.user.tag} for: ${reason}`);
        } catch (error) {
            message.reply('Failed to kick the member');
        }
    }
};
