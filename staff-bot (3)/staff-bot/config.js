// Token / client id / guild id come from the .env file (nano .env on the VPS).
// Everything else is set directly below — edit the values in this file.
require('dotenv').config();

module.exports = {
  token: process.env.BOT_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  // Color of every embed the bot sends.
  embedColor: 0x800080, // #800080

  // Role that can use the staff commands (/embed, /lock, /unlock, /gcreate,
  // /gend, /greroll, /staffapps) and press Accept / Deny on applications.
  // Administrator and Manage Server always work. Leave '' to only allow those.
  staffRoleId: '',

  // ---- Tickets (/ticket-panel) ----
  // - ticketCategories.<id>.categoryId: Discord category the tickets are
  //   created under ('' = no category). ids match data/ticketCategories.js.
  // - ticketCategories.<id>.pingRoleIds: roles pinged + given access
  //   (staffRoleId is always added).
  // - alwaysCanTypeRoleId: role that can always type, even in a claimed ticket.
  // - ticketLogChannelId: transcripts + claim/close logs go here ('' = off).
  // Set staffRoleId above so staff can see the tickets.
  ticketPanelDescription:
`### 🎫 Support
> **Open this if you want help or assistance with anything.**

### 🚨 Staff Report
> **Open this if a staff / builder did something wrong.**

### 🛒 Buy/Sell Spawner
> **Open this if you want to buy/sell spawners.**

### 🎁 Giveaway Claim
> **Open this to claim a giveaway you won.**

### 🎉 Giveaway Sponsor
> **Open this if you want to sponsor a giveaway.**`,

  alwaysCanTypeRoleId: '',
  ticketLogChannelId: '',
  ticketCategories: {
    support: { categoryId: '', pingRoleIds: [] },
    staff_report: { categoryId: '', pingRoleIds: [] },
    buy_sell_spawner: { categoryId: '', pingRoleIds: [] },
    giveaway_claim: { categoryId: '', pingRoleIds: [] },
    giveaway_sponsor: { categoryId: '', pingRoleIds: [] },
  },

  // ---- Applications (staff + partner manager) ----
  // Each type has its own:
  // - reviewChannelId: EXISTING text channel where finished applications are
  //   posted with Accept / Deny. Make it staff-only.
  // - pingRoleId: role pinged when one lands ('' = no ping).
  // - acceptedRoleId: role given when accepted ('' = none). The bot needs
  //   Manage Roles and its role must sit above it.
  // Shared: timeLimitHours (time to finish after Start) and reapplyDays
  // (cooldown after a denial).
  applications: {
    timeLimitHours: 3,
    reapplyDays: 7,

    staff: {
      reviewChannelId: '1560663173626069123',
      pingRoleId: '',
      acceptedRoleId: '',
    },
    partner: {
      reviewChannelId: '1560663173626069123',
      pingRoleId: '',
      acceptedRoleId: '',
    },

    // Embed posted by /staffapps (the blue buttons sit under it).
    panelTitle: 'Applications',
    panelDescription:
`Want to join the team? Press a button below to start your application.

**Before you apply:**
> Make sure your DMs are open so I can message you
> Read the rules first
> If you ping a staff member about your application you will be denied
> If you get denied you can reapply in 1 week`,
  },
};
