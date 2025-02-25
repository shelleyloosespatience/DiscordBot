const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { Permissions, Messages, Colors } = require('../../../utils/constants');
const warningManager = require('../../../utils/warningManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Manage warnings for users')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Warn a user')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to warn')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for the warning')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List warnings for a user')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to check warnings for')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a specific warning')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to remove warning from')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('warning_id')
                        .setDescription('The ID of the warning to remove')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear all warnings for a user')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to clear warnings for')
                        .setRequired(true))),

    async execute(interaction) {
        if (!interaction.member.permissions.has(Permissions.MANAGE_MESSAGES)) {
            return interaction.reply({
                content: Messages.NO_PERMISSION,
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getUser('target');

        switch (subcommand) {
            case 'add': {
                const reason = interaction.options.getString('reason');
                const warningCount = warningManager.addWarning(
                    interaction.guildId,
                    target.id,
                    interaction.user.id,
                    reason
                );

                const embed = new EmbedBuilder()
                    .setColor(Colors.ERROR)
                    .setTitle('⚠️ Warning Issued')
                    .addFields(
                        { name: 'User', value: target.tag, inline: true },
                        { name: 'Moderator', value: interaction.user.tag, inline: true },
                        { name: 'Reason', value: reason },
                        { name: 'Total Warnings', value: warningCount.toString() }
                    );

                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'list': {
                const warnings = warningManager.getWarnings(interaction.guildId, target.id);
                
                if (warnings.length === 0) {
                    return interaction.reply({
                        content: `${target.tag} has no warnings.`,
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setColor(Colors.INFO)
                    .setTitle(`Warnings for ${target.tag}`)
                    .setDescription(warnings.map(w => 
                        `**ID ${w.id}** by <@${w.moderatorId}> on ${new Date(w.timestamp).toLocaleDateString()}\n` +
                        `Reason: ${w.reason}`
                    ).join('\n\n'));

                await interaction.reply({ embeds: [embed] });
                break;
            }
            case 'remove': {
                const warningId = interaction.options.getInteger('warning_id');
                const removed = warningManager.removeWarning(interaction.guildId, target.id, warningId);

                if (removed) {
                    await interaction.reply({
                        content: `Warning ${warningId} has been removed from ${target.tag}.`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `Warning ${warningId} not found for ${target.tag}.`,
                        ephemeral: true
                    });
                }
                break;
            }
            case 'clear': {
                warningManager.clearWarnings(interaction.guildId, target.id);
                await interaction.reply({
                    content: `All warnings have been cleared for ${target.tag}.`,
                    ephemeral: true
                });
                break;
            }
        }
    }
};
