const { EmbedBuilder } = require('discord.js');
const { Colors } = require('../../../utils/constants');

module.exports = {
    name: 'userinfo',
    description: 'Display information about a user',
    usage: '!userinfo [user]',
    category: 'utility',
    async execute(message, args) {
        const target = message.mentions.users.first() || message.author;
        const member = message.guild.members.cache.get(target.id);
        
        const roles = member.roles.cache
            .filter(role => role.id !== message.guild.id)
            .map(role => role.toString())
            .join(', ') || 'None';

        const embed = new EmbedBuilder()
            .setColor(Colors.INFO)
            .setTitle(`${target.username}'s Information`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '🆔 ID', value: target.id, inline: true },
                { name: '🏷️ Tag', value: target.tag, inline: true },
                { name: '📅 Account Created', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '🎭 Nickname', value: member.nickname || 'None', inline: true },
                { name: '🤖 Bot', value: target.bot ? 'Yes' : 'No', inline: true },
                { name: `📜 Roles [${member.roles.cache.size - 1}]`, value: roles }
            )
            .setFooter({ text: `Requested by ${message.author.tag}` })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
