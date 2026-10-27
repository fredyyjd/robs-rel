// The 5 ticket categories shown as buttons on the ticket panel.
// `questions` are asked in a form as soon as someone presses the button.
// `notes` (optional) is an FYI line shown in the ticket.
module.exports = [
  {
    id: 'support',
    style: 'Danger', // button colour: Danger=red, Success=green, Primary=blue, Secondary=grey
    label: 'Support',
    description: 'Open this if you want help or assistance with anything.',
    questions: ['What do you need help with?', "What's your IGN?"],
  },
  {
    id: 'buy_sell_spawner',
    style: 'Success', // button colour: Danger=red, Success=green, Primary=blue, Secondary=grey
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
    style: 'Success', // button colour: Danger=red, Success=green, Primary=blue, Secondary=grey
    label: 'Giveaway Claim',
    description: 'Open this to claim a giveaway you won.',
    questions: ['How much have you won?', 'Who hosted the giveaway?'],
  },
  {
    id: 'giveaway_sponsor',
    style: 'Primary', // button colour: Danger=red, Success=green, Primary=blue, Secondary=grey
    label: 'Giveaway Sponsor',
    description: 'Open this if you want to sponsor a giveaway.',
    questions: ['How much do you want to sponsor?', "What's your IGN?"],
  },
  {
    id: 'partner',
    style: 'Primary',
    label: 'Partner',
    description: 'Open this if you want to partner with us.',
    questions: ["What's your server name?", 'How many members does it have?', 'Link to your server'],
  },
];
