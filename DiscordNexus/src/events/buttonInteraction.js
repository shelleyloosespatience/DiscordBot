const { EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ticketManager = require('../utils/ticketManager');
const ticketConfig = require('../utils/ticketConfig');
const { Colors, Messages } = require('../utils/constants');
const logger = require('../utils/logger');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        try {
            switch (interaction.customId) {
                case 'create_ticket': {
                    const modal = new ModalBuilder()
                        .setCustomId('ticket_create_modal')
                        .setTitle('Create a Ticket');

                    const reasonInput = new TextInputBuilder()
                        .setCustomId('ticket_reason')
                        .setLabel('Why do you need support?')
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder('Please describe your issue...')
                        .setRequired(true)
                        .setMinLength(10)
                        .setMaxLength(1000);

                    const firstActionRow = new ActionRowBuilder().addComponents(reasonInput);
                    modal.addComponents(firstActionRow);

                    await interaction.showModal(modal);
                    break;
                }
                case 'ticket_close': {
                    const config = ticketConfig.getGuildConfig(interaction.guild.id);
                    logger.info(`Closing ticket with config: ${JSON.stringify(config.ticketSettings)}`);

                    const transcriptPath = await ticketManager.saveTranscript(interaction.channel.id);
                    const closed = await ticketManager.closeTicket(interaction.channel.id);

                    if (closed) {
                        const embed = new EmbedBuilder()
                            .setColor(Colors.WARNING)
                            .setTitle('Ticket Closing')
                            .setDescription(`This ticket will be closed in ${config.ticketSettings.closeDelay / 1000} seconds.`)
                            .setFooter({ text: `Closed by ${interaction.user.tag}` });

                        await interaction.reply({ embeds: [embed] });

                        if (transcriptPath && config.transcriptChannel) {
                            const transcriptChannel = await interaction.guild.channels.fetch(config.transcriptChannel);
                            if (transcriptChannel) {
                                const transcriptEmbed = new EmbedBuilder()
                                    .setColor(Colors.INFO)
                                    .setTitle('Ticket Transcript')
                                    .setDescription(`Ticket ID: ${interaction.channel.name}`)
                                    .addFields(
                                        { name: 'Closed By', value: interaction.user.tag },
                                        { name: 'Close Time', value: new Date().toLocaleString() }
                                    );

                                await transcriptChannel.send({ embeds: [transcriptEmbed], files: [transcriptPath] });
                            }
                        }

                        setTimeout(() => interaction.channel.delete(), config.ticketSettings.closeDelay);
                    } else {
                        await interaction.reply({
                            content: Messages.ERROR,
                            ephemeral: true
                        });
                    }
                    break;
                }
                case 'ticket_claim': {
                    const claimed = await ticketManager.claimTicket(interaction.channel.id, interaction.user);
                    if (claimed) {
                        const embed = new EmbedBuilder()
                            .setColor(Colors.SUCCESS)
                            .setTitle('Ticket Claimed')
                            .setDescription(`This ticket has been claimed by ${interaction.user.toString()}`)
                            .setTimestamp()
                            .setFooter({ text: interaction.guild.name });

                        await interaction.reply({ embeds: [embed] });
                    } else {
                        await interaction.reply({
                            content: 'This ticket cannot be claimed.',
                            ephemeral: true
                        });
                    }
                    break;
                }
                case 'ticket_transcript': {
                    const transcriptPath = await ticketManager.saveTranscript(interaction.channel.id);
                    if (transcriptPath) {
                        const config = ticketConfig.getGuildConfig(interaction.guild.id);
                        const transcriptChannel = await interaction.guild.channels.fetch(config.transcriptChannel);

                        if (transcriptChannel) {
                            const embed = new EmbedBuilder()
                                .setColor(Colors.INFO)
                                .setTitle('Ticket Transcript')
                                .setDescription(`Transcript for: ${interaction.channel.name}`)
                                .addFields(
                                    { name: 'Generated By', value: interaction.user.tag },
                                    { name: 'Generation Time', value: new Date().toLocaleString() }
                                );

                            await transcriptChannel.send({ embeds: [embed], files: [transcriptPath] });
                            await interaction.reply({
                                content: 'Transcript saved and sent to the transcript channel.',
                                ephemeral: true
                            });
                        } else {
                            await interaction.reply({
                                content: 'Transcript channel not found.',
                                ephemeral: true
                            });
                        }
                    } else {
                        await interaction.reply({
                            content: Messages.ERROR,
                            ephemeral: true
                        });
                    }
                    break;
                }
            }
        } catch (error) {
            logger.error('Error handling button interaction:', error);
            await interaction.reply({
                content: Messages.ERROR,
                ephemeral: true
            });
        }
    }
};