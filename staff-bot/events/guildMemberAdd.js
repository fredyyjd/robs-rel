const { Events } = require('discord.js');

const WELCOME_CHANNEL_ID = '1558218665361408071';

// 1 -> 1st, 2 -> 2nd, 3 -> 3rd, 4 -> 4th, 11 -> 11th, 21 -> 21st ...
function ordinal(n) {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
}

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (member.user.bot) return;
    try {
      const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID);
      if (!channel) return;
      await channel.send(
        `Hey ${member} Welcome to ${member.guild.name}, You are the #${ordinal(member.guild.memberCount)} member`
      );
    } catch (err) {
      console.error('[welcome] failed to send welcome:', err);
    }
  },
};
