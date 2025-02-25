const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Permissions, Messages, Colors } = require('../../../utils/constants');

// Store channel configurations
const autoReactChannels = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autoreact')
        .setDescription('Configure auto-reactions for channels')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set auto-reactions for a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to configure')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reactions')
                        .setDescription('Reactions to add (emoji separated by spaces)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove auto-reactions from a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to remove auto-reactions from')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List channels with auto-reactions')),

    autoReactChannels, // Export the Map

    async execute(interaction) {
        if (!interaction.member.permissions.has(Permissions.MANAGE_MESSAGES)) {
            return interaction.reply({
                content: Messages.NO_PERMISSION,
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'set': {
                const channel = interaction.options.getChannel('channel');
                const reactions = interaction.options.getString('reactions').trim().split(/\s+/);

                // Validate emojis
                const validReactions = [];
                for (const reaction of reactions) {
                    try {
                        // Test if the bot can use this emoji
                        const message = await interaction.channel.send('Testing emoji...');
                        await message.react(reaction);
                        await message.delete();
                        validReactions.push(reaction);
                    } catch {
                        continue;
                    }
                }

                if (validReactions.length === 0) {
                    return interaction.reply({
                        content: 'No valid reactions provided. Please use valid emojis that I can access.',
                        ephemeral: true
                    });
                }

                autoReactChannels.set(channel.id, validReactions);

                const embed = new EmbedBuilder()
                    .setColor(Colors.SUCCESS)
                    .setTitle('Auto-Reactions Configured')
                    .addFields(
                        { name: 'Channel', value: channel.toString() },
                        { name: 'Reactions', value: validReactions.join(' ') }
                    );

                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'remove': {
                const channel = interaction.options.getChannel('channel');

                if (autoReactChannels.delete(channel.id)) {
                    await interaction.reply({
                        content: `Auto-reactions removed from ${channel.toString()}.`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `No auto-reactions were configured for ${channel.toString()}.`,
                        ephemeral: true
                    });
                }
                break;
            }
            case 'list': {
                const configuredChannels = [...autoReactChannels.entries()];

                if (configuredChannels.length === 0) {
                    return interaction.reply({
                        content: 'No channels have auto-reactions configured.',
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor(Colors.INFO)
                    .setTitle('Auto-Reaction Channels')
                    .setDescription(configuredChannels.map(([channelId, reactions]) =>
                        `<#${channelId}>: ${reactions.join(' ')}`
                    ).join('\n'));

                await interaction.reply({ embeds: [embed] });
                break;
            }
        }
    }
};