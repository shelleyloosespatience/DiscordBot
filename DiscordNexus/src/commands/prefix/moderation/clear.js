const { PermissionFlagsBits } = require('discord.js');
const { Colors, Messages } = require('../../../utils/constants');

module.exports = {
    name: 'clear',
    description: 'Clear messages from the channel',
    usage: '!clear <amount>',
    category: 'moderation',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ You do not have permission to manage messages.'
                }]
            });
        }

        const amount = parseInt(args[0]);
        if (isNaN(amount) || amount < 1 || amount > 100) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ Please provide a number between 1 and 100.'
                }]
            });
        }

        try {
            await message.delete();
            const deleted = await message.channel.bulkDelete(amount, true);

            const reply = await message.channel.send({
                embeds: [{
                    color: Colors.SUCCESS,
                    description: `✅ Successfully deleted ${deleted.size} messages.`
                }]
            });

            // Delete success message after 5 seconds
            setTimeout(() => reply.delete().catch(() => {}), 5000);

            // Log the action if possible
            const logChannel = message.guild.channels.cache.find(
                channel => channel.name === 'mod-logs'
            );

            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        color: Colors.WARNING,
                        title: '🗑️ Messages Cleared',
                        description: `**Channel:** ${message.channel}\n**Moderator:** ${message.author.tag}\n**Amount:** ${deleted.size} messages`,
                        timestamp: new Date()
                    }]
                });
            }
        } catch (error) {
            console.error('Error in clear command:', error);
            await message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: Messages.ERROR
                }]
            });
        }
    }
};
