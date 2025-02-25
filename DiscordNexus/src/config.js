require('dotenv').config();

module.exports = {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    prefix: '.',
    owners: ['953527567808356404'],
    testGuild: process.env.TEST_GUILD,
};
