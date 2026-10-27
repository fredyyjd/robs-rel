// Slash-command text options (like /embed's title/description) don't expand
// custom emoji: typing :name: stays the literal shortcode. This swaps in the
// server's real emoji tag when one matches. Unmatched shortcodes are left as-is.
function resolveEmojiShortcodes(guild, text) {
  if (!text || !guild) return text;
  return text.replace(/:(\w+):/g, (full, name) => {
    const emoji = guild.emojis.cache.find((e) => e.name === name);
    return emoji ? emoji.toString() : full;
  });
}

module.exports = { resolveEmojiShortcodes };
