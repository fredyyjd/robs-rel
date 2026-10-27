const { SlashCommandBuilder, ChannelType, EmbedBuilder, MessageFlags } = require('discord.js');
const { isStaff } = require('../utils/permissions');
const config = require('../config');
const { resolveEmojiShortcodes } = require('../utils/parseEmoji');

// /embed title: description: — posts a custom embed. Staff only.
// Tip: slash options can't hold real line breaks, so type \n where you want
// a new line (e.g. "Line one\nLine two").
module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Send an embed')
    .addStringOption((o) => o.setName('title').setDescription('Title').setMaxLength(256))
    .addStringOption((o) =>
      o.setName('description').setDescription('Description').setMaxLength(4000)
    )
    .addStringOption((o) => o.setName('color').setDescription('Color (hex)'))
    .addStringOption((o) => o.setName('image').setDescription('Image URL'))
    .addStringOption((o) => o.setName('thumbnail').setDescription('Thumbnail URL'))
    .addStringOption((o) => o.setName('footer').setDescription('Footer').setMaxLength(2048))
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

    const guild = interaction.guild;
    const fix = (t) => resolveEmojiShortcodes(guild, t)?.replace(/\\n/g, '\n');
    const title = fix(interaction.options.getString('title'));
    const description = fix(interaction.options.getString('description'));
    const footer = fix(interaction.options.getString('footer'));
    const colorInput = interaction.options.getString('color');
    const image = interaction.options.getString('image');
    const thumbnail = interaction.options.getString('thumbnail');
    const target = interaction.options.getChannel('channel') || interaction.channel;

    if (!title && !description && !image && !thumbnail) {
      return interaction.reply({
        content: 'Give at least a title, description, image or thumbnail — an empty embed can’t be sent.',
        flags: MessageFlags.Ephemeral,
      });
    }

    let color = config.embedColor;
    if (colorInput) {
      const parsed = parseInt(colorInput.replace('#', ''), 16);
      if (Number.isNaN(parsed)) {
        return interaction.reply({
          content: `"${colorInput}" isn’t a valid hex color — try something like #5865f2.`,
          flags: MessageFlags.Ephemeral,
        });
      }
      color = parsed;
    }

    const embed = new EmbedBuilder().setColor(color);
    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description);
    if (image) embed.setImage(image);
    if (thumbnail) embed.setThumbnail(thumbnail);
    if (footer) embed.setFooter({ text: footer });

    try {
      await target.send({ embeds: [embed] });
    } catch (err) {
      console.error('[embed] failed to send:', err);
      return interaction.reply({
        content: `Couldn’t send that embed — check the image/thumbnail URLs and my permissions in ${target}.\n\`\`\`${err.message}\`\`\``,
        flags: MessageFlags.Ephemeral,
      });
    }

    return interaction.reply({ content: `Embed posted in ${target}.`, flags: MessageFlags.Ephemeral });
  },
};
