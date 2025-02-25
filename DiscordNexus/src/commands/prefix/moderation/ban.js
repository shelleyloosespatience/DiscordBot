const { Permissions, Messages } = require('../../../utils/constants');

module.exports = {
    name: 'ban',
    description: 'Ban a member from the server',
    usage: '!ban <user> [reason]',
    category: 'moderation',
    async execute(message, args) {
        if (!message.member.permissions.has(Permissions.BAN_MEMBERS)) {
            return message.reply(Messages.NO_PERMISSION);
        }

        const member = message.mentions.members.first();
        if (!member) {
            return message.reply('Please mention a member to ban');
        }

        const reason = args.slice(1).join(' ') || 'No reason provided';

        try {
            await member.ban({ reason });
            await message.reply(`Successfully banned ${member.user.tag} for: ${reason}`);
        } catch (error) {
            message.reply('Failed to ban the member');
        }
    }
};
