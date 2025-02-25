const { EmbedBuilder } = require('discord.js');
const { prefix } = require('../../../config');
const { Colors } = require('../../../utils/constants');

module.exports = {
    name: 'help',
    description: 'Display all commands or info about a specific command',
    usage: '!help [command]',
    category: 'utility',
    async execute(message, args) {
        const { prefixCommands, slashCommands } = message.client;

        if (!args.length) {
            const embed = new EmbedBuilder()
                .setColor(Colors.INFO)
                .setTitle('📚 Command List')
                .setDescription(`Use \`${prefix}help [command]\` for details about a specific prefix command.\nUse \`/help\` to see slash command details.`);

            // Organize commands by category
            const categories = new Map();

            // Add prefix commands
            prefixCommands.forEach(command => {
                const category = categories.get(command.category) || { prefix: [], slash: [] };
                category.prefix.push(command.name);
                categories.set(command.category, category);
            });

            // Add slash commands
            slashCommands.forEach(command => {
                const category = command.data.name;
                const categoryGroup = categories.get(category) || { prefix: [], slash: [] };
                categoryGroup.slash.push(command.data.name);
                categories.set(category, categoryGroup);
            });

            // Add fields for each category
            categories.forEach((commands, category) => {
                let fieldValue = '';

                if (commands.prefix.length > 0) {
                    fieldValue += `**Prefix Commands:**\n${commands.prefix.map(cmd => `\`${prefix}${cmd}\``).join(', ')}\n`;
                }

                if (commands.slash.length > 0) {
                    fieldValue += `**Slash Commands:**\n${commands.slash.map(cmd => `\`/${cmd}\``).join(', ')}`;
                }

                embed.addFields({
                    name: `${category.charAt(0).toUpperCase() + category.slice(1)}`,
                    value: fieldValue || 'No commands available',
                    inline: false
                });
            });

            // Add footer with command count
            const totalCommands = prefixCommands.size + slashCommands.size;
            embed.setFooter({ 
                text: `Total Commands: ${totalCommands} | Prefix Commands: ${prefixCommands.size} | Slash Commands: ${slashCommands.size}` 
            });

            return message.reply({ embeds: [embed] });
        }

        // Detailed help for a specific command
        const commandName = args[0].toLowerCase();
        const command = prefixCommands.get(commandName);

        if (!command) {
            return message.reply({
                embeds: [{
                    color: Colors.ERROR,
                    description: '❌ Command not found. Use `!help` to see all available commands.'
                }]
            });
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.INFO)
            .setTitle(`Command: ${command.name}`)
            .addFields(
                { name: '📝 Description', value: command.description || 'No description available' },
                { name: '📋 Usage', value: command.usage || 'No usage provided' },
                { name: '📁 Category', value: command.category || 'No category' }
            );

        if (command.aliases) {
            embed.addFields({ name: '🔄 Aliases', value: command.aliases.join(', ') });
        }

        if (command.permissions) {
            embed.addFields({ name: '🔒 Required Permissions', value: command.permissions.join(', ') });
        }

        message.reply({ embeds: [embed] });
    }
};