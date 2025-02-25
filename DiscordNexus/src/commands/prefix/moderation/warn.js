const { EmbedBuilder } = require('discord.js');
const { Permissions, Messages, Colors } = require('../../../utils/constants');
const warningManager = require('../../../utils/warningManager');

module.exports = {
    name: 'warn',
    description: 'Manage warnings for users',
    usage: '!warn <user> <reason> | !warn list <user> | !warn remove <user> <warning_id> | !warn clear <user>',
    category: 'moderation',
    async execute(message, args) {
        if (!message.member.permissions.has(Permissions.MANAGE_MESSAGES)) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: Messages.NO_PERMISSION
                }]
            });
        }

        if (!args.length) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ Please provide a valid subcommand: warn, list, remove, or clear'
                }]
            });
        }

        const subCommand = args[0].toLowerCase();
        const target = message.mentions.users.first();

        if (!target && subCommand !== 'help') {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ Please mention a user'
                }]
            });
        }

        switch (subCommand) {
            case 'list': {
                const warnings = warningManager.getWarnings(message.guild.id, target.id);
                
                if (warnings.length === 0) {
                    return message.reply({
                        embeds: [{
                            color: Colors.INFO,
                            description: `${target.tag} has no warnings.`
                        }]
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor(Colors.INFO)
                    .setTitle(`Warnings for ${target.tag}`)
                    .setDescription(warnings.map(w => 
                        `**ID ${w.id}** by <@${w.moderatorId}> on ${new Date(w.timestamp).toLocaleDateString()}\n` +
                        `Reason: ${w.reason}`
                    ).join('\n\n'));

                await message.reply({ embeds: [embed] });
                break;
            }
            case 'remove': {
                const warningId = parseInt(args[2]);
                if (isNaN(warningId)) {
                    return message.reply({
                        embeds: [{
                            color: Colors.ERROR,
                            description: '❌ Please provide a valid warning ID'
                        }]
                    });
                }

                const removed = warningManager.removeWarning(message.guild.id, target.id, warningId);
                await message.reply({
                    embeds: [{
                        color: Colors.SUCCESS,
                        description: removed ? 
                            `✅ Warning ${warningId} has been removed from ${target.tag}` :
                            `❌ Warning ${warningId} not found for ${target.tag}`
                    }]
                });
                break;
            }
            case 'clear': {
                warningManager.clearWarnings(message.guild.id, target.id);
                await message.reply({
                    embeds: [{
                        color: Colors.SUCCESS,
                        description: `✅ All warnings have been cleared for ${target.tag}`
                    }]
                });
                break;
            }
            default: {
                const reason = args.slice(1).join(' ');
                if (!reason) {
                    return message.reply({
                        embeds: [{
                            color: Colors.ERROR,
                            description: '❌ Please provide a reason for the warning'
                        }]
                    });
                }

                const warningCount = warningManager.addWarning(
                    message.guild.id,
                    target.id,
                    message.author.id,
                    reason
                );

                const embed = new EmbedBuilder()
                    .setColor(Colors.ERROR)
                    .setTitle('⚠️ Warning Issued')
                    .addFields(
                        { name: 'User', value: target.tag, inline: true },
                        { name: 'Moderator', value: message.author.tag, inline: true },
                        { name: 'Reason', value: reason },
                        { name: 'Total Warnings', value: warningCount.toString() }
                    );

                await message.reply({ embeds: [embed] });
            }
        }
    }
};
