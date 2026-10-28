const { AttachmentBuilder } = require('discord.js');

// Pages backwards through `channel`'s full message history (Discord only
// returns 100 at a time) and returns them oldest-first.
async function fetchAllMessages(channel) {
  const all = [];
  let before;

  for (;;) {
    const batch = await channel.messages.fetch({ limit: 100, before });
    if (!batch.size) break;
    all.push(...batch.values());
    before = batch.last().id;
    if (batch.size < 100) break;
  }

  return all.reverse();
}

const stamp = (ms) => new Date(ms).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

// Builds a plain-text transcript of `channel` and returns it as a discord.js
// AttachmentBuilder (.txt), ready to send/DM.
async function buildTranscript(channel) {
  const messages = await fetchAllMessages(channel);

  const lines = [
    `Transcript - #${channel.name}`,
    `${messages.length} message(s)`,
    '='.repeat(40),
    '',
  ];

  for (const m of messages) {
    lines.push(`[${stamp(m.createdTimestamp)}] ${m.author?.tag || 'Unknown'}`);

    if (m.content) lines.push(m.content);

    for (const e of m.embeds) {
      const parts = [e.title, e.description].filter(Boolean);
      if (parts.length) lines.push(parts.join('\n'));
    }

    for (const a of m.attachments.values()) lines.push(`[attachment] ${a.name}: ${a.url}`);

    if (!m.content && !m.embeds.length && !m.attachments.size) lines.push('(no text content)');

    lines.push('');
  }

  return new AttachmentBuilder(Buffer.from(lines.join('\n'), 'utf8'), {
    name: `transcript-${channel.name}.txt`,
  });
}

module.exports = { buildTranscript };
