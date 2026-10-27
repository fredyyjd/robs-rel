// Token / client id / guild id come from the .env file (nano .env on the VPS).
// Everything else is set directly below — edit the values in this file.
require('dotenv').config();

module.exports = {
  token: process.env.BOT_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,

  // Role that can use the staff commands (/embed, /lock, /unlock, /gcreate,
  // /gend, /greroll, /staffapps) and press Accept / Deny on applications.
  // Administrator and Manage Server always work. Leave '' to only allow those.
  staffRoleId: '',

  // ---- Staff applications ----
  // - reviewChannelId: EXISTING text channel where finished applications are
  //   posted with the Accept / Deny buttons. Make it staff-only.
  // - pingRoleId: role pinged when an application lands ('' = no ping).
  // - acceptedRoleId: role given to the applicant when accepted ('' = none).
  //   The bot needs Manage Roles and its role must sit above this role.
  // - timeLimitHours: how long someone has to finish once they press Start.
  // - reapplyDays: cooldown after a denial.
  applications: {
    reviewChannelId: '1560663173626069123',
    pingRoleId: '',
    acceptedRoleId: '',
    timeLimitHours: 3,
    reapplyDays: 7,

    // Embed posted by /staffapps (the blue "Staff Application" button sits under it).
    panelTitle: 'Staff Applications',
    panelDescription:
`Want to join the team? Press the button below to start your staff application.

**Before you apply:**
> Make sure your DMs are open so I can message you
> Read the rules first
> If you ping a staff member about your application you will be denied
> If you get denied you can reapply in 1 week`,
  },
};
