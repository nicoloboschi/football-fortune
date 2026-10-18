// Rules engine. The whole game is one JSON-serialisable state object.
// Work is a queue of tasks; a task that needs the human sets state.pending and waits.
// act(state, input) hands the input to the waiting task and runs on.
import * as D from './data.js';

export const rnd = n => Math.floor(Math.random() * n);
export const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const money = n => (n < 0 ? '-€' : '€') + Math.abs(n).toLocaleString('it-IT');
export const nominal = pid => D.PLAYERS[pid].stars * 20000;
export const card = pid => { const p = D.PLAYERS[pid]; return `${p.name} ${D.POS_SHORT[p.pos]}${p.stars}`; };
const roundUp = (n, step) => Math.ceil(n / step) * step;
const STEP = 5000;
const CPU_STAR = 30000;   // what a CPU manager will pay per star of team strength gained
const CPU_BUFFER = 60000; // cash a CPU manager keeps back

// ---------- squads ----------

export const active = s => s.managers.filter(m => !m.bankrupt);
export const managerOf = (s, team) => s.managers.find(m => m.club === team && !m.bankrupt);
const loanOf = (s, pid) => s.loans.find(l => l.pid === pid);
// players a manager can field: owned and not loaned out, plus players loaned in
export function squad(s, m) {
  const own = Object.keys(s.owner).map(Number).filter(p => s.owner[p] === m.i && !loanOf(s, p));
  return own.concat(s.loans.filter(l => l.to === m.i).map(l => l.pid));
}
const owned = (s, m) => squad(s, m).filter(p => s.owner[p] === m.i); // excludes loaned-in

// Best 4-3-3 from the squad. Utilities fill any gap or beat a weaker specialist; a utility in goal counts 1 star.
export function lineup(s, m, { add = null, remove = null, withOut = false } = {}) {
  let ps = squad(s, m).filter(p => p !== remove && (withOut || !s.out[p]));
  if (add != null) ps.push(add);
  const by = pos => ps.filter(p => D.PLAYERS[p].pos === pos).sort((a, b) => D.PLAYERS[b].stars - D.PLAYERS[a].stars);
  const U = by('U');
  let gk = by('G')[0];
  let gkVal = gk != null ? D.PLAYERS[gk].stars : 0;
  if (gk == null && U.length) { gk = U.pop(); gkVal = 1; }
  const slots = [['D', 4], ['M', 3], ['A', 3]].flatMap(([pos, n]) => {
    const got = by(pos).slice(0, n);
    return Array.from({ length: n }, (_, i) => ({ pos, pid: got[i] ?? null }));
  });
  const val = sl => sl.pid == null ? -1 : D.PLAYERS[sl.pid].stars;
  for (const u of U) {
    const weakest = slots.reduce((a, b) => val(b) < val(a) ? b : a);
    if (D.PLAYERS[u].stars > val(weakest)) weakest.pid = u;
  }
  const full = gk != null && slots.every(sl => sl.pid != null);
  const sum = pos => slots.filter(sl => sl.pos === pos && sl.pid != null).reduce((t, sl) => t + D.PLAYERS[sl.pid].stars, 0);
  const def = gkVal + sum('D'), att = sum('M') + sum('A');
  const xi = [gk, ...slots.map(sl => sl.pid)].filter(p => p != null);
  return { full, def: full ? def : 0, att: full ? att : 0, gk, slots, xi };
}
const strength = (s, m, opt) => { const l = lineup(s, m, opt); return l.full ? l.def + l.att : -100 + l.xi.length; };

export function wages(s, m) {
  const stars = squad(s, m).reduce((t, p) => t + D.PLAYERS[p].stars, 0);
  return D.WAGES.find(([max]) => stars <= max)[1];
}

// player whose loss hurts the least (ties broken by fewer stars)
function leastHarm(s, m, pids) {
  const cost = p => strength(s, m) - strength(s, m, { remove: p });
  return [...pids].sort((a, b) => cost(a) - cost(b) || D.PLAYERS[a].stars - D.PLAYERS[b].stars)[0];
}
// best player in a section (or whole squad), excluding loaned-in players; ties: least harmful
function best(s, m, pos, except = []) {
  const ps = owned(s, m).filter(p => (!pos || D.PLAYERS[p].pos === pos) && !except.includes(p));
  if (!ps.length) return null;
  const top = Math.max(...ps.map(p => D.PLAYERS[p].stars));
  return leastHarm(s, m, ps.filter(p => D.PLAYERS[p].stars === top));
}

// ---------- money and player movement ----------

function log(s, text, mi = null) { s.log.unshift({ text, mi, t: s.tick = (s.tick || 0) + 1 }); s.log.length = Math.min(s.log.length, 200); }
const who = (s, m) => m.name;
function toPileBottom(s, pid) { endLoan(s, pid); delete s.out[pid]; s.owner[pid] = 'pile'; s.pile.push(pid); }
function endLoan(s, pid) { s.loans = s.loans.filter(l => l.pid !== pid); }
function give(s, pid, m) { s.pile = s.pile.filter(p => p !== pid); s.bank = s.bank.filter(p => p !== pid); endLoan(s, pid); s.owner[pid] = m.i; }
export function sellToBank(s, m, pid, price = nominal(pid) * 3 / 4) {
  endLoan(s, pid); delete s.out[pid];
  s.owner[pid] = 'bank'; s.bank.push(pid); m.cash += price;
  log(s, `${who(s, m)} vende ${card(pid)} alla banca per ${money(price)}`, m.i);
}
const sellable = (s, m) => owned(s, m);

function bankrupt(s, m) {
  m.bankrupt = true;
  for (const p of owned(s, m)) toPileBottom(s, p);
  s.loans = s.loans.filter(l => l.to !== m.i && l.from !== m.i);
  log(s, `${m.name} è in bancarotta e si dimette!`, m.i);
  if (m.human) s.queue.splice(1, Infinity, { k: 'over', why: 'Sei andato in bancarotta.' });
}

// ---------- league, cups ----------

function roundRobin() {
  const t = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), rounds = [];
  for (let r = 0; r < 9; r++) {
    const ring = [t[0], ...t.slice(1).map((_, i) => t[1 + (i + r) % 9])];
    rounds.push(Array.from({ length: 5 }, (_, i) => rnd(2) ? [ring[i], ring[9 - i]] : [ring[9 - i], ring[i]]));
  }
  return shuffle(rounds);
}
const pos = (s, t) => t <= 10 ? s.pos[t] : 11;
const excess = (s, t) => Math.max(0, s.A[t] + s.D[t] - 38);
// gate shown by the program; each manager in the fixture receives half
const gate = (s, a, b, bonus = 0) => Math.max(10000,
  Math.floor((22 - pos(s, a) - pos(s, b) + excess(s, a) + excess(s, b)) / 3 + 0.5 + bonus / 10) * 10000);
const gateVsForeign = (s, m, f, bonus) => Math.max(10000,
  Math.floor((11 - pos(s, m) + excess(s, m) + excess(s, f)) / 3 + 0.5 + bonus / 10) * 10000);
const leagueGoals = (s, a, b) => Math.floor(Math.max(0, (s.A[a] - s.D[b]) / 3 + rnd(3) - 1) + 0.5);
function cupScore(s, a, b) {
  const th = Math.floor((s.A[a] - s.D[b]) / 3 + 0.5), ta = Math.floor((s.A[b] - s.D[a]) / 3 + 0.5);
  let x, y;
  for (let i = 0; i < 10; i++) {
    x = Math.max(0, th + rnd(3) - 1); y = Math.max(0, ta + rnd(3) - 1);
    if (x !== y) return [x, y];
  }
  const r = rnd(2); return [x + r, y + 1 - r];
}
export function sortTable(s) {
  const t = s.table;
  s.order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].sort((a, b) =>
    t[b].pts - t[a].pts || (t[b].f - t[b].a) - (t[a].f - t[a].a) || t[b].f - t[a].f || s.pos[a] - s.pos[b]);
  s.order.forEach((team, i) => { s.pos[team] = i + 1; });
}
// game points for a league position (program FN P)
export const leaguePoints = p => 11 - p + (p <= 4 ? 5 - p : 0) + (p === 1 ? 1 : 0);
export const gamePoints = (s, m) => m.k1 + (s.leagueStarted ? leaguePoints(s.pos[m.club]) : 0) + m.k2 + m.k3 + m.k7;

// Computer team strengths, set at each season's first match from the managers' teams (program lines 1680-2070)
function setComputerStrengths(s) {
  // ponytail: managers who could not field a side are left out (the original would get 0s and collapse every club)
  const L = s.level, ply = s.managers.length;
  const ms = active(s).filter(m => m.fielded).map(m => ({ a: s.A[m.club], d: s.D[m.club] }));
  if (!ms.length) ms.push({ a: 16, d: 14 });
  const tot = m => m.a + m.d;
  const mx = ms.reduce((a, b) => tot(b) > tot(a) ? b : a), mn = ms.reduce((a, b) => tot(b) < tot(a) ? b : a);
  const AM = mx.a, DM = mx.d, AL = mn.a, DL = mn.d;
  const TA = Math.round(ms.reduce((t, m) => t + m.a, 0) / ms.length);
  const TD = Math.round(ms.reduce((t, m) => t + m.d, 0) / ms.length);
  const set = (t, a, d) => { s.A[t] = Math.max(0, Math.min(29, a)); s.D[t] = Math.max(0, Math.min(24, d)); };
  const comp = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(t => !s.managers.some(m => m.club === t));
  const top = 1 + Math.floor((8 - ply) / 4);
  comp.forEach((t, z) => {
    if (z < top) { const r1 = rnd(L + 1), r2 = rnd(r1 + 1); set(t, AM + r2, DM + r1 - r2); }
    else if (z < top + 2) {
      if (L === 1) { const r1 = rnd(5) - 2; set(t, TA + r1, TD - r1); }
      else { const r1 = rnd(Math.floor(L / 2 + 1)), r2 = rnd(r1 + 1); set(t, TA + r2, TD + r1 - r2); }
    } else { const r1 = rnd(Math.floor((7 - L) / 2)), r2 = rnd(r1 + 1); set(t, AL - r2, DL - r1 + r2); }
  });
  const spread = (from, to, A0, D0) => {
    for (let t = from; t <= to; t++) { const r1 = rnd(4) - 1, r2 = Math.sign(r1) * rnd(1 + Math.abs(r1)); set(t, A0 + r2, D0 + r1 - r2); }
  };
  for (let t = 11; t <= 20; t++) { const r1 = rnd(3) - 1, r2 = r1 * rnd(2); set(t, AL + r2, DL + r1 - r2); }
  for (let t = 21; t <= 30; t++) { const r1 = rnd(3), r2 = rnd(r1 + 1); set(t, AL - r2, DL - r1 + r2); }
  for (let t = 31; t <= 40; t++) { const r1 = rnd(3); set(t, AL - r1, DL + r1 - 2); }
  spread(41, 50, TA, TD); spread(51, 70, AL, DL); spread(71, 80, AM, DM);
  // two non-league giant killers, strong until the quarter finals
  const g1 = 31 + rnd(10); let g2 = 31 + rnd(9); if (g2 >= g1) g2++;
  s.giants = { [g1]: [s.A[g1], s.D[g1]], [g2]: [s.A[g2], s.D[g2]] };
  for (const g of [g1, g2]) set(g, AL + 5, DL + 4);
}

function drawFA(s) {
  const league = [...s.managers.map(m => m.club), ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(t => !s.managers.some(m => m.club === t))];
  const lower = shuffle(Array.from({ length: 30 }, (_, i) => i + 11)).slice(0, 22);
  // league clubs (slots 0-9) meet lower clubs in round 1
  s.fa = { slots: [...league, ...lower], winner: null };
}

const nextOpp = c => c.opps[c.i++ % c.opps.length];
const inEuro = (s, m) => ['EC', 'CWC', 'UEFA'].some(k => s.euro[k]?.ms.includes(m.i));
const inFA = (s, m) => !!s.fa && s.fa.slots.includes(m.club) && !s.fa.winner;
function skipWeek(s, w) {
  const [type] = D.CALENDAR[w];
  if (type === 'E') return s.season === 1 || !active(s).some(m => inEuro(s, m));
  if (type === 'F') return !!s.fa && !active(s).some(m => inFA(s, m));
  return false;
}
export function playsThisWeek(s, m) {
  if (m.bankrupt) return false;
  const [type] = D.CALENDAR[s.week];
  return type === 'L' || (type === 'F' ? (!s.fa || inFA(s, m)) : inEuro(s, m));
}

// ---------- the week's matches ----------

function playWeek(s) {
  const [type, round] = D.CALENDAR[s.week];
  for (const m of s.managers) {
    const l = m.bankrupt ? { def: 0, att: 0, full: false } : lineup(s, m);
    s.A[m.club] = l.att; s.D[m.club] = l.def; m.fielded = l.full;
  }
  if (!s.strengthsSet) { setComputerStrengths(s); drawFA(s); s.strengthsSet = true; }
  const played = new Set(), lines = [];
  // results are data so the screen can draw score cards: h = heading, m = match, n = note
  const head = text => lines.push({ k: 'h', text }), note = text => lines.push({ k: 'n', text });
  const match = (h, a, x, y, g = null) => lines.push({ k: 'm', h, a, x, y, g, hd: s.D[h], ha: s.A[h], ad: s.D[a], aa: s.A[a],
    mh: managerOf(s, h)?.i ?? null, ma: managerOf(s, a)?.i ?? null });
  const pay = (t, amount) => { const m = managerOf(s, t); if (m) { played.add(m.i); if (m.fielded) { m.cash += amount / 2; m.gates += amount / 2; } } };
  const isM = t => !!managerOf(s, t);

  if (type === 'L') {
    s.leagueStarted = true;
    head(`Serie A · giornata ${round}`);
    for (const [h, a] of s.fixtures[round - 1]) {
      const g = gate(s, h, a), gh = leagueGoals(s, h, a), ga = leagueGoals(s, a, h);
      for (const [t, f, x] of [[h, gh, ga], [a, ga, gh]]) {
        const r = s.table[t]; r.p++; r.f += f; r.a += x;
        if (f > x) { r.w++; r.pts += s.points[0]; } else if (f === x) { r.d++; r.pts += s.points[1]; } else { r.l++; r.pts += s.points[2]; }
      }
      pay(h, g); pay(a, g);
      match(h, a, gh, ga, isM(h) || isM(a) ? g : null);
    }
    sortTable(s);
  } else if (type === 'F') {
    if (round === 3) for (const [t, [a, d]] of Object.entries(s.giants)) { s.A[t] = a; s.D[t] = d; }
    head(`Coppa Italia · ${D.ROUND_NAMES[round - 1]}`);
    const sl = s.fa.slots, H = sl.length / 2;
    for (let z = 0; z < H; z++) {
      const [h, a] = [sl[z], sl[z + H]], [x, y] = cupScore(s, h, a), win = x > y ? h : a;
      if (isM(h) || isM(a)) {
        const g = gate(s, h, a, D.GATE_BONUS.FA[round - 1]); pay(h, g); pay(a, g);
        match(h, a, x, y, g);
        const wm = managerOf(s, win); if (wm) wm.k2 += D.CUP_POINTS.FA[round - 1];
      } else if (z < 8) match(h, a, x, y);
      sl[z] = win;
    }
    s.fa.slots = shuffle(sl.slice(0, H));
    if (round === 5) { s.fa.winner = s.fa.slots[0]; note(`${D.TEAMS[s.fa.winner]} vince la Coppa Italia!`); }
  } else {
    for (const k of ['EC', 'CWC']) {
      const c = s.euro[k]; if (!c.ms.length) continue;
      head(`${D.COMP_NAME[k]} · ${D.ROUND_NAMES[round - 1]}`);
      const tie = (h, a, g) => {
        const [x, y] = cupScore(s, h, a); pay(h, g); pay(a, g);
        match(h, a, x, y, g);
        const win = x > y ? h : a, lose = win === h ? a : h;
        const wm = managerOf(s, win); if (wm) wm.k3 += D.CUP_POINTS[k][round - 1];
        const lm = managerOf(s, lose); if (lm) c.ms = c.ms.filter(i => i !== lm.i);
        return win;
      };
      const clubs = c.ms.map(i => s.managers[i].club);
      if (clubs.length === 2 && c.meet) tie(clubs[0], clubs[1], gate(s, clubs[0], clubs[1], D.GATE_BONUS[k][round - 1]));
      else for (const t of clubs) { const o = nextOpp(c); tie(t, o, gateVsForeign(s, t, o, D.GATE_BONUS[k][round - 1])); }
      c.meet = c.ms.length === 2 && Math.random() * (D.CUP_TEAMS[round - 1] / 2 - 1) <= 1;
      if (round === 5 && c.ms.length) { c.winner = c.ms[0]; note(`${who(s, s.managers[c.winner])} vince la ${D.COMP_NAME[k]}!`); }
    }
    const u = s.euro.UEFA;
    if (u.ms.length) {
      head(`Coppa UEFA · ${D.ROUND_NAMES[round - 1]}`);
      const bonus = D.GATE_BONUS.UEFA[round - 1];
      if (round === 1) {
        u.ms.forEach((mi, z) => {
          const t = s.managers[mi].club, o = u.pool[z], [x, y] = cupScore(s, t, o), g = gateVsForeign(s, t, o, bonus);
          pay(t, g); match(t, o, x, y, g);
          if (x > y) u.pool[z] = t;
        });
        u.ms = u.ms.filter(mi => u.pool.includes(s.managers[mi].club));
      } else {
        const H = D.CUP_TEAMS[round - 1] / 2, p = u.pool;
        for (let z = 0; z < H; z++) {
          const [h, a] = [p[z], p[z + H]], [x, y] = cupScore(s, h, a), win = x > y ? h : a;
          if (isM(h) || isM(a)) {
            const g = gate(s, h, a, bonus); pay(h, g); pay(a, g);
            match(h, a, x, y, g);
            const wm = managerOf(s, win); if (wm) wm.k3 += D.CUP_POINTS.UEFA[round - 1];
          }
          p[z] = win;
        }
        u.pool = shuffle(p.slice(0, H));
        u.ms = u.ms.filter(mi => u.pool.includes(s.managers[mi].club));
        if (round === 5 && u.ms.length) { u.winner = u.ms[0]; note(`${who(s, s.managers[u.winner])} vince la Coppa UEFA!`); }
      }
    }
  }
  if (type !== 'L' && round === 4) s.transfersClosed = true; // semi-final transfer deadline
  for (const m of s.managers) {
    if (!played.has(m.i)) continue;
    if (!m.fielded && !m.bankrupt) note(`${who(s, m)} non ha schierato una squadra completa: niente incasso.`);
    for (const p of squad(s, m)) if (s.out[p]) { if (--s.out[p] <= 0) delete s.out[p]; }
    s.loans = s.loans.filter(l => l.to !== m.i);
  }
  return lines;
}

// ---------- seasons ----------

function startSeason(s) {
  s.table = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(t => [t, { p: 0, w: 0, d: 0, l: 0, f: 0, a: 0, pts: 0 }]));
  s.fixtures = roundRobin();
  s.strengthsSet = false; s.leagueStarted = false; s.transfersClosed = false; s.fa = null;
  for (const k of ['EC', 'CWC', 'UEFA']) {
    s.euro[k] = { ...s.euro[k], winner: null, i: 0, meet: false, opps: shuffle([...D.EURO_POOL[k]]) };
    if (k === 'UEFA') s.euro[k].pool = shuffle([...D.EURO_POOL.UEFA]);
  }
  s.week = 0;
}

function qualifyEurope(s) {
  const ms = active(s).map(m => m.i), champ = managerOf(s, s.order[0]), fa = s.fa?.winner && managerOf(s, s.fa.winner);
  const ec = new Set(), cwc = new Set();
  if (champ) ec.add(champ.i);
  if (s.euro.EC?.winner != null && ms.includes(s.euro.EC.winner)) ec.add(s.euro.EC.winner);
  for (const i of [fa?.i, s.euro.CWC?.winner]) if (i != null && ms.includes(i) && !ec.has(i)) cwc.add(i);
  s.euro.EC.ms = [...ec].slice(0, 2); s.euro.CWC.ms = [...cwc].slice(0, 2);
  s.euro.UEFA.ms = ms.filter(i => !ec.has(i) && !cwc.has(i));
}

function seasonSummary(s) {
  const out = [`Campione d'Italia: ${D.TEAMS[s.order[0]]}`];
  if (s.fa?.winner) out.push(`Coppa Italia: ${D.TEAMS[s.fa.winner]}`);
  for (const k of ['EC', 'CWC', 'UEFA']) if (s.euro[k].winner != null) out.push(`${D.COMP_NAME[k]}: ${D.TEAMS[s.managers[s.euro[k].winner].club]}`);
  for (const m of s.managers) out.push(`${who(s, m)} (${D.TEAMS[m.club]}) chiude ${s.pos[m.club]}°${m.bankrupt ? ' · in bancarotta' : ''}`);
  return [{ k: 'h', text: `Riepilogo stagione ${s.season}` }, ...out.map(text => ({ k: 'n', text }))];
}

// ---------- decks ----------

function draw(s, deck, size) {
  const d = s.decks[deck];
  if (d.i >= d.order.length) { d.order = shuffle(Array.from({ length: size }, (_, i) => i)); d.i = 0; log(s, `Carte ${deck === 'ml' ? 'Fortuna' : 'Problemi di formazione'} rimescolate`); }
  return d.order[d.i++];
}

// ---------- CPU manager decisions ----------

function cpuMax(s, m, pid) {
  const full = lineup(s, m).full, gain = strength(s, m, { add: pid }) - strength(s, m);
  const perStar = CPU_STAR + Math.max(0, m.cash - 200000) / 10; // richer managers spend more freely
  let v = gain > 0 ? gain * perStar : (squad(s, m).length < 15 ? D.PLAYERS[pid].stars * 8000 : 0);
  return Math.max(0, Math.floor(Math.min(v, m.cash - (full ? CPU_BUFFER : 10000)) / STEP) * STEP);
}

// ---------- tasks ----------

const after = (s, ...tasks) => s.queue.splice(1, 0, ...tasks);
const human = s => s.managers[0];

const TASKS = {
  season(s, t) {
    if (s.season > 1) for (const m of active(s)) after(s, { k: 'ml', m: m.i, pre: true }, { k: 'sp', m: m.i, pre: true });
    s.queue.push({ k: 'week' });
    return true;
  },

  week(s) {
    log(s, `— Stagione ${s.season}, settimana ${s.week + 1}: ${weekLabel(s)} —`);
    after(s, ...active(s).map(m => ({ k: 'turn', m: m.i })), { k: 'play' });
    return true;
  },

  turn(s, t) {
    const m = s.managers[t.m];
    if (m.bankrupt) return true;
    if (m.human && !t.input) { s.pending = { type: 'roll' }; return false; }
    const die = 1 + rnd(6);
    m.sq = (m.sq + die) % D.BOARD.length;
    const sq = D.BOARD[m.sq];
    log(s, `${who(s, m)} tira ${die}: ${D.SQUARE[sq].label}`, m.i);
    after(s, { k: 'square', m: m.i, sq }, ...(m.human ? [] : [{ k: 'cpuShop', m: m.i }]));
    return true;
  },

  square(s, t) {
    const m = s.managers[t.m];
    switch (t.sq) {
      case 'WAGES': after(s, { k: 'pay', m: m.i, amount: wages(s, m), why: 'di stipendi' }); break;
      case 'ML': after(s, { k: 'ml', m: m.i }); break;
      case 'SP': after(s, { k: 'sp', m: m.i }); break;
      case 'AUC': after(s, { k: 'auction', lander: m.i, half: false, src: 'pile' }); break;
      case 'HALF': after(s, { k: 'auction', lander: m.i, half: true, src: 'pile' }); break;
      case 'SPON': m.cash += 30000; log(s, `${who(s, m)} incassa ${money(30000)} dallo sponsor`, m.i); break;
      case 'BANK': after(s, { k: 'bankFinance', m: m.i }); break;
      case 'CRISIS': after(s, { k: 'crisis', m: m.i }, { k: 'pay', m: m.i, amount: 50000, why: 'di multa (Crisi)' }); break;
    }
    return true;
  },

  pay(s, t) {
    const m = s.managers[t.m];
    if (m.bankrupt) return true;
    if (t.input?.type === 'sell') sellToBank(s, m, t.input.pid);
    t.input = null;
    if (m.cash >= t.amount) { m.cash -= t.amount; log(s, `${who(s, m)} paga ${money(t.amount)} ${t.why}`, m.i); return true; }
    const raise = sellable(s, m).reduce((x, p) => x + nominal(p) * 3 / 4, 0);
    if (m.cash + raise < t.amount) { bankrupt(s, m); return true; }
    if (m.human) { s.pending = { type: 'sell', forced: true, need: t.amount - m.cash, why: t.why }; return false; }
    while (m.cash < t.amount) sellToBank(s, m, leastHarm(s, m, sellable(s, m)));
    return TASKS.pay(s, t);
  },

  bankFinance(s, t) {
    const m = s.managers[t.m];
    if (t.input?.type === 'sell') sellToBank(s, m, t.input.pid);
    if (m.human) {
      if (t.input?.type === 'done') return true;
      t.input = null; s.pending = { type: 'sell', forced: false }; return false;
    }
    // CPU: sell surplus when short of cash, keeping two reserves
    const xi = new Set(lineup(s, m, { withOut: true }).xi);
    const spare = owned(s, m).filter(p => !xi.has(p)).sort((a, b) => D.PLAYERS[b].stars - D.PLAYERS[a].stars);
    if (m.cash < 120000) for (const p of spare.slice(2)) sellToBank(s, m, p);
    return true;
  },

  crisis(s, t) {
    const m = s.managers[t.m];
    const opts = ['G', 'D', 'M', 'A'].map(pos => best(s, m, pos)).filter(p => p != null);
    if (!opts.length) return true;
    if (m.human && !t.input) {
      s.pending = { type: 'choose', title: 'Crisi!', text: 'Multa di €50.000 e devi vendere alla banca, a ¾ del valore, il tuo miglior giocatore di un reparto a scelta.',
        options: opts.map(p => ({ id: p, label: `Vendi ${card(p)} (${money(nominal(p) * 3 / 4)})` })) };
      return false;
    }
    sellToBank(s, m, m.human ? t.input.id : leastHarm(s, m, opts));
    return true;
  },

  ml(s, t) {
    const m = s.managers[t.m];
    t.card ??= draw(s, 'ml', D.LUCK.length);
    const c = D.LUCK[t.card];
    if (m.human && !t.input) { s.pending = { type: 'info', title: (t.pre ? 'Precampionato · ' : '') + 'Fortuna', text: c.text }; return false; }
    if (!m.human) log(s, `${m.name} · Fortuna: ${c.text}`, m.i);
    if (c.effect === 'wages') after(s, { k: 'pay', m: m.i, amount: wages(s, m), why: 'di premio ai giocatori' });
    else if (c.effect === 'ground') after(s, { k: 'groundSale', m: m.i }, { k: 'pay', m: m.i, amount: 300000, why: "per l'acquisto dello stadio" });
    else if (c.effect > 0) { m.cash += c.effect; if (m.human) log(s, `${m.name} incassa ${money(c.effect)}`, m.i); }
    else after(s, { k: 'pay', m: m.i, amount: -c.effect, why: '' });
    return true;
  },

  groundSale(s, t) {
    const m = s.managers[t.m], ps = owned(s, m);
    if (!ps.length) return true;
    if (m.human && !t.input) {
      s.pending = { type: 'pick', title: 'Acquisto dello stadio', text: 'Puoi vendere un giocatore alla banca a 1,5 volte il suo valore nominale.',
        pids: ps, prices: Object.fromEntries(ps.map(p => [p, nominal(p) * 1.5])), optional: true };
      return false;
    }
    const pid = m.human ? t.input.pid : (m.cash < 300000 + CPU_BUFFER ? leastHarm(s, m, ps) : null);
    if (pid != null) sellToBank(s, m, pid, nominal(pid) * 1.5);
    return true;
  },

  sp(s, t) {
    const m = s.managers[t.m];
    t.card ??= draw(s, 'sp', D.SELECTION.length);
    const c = D.SELECTION[t.card];
    const harmful = !['free', 'half', 'immunity', 'buyOpp'].includes(c.effect);
    if (m.human && !t.input) {
      s.pending = harmful && m.immunity
        ? { type: 'choose', title: (t.pre ? 'Precampionato · ' : '') + 'Problemi di formazione', text: c.text, options: [{ id: 'use', label: 'Gioca la carta Immunità' }, { id: 'accept', label: 'Accetta' }] }
        : { type: 'info', title: (t.pre ? 'Precampionato · ' : '') + 'Problemi di formazione', text: c.text };
      return false;
    }
    if (!m.human) log(s, `${m.name} · Problema di formazione: ${c.text}`, m.i);
    if (harmful && m.immunity && (m.human ? t.input.id === 'use' : true)) {
      m.immunity--; s.immunityBank++; log(s, `${who(s, m)} gioca una carta Immunità`, m.i); return true;
    }
    const lose = pid => { if (pid != null) { log(s, `${who(s, m)} perde ${card(pid)}`, m.i); toPileBottom(s, pid); } };
    switch (c.effect) {
      case 'free': { const p = s.pile.shift(); if (p != null) { give(s, p, m); log(s, `${who(s, m)} prende ${card(p)} a parametro zero`, m.i); } break; }
      case 'abroad': { const p = best(s, m); if (p != null) { m.cash += nominal(p) * 2; log(s, `${who(s, m)} vende ${card(p)} all'estero per ${money(nominal(p) * 2)}`, m.i); toPileBottom(s, p); } break; }
      case 'out': { const p = best(s, m, c.pos); if (p != null) { s.out[p] = 1; log(s, `${card(p)} salta una partita`, m.i); } break; }
      case 'lose': lose(best(s, m, c.pos)); break;
      case 'crash': { const a = best(s, m); lose(a); lose(best(s, m)); break; }
      case 'retire': after(s, { k: 'retire', m: m.i, pos: c.pos }); break;
      case 'half': after(s, { k: 'auction', lander: m.i, half: true, src: 'pile' }); break;
      case 'immunity':
        if (s.immunityBank > 0) { s.immunityBank--; m.immunity++; log(s, `${who(s, m)} ottiene una carta Immunità`, m.i); }
        else log(s, 'La banca non ha più carte Immunità', m.i);
        break;
      case 'loan': { const p = best(s, m, c.pos); if (p != null) after(s, { k: 'loan', from: m.i, pid: p }); break; }
      case 'buyOpp': after(s, { k: 'buyOpp', m: m.i }); break;
    }
    return true;
  },

  retire(s, t) {
    const m = s.managers[t.m], ps = owned(s, m).filter(p => D.PLAYERS[p].pos === t.pos);
    if (!ps.length) return true;
    if (m.human && ps.length > 1 && !t.input) {
      s.pending = { type: 'pick', title: 'Chi se ne va?', text: `Scegli il ${D.POS_NAME[t.pos].toLowerCase()} che lascia la squadra.`, pids: ps };
      return false;
    }
    const p = m.human ? (t.input?.pid ?? ps[0]) : leastHarm(s, m, ps);
    log(s, `${card(p)} lascia ${m.human ? 'la tua squadra' : m.name}`, m.i);
    toPileBottom(s, p);
    return true;
  },

  loan(s, t) {
    const from = s.managers[t.from], price = nominal(t.pid) / 4;
    if (s.transfersClosed || !playsThisWeek(s, from)) { log(s, `Nessun prestito possibile per ${card(t.pid)} questa settimana`, from.i); return true; }
    const takers = active(s).filter(m => m !== from && playsThisWeek(s, m) && m.cash >= price);
    const h = human(s);
    if (takers.includes(h) && !t.input) {
      s.pending = { type: 'choose', title: 'Offerta di prestito', text: `${from.name} deve offrire ${card(t.pid)} in prestito per una partita. Prezzo ${money(price)}.`,
        options: [{ id: 'yes', label: `Prendilo per ${money(price)}` }, { id: 'no', label: 'No, grazie' }] };
      return false;
    }
    let to = t.input?.id === 'yes' ? h : null;
    if (!to) {
      const cpus = takers.filter(m => !m.human && strength(s, m, { add: t.pid }) > strength(s, m) && m.cash - price >= CPU_BUFFER);
      to = cpus.sort((a, b) => strength(s, b, { add: t.pid }) - strength(s, a, { add: t.pid }))[0];
    }
    if (!to) { log(s, `Nessuno prende ${card(t.pid)} in prestito`, from.i); return true; }
    to.cash -= price; from.cash += price;
    s.loans.push({ pid: t.pid, from: from.i, to: to.i });
    log(s, `${who(s, to)} prende in prestito ${card(t.pid)} da ${who(s, from)} per ${money(price)}`, to.i);
    return true;
  },

  buyOpp(s, t) {
    const m = s.managers[t.m];
    if (s.transfersClosed) { log(s, 'Il mercato è chiuso: nessun effetto', m.i); return true; }
    const cands = active(s).filter(o => o !== m).flatMap(o => owned(s, o)).filter(p => nominal(p) <= m.cash);
    if (!cands.length) return true;
    let pid = null;
    if (m.human) {
      if (!t.input) { s.pending = { type: 'pick', title: 'Compra da un avversario', text: 'Compra un giocatore di un avversario al suo valore nominale.', pids: cands, prices: Object.fromEntries(cands.map(p => [p, nominal(p)])), optional: true }; return false; }
      pid = t.input.pid ?? null;
    } else {
      const gain = p => strength(s, m, { add: p }) - strength(s, m);
      const p = cands.filter(p => m.cash - nominal(p) >= CPU_BUFFER).sort((a, b) => gain(b) - gain(a))[0];
      if (p != null && gain(p) > 0) pid = p;
    }
    if (pid == null) return true;
    const seller = s.managers[s.owner[pid]];
    m.cash -= nominal(pid); seller.cash += nominal(pid); give(s, pid, m);
    log(s, `${who(s, m)} compra ${card(pid)} da ${who(s, seller)} per ${money(nominal(pid))}`, m.i);
    return true;
  },

  // English auction; CPU managers bid up to their valuation. Opening bids among CPUs are settled at once.
  auction(s, t) {
    if (!t.ready) {
      t.ready = true;
      t.pid = t.src === 'pile' ? s.pile.shift() : (s.bank.includes(t.bankPid) ? t.bankPid : null);
      if (t.pid == null) { if (t.src === 'pile') log(s, 'Il mazzo dell\'asta è vuoto'); return true; }
      if (t.src === 'pile') s.owner[t.pid] = 'auction';
      t.step = t.half ? 10000 : STEP;
      t.min = t.src === 'bank' ? roundUp(nominal(t.pid) * 1.5, t.step) : t.step;
      const maxes = active(s).filter(m => !m.human).map(m => {
        let v = cpuMax(s, m, t.pid); if (t.half && m.i === t.lander) v = Math.min(v * 2, Math.floor(m.cash * 2 / t.step) * t.step);
        return { i: m.i, max: Math.floor(v / t.step) * t.step };
      }).filter(c => c.max >= t.min).sort((a, b) => b.max - a.max);
      t.cpu = maxes[0] ?? null;
      t.high = 0; t.bidder = null;
      if (t.cpu) { t.high = Math.max(t.min, Math.min(t.cpu.max, maxes[1] ? maxes[1].max + t.step : t.min)); t.bidder = t.cpu.i; }
      log(s, `${t.src === 'bank' ? 'Vendita della banca' : (t.half ? 'Asta al 50%' : 'Asta')}: ${card(t.pid)} (valore ${money(nominal(t.pid))})`, t.lander);
    }
    const h = human(s);
    if (t.input?.type === 'bid') {
      t.high = t.input.amount; t.bidder = h.i;
      if (t.cpu && t.cpu.max >= t.high + t.step) { t.high += t.step; t.bidder = t.cpu.i; }
    }
    const humanCap = !h.bankrupt && (t.half && t.lander === h.i ? h.cash * 2 : h.cash);
    const next = t.bidder == null ? t.min : t.high + t.step;
    if (t.input?.type !== 'pass' && t.bidder !== h.i && humanCap >= next) {
      t.input = null;
      s.pending = { type: 'auction', pid: t.pid, high: t.high, bidder: t.bidder, next, step: t.step, cap: humanCap,
        half: t.half, lander: t.lander, src: t.src };
      return false;
    }
    if (t.bidder == null) {
      if (t.src === 'pile') { s.pile.push(t.pid); s.owner[t.pid] = 'pile'; }
      log(s, `Nessuna offerta: ${card(t.pid)} ${t.src === 'pile' ? 'torna in fondo al mazzo' : 'resta alla banca'}`);
      return true;
    }
    const w = s.managers[t.bidder], price = t.half && t.bidder === t.lander ? t.high / 2 : t.high;
    w.cash -= price; give(s, t.pid, w);
    log(s, `${who(s, w)} compra ${card(t.pid)} per ${money(price)}`, w.i);
    return true;
  },

  cpuShop(s, t) {
    const m = s.managers[t.m];
    if (m.bankrupt) return true;
    const price = p => roundUp(nominal(p) * 1.5, STEP), gain = p => strength(s, m, { add: p }) - strength(s, m);
    const perStar = CPU_STAR + Math.max(0, m.cash - 200000) / 10;
    const buy = s.bank.filter(p => gain(p) * perStar >= price(p) && m.cash - price(p) >= CPU_BUFFER).sort((a, b) => gain(b) - gain(a))[0];
    if (buy != null) after(s, { k: 'auction', lander: m.i, half: false, src: 'bank', bankPid: buy });
    return true;
  },

  play(s, t) {
    if (!t.lines) t.lines = playWeek(s);
    if (!t.input && !human(s).bankrupt) { s.pending = { type: 'results', lines: t.lines }; return false; }
    do s.week++; while (s.week < D.CALENDAR.length && skipWeek(s, s.week));
    after(s, s.week < D.CALENDAR.length ? { k: 'week' } : { k: 'seasonEnd' });
    return true;
  },

  seasonEnd(s, t) {
    if (!t.lines) {
      t.lines = seasonSummary(s);
      for (const m of active(s)) m.k1 += leaguePoints(s.pos[m.club]);
      s.leagueStarted = false;
    }
    if (!t.input) { s.pending = { type: 'results', title: `Fine della stagione ${s.season}`, lines: t.lines }; return false; }
    if (s.season >= s.seasons) {
      for (const m of active(s)) m.k7 = Math.floor(m.cash / 50000);
      after(s, { k: 'over', why: 'La partita è finita.' });
      return true;
    }
    qualifyEurope(s);
    s.season++; startSeason(s);
    after(s, { k: 'season' });
    return true;
  },

  over(s, t) { s.pending = { type: 'over', why: t.why }; s.finished = true; return false; },
};

export function weekLabel(s) {
  const [type, r] = D.CALENDAR[s.week];
  return type === 'L' ? `Serie A, giornata ${r}` : `${type === 'F' ? 'Coppa Italia' : 'Coppe europee'}, ${D.ROUND_NAMES[r - 1].toLowerCase()}`;
}

// ---------- public API ----------

export function newGame({ name = 'Mister', club = 1, level = 2, seasons = 2, cpus = 1, points = [3, 1, 0] } = {}) {
  const s = { v: 2, level, seasons, points, season: 1, week: 0, managers: [], owner: {}, pile: [], bank: [], out: {}, loans: [],
    immunityBank: 6, A: Array(81).fill(0), D: Array(81).fill(0), pos: {}, euro: { EC: { ms: [] }, CWC: { ms: [] }, UEFA: { ms: [] } },
    decks: { ml: { order: [], i: 0 }, sp: { order: [], i: 0 } }, queue: [], pending: null, log: [] };
  for (let t = 1; t <= 10; t++) s.pos[t] = t;
  const clubs = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(c => c !== club));
  const cpuNames = shuffle(['Trap', 'Capello', 'Sacchi', 'Lippi', 'Ancelotti', 'Mancio', 'Conte', 'Spalletti']);
  for (let i = 0; i <= cpus; i++) {
    s.managers.push({ i, name: i ? cpuNames[i - 1] : name, human: !i, club: i ? clubs[i - 1] : club, cash: 200000, sq: 0,
      immunity: 0, bankrupt: false, k1: 0, k2: 0, k3: 0, k7: 0, gates: 0 });
  }
  // starting squads: random rows from one half of the program's squad table
  const half = rnd(2) * 5, gd = shuffle([0, 1, 2, 3, 4]), ma = shuffle([0, 1, 2, 3, 4]), u = shuffle([0, 1, 2, 3, 4]);
  const free = new Set(D.PLAYERS.map(p => p.id));
  const take = (pos, stars, m) => {
    const ok = [...free].filter(p => D.PLAYERS[p].pos === pos);
    const dist = p => Math.abs(D.PLAYERS[p].stars - stars);
    const bestDist = Math.min(...ok.map(dist));
    const p = shuffle(ok.filter(p => dist(p) === bestDist))[0];
    free.delete(p); s.owner[p] = m.i;
  };
  for (const m of s.managers) {
    const row = k => D.SQUAD_ROWS[half + [gd, gd, ma, ma, u][k][m.i]][k];
    take('G', row(0), m);
    [...'DMAU'].forEach((pos, k) => [...String(row(k + 1))].forEach(st => take(pos, +st, m)));
  }
  s.pile = shuffle([...free]);
  for (const p of s.pile) s.owner[p] = 'pile';
  startSeason(s);
  log(s, `Benvenuto, ${name}! Alleni ${D.TEAMS[club]}. Si parte con la stagione 1.`);
  s.queue = [{ k: 'season' }];
  return advance(s);
}

export function advance(s) {
  s.pending = null;
  for (let guard = 0; s.queue.length && guard < 10000; guard++) {
    const t = s.queue[0];
    if (!TASKS[t.k](s, t)) return s;
    s.queue.shift();
  }
  return s;
}

// Things the human can do while waiting to roll: buy from the bank, make transfer offers.
export function canTrade(s) { return s.pending?.type === 'roll'; }

export function act(s, input) {
  s.notice = null;
  if (!s.pending || s.finished) return s;
  const h = human(s), p = s.pending;
  if (input.type === 'bankBuy' || input.type === 'buyOffer' || input.type === 'sellOffer') {
    if (!canTrade(s)) return s;
    if (input.type === 'bankBuy') {
      if (!s.bank.includes(input.pid)) return s;
      s.queue.unshift({ k: 'auction', lander: h.i, half: false, src: 'bank', bankPid: input.pid });
      return advance(s);
    }
    return trade(s, input);
  }
  // validate against what the pending prompt allows
  const mine = pid => s.owner[pid] === h.i && !loanOf(s, pid);
  const ok = {
    roll: () => input.type === 'roll',
    info: () => input.type === 'ok', results: () => input.type === 'ok',
    choose: () => input.type === 'choose' && p.options.some(o => o.id === input.id),
    pick: () => (input.type === 'pick' && p.pids.includes(input.pid)) || (input.type === 'skip' && p.optional),
    sell: () => (input.type === 'sell' && mine(input.pid)) || (input.type === 'done' && !p.forced),
    auction: () => input.type === 'pass' || (input.type === 'bid' && input.amount >= p.next && input.amount <= p.cap && input.amount % p.step === 0),
  }[p.type];
  if (!ok || !ok()) return s;
  s.queue[0].input = input;
  return advance(s);
}

// Transfer offers to CPU managers, allowed before the cup semi-final deadline. Result message in s.notice.
function trade(s, { type, pid, price, to }) {
  const h = human(s);
  if (s.transfersClosed) { s.notice = 'Il mercato è chiuso (giocate le semifinali di coppa).'; return s; }
  price = Math.floor(+price / STEP) * STEP;
  if (type === 'buyOffer') {
    const o = s.managers[s.owner[pid]];
    if (!o || o.human || o.bankrupt || loanOf(s, pid) || !(price > 0) || price > h.cash) { s.notice = 'Offerta non possibile.'; return s; }
    const loss = strength(s, o) - strength(s, o, { remove: pid });
    const ask = Math.max(nominal(pid) * 1.5, nominal(pid) + loss * CPU_STAR * 1.3);
    if (price < ask || !lineup(s, o, { remove: pid, withOut: true }).full) { s.notice = `${o.name} rifiuta i tuoi ${money(price)} per ${card(pid)}.`; return s; }
    h.cash -= price; o.cash += price; give(s, pid, h);
    s.notice = `${o.name} accetta! ${card(pid)} arriva per ${money(price)}.`;
  } else {
    const o = s.managers[to];
    if (s.owner[pid] !== h.i || loanOf(s, pid) || !o || o.human || o.bankrupt || !(price > 0)) { s.notice = 'Offerta non possibile.'; return s; }
    if (price > cpuMax(s, o, pid)) { s.notice = `${o.name} non è interessato a ${money(price)}.`; return s; }
    o.cash -= price; h.cash += price; give(s, pid, o);
    s.notice = `${o.name} compra ${card(pid)} per ${money(price)}.`;
  }
  log(s, s.notice, h.i);
  return s;
}

// Real XI for a computer-run Serie A club. Stars are dealt so lines add up to the club's Defence and Attack.
const XI_SKIN = { Adriano: 5, 'Marcus Thuram': 5, 'Denzel Dumfries': 5, 'Patrick Vieira': 6, 'Kevin-Prince Boateng': 5,
  'Ismaël Bennacer': 3, Robinho: 4, 'Alexandre Pato': 3, Juan: 4, 'Mohamed Salah': 4, 'Felipe Anderson': 4, 'Ademola Lookman': 6,
  'Duván Zapata': 5, 'Adama Soumaoro': 6, 'Nicolas Nkoulou': 6, 'Faouzi Ghoulam': 4, Danilo: 4, 'Alex Sandro': 4,
  'Thiago Motta': 3, 'Tomás Rincón': 4, 'Gary Medel': 3, 'Angelo Ogbonna': 5, 'Joshua Zirkzee': 4, 'Rafael Tolói': 3, 'Neto': 3 };
export function clubXI(s, team) {
  if (!s.strengthsSet || team > 10) return null;
  const deal = (total, n) => Array.from({ length: n }, (_, i) => Math.max(1, Math.min(5, Math.floor(total / n) + (i < total % n ? 1 : 0))));
  const names = D.CLUB_XI[team], def = deal(s.D[team], 5), att = deal(s.A[team], 6);
  const pos = ['G', 'D', 'D', 'D', 'D', 'M', 'M', 'M', 'A', 'A', 'A'];
  const attOrder = [8, 5, 9, 6, 10, 7]; // best attacker, best midfielder, ...
  const stars = [...def, ...Array(6)];
  attOrder.forEach((idx, k) => { stars[idx] = att[k]; });
  const h = str => [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return names.map((name, i) => ({ name, pos: pos[i], stars: stars[i], club: team,
    look: `${XI_SKIN[name] || 2}${'sshlbc'[h(name) % 6]}${'kkbby'[h(name + 'h') % 5]}${h(name + 'b') % 3}` }));
}
