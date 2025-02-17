const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const AntiRaidManager = require('../models/AntiRaidManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('security')
        .setDescription('Configure anti-raid protection settings')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('config')
                .setDescription('Configure basic anti-raid settings')
                .addBooleanOption(option =>
                    option.setName('enabled')
                        .setDescription('Enable or disable anti-raid protection'))
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action to take on detected raiders')
                        .addChoices(
                            { name: 'Ban', value: 'ban' },
                            { name: 'Kick', value: 'kick' },
                            { name: 'Timeout', value: 'timeout' }
                        ))
                .addChannelOption(option =>
                    option.setName('notify_channel')
                        .setDescription('Channel for anti-raid notifications')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('thresholds')
                .setDescription('Configure action thresholds')
                .addIntegerOption(option =>
                    option.setName('channel_delete')
                        .setDescription('Channel deletion threshold')
                        .setMinValue(1)
                        .setMaxValue(10))
                .addIntegerOption(option =>
                    option.setName('role_delete')
                        .setDescription('Role deletion threshold')
                        .setMinValue(1)
                        .setMaxValue(10))
                .addIntegerOption(option =>
                    option.setName('member_ban')
                        .setDescription('Member ban threshold')
                        .setMinValue(1)
                        .setMaxValue(10))
                .addIntegerOption(option =>
                    option.setName('member_kick')
                        .setDescription('Member kick threshold')
                        .setMinValue(1)
                        .setMaxValue(10)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('Manage whitelist')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add/remove from whitelist'))
                .addBooleanOption(option =>
                    option.setName('add')
                        .setDescription('True to add, False to remove'))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const guildConfig = AntiRaidManager.getGuildConfig(interaction.guildId);

        try {
            switch (subcommand) {
                case 'config':
                    await handleConfigSubcommand(interaction, guildConfig);
                    break;
                case 'thresholds':
                    await handleThresholdsSubcommand(interaction, guildConfig);
                    break;
                case 'whitelist':
                    await handleWhitelistSubcommand(interaction, guildConfig);
                    break;
            }

            await AntiRaidManager.saveConfig();
            
            await interaction.reply({
                embeds: [{
                    color: 0x00FF00,
                    title: '✅ Security Settings Updated',
                    description: 'Anti-raid configuration has been updated successfully.',
                    timestamp: new Date()
                }],
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                embeds: [{
                    color: 0xFF0000,
                    title: '❌ Error',
                    description: 'Failed to update anti-raid configuration.',
                    timestamp: new Date()
                }],
                ephemeral: true
            });
            console.error('Error in security command:', error);
        }
    }
};

async function handleConfigSubcommand(interaction, config) {
    const enabled = interaction.options.getBoolean('enabled');
    const action = interaction.options.getString('action');
    const notifyChannel = interaction.options.getChannel('notify_channel');

    if (enabled !== null) config.enabled = enabled;
    if (action) config.action.type = action;
    if (notifyChannel) config.action.notifyChannel = notifyChannel.id;
}

async function handleThresholdsSubcommand(interaction, config) {
    const thresholds = {
        channel_delete: 'channelDelete',
        role_delete: 'roleDelete',
        member_ban: 'memberBan',
        member_kick: 'memberKick'
    };

    Object.entries(thresholds).forEach(([option, key]) => {
        const value = interaction.options.getInteger(option);
        if (value !== null) {
            config.thresholds[key].limit = value;
        }
    });
}

async function handleWhitelistSubcommand(interaction, config) {
    const user = interaction.options.getUser('user');
    const add = interaction.options.getBoolean('add');

    if (!user || add === null) return;

    if (add) {
        if (!config.whitelist.includes(user.id)) {
            config.whitelist.push(user.id);
        }
    } else {
        config.whitelist = config.whitelist.filter(id => id !== user.id);
    }
}