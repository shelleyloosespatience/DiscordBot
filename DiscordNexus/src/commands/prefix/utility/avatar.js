const { EmbedBuilder } = require('discord.js');
const { Colors } = require('../../../utils/constants');

module.exports = {
    name: 'avatar',
    description: 'Display user\'s avatar',
    usage: '!avatar [user]',
    category: 'utility',
    async execute(message, args) {
        const target = message.mentions.users.first() || message.author;
        
        const embed = new EmbedBuilder()
            .setColor(Colors.INFO)
            .setTitle(`${target.username}'s Avatar`)
            .setImage(target.displayAvatarURL({ size: 1024, dynamic: true }))
            .setFooter({ text: `Requested by ${message.author.tag}` });

        await message.reply({ embeds: [embed] });
    }
};
