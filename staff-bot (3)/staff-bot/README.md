# staff-bot

Discord bot with staff applications (DM flow), `/embed`, `/lock`, `/unlock` and giveaways.

```
commands/   slash commands (embed, lock, unlock, staffapps, ticket-panel, ticket, gcreate, gend, greroll)
events/     ready + interactionCreate
utils/      giveaways, application flow, permissions, JSON store
config.js   everything you edit (channel ids, roles, panel text)
data/       ticketCategories.js + live data (giveaways, applications, tickets) — json not committed
```

## Commands

| Command | What it does |
|---|---|
| `/embed title: description:` | Posts a custom embed (also color, image, thumbnail, footer, channel). Type `\n` for a new line. |
| `/lock [channel]` | Locks the channel and posts `## #channel has been locked by @user` |
| `/unlock [channel]` | Unlocks it and posts `## #channel has been unlocked by @user` |
| `/staffapps` | Posts the application panel (blue **Staff Application** + **Partner Manager Application** buttons) |
| `/ticket-panel` | Posts the ticket panel (Support, Staff Report, Buy/Sell Spawner, Giveaway Claim, Giveaway Sponsor) |
| `/ticket close` `rename` `add` | Manage the ticket you're in |
| `/gcreate` `/gend` `/greroll` | Giveaways, same options as the caveman bot |

Staff commands work for Administrator, Manage Server, or the role in `staffRoleId` (config.js).

## Application flow (Staff + Partner Manager)

1. Someone presses **Staff Application** -> the bot DMs "Are you sure you want to apply?" with green **Start App** / red **Cancel App**.
2. After Start they get the 9 questions in DMs (Cancel App is attached to every question). They have 3 hours.
3. The finished app is posted in the review channel (`applications.reviewChannelId` in config.js): info embed on top (display name, ID, joined Discord, joined server), the answers, then green **Accept** / red **Deny**. Both ask for an optional reason.
4. The applicant gets a DM with the result. Denied -> "You got denied" plus a greyed-out **Reapply in 1 week!** button, and they can't apply again for 7 days.

## Setup on the VPS

```bash
cd /root/bots
git clone https://github.com/YOUR-USER/YOUR-REPO.git
cd YOUR-REPO
npm install
nano .env            # BOT_TOKEN, CLIENT_ID, GUILD_ID  (see .env.example)
node deploy-commands.js
pm2 start index.js --name staff-bot
pm2 save
```

Updating:

```bash
cd /root/bots/YOUR-REPO
git pull
npm install                  # only if package.json changed
node deploy-commands.js      # only if you added/changed a command
pm2 restart staff-bot
```

## Invite the bot

Scopes: `bot` + `applications.commands`. Permissions: View Channels, Send Messages, Embed Links, Read Message History, Manage Channels + Manage Roles (for `/lock` `/unlock`), and Manage Roles if you set `acceptedRoleId`. Administrator also works.

No privileged intents are needed (Server Members / Message Content can stay off).
