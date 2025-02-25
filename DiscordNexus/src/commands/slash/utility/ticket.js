const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const { Colors } = require('../../../utils/constants');
const ticketManager = require('../../../utils/ticketManager');
const ticketConfig = require('../../../utils/ticketConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Manage support tickets')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Setup the ticket system')
                .addChannelOption(option =>
                    option.setName('ticket_channel')
                        .setDescription('Channel where users can create tickets')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('transcript_channel')
                        .setDescription('Channel where ticket transcripts will be sent')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('support_role')
                        .setDescription('Role that can see and manage tickets')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('title')
                        .setDescription('Title for the ticket creation embed')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('description')
                        .setDescription('Description for the ticket creation embed')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Color for the embed (hex code)')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('button_label')
                        .setDescription('Label for the create ticket button')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('button_emoji')
                        .setDescription('Emoji for the create ticket button')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Create a new support ticket')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for creating the ticket')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Close the current ticket channel'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('claim')
                .setDescription('Claim the current ticket')),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'setup': {
                    // Check if user has admin permissions
                    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                        return interaction.reply({
                            content: 'You need administrator permissions to setup the ticket system.',
                            ephemeral: true
                        });
                    }

                    const ticketChannel = interaction.options.getChannel('ticket_channel');
                    const transcriptChannel = interaction.options.getChannel('transcript_channel');
                    const supportRole = interaction.options.getRole('support_role');
                    const title = interaction.options.getString('title') || 'Support Tickets';
                    const description = interaction.options.getString('description') || 'Click the button below to create a ticket';
                    const color = interaction.options.getString('color') || '#5865F2';
                    const buttonLabel = interaction.options.getString('button_label') || 'Create Ticket';
                    const buttonEmoji = interaction.options.getString('button_emoji') || '🎫';

                    // Save configuration
                    await ticketConfig.setGuildConfig(interaction.guild.id, {
                        ticketChannel: ticketChannel.id,
                        transcriptChannel: transcriptChannel.id,
                        supportRoles: [supportRole.id],
                        embedSettings: {
                            color: color,
                            title: title,
                            description: description,
                            thumbnail: interaction.guild.iconURL()
                        },
                        buttonSettings: {
                            label: buttonLabel,
                            emoji: buttonEmoji,
                            style: ButtonStyle.Primary
                        }
                    });

                    // Create the ticket creation embed
                    const embed = new EmbedBuilder()
                        .setColor(color)
                        .setTitle(title)
                        .setDescription(description)
                        .setThumbnail(interaction.guild.iconURL())
                        .setFooter({ text: interaction.guild.name });

                    // Create the button
                    const button = new ButtonBuilder()
                        .setCustomId('create_ticket')
                        .setLabel(buttonLabel)
                        .setEmoji(buttonEmoji)
                        .setStyle(ButtonStyle.Primary);

                    const row = new ActionRowBuilder().addComponents(button);

                    // Send the setup message
                    await ticketChannel.send({
                        embeds: [embed],
                        components: [row]
                    });

                    const setupEmbed = new EmbedBuilder()
                        .setColor(Colors.SUCCESS)
                        .setTitle('Ticket System Setup Complete')
                        .addFields(
                            { name: 'Ticket Channel', value: ticketChannel.toString(), inline: true },
                            { name: 'Transcript Channel', value: transcriptChannel.toString(), inline: true },
                            { name: 'Support Role', value: supportRole.toString(), inline: true }
                        );

                    await interaction.reply({ embeds: [setupEmbed], ephemeral: true });
                    break;
                }
                case 'create': {
                    const reason = interaction.options.getString('reason');
                    try {
                        const channel = await ticketManager.createTicket(
                            interaction.guild,
                            interaction.user,
                            reason
                        );

                        const embed = new EmbedBuilder()
                            .setColor(Colors.SUCCESS)
                            .setDescription(`Ticket created successfully! Check ${channel.toString()}`);

                        await interaction.reply({
                            embeds: [embed],
                            ephemeral: true
                        });
                    } catch (error) {
                        console.error('Error creating ticket:', error);
                        await interaction.reply({
                            content: 'Failed to create ticket. Please try again later.',
                            ephemeral: true
                        });
                    }
                    break;
                }
                case 'close': {
                    if (!interaction.channel) {
                        return interaction.reply({
                            content: 'This command can only be used in a server channel.',
                            ephemeral: true
                        });
                    }

                    const closed = await ticketManager.closeTicket(interaction.channel.id);
                    if (closed) {
                        await interaction.reply('Ticket will be closed in 5 seconds...');
                        setTimeout(() => interaction.channel.delete(), 5000);
                    } else {
                        await interaction.reply({
                            content: 'This is not a ticket channel.',
                            ephemeral: true
                        });
                    }
                    break;
                }
                case 'claim': {
                    if (!interaction.channel) {
                        return interaction.reply({
                            content: 'This command can only be used in a server channel.',
                            ephemeral: true
                        });
                    }

                    const claimed = await ticketManager.claimTicket(interaction.channel.id, interaction.user);
                    if (claimed) {
                        await interaction.reply({
                            content: `Ticket claimed by ${interaction.user.toString()}!`,
                            ephemeral: false
                        });
                    } else {
                        await interaction.reply({
                            content: 'This ticket cannot be claimed. It might be already claimed or not a valid ticket channel.',
                            ephemeral: true
                        });
                    }
                    break;
                }
            }
        } catch (error) {
            console.error('Error executing ticket command:', error);
            await interaction.reply({
                content: 'An error occurred while processing your request.',
                ephemeral: true
            });
        }
    }
};