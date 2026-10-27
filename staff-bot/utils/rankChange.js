const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { isStaff } = require('./permissions');
const rankRoles = require('../data/rankRoles');
const config = require('../config');

// Builds /promo and /demo (they only differ in wording).
function createRankCommand({ name, description, title, text, dmText }) {
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
        return interaction.reply({ content: 'You do not have permission to use this.', flags: MessageFlags.Ephemeral });
      }

      const user = interaction.options.getUser('user');
      const role = interaction.options.getRole('role');
      const reason = interaction.options.getString('reason');

      if (!rankRoles.includes(role.id)) {
        return interaction.reply({ content: 'That role can’t be used for this command.', flags: MessageFlags.Ephemeral });
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
        .setDescription(`${dmText(role, interaction.guild)}${reasonLine}`)
        .setFooter({ text: interaction.guild.name });

      try {
        await user.send({ embeds: [dmEmbed] });
      } catch {
        await interaction
          .followUp({ content: `I couldn’t DM ${user} (their DMs are closed).`, flags: MessageFlags.Ephemeral })
          .catch(() => {});
      }
    },
  };
}

module.exports = { createRankCommand };
