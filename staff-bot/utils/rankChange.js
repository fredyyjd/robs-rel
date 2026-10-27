const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { isStaff } = require('./permissions');
const rankRoles = require('../data/rankRoles');
const config = require('../config');

const ephemeral = (content) => ({ content, flags: MessageFlags.Ephemeral });

// Builds /promo (gives the role) and /demo (takes the role away).
// action: 'add' | 'remove'
function createRankCommand({ name, description, action, title, text, dmText }) {
  return {
    data: new SlashCommandBuilder()
      .setName(name)
      .setDescription(description)
      .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
      .addRoleOption((o) => o.setName('role').setDescription('Rank').setRequired(true))
      .addStringOption((o) => o.setName('reason').setDescription('Reason (optional)').setMaxLength(500))
      .setDMPermission(false),

    async execute(interaction) {
      if (!isStaff(interaction.member)) {
        return interaction.reply(ephemeral('You do not have permission to use this.'));
      }

      const user = interaction.options.getUser('user');
      const roleOpt = interaction.options.getRole('role');
      const reason = interaction.options.getString('reason');

      if (!rankRoles.includes(roleOpt.id)) {
        return interaction.reply(ephemeral('That role can’t be used for this command.'));
      }

      const guild = interaction.guild;
      const role = guild.roles.cache.get(roleOpt.id);
      const target = await guild.members.fetch(user.id).catch(() => null);
      if (!role) return interaction.reply(ephemeral('I can’t find that role.'));
      if (!target) return interaction.reply(ephemeral('That user isn’t in this server.'));

      // You can't hand out (or take away) a role as high as or higher than your own,
      // unless you're the server owner or an Administrator.
      const inv = interaction.member;
      const isOwner = guild.ownerId === inv.id;
      const isAdmin = inv.permissions.has(PermissionFlagsBits.Administrator);
      if (!isOwner && !isAdmin && inv.roles.highest.comparePositionTo(role) <= 0) {
        return interaction.reply(ephemeral('You can’t manage a role that high.'));
      }

      if (!role.editable) {
        return interaction.reply(
          ephemeral('I can’t manage that role. Give me **Manage Roles** and move my role above it.')
        );
      }

      const has = target.roles.cache.has(role.id);
      if (action === 'add' && has) return interaction.reply(ephemeral(`${user} already has ${role}.`));
      if (action === 'remove' && !has) return interaction.reply(ephemeral(`${user} doesn’t have ${role}.`));

      try {
        await target.roles[action](role, `${title} by ${interaction.user.tag}`);
      } catch (err) {
        console.error(`[${name}] role change failed:`, err);
        return interaction.reply(ephemeral('I couldn’t change their roles. Check my permissions and role position.'));
      }

      const reasonLine = reason ? `\n\n**Reason:** ${reason}` : '';

      const embed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(title)
        .setDescription(`${text(user, role)}${reasonLine}`);

      // Content pings the user; roles inside the embed never ping.
      await interaction.reply({
        content: `${user}`,
        embeds: [embed],
        allowedMentions: { users: [user.id] },
      });

      // DM the user too (role mentions don't render in DMs, so the role name is used).
      const dmEmbed = new EmbedBuilder()
        .setColor(config.embedColor)
        .setTitle(title)
        .setDescription(`${dmText(role, guild)}${reasonLine}`)
        .setFooter({ text: guild.name });

      try {
        await user.send({ embeds: [dmEmbed] });
      } catch {
        await interaction
          .followUp(ephemeral(`I couldn’t DM ${user} (their DMs are closed).`))
          .catch(() => {});
      }
    },
  };
}

module.exports = { createRankCommand };
