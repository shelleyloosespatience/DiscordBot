const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
let ModLogConfig;

if (process.env.MONGO_URI) {
  const mongoose = require('mongoose');
  mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('[ModLogs] MongoDB connected for mod logs config'))
    .catch(err => console.error('[ModLogs] MongoDB connection error:', err));

  const modLogConfigSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true }
  });
  ModLogConfig = mongoose.model('ModLogConfig', modLogConfigSchema);
}

const CONFIG_PATH = path.join(__dirname, '../../../modlogsConfig.json');

// Ensure local JSON config exists
if (!fs.existsSync(CONFIG_PATH)) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify({}, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmodlogs')
    .setDescription('Set the mod logs channel for logging moderation events.')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Select a text channel for mod logs')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),
  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({ content: 'This command can only be used in a guild.', ephemeral: true });
    }
    const channel = interaction.options.getChannel('channel');
    try {
      if (ModLogConfig) {
        // Save to MongoDB
        await ModLogConfig.findOneAndUpdate(
          { guildId: interaction.guild.id },
          { channelId: channel.id },
          { upsert: true, new: true }
        );
      } else {
        // Save to local JSON file
        const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
        config[interaction.guild.id] = channel.id;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      }
      await interaction.reply({ content: `Mod logs channel has been set to ${channel}`, ephemeral: true });
    } catch (err) {
      console.error('[ModLogs] Error setting mod logs channel:', err);
      await interaction.reply({ content: 'There was an error setting the mod logs channel.', ephemeral: true });
    }
  }
};