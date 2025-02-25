const { Events } = require("discord.js");
const ticketManager = require("../utils/ticketManager");
const { Colors, Messages } = require("../utils/constants");
const logger = require("../utils/logger");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return;

        try {
            if (interaction.customId === "ticket_create_modal") {
                const reason =
                    interaction.fields.getTextInputValue("ticket_reason");

                try {
                    const channel = await ticketManager.createTicket(
                        interaction.guild,
                        interaction.user,
                        reason,
                    );

                    await interaction.reply({
                        embeds: [
                            {
                                color: Colors.SUCCESS,
                                description: `${Messages.TICKET_CREATED} Check ${channel.toString()}`,
                            },
                        ],
                        ephemeral: true,
                    });
                } catch (error) {
                    logger.error("Error creating ticket from modal:", error);
                    await interaction.reply({
                        embeds: [
                            {
                                color: Colors.ERROR,
                                description: Messages.ERROR,
                            },
                        ],
                        ephemeral: true,
                    });
                }
            }
        } catch (error) {
            logger.error("Error handling modal submit:", error);
            if (!interaction.replied) {
                await interaction.reply({
                    embeds: [
                        {
                            color: Colors.ERROR,
                            description: Messages.ERROR,
                        },
                    ],
                    ephemeral: true,
                });
            }
        }
    },
};
