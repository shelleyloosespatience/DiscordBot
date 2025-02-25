module.exports = {
    name: 'ping',
    description: 'Check bot latency',
    category: 'utility',
    async execute(message) {
        const sent = await message.reply('Pinging...');
        sent.edit(`Pong! Latency: ${sent.createdTimestamp - message.createdTimestamp}ms`);
    }
};
