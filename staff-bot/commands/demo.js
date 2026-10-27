const { createRankCommand } = require('../utils/rankChange');

// /demo user role [reason] — takes the role away, posts the message, DMs the user.
module.exports = createRankCommand({
  name: 'demo',
  description: 'Demote a staff member (removes the role)',
  action: 'remove',
  title: 'Demotion',
  text: (user, role) => `${user} has been demoted from ${role}.`,
  dmText: (role, guild) => `You have been demoted from **${role.name}** in ${guild.name}.`,
});
