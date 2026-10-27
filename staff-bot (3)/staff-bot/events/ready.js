const { Events } = require('discord.js');
const { startGiveawayTimer } = require('../utils/giveaways');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Logged in as ${client.user.tag}`);
    // Ends any giveaways that are due (also picks them back up after a restart).
    startGiveawayTimer(client);
  },
};
