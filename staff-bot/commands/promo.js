const { createRankCommand } = require('../utils/rankChange');

// /promo user role [reason]
module.exports = createRankCommand({
  name: 'promo',
  description: 'Promote a staff member',
  title: 'Promotion',
  text: (user, role) => `Congratulations ${user} on being promoted to ${role}!`,
  dmText: (role, guild) => `Congratulations on being promoted to **${role.name}** in ${guild.name}!`,
});
