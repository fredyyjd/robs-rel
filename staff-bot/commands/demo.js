const { createRankCommand } = require('../utils/rankChange');

// /demo user role [reason]
module.exports = createRankCommand({
  name: 'demo',
  description: 'Demote a staff member',
  title: 'Demotion',
  text: (user, role) => `${user} has been demoted to ${role}.`,
  dmText: (role, guild) => `You have been demoted to **${role.name}** in ${guild.name}.`,
});
