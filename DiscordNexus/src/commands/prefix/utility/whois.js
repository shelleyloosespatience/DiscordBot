const { EmbedBuilder } = require('discord.js');
const { Colors } = require('../../../utils/constants');

module.exports = {
    name: 'whois',
    description: 'Display detailed information about a user',
    usage: '!whois [user]',
    category: 'utility',
    async execute(message, args) {
        const target = message.mentions.members.first() || message.member;
        const badges = {
            BugHunterLevel1: 'Bug Hunter',
            BugHunterLevel2: 'Bug Hunter Level 2',
            CertifiedModerator: 'Discord Certified Moderator',
            HypeSquadOnlineHouse1: 'House Bravery',
            HypeSquadOnlineHouse2: 'House Brilliance',
            HypeSquadOnlineHouse3: 'House Balance',
            Hypesquad: 'HypeSquad Events',
            Partner: 'Partner',
            PremiumEarlySupporter: 'Early Supporter',
            Staff: 'Discord Staff',
            VerifiedBot: 'Verified Bot',
            VerifiedDeveloper: 'Early Verified Bot Developer'
        };

        const userFlags = target.user.flags?.toArray() || [];
        const deviceList = [];
        if (target.presence?.clientStatus) {
            if (target.presence.clientStatus.desktop) deviceList.push('💻 Desktop');
            if (target.presence.clientStatus.mobile) deviceList.push('📱 Mobile');
            if (target.presence.clientStatus.web) deviceList.push('🌐 Web');
        }

        const permissions = {
            Administrator: '👑',
            ManageGuild: '⚙️',
            ManageRoles: '📜',
            ManageChannels: '📁',
            ManageMessages: '📝',
            ManageWebhooks: '🔗',
            ManageNicknames: '📛',
            ManageEmojisAndStickers: '😄',
            KickMembers: '👢',
            BanMembers: '🔨',
            MentionEveryone: '📢'
        };

        const keyPermissions = Object.entries(permissions)
            .filter(([perm]) => target.permissions.has(perm))
            .map(([, emoji]) => emoji);

        const roles = target.roles.cache
            .filter(role => role.id !== message.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString());

        const embed = new EmbedBuilder()
            .setColor(target.displayHexColor || Colors.INFO)
            .setTitle(`${target.user.tag}'s Information`)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .addFields(
                { name: '🆔 ID', value: target.id, inline: true },
                { name: '🎭 Nickname', value: target.nickname || 'None', inline: true },
                { name: '🤖 Bot', value: target.user.bot ? 'Yes' : 'No', inline: true },
                { name: '📅 Account Created', value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '📥 Joined Server', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '🎮 Status', value: target.presence?.status || 'offline', inline: true }
            );

        if (deviceList.length > 0) {
            embed.addFields({ name: '📱 Devices', value: deviceList.join('\n'), inline: true });
        }

        if (userFlags.length > 0) {
            const userBadges = userFlags
                .map(flag => badges[flag])
                .filter(badge => badge)
                .join(', ');
            if (userBadges) {
                embed.addFields({ name: '🏅 Badges', value: userBadges, inline: true });
            }
        }

        if (keyPermissions.length > 0) {
            embed.addFields({ name: '🔑 Key Permissions', value: keyPermissions.join(' '), inline: true });
        }

        if (roles.length > 0) {
            embed.addFields({ name: `📜 Roles [${roles.length}]`, value: roles.join(', ').substring(0, 1024) });
        }

        if (target.presence?.activities?.length > 0) {
            const activities = target.presence.activities.map(activity => {
                let text = `**${activity.type}:** ${activity.name}`;
                if (activity.details) text += `\n${activity.details}`;
                if (activity.state) text += `\n${activity.state}`;
                return text;
            }).join('\n\n');
            
            embed.addFields({ name: '🎮 Activities', value: activities });
        }

        embed.setFooter({ text: `Requested by ${message.author.tag}` })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
