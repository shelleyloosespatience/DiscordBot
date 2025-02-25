const { PermissionFlagsBits } = require('discord.js');
const { Colors } = require('../../../utils/constants');

module.exports = {
    name: 'say',
    description: 'Make the bot say something',
    usage: '!say <message>',
    category: 'utility',
    async execute(message, args) {
        // Check if user has permission to manage messages
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ You need Manage Messages permission to use this command.'
                }]
            });
        }

        if (!args.length) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ Please provide a message to say.'
                }]
            });
        }

        const sayMessage = args.join(' ');

        // Delete the command message
        await message.delete().catch(() => {});

        // Send the message
        await message.channel.send(sayMessage);

        // Log the action if possible
        const logChannel = message.guild.channels.cache.find(
            channel => channel.name === 'mod-logs'
        );

        if (logChannel) {
            await logChannel.send({
                embeds: [{
                    color: Colors.INFO,
                    title: '💬 Say Command Used',
                    description: `**Channel:** ${message.channel}\n**Moderator:** ${message.author.tag}\n**Message:** ${sayMessage}`,
                    timestamp: new Date()
                }]
            });
        }
    }
};
