const {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require('discord.js');
const { isStaff } = require('../utils/permissions');
const config = require('../config');

// /unlock [channel] — lets @everyone send messages again and posts
// "## #channel has been unlocked by @user".
module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a channel')
    .addChannelOption((o) =>
      o
        .setName('channel')
        .setDescription('Channel')
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
    if (!existing?.deny.has(PermissionFlagsBits.SendMessages)) {
      return interaction.reply({ content: `${channel} isn’t locked.`, flags: MessageFlags.Ephemeral });
    }

    try {
      // null = remove the override and fall back to the category / server default
      // (setting it to true would force-allow it and ignore the category).
      await channel.permissionOverwrites.edit(everyone, { SendMessages: null });
    } catch (err) {
      console.error('[unlock] failed:', err);
      return interaction.reply({
        content: `I couldn’t unlock ${channel}. I need **Manage Channels** and **Manage Roles** there.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setDescription(`## ${channel} has been unlocked by ${interaction.user}`);

    if (channel.id === interaction.channelId) {
      return interaction.reply({ embeds: [embed] });
    }
    await channel.send({ embeds: [embed] }).catch(() => {});
    return interaction.reply({ content: `Unlocked ${channel}.`, flags: MessageFlags.Ephemeral });
  },
};
