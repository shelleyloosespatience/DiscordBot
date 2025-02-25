const { SlashCommandBuilder } = require('@discordjs/builders');
const { Permissions, Messages, Colors } = require('../../../utils/constants');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage roles for users')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a user')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to add the role to')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a user')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to remove the role from')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove')
                        .setRequired(true))),

    async execute(interaction) {
        try {
            if (!interaction.member.permissions.has(Permissions.MANAGE_ROLES)) {
                return interaction.reply({
                    content: Messages.NO_PERMISSION,
                    ephemeral: true
                });
            }

            const target = interaction.options.getMember('target');
            const role = interaction.options.getRole('role');
            const subcommand = interaction.options.getSubcommand();

            if (!target || !role) {
                return interaction.reply({
                    content: 'Failed to find the specified user or role.',
                    ephemeral: true
                });
            }

            // Check if the bot's role is high enough to manage the target role
            const botMember = interaction.guild.members.cache.get(interaction.client.user.id);
            if (role.position >= botMember.roles.highest.position) {
                return interaction.reply({
                    content: 'I cannot modify a role that is higher than or equal to my highest role.',
                    ephemeral: true
                });
            }

            // Check if the user's highest role is lower than the role they're trying to manage
            if (role.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    content: 'You cannot modify a role that is higher than or equal to your highest role.',
                    ephemeral: true
                });
            }

            if (subcommand === 'add') {
                await target.roles.add(role);
                await interaction.reply({
                    embeds: [{
                        color: Colors.SUCCESS,
                        description: `Successfully added the role ${role.name} to ${target.user.tag}`
                    }],
                    ephemeral: true
                });
            } else if (subcommand === 'remove') {
                await target.roles.remove(role);
                await interaction.reply({
                    embeds: [{
                        color: Colors.SUCCESS,
                        description: `Successfully removed the role ${role.name} from ${target.user.tag}`
                    }],
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error in role command:', error);
            await interaction.reply({
                content: Messages.ERROR,
                ephemeral: true
            });
        }
    }
};