const { Events, MessageFlags } = require('discord.js');
const { ENTER_ID, handleGiveawayButton } = require('../utils/giveaways');
const applicationFlow = require('../utils/applicationFlow');

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
        if (interaction.customId.startsWith('staffapp_')) return await applicationFlow.handleButton(interaction);
        return;
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('staffapp_')) return await applicationFlow.handleModal(interaction);
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
