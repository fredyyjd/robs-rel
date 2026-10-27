const { createRankCommand } = require('../utils/rankChange');

// /promo user role [reason] — gives the role, posts the message, DMs the user.
module.exports = createRankCommand({
  name: 'promo',
  description: 'Promote a staff member (gives them the role)',
  action: 'add',
  title: 'Promotion',
  text: (user, role) => `Congratulations ${user} on being promoted to ${role}!`,
  dmText: (role, guild) => `Congratulations on being promoted to **${role.name}** in ${guild.name}!`,
});
