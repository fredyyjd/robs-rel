const { PermissionFlagsBits } = require('discord.js');
const config = require('../config');

// Staff = Administrator, Manage Server, or the configured staff role.
function isStaff(member) {
  if (!member || !member.permissions) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  if (config.staffRoleId && member.roles.cache.has(config.staffRoleId)) return true;
  return false;
}

module.exports = { isStaff };
