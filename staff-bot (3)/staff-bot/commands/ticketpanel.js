const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const categories = require('../data/ticketCategories');
const config = require('../config');
const { isStaff } = require('../utils/permissions');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Send the ticket panel')
    .setDMPermission(false),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: 'You do not have permission to use this.', flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('Tickets')
      .setDescription(config.ticketPanelDescription);

    const row = new ActionRowBuilder().addComponents(
      categories.map((c) =>
        new ButtonBuilder()
          .setCustomId(`ticket_open_${c.id}`)
          .setLabel(c.label)
          .setEmoji(c.emoji)
          .setStyle(ButtonStyle.Secondary)
      )
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: 'Ticket panel posted.', flags: MessageFlags.Ephemeral });
  },
};
