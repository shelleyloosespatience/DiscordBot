const { PermissionFlagsBits } = require('discord.js');
const { Colors, Messages } = require('../../../utils/constants');

module.exports = {
    name: 'mute',
    description: 'Timeout (mute) a member',
    usage: '!mute <user> <duration> [reason]',
    category: 'moderation',
    async execute(message, args) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ You do not have permission to timeout members.'
                }]
            });
        }

        const target = message.mentions.members.first();
        if (!target) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ Please mention a member to timeout.'
                }]
            });
        }

        if (!args[1]) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ Please specify a duration (e.g., 1h, 30m, 1d).'
                }]
            });
        }

        // Parse duration
        const durationRegex = /^(\d+)([mhd])$/;
        const match = args[1].match(durationRegex);

        if (!match) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ Invalid duration format. Use something like 1h, 30m, or 1d.'
                }]
            });
        }

        const [, amount, unit] = match;
        const multiplier = {
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000
        };

        const duration = parseInt(amount) * multiplier[unit];
        const reason = args.slice(2).join(' ') || 'No reason provided';

        try {
            await target.timeout(duration, reason);
            await message.reply({
                embeds: [{
                    color: Colors.SUCCESS,
                    description: `✅ Successfully timed out ${target.user.tag} for ${amount}${unit}\nReason: ${reason}`
                }]
            });

            // Log the timeout if possible
            const logChannel = message.guild.channels.cache.find(
                channel => channel.name === 'mod-logs'
            );

            if (logChannel) {
                await logChannel.send({
                    embeds: [{
                        color: Colors.WARNING,
                        title: '🔇 Member Timed Out',
                        description: `**Member:** ${target.user.tag} (${target.id})\n**Moderator:** ${message.author.tag}\n**Duration:** ${amount}${unit}\n**Reason:** ${reason}`,
                        timestamp: new Date()
                    }]
                });
            }
        } catch (error) {
            console.error('Error in mute command:', error);
            await message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: Messages.ERROR
                }]
            });
        }
    }
};
