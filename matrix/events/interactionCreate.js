const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: "interactionCreate",
    async execute(interaction) {
        // Early return if not a chat command
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.slashCommands.get(interaction.commandName);
        
        // If command not found, reply with error and log it
        if (!command) {
            console.error(`Command not found: ${interaction.commandName}`);
            return await interaction.reply({ 
                content: "This command wasn't found in the system. Please contact an administrator.", 
                ephemeral: true 
            });
        }

        try {
            // Execute the command
            await command.command.execute(interaction);
        } catch (error) {
            // Log the full error with stack trace
            console.error('Command execution error:', {
                command: interaction.commandName,
                user: interaction.user.tag,
                error: error.stack || error.message,
                timestamp: new Date().toISOString()
            });

            // Create a detailed error embed
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Command Error')
                .setDescription('An error occurred while executing this command.')
                .addFields(
                    { name: 'Command', value: interaction.commandName },
                    { name: 'Error', value: error.message.substring(0, 1000) } // Truncate if too long
                )
                .setTimestamp();

            try {
                // Handle the error response based on interaction state
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ 
                        embeds: [errorEmbed], 
                        ephemeral: true 
                    });
                } else {
                    await interaction.reply({ 
                        embeds: [errorEmbed], 
                        ephemeral: true 
                    });
                }
            } catch (followUpError) {
                // Log if we can't send the error message to Discord
                console.error('Failed to send error message to Discord:', {
                    originalError: error.message,
                    followUpError: followUpError.message
                });
            }

            // Rethrow the error if it's a critical error that should crash the bot
            if (error.critical) {
                throw error;
            }
        }
    }
};