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

const PANEL_TEXT = `Thanks for reaching out, feel free to make a ticket.

Click a button below to open a ticket in the relevant category.

Only open a ticket if you genuinely need help.`;

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
      .setTitle(interaction.guild.name)
      .setDescription(PANEL_TEXT)
      .setFooter({ text: `${interaction.guild.name} - Tickets - 1 per user` });

    const row = new ActionRowBuilder().addComponents(
      categories.map((c) =>
        new ButtonBuilder()
          .setCustomId(`ticket_open_${c.id}`)
          .setLabel(c.label)
          .setStyle(ButtonStyle[c.style] || ButtonStyle.Secondary)
      )
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: 'Ticket panel posted.', flags: MessageFlags.Ephemeral });
  },
};
