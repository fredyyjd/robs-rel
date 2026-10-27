const {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const { isStaff } = require('../utils/permissions');

// /lock [channel] — stops @everyone from sending messages in the channel and
// posts "## #channel has been locked by @user".
module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Lock a channel so members can’t send messages (staff only)')
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('Channel to lock (default: this channel)')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    )
    .setDMPermission(false),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({ content: 'You do not have permission to use this.', flags: MessageFlags.Ephemeral });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const everyone = interaction.guild.roles.everyone;

    const existing = channel.permissionOverwrites.cache.get(everyone.id);
    if (existing?.deny.has(PermissionFlagsBits.SendMessages)) {
      return interaction.reply({ content: `${channel} is already locked.`, flags: MessageFlags.Ephemeral });
    }

    try {
      await channel.permissionOverwrites.edit(everyone, { SendMessages: false });
    } catch (err) {
      console.error('[lock] failed:', err);
      return interaction.reply({
        content: `I couldn’t lock ${channel}. I need **Manage Channels** and **Manage Roles** there.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setDescription(`## ${channel} has been locked by ${interaction.user}`);

    if (channel.id === interaction.channelId) {
      return interaction.reply({ embeds: [embed] });
    }
    await channel.send({ embeds: [embed] }).catch(() => {});
    return interaction.reply({ content: `Locked ${channel}.`, flags: MessageFlags.Ephemeral });
  },
};
