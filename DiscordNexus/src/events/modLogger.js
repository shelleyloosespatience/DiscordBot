const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
let ModLogConfig; // Mongoose model if using MongoDB

if (process.env.MONGO_URI) {
  const mongoose = require('mongoose');
  // Assume connection was handled by the command file
  const modLogConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true }
  });
  ModLogConfig = mongoose.model('ModLogConfig', modLogConfigSchema);
}

const CONFIG_PATH = path.join(__dirname, '../../../modlogsConfig.json');

/**
 * Retrieve the mod logs channel for a guild either from MongoDB or local JSON.
 * Returns a Promise that resolves to the channel object or null.
 */
async function getModLogChannel(guild) {
  if (!guild) return null;
  if (process.env.MONGO_URI && ModLogConfig) {
    try {
      const config = await ModLogConfig.findOne({ guildId: guild.id });
      if (config && config.channelId) return guild.channels.cache.get(config.channelId);
    } catch (err) {
      console.error('[ModLogs] MongoDB fetch error:', err);
    }
  } else {
    if (fs.existsSync(CONFIG_PATH)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      if (config[guild.id]) return guild.channels.cache.get(config[guild.id]);
    }
  }
  return null;
}

module.exports = (client) => {
  // Log deleted messages
  client.on('messageDelete', async (message) => {
    if (!message.guild || message.author.bot) return;
    const logChannel = await getModLogChannel(message.guild);
    if (!logChannel) return;
    const embed = new EmbedBuilder()
      .setTitle('Message Deleted')
      .setColor(0xff0000)
      .setDescription(`Message by **${message.author.tag}** in <#${message.channel.id}> was deleted.`)
      .addFields({
        name: 'Content',
        value: message.content ? message.content.substring(0, 1024) : 'No content'
      })
      .setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(console.error);
  });

  // Log edited messages
  client.on('messageUpdate', async (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author.bot) return;
    if (oldMessage.content === newMessage.content) return;
    const logChannel = await getModLogChannel(oldMessage.guild);
    if (!logChannel) return;
    const embed = new EmbedBuilder()
      .setTitle('Message Edited')
      .setColor(0xffa500)
      .setDescription(`Message by **${oldMessage.author.tag}** in <#${oldMessage.channel.id}> was edited.`)
      .addFields(
        { name: 'Before', value: oldMessage.content ? oldMessage.content.substring(0, 1024) : 'No content' },
        { name: 'After', value: newMessage.content ? newMessage.content.substring(0, 1024) : 'No content' }
      )
      .setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(console.error);
  });

  // Log channel deletions
  client.on('channelDelete', async (channel) => {
    if (!channel.guild) return;
    const logChannel = await getModLogChannel(channel.guild);
    if (!logChannel) return;
    const embed = new EmbedBuilder()
      .setTitle('Channel Deleted')
      .setColor(0xff0000)
      .setDescription(`Channel **${channel.name}** (ID: ${channel.id}) was deleted.`)
      .setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(console.error);
  });

  // Log channel updates (e.g. name/topic changes)
  client.on('channelUpdate', async (oldChannel, newChannel) => {
    if (!oldChannel.guild) return;
    const logChannel = await getModLogChannel(oldChannel.guild);
    if (!logChannel) return;
    let changes = '';
    if (oldChannel.name !== newChannel.name) {
      changes += `**Name:** ${oldChannel.name} → ${newChannel.name}\n`;
    }
    if (oldChannel.topic !== newChannel.topic) {
      changes += `**Topic:** ${oldChannel.topic || 'None'} → ${newChannel.topic || 'None'}\n`;
    }
    if (!changes) return;
    const embed = new EmbedBuilder()
      .setTitle('Channel Updated')
      .setColor(0xffa500)
      .setDescription(`Channel **${oldChannel.name}** (ID: ${oldChannel.id}) was updated.`)
      .addFields({ name: 'Changes', value: changes })
      .setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(console.error);
  });

  // Log member removals (leaves or kicks)
  client.on('guildMemberRemove', async (member) => {
    if (!member.guild) return;
    const logChannel = await getModLogChannel(member.guild);
    if (!logChannel) return;
    const embed = new EmbedBuilder()
      .setTitle('Member Left / Kicked')
      .setColor(0xff0000)
      .setDescription(`Member **${member.user.tag}** (ID: ${member.id}) left or was kicked.`)
      .setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(console.error);
  });

  // Log member updates (e.g. timeouts, role changes)
  client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if (!oldMember.guild) return;
    const logChannel = await getModLogChannel(oldMember.guild);
    if (!logChannel) return;
    let changes = '';
    // Check for timeout (communication disabled) changes
    if (oldMember.communicationDisabledUntil !== newMember.communicationDisabledUntil) {
      changes += `**Timeout:** ${oldMember.communicationDisabledUntil ? new Date(oldMember.communicationDisabledUntil).toLocaleString() : 'None'} → ${newMember.communicationDisabledUntil ? new Date(newMember.communicationDisabledUntil).toLocaleString() : 'None'}\n`;
    }
    // Check for role changes
    const oldRoles = oldMember.roles.cache.map(r => r.id);
    const newRoles = newMember.roles.cache.map(r => r.id);
    if (oldRoles.length !== newRoles.length) {
      changes += `**Roles Changed:** ${oldMember.roles.cache.map(r => r.name).join(', ')} → ${newMember.roles.cache.map(r => r.name).join(', ')}\n`;
    }
    if (!changes) return;
    const embed = new EmbedBuilder()
      .setTitle('Member Updated')
      .setColor(0xffa500)
      .setDescription(`Member **${oldMember.user.tag}** (ID: ${oldMember.id}) was updated.`)
      .addFields({ name: 'Changes', value: changes })
      .setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(console.error);
  });

  // Log role creations
  client.on('roleCreate', async (role) => {
    if (!role.guild) return;
    const logChannel = await getModLogChannel(role.guild);
    if (!logChannel) return;
    const embed = new EmbedBuilder()
      .setTitle('Role Created')
      .setColor(0x00ff00)
      .setDescription(`Role **${role.name}** (ID: ${role.id}) was created.`)
      .setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(console.error);
  });

  // Log role deletions
  client.on('roleDelete', async (role) => {
    if (!role.guild) return;
    const logChannel = await getModLogChannel(role.guild);
    if (!logChannel) return;
    const embed = new EmbedBuilder()
      .setTitle('Role Deleted')
      .setColor(0xff0000)
      .setDescription(`Role **${role.name}** (ID: ${role.id}) was deleted.`)
      .setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(console.error);
  });

  // Log role updates
  client.on('roleUpdate', async (oldRole, newRole) => {
    if (!oldRole.guild) return;
    const logChannel = await getModLogChannel(oldRole.guild);
    if (!logChannel) return;
    let changes = '';
    if (oldRole.name !== newRole.name) {
      changes += `**Name:** ${oldRole.name} → ${newRole.name}\n`;
    }
    if (oldRole.color !== newRole.color) {
      changes += `**Color:** ${oldRole.hexColor} → ${newRole.hexColor}\n`;
    }
    if (!changes) return;
    const embed = new EmbedBuilder()
      .setTitle('Role Updated')
      .setColor(0xffa500)
      .setDescription(`Role **${oldRole.name}** (ID: ${oldRole.id}) was updated.`)
      .addFields({ name: 'Changes', value: changes })
      .setTimestamp();
    logChannel.send({ embeds: [embed] }).catch(console.error);
  });
};
