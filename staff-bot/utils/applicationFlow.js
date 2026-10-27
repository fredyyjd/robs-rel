const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');
const config = require('../config');
const { isStaff } = require('./permissions');
const A = require('./applications');

const EPHEMERAL = MessageFlags.Ephemeral;
const CONFIRM_EXPIRE_MS = 15 * 60 * 1000;

// userId -> in-progress application (lives in memory; a bot restart cancels
// anything still being answered, finished applications are saved on disk).
//   { state: 'confirm' | 'active', guildId, messageId, timer, collector,
//     answers: [], index, expiresAt, lastQuestion, queue, done }
const sessions = new Map();

// ============================================================
// Panel button (server) -> sends the "Are you sure?" DM
// ============================================================
async function handleApply(interaction) {
  if (!interaction.guild) return;
  const user = interaction.user;

  const until = A.cooldowns.get(user.id);
  if (until && until > Date.now()) {
    return interaction.reply({
      content: `You were denied recently. You can reapply <t:${Math.floor(until / 1000)}:R>.`,
      flags: EPHEMERAL,
    });
  }
  const pending = Object.values(A.applications.all()).find((a) => a.userId === user.id && a.status === 'pending');
  if (pending) {
    return interaction.reply({ content: 'You already have an application waiting to be reviewed.', flags: EPHEMERAL });
  }
  if (sessions.has(user.id)) {
    return interaction.reply({
      content: 'You already have an application in progress — check your DMs.',
      flags: EPHEMERAL,
    });
  }

  await interaction.deferReply({ flags: EPHEMERAL });

  let message;
  try {
    const dm = await user.createDM();
    message = await dm.send({ embeds: [A.confirmEmbed()], components: [A.confirmRow()] });
  } catch {
    return interaction.editReply({
      content: 'I couldn’t DM you. Open your DMs for this server (Server menu > Privacy Settings > Direct Messages) and try again.',
    });
  }

  const session = { state: 'confirm', guildId: interaction.guild.id, messageId: message.id };
  session.timer = setTimeout(() => {
    if (sessions.get(user.id) !== session || session.state !== 'confirm') return;
    sessions.delete(user.id);
    message.edit({ components: [] }).catch(() => {});
  }, CONFIRM_EXPIRE_MS);
  session.timer.unref?.();
  sessions.set(user.id, session);

  return interaction.editReply({ content: 'Check your DMs to continue your application.' });
}

// ============================================================
// DM buttons: Start App / Cancel App
// ============================================================
async function handleStart(interaction) {
  const user = interaction.user;
  const session = sessions.get(user.id);
  if (!session || session.state !== 'confirm' || session.messageId !== interaction.message.id) {
    await interaction.update({ components: [] }).catch(() => {});
    return interaction.followUp({
      content: 'This application is no longer active. Go back to the server and press the Staff Application button again.',
    });
  }

  clearTimeout(session.timer);
  const ms = A.hours() * 60 * 60 * 1000;
  session.state = 'active';
  session.answers = [];
  session.index = 0;
  session.expiresAt = Date.now() + ms;
  session.queue = Promise.resolve();
  session.done = false;

  await interaction.update({ components: [] });

  const dm = await user.createDM();
  session.collector = dm.createMessageCollector({ filter: (m) => m.author.id === user.id, time: ms });
  session.collector.on('collect', (m) => {
    session.queue = session.queue
      .then(() => onAnswer(interaction.client, user, session, dm, m))
      .catch((err) => console.error('[staff apps] answer error:', err));
  });
  session.collector.on('end', (_c, reason) => {
    if (reason !== 'time') return;
    if (sessions.get(user.id) === session) sessions.delete(user.id);
    session.lastQuestion?.edit({ components: [] }).catch(() => {});
    dm.send({
      embeds: [A.simpleEmbed('Application Timed Out', `You ran out of time (${A.hours()} hours). Go back to the server and press the Staff Application button to restart.`, A.RED)],
    }).catch(() => {});
  });

  await askQuestion(session, dm);
}

async function handleCancel(interaction) {
  const user = interaction.user;
  const session = sessions.get(user.id);
  if (session) {
    clearTimeout(session.timer);
    session.done = true;
    session.collector?.stop('cancel');
    sessions.delete(user.id);
  }
  return interaction.update({
    embeds: [A.simpleEmbed('Application Cancelled', 'Your application was cancelled. You can start a new one any time from the server.', A.RED)],
    components: [],
  });
}

async function askQuestion(session, dm) {
  const msg = await dm.send({
    embeds: [A.questionEmbed(session.index, session.expiresAt)],
    components: [A.cancelRow()],
  });
  session.lastQuestion = msg;
}

async function onAnswer(client, user, session, dm, message) {
  if (session.done || sessions.get(user.id) !== session) return;

  let text = (message.content || '').trim();
  const files = [...message.attachments.values()].map((a) => a.url);
  if (files.length) text = [text, ...files].filter(Boolean).join('\n');
  if (!text) {
    await dm.send('Please reply with text (or a link) for this question.').catch(() => {});
    return;
  }

  session.lastQuestion?.edit({ components: [] }).catch(() => {});
  session.answers.push({ q: A.QUESTIONS[session.index], a: text.slice(0, 2000) });
  session.index++;

  if (session.index < A.QUESTIONS.length) {
    return askQuestion(session, dm);
  }

  session.done = true;
  session.collector.stop('done');
  sessions.delete(user.id);
  await submitApplication(client, user, session, dm);
}

// ============================================================
// Finished application -> review channel
// ============================================================
async function submitApplication(client, user, session, dm) {
  const fail = (why) => {
    console.error('[staff apps] submit failed:', why);
    return dm
      .send({ embeds: [A.simpleEmbed('Something went wrong', 'I couldn’t send your application to the staff team. Please contact a staff member.', A.RED)] })
      .catch(() => {});
  };

  const guild = await client.guilds.fetch(session.guildId).catch(() => null);
  const channel = await client.channels.fetch(config.applications.reviewChannelId).catch(() => null);
  if (!guild || !channel) return fail('guild or review channel not found');

  const member = await guild.members.fetch(user.id).catch(() => null);
  const appId = A.newId();
  const submittedAt = Date.now();
  const embeds = A.answerEmbeds(session.answers);

  try {
    const pingRole = config.applications.pingRoleId;
    await channel.send({
      content: pingRole ? `<@&${pingRole}>` : undefined,
      embeds: [A.infoEmbed(user, member, guild, appId, submittedAt)],
      allowedMentions: { roles: pingRole ? [pingRole] : [] },
    });

    let last;
    for (let i = 0; i < embeds.length; i++) {
      const isLast = i === embeds.length - 1;
      last = await channel.send({
        embeds: [embeds[i]],
        components: isLast ? [A.decisionRow(appId)] : [],
      });
    }

    A.applications.set(appId, {
      id: appId,
      userId: user.id,
      guildId: guild.id,
      channelId: channel.id,
      lastMessageId: last.id,
      answers: session.answers,
      submittedAt,
      status: 'pending',
    });
  } catch (err) {
    return fail(err.message);
  }

  await dm
    .send({
      embeds: [A.simpleEmbed(
        'Application Submitted',
        'Your staff application has been sent to the team. Please don’t ping or message staff about it — that will get you denied. You’ll get a DM when it’s reviewed.',
        A.GREEN
      )],
    })
    .catch(() => {});
}

// ============================================================
// Accept / Deny (review channel)
// ============================================================
async function handleDecisionButton(interaction, accept) {
  if (!isStaff(interaction.member)) {
    return interaction.reply({ content: 'Only staff can review applications.', flags: EPHEMERAL });
  }
  const appId = interaction.customId.split(':')[1];
  const app = A.applications.get(appId);
  if (!app) return interaction.reply({ content: 'I can’t find that application.', flags: EPHEMERAL });
  if (app.status !== 'pending') {
    return interaction.reply({ content: `That application was already ${app.status}.`, flags: EPHEMERAL });
  }

  const modal = new ModalBuilder()
    .setCustomId(`${accept ? A.IDS.ACCEPT_MODAL : A.IDS.DENY_MODAL}:${appId}`)
    .setTitle(accept ? 'Accept Application' : 'Deny Application')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('reason')
          .setLabel('Reason (optional)')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(1000)
      )
    );
  return interaction.showModal(modal);
}

async function handleDecisionModal(interaction, accept) {
  if (!isStaff(interaction.member)) {
    return interaction.reply({ content: 'Only staff can review applications.', flags: EPHEMERAL });
  }
  const appId = interaction.customId.split(':')[1];
  const app = A.applications.get(appId);
  if (!app) return interaction.reply({ content: 'I can’t find that application.', flags: EPHEMERAL });
  if (app.status !== 'pending') {
    return interaction.reply({ content: `That application was already ${app.status}.`, flags: EPHEMERAL });
  }

  const reason = interaction.fields.getTextInputValue('reason').trim();
  const client = interaction.client;
  const staffName = interaction.member.displayName || interaction.user.username;

  // Save the decision first so two staff members can't both decide it.
  Object.assign(app, {
    status: accept ? 'accepted' : 'denied',
    decidedBy: interaction.user.id,
    decidedAt: Date.now(),
    reason: reason || null,
  });
  A.applications.set(appId, app);

  await interaction.deferReply({ flags: EPHEMERAL });
  const notes = [];

  // 1) Lock the buttons on the review message and post the outcome under it.
  try {
    const channel = await client.channels.fetch(app.channelId);
    const msg = await channel.messages.fetch(app.lastMessageId);
    await msg.edit({ components: [A.decidedRow(appId, accept, staffName)] });
    await msg.reply({
      embeds: [new EmbedBuilder()
        .setColor(accept ? A.GREEN : A.RED)
        .setDescription(
          `**${accept ? 'Accepted' : 'Denied'}** by ${interaction.user}\n**Reason:** ${reason || 'No reason given.'}`
        )],
      allowedMentions: { parse: [] },
    });
  } catch (err) {
    console.error('[staff apps] couldn’t update review message:', err.message);
    notes.push('Couldn’t update the review message.');
  }

  // 2) Cooldown (deny) or role (accept).
  const guild = await client.guilds.fetch(app.guildId).catch(() => null);
  const reapplyAt = Date.now() + config.applications.reapplyDays * 24 * 60 * 60 * 1000;
  if (!accept) {
    A.cooldowns.set(app.userId, reapplyAt);
  } else if (config.applications.acceptedRoleId && guild) {
    const member = await guild.members.fetch(app.userId).catch(() => null);
    await member?.roles.add(config.applications.acceptedRoleId).catch((err) => {
      console.error('[staff apps] couldn’t give accepted role:', err.message);
      notes.push('Couldn’t give the accepted role (check Manage Roles and role order).');
    });
  }

  // 3) DM the applicant.
  const guildName = guild?.name || 'the server';
  try {
    const applicant = await client.users.fetch(app.userId);
    await applicant.send(
      accept
        ? { embeds: [A.acceptedEmbed(guildName, reason)] }
        : { embeds: [A.deniedEmbed(guildName, reason, reapplyAt)], components: [A.reapplyRow()] }
    );
  } catch {
    notes.push('Couldn’t DM the applicant (their DMs are closed).');
  }

  return interaction.editReply({
    content: `Application ${accept ? 'accepted' : 'denied'}.${notes.length ? '\n' + notes.join('\n') : ''}`,
  });
}

// ============================================================
// Router used by events/interactionCreate.js
// ============================================================
async function handleButton(interaction) {
  const id = interaction.customId;
  if (id === A.IDS.APPLY) return handleApply(interaction);
  if (id === A.IDS.START) return handleStart(interaction);
  if (id === A.IDS.CANCEL) return handleCancel(interaction);
  if (id.startsWith(`${A.IDS.ACCEPT}:`)) return handleDecisionButton(interaction, true);
  if (id.startsWith(`${A.IDS.DENY}:`)) return handleDecisionButton(interaction, false);
}

async function handleModal(interaction) {
  const id = interaction.customId;
  if (id.startsWith(`${A.IDS.ACCEPT_MODAL}:`)) return handleDecisionModal(interaction, true);
  if (id.startsWith(`${A.IDS.DENY_MODAL}:`)) return handleDecisionModal(interaction, false);
}

module.exports = { handleButton, handleModal };
