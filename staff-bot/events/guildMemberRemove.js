const { Events } = require('discord.js');

const WELCOME_CHANNEL_ID = '1558218665361408071';

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(member) {
    if (!member.user || member.user.bot) return;
    try {
      const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID);
      if (!channel) return;
      await channel.send(`${member.user.username} has left us :(`);
    } catch (err) {
      console.error('[welcome] failed to send leave message:', err);
    }
  },
};
