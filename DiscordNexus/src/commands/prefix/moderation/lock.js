const { PermissionFlagsBits } = require('discord.js');
const { Colors, Messages } = require('../../../utils/constants');

module.exports = {
    name: 'lock',
    description: 'Lock or unlock a channel',
    usage: '!lock [channel] [reason] | !unlock [channel] [reason]',
    category: 'moderation',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ You do not have permission to manage channels.'
                }]
            });
        }

        const isUnlock = message.content.toLowerCase().startsWith('!unlock');
        const targetChannel = message.mentions.channels.first() || message.channel;
        const reason = args.slice(message.mentions.channels.size > 0 ? 1 : 0).join(' ') || 'No reason provided';

        if (!targetChannel.manageable) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ I cannot manage this channel. I may not have the required permissions.'
                }]
            });
        }

        const everyoneRole = message.guild.roles.everyone;

        try {
            await targetChannel.permissionOverwrites.edit(everyoneRole, {
                SendMessages: isUnlock ? null : false,
                AddReactions: isUnlock ? null : false
            });

            await message.reply({
                embeds: [{
                    color: Colors.SUCCESS,
                    description: `${isUnlock ? '🔓' : '🔒'} Channel ${targetChannel} has been ${isUnlock ? 'unlocked' : 'locked'}.\nReason: ${reason}`
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
                        title: `🔧 Channel ${isUnlock ? 'Unlocked' : 'Locked'}`,
                        description: `**Channel:** ${targetChannel}\n**Moderator:** ${message.author.tag}\n**Reason:** ${reason}`,
                        timestamp: new Date()
                    }]
                });
            }
        } catch (error) {
            console.error(`Error in ${isUnlock ? 'unlock' : 'lock'} command:`, error);
            await message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: Messages.ERROR
                }]
            });
        }
    }
};
