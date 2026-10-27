const { SlashCommandBuilder } = require('discord.js');
const { closeChannel, renameChannel, addUserToTicket } = require('../utils/ticketActions');

// /ticket close | rename <name> | add <user> — same as the ticket buttons.
module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ticket commands')
    .addSubcommand((sub) => sub.setName('close').setDescription('Close this ticket'))
    .addSubcommand((sub) =>
      sub
        .setName('rename')
        .setDescription('Rename this ticket')
        .addStringOption((o) => o.setName('name').setDescription('New name').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add a user to this ticket')
        .addUserOption((o) => o.setName('user').setDescription('User').setRequired(true))
    )
    .setDMPermission(false),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'close') return closeChannel(interaction);
    if (sub === 'rename') return renameChannel(interaction, interaction.options.getString('name'));
    if (sub === 'add') return addUserToTicket(interaction, interaction.options.getUser('user'));
  },
};
