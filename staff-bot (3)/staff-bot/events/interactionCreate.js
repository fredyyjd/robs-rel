const { Events, MessageFlags } = require('discord.js');
const { ENTER_ID, handleGiveawayButton } = require('../utils/giveaways');
const applicationFlow = require('../utils/applicationFlow');
const { handleTicketOpen } = require('../utils/ticketHandlers');
const {
  closeChannel,
  requestClose,
  handleCloseAgree,
  handleCloseDisagree,
  claimTicket,
  unclaimTicket,
  handleRenameButton,
  handleRenameModalSubmit,
} = require('../utils/ticketActions');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        return await command.execute(interaction);
      }

      if (interaction.isButton()) {
        if (interaction.customId === ENTER_ID) return await handleGiveawayButton(interaction);
        const id = interaction.customId;
        if (id.startsWith('staffapp_')) return await applicationFlow.handleButton(interaction);
        if (id.startsWith('ticket_open_')) return await handleTicketOpen(interaction);
        if (id === 'ticket_close_btn') return await closeChannel(interaction);
        if (id === 'ticket_request_close_btn') return await requestClose(interaction);
        if (id.startsWith('ticket_close_agree:')) return await handleCloseAgree(interaction);
        if (id.startsWith('ticket_close_disagree:')) return await handleCloseDisagree(interaction);
        if (id === 'ticket_claim_btn') return await claimTicket(interaction);
        if (id === 'ticket_unclaim_btn') return await unclaimTicket(interaction);
        if (id === 'ticket_rename_btn') return await handleRenameButton(interaction);
        return;
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('staffapp_')) return await applicationFlow.handleModal(interaction);
        if (interaction.customId === 'ticket_rename_modal') return await handleRenameModalSubmit(interaction);
        // ticket_modal_* (the intake form) is handled inside utils/ticketHandlers.js
      }
    } catch (err) {
      console.error('[interaction] error:', err);
      const payload = { content: 'Something went wrong running that. Try again in a moment.', flags: MessageFlags.Ephemeral };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {});
      } else if (interaction.isRepliable()) {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};
