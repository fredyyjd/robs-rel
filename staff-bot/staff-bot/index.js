require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection, Options } = require('discord.js');
const config = require('./config');

if (!config.token) {
  console.error('Missing BOT_TOKEN — add it to the .env file (nano .env).');
  process.exit(1);
}

const client = new Client({
  // Guilds: slash commands / buttons. DirectMessages: the DM application flow.
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  // Channel + Message partials are required for DMs to arrive.
  partials: [Partials.Channel, Partials.Message],

  // Low-memory setup (small VPS): keep few messages and drop caches the bot never reads.
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    MessageManager: 25,
    UserManager: { maxSize: 100, keepOverLimit: (u) => u.id === u.client.user.id },
    GuildMemberManager: { maxSize: 50, keepOverLimit: (m) => m.id === m.client.user.id },
    GuildInviteManager: 0,
    GuildBanManager: 0,
    PresenceManager: 0,
    VoiceStateManager: 0,
    StageInstanceManager: 0,
    GuildScheduledEventManager: 0,
    ThreadMemberManager: 0,
  }),
  sweepers: {
    ...Options.DefaultSweeperSettings,
    messages: { interval: 300, lifetime: 1800 },
  },
});

// Load slash commands from /commands
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

// Load event handlers from /events
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  const run = (...args) => event.execute(...args);
  if (event.once) client.once(event.name, run);
  else client.on(event.name, run);
}

process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));

client.login(config.token);
