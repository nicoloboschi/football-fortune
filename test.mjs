// Plays full games with random human choices and checks the books balance. Run: node test.mjs
import * as g from './game.js';
import * as D from './data.js';
import assert from 'node:assert';

function randomInput(s) {
  const p = s.pending, pick = a => a[g.rnd(a.length)];
  const mine = Object.keys(s.owner).map(Number).filter(x => s.owner[x] === 0);
  switch (p.type) {
    case 'roll':
      if (Math.random() < 0.1 && s.bank.length) return { type: 'bankBuy', pid: pick(s.bank) };
      if (Math.random() < 0.05) {
        const theirs = Object.keys(s.owner).map(Number).filter(x => typeof s.owner[x] === 'number' && s.owner[x] > 0);
        if (theirs.length) return { type: 'buyOffer', pid: pick(theirs), price: 100000 };
      }
      if (Math.random() < 0.05 && mine.length) return { type: 'sellOffer', pid: pick(mine), to: 1, price: 20000 };
      return { type: 'roll' };
    case 'info': case 'results': return { type: 'ok' };
    case 'choose': return { type: 'choose', id: pick(p.options).id };
    case 'pick': return p.optional && Math.random() < 0.3 ? { type: 'skip' } : { type: 'pick', pid: pick(p.pids) };
    case 'sell': return !p.forced && Math.random() < 0.7 ? { type: 'done' } : { type: 'sell', pid: pick(mine) };
    case 'auction': return Math.random() < 0.5 ? { type: 'pass' } : { type: 'bid', amount: p.next };
  }
}

function check(s) {
  const all = Object.keys(s.owner).map(Number);
  assert.equal(all.length, D.PLAYERS.length, 'every card has an owner');
  assert.equal(new Set(s.pile).size, s.pile.length, 'pile has no duplicates');
  for (const p of all) {
    const o = s.owner[p];
    if (o === 'pile') assert(s.pile.includes(p), 'pile owner in pile');
    else if (o === 'auction') assert.equal(s.queue[0].k, 'auction', 'card on the block during an auction');
    else if (o === 'bank') assert(s.bank.includes(p), 'bank owner in bank');
    else assert(!s.pile.includes(p) && !s.bank.includes(p) && !s.managers[o].bankrupt, 'manager card not elsewhere');
  }
  for (const m of g.active(s)) assert(m.cash >= 0 || s.queue[0]?.k === 'pay', `${m.name} cash ${m.cash}`);
  for (const l of s.loans) assert.equal(s.owner[l.pid], l.from, 'loan owner');
}

let finished = 0, steps = 0;
for (let game = 0; game < 40; game++) {
  let s = g.newGame({ name: 'T', club: 1 + g.rnd(10), level: 1 + g.rnd(4), seasons: 1 + g.rnd(3), cpus: 1 + g.rnd(4) });
  for (let i = 0; i < 20000 && !s.finished; i++) {
    s = JSON.parse(JSON.stringify(s)); // must survive a save/load at any point
    const before = s.queue.length + JSON.stringify(s.pending).length;
    g.act(s, randomInput(s));
    check(s);
    steps++;
  }
  assert(s.finished, 'game reached the end');
  finished++;
}
// match formula sanity: equal teams draw often, strong attack scores more
const s = g.newGame({});
console.log(`ok: ${finished} games, ${steps} steps; points by position:`, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g.leaguePoints).join(' '));
assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g.leaguePoints), [15, 12, 10, 8, 6, 5, 4, 3, 2, 1]);
