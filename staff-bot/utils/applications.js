const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');
const createStore = require('./jsonStore');

// data/applications.json  { [appId]: { id, userId, guildId, channelId, lastMessageId,
//                                      answers: [{ q, a }], submittedAt, status, ... } }
// data/cooldowns.json     { [userId]: timestamp the user may apply again }
const applications = createStore('applications.json', {});
const cooldowns = createStore('cooldowns.json', {});

const IDS = {
  APPLY: 'staffapp_apply', // blue button on the server panel
  START: 'staffapp_start', // green Start App (DM)
  CANCEL: 'staffapp_cancel', // red Cancel App (DM)
  ACCEPT: 'staffapp_accept', // green Accept (review channel) — "staffapp_accept:<appId>"
  DENY: 'staffapp_deny', // red Deny (review channel) — "staffapp_deny:<appId>"
  ACCEPT_MODAL: 'staffapp_accept_modal',
  DENY_MODAL: 'staffapp_deny_modal',
  REAPPLY: 'staffapp_reapply', // greyed-out button on the denial DM
};

const TYPES = {
  staff: {
    label: 'Staff Application',
    questions: [
      'What is your balance, playtime and IGN?',
      'Why are you better than the other applicants?',
      'Are you active? And how long a day?',
      'Why should we choose you over the others?',
      'If you have experience, send it here! (server name, how many members, what role, or send links)',
      'If you ping a staff member about your app you will be denied. (Reply to confirm you understand)',
      'Are you able to host 15m weekly or a bit less?',
      'Do you have a working mic?',
      'Have you read the rules? (If you haven’t, please read them now)',
    ],
  },
  partner: {
    label: 'Partner Manager Application',
    questions: [
      'How active can you be?',
      'How many partners can you do a week?',
      'Do you have experience? (send proof here)',
    ],
  },
};

const BLUE = config.embedColor;
const GREEN = config.embedColor;
const RED = config.embedColor;
const DARK = config.embedColor;

const ts = (ms) => Math.floor(ms / 1000);
const hours = () => config.applications.timeLimitHours;
const reapplyLabel = () => {
  const d = config.applications.reapplyDays;
  return d === 7 ? '1 week' : `${d} day${d === 1 ? '' : 's'}`;
};

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ---- Embeds / rows shown to the applicant (DMs) ----

function confirmEmbed(type) {
  return new EmbedBuilder()
    .setColor(BLUE)
    .setTitle(TYPES[type].label)
    .setDescription(
      `**Are you sure you want to apply?**\n\n` +
        `Once you start the application I will send you a series of questions. ` +
        `You will have **${hours()} hours** to complete the application. ` +
        `If you do not complete the application in time, you will have to restart.\n\n` +
        `If you wish to stop the application feel free to click the cancel button at any time.`
    );
}

function confirmRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(IDS.START).setLabel('Start App').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(IDS.CANCEL).setLabel('Cancel App').setStyle(ButtonStyle.Danger)
  );
}

// The Cancel button is attached to every question embed.
function cancelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(IDS.CANCEL).setLabel('Cancel App').setStyle(ButtonStyle.Danger)
  );
}

function questionEmbed(type, index, expiresAt) {
  const t = TYPES[type];
  const e = new EmbedBuilder()
    .setColor(BLUE)
    .setTitle(`${t.label} — Question ${index + 1}/${t.questions.length}`)
    .setDescription(t.questions[index])
    .setFooter({ text: 'Reply to this message with your answer' });
  if (index === 0) e.addFields({ name: 'Time limit', value: `Ends <t:${ts(expiresAt)}:R>` });
  return e;
}

function simpleEmbed(title, description, color = DARK) {
  return new EmbedBuilder().setColor(color).setTitle(title).setDescription(description);
}

// ---- Review channel messages ----

function infoEmbed(user, member, guild, appId, submittedAt, type) {
  const joined = member?.joinedTimestamp
    ? `<t:${ts(member.joinedTimestamp)}:F> (<t:${ts(member.joinedTimestamp)}:R>)`
    : 'Not in the server';
  return new EmbedBuilder()
    .setColor(BLUE)
    .setTitle(TYPES[type].label)
    .setThumbnail(member?.displayAvatarURL() || user.displayAvatarURL())
    .addFields(
      { name: 'Display Name', value: member?.displayName || user.displayName || user.username, inline: true },
      { name: 'Username', value: user.username, inline: true },
      { name: 'User ID', value: user.id, inline: true },
      { name: 'Mention', value: `<@${user.id}>`, inline: true },
      { name: 'Joined Discord', value: `<t:${ts(user.createdTimestamp)}:F> (<t:${ts(user.createdTimestamp)}:R>)` },
      { name: `Joined ${guild.name}`, value: joined },
      { name: 'Submitted', value: `<t:${ts(submittedAt)}:F>` }
    )
    .setFooter({ text: `Application ID: ${appId}` });
}

// Discord caps a field value at 1024 chars and a message at 6000 chars across
// its embeds, so long answers are split into continuation fields and the
// answers are spread over as many messages as needed (one embed each).
function answerEmbeds(answers) {
  const fields = [];
  answers.forEach(({ q, a }, i) => {
    const chunks = a.match(/[\s\S]{1,1000}/g) || ['(no answer)'];
    chunks.forEach((chunk, n) => {
      fields.push({
        name: n === 0 ? `${i + 1}. ${q}`.slice(0, 256) : `${i + 1}. (continued)`,
        value: chunk,
      });
    });
  });

  const embeds = [];
  let current = [];
  let size = 0;
  for (const f of fields) {
    const len = f.name.length + f.value.length;
    if (current.length >= 25 || size + len > 5000) {
      embeds.push(current);
      current = [];
      size = 0;
    }
    current.push(f);
    size += len;
  }
  if (current.length) embeds.push(current);

  return embeds.map((fs, i) =>
    new EmbedBuilder()
      .setColor(DARK)
      .setTitle(i === 0 ? 'Answers' : 'Answers (continued)')
      .addFields(fs)
  );
}

function decisionRow(appId, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${IDS.ACCEPT}:${appId}`)
      .setLabel('Accept')
      .setStyle(ButtonStyle.Success)
      .setDisabled(disabled),
    new ButtonBuilder()
      .setCustomId(`${IDS.DENY}:${appId}`)
      .setLabel('Deny')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(disabled)
  );
}

function decidedRow(appId, accepted, staffName) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${IDS.ACCEPT}:${appId}:done`)
      .setLabel(`${accepted ? 'Accepted' : 'Denied'} by ${staffName}`.slice(0, 80))
      .setStyle(accepted ? ButtonStyle.Success : ButtonStyle.Danger)
      .setDisabled(true)
  );
}

// ---- DMs sent after a decision ----

function acceptedEmbed(label, guildName, reason) {
  return new EmbedBuilder()
    .setColor(GREEN)
    .setTitle(`${label} Accepted`)
    .setDescription(
      `Congratulations! Your **${label}** in **${guildName}** has been **accepted**.` +
        `\n\n**Reason:** ${reason || 'No reason given.'}`
    );
}

function deniedEmbed(label, guildName, reason, reapplyAt) {
  return new EmbedBuilder()
    .setColor(RED)
    .setTitle(`${label} Denied`)
    .setDescription(
      `You got denied in **${guildName}**.\n\n**Reason:** ${reason || 'No reason given.'}` +
        `\n\nYou can reapply <t:${ts(reapplyAt)}:R>.`
    );
}

// Greyed-out, can't be clicked.
function reapplyRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(IDS.REAPPLY)
      .setLabel(`Reapply in ${reapplyLabel()}!`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );
}

module.exports = {
  applications,
  cooldowns,
  IDS,
  TYPES,
  newId,
  hours,
  confirmEmbed,
  confirmRow,
  cancelRow,
  questionEmbed,
  simpleEmbed,
  infoEmbed,
  answerEmbeds,
  decisionRow,
  decidedRow,
  acceptedEmbed,
  deniedEmbed,
  reapplyRow,
  GREEN,
  RED,
  BLUE,
};
