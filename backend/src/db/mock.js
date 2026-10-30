let voteState = {};

function votes() {
  return voteState;
}

function vote(id, decision) {
  if (!voteState[id]) voteState[id] = { true: 0, false: 0 };
  if (decision === 'true') voteState[id].true++;
  if (decision === 'false') voteState[id].false++;
  return voteState[id];
}

function leaderboard() {
  // Placeholder leaderboard with static users
  return [
    { user: 'alice', points: 120, badge: 'Misinformation Slayer' },
    { user: 'bob', points: 85, badge: 'Fact Detective' },
    { user: 'chandra', points: 50, badge: 'Truth Explorer' }
  ];
}

module.exports = { votes, vote, leaderboard };
