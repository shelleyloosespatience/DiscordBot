const { PermissionFlagsBits } = require('discord.js');
const { Colors, Messages } = require('../../../utils/constants');

module.exports = {
    name: 'nick',
    description: 'Change a user\'s nickname',
    usage: '!nick <user> <new nickname> | !nick reset <user>',
    category: 'utility',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ You do not have permission to manage nicknames.'
                }]
            });
        }

        const target = message.mentions.members.first();
        if (!target) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ Please mention a user to change their nickname.'
                }]
            });
        }

        if (!target.manageable) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ I cannot manage this user\'s nickname. They may have a higher role than me.'
                }]
            });
        }

        const isReset = args[0].toLowerCase() === 'reset';
        const newNick = isReset ? null : args.slice(1).join(' ');

        if (!isReset && !newNick) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ Please provide a new nickname or use "reset" to remove the nickname.'
                }]
            });
        }

        try {
            const oldNick = target.nickname || target.user.username;
            await target.setNickname(newNick);

            await message.reply({
                embeds: [{
                    color: Colors.SUCCESS,
                    description: isReset ?
                        `✅ Reset nickname for ${target.user.tag}` :
                        `✅ Changed nickname for ${target.user.tag}\nOld: ${oldNick}\nNew: ${newNick}`
                }]
            });

            // Log the action if possible
            const logChannel = message.guild.channels.cache.find(
                channel => channel.name === 'mod-logs'
            );

            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        color: Colors.WARNING,
                        title: '📝 Nickname Changed',
                        description: `**User:** ${target.user.tag}\n**Moderator:** ${message.author.tag}\n**Old Nick:** ${oldNick}\n**New Nick:** ${newNick || target.user.username}`,
                        timestamp: new Date()
                    }]
                });
            }
        } catch (error) {
            console.error('Error in nick command:', error);
            await message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: Messages.ERROR
                }]
            });
        }
    }
};
