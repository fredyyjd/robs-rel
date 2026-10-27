const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const config = require('../config');
const { isStaff } = require('../utils/permissions');
const { IDS } = require('../utils/applications');

// /staffapps — posts the staff application panel (blue "Staff Application" button).
module.exports = {
  data: new SlashCommandBuilder()
    .setName('staffapps')
    .setDescription('Send the application panel')
    .setDMPermission(false),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: 'You do not have permission to use this.', flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle(interaction.guild.name)
      .setDescription(config.applications.panelDescription)
      .setFooter({ text: `${interaction.guild.name} - Applications` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${IDS.APPLY}:staff`).setLabel('Staff Application').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`${IDS.APPLY}:partner`).setLabel('Partner Manager Application').setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    return interaction.reply({ content: 'Application panel posted.', flags: MessageFlags.Ephemeral });
  },
};
