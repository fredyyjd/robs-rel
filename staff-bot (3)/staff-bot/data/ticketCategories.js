// The 5 ticket categories shown as buttons on the ticket panel.
// `questions` are asked in a form as soon as someone presses the button.
// `notes` (optional) is an FYI line shown in the ticket.
module.exports = [
  {
    id: 'support',
    emoji: '🎫',
    label: 'Support',
    description: 'Open this if you want help or assistance with anything.',
    questions: ['What do you need help with?', "What's your IGN?"],
  },
  {
    id: 'staff_report',
    emoji: '🚨',
    label: 'Staff Report',
    description: 'Open this if a staff / builder did something wrong.',
    questions: [
      'Are you reporting a staff or a member?',
      'What did they do?',
      'Do you have any proof?',
    ],
  },
  {
    id: 'buy_sell_spawner',
    emoji: '🛒',
    label: 'Buy/Sell Spawner',
    description: 'Open this if you want to buy/sell spawners.',
    notes: 'Only buy/sell with users who have spawner perms.',
    questions: [
      'How many spawners are you buying/selling?',
      'Only buy/sell spawners with users who have spawner perms!',
    ],
  },
  {
    id: 'giveaway_claim',
    emoji: '🎁',
    label: 'Giveaway Claim',
    description: 'Open this to claim a giveaway you won.',
    questions: ['How much have you won?', 'Who hosted the giveaway?'],
  },
  {
    id: 'giveaway_sponsor',
    emoji: '🎉',
    label: 'Giveaway Sponsor',
    description: 'Open this if you want to sponsor a giveaway.',
    questions: ['How much do you want to sponsor?', "What's your IGN?"],
  },
];
