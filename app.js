import * as g from './game.js';
import * as D from './data.js';

const COLORS = ['#ffd400', '#e4002b', '#00a3e0', '#ff7a00', '#8a2be2'];
const app = document.getElementById('app');
let s = null, tab = 'play', lastDie = null;

// ---------- persistence: server file (survives a new tunnel URL) + browser copy ----------
async function load() {
  try { const r = await fetch('api/state'); if (r.ok) { const j = await r.json(); if (j && j.v) return j; } } catch {}
  try { return JSON.parse(localStorage.getItem('ff-save')); } catch { return null; }
}
function save() {
  const body = JSON.stringify(s);
  try { localStorage.setItem('ff-save', body); } catch {}
  fetch('api/state', { method: 'PUT', body, headers: { 'content-type': 'application/json' } }).catch(() => {});
}

// ---------- helpers ----------
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const stars = n => '★'.repeat(n);
const P = pid => D.PLAYERS[pid];
const me = () => s.managers[0];
const pl = (pid, right = '', tags = '') => `<div class="player"><span><span class="pos ${P(pid).pos}">${P(pid).pos}</span> ${esc(P(pid).name)} <span class="stars">${stars(P(pid).stars)}</span>${tags}</span><span>${right}</span></div>`;
const btn = (label, a, extra = '', cls = '') => `<button class="${cls}" data-a='${esc(JSON.stringify(a))}' ${extra}>${label}</button>`;
const tagsFor = pid => (s.out[pid] ? '<span class="tag">out 1 game</span>' : '') + (s.loans.some(l => l.pid === pid && l.to === 0) ? '<span class="tag">on loan</span>' : '');

function send(input) {
  if (input.type === 'roll') { const before = me().sq; g.act(s, input); lastDie = (me().sq - before + 36) % 36 || null; }
  else g.act(s, input);
  save(); render();
}

// ---------- screens ----------
function setup() {
  app.innerHTML = `<header><div class="row"><b>Brian Clough's Football Fortunes</b></div></header><main>
  <div class="card"><h3>New game</h3>
    <p class="muted">You manage a club against computer managers. Move round the board, buy players at auction, survive Selection Problems and Manager's Luck, then play League, FA Cup and European matches. The winner has the most game points at the end.</p>
    <label>Your name</label><input id="name" value="Nicolò" maxlength="14">
    <label>Your club</label><select id="club">${D.TEAMS.slice(1, 11).map((t, i) => `<option value="${i + 1}">${t}</option>`).join('')}</select>
    <label>Computer managers</label><select id="cpus"><option>1</option><option selected>2</option><option>3</option><option>4</option></select>
    <label>Difficulty (strength of computer clubs)</label><select id="level"><option value="1">1 · Easy</option><option value="2" selected>2 · Average</option><option value="3">3 · Good</option><option value="4">4 · Expert</option></select>
    <label>Seasons</label><select id="seasons"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option></select>
    <button class="big" id="start">Kick off</button>
  </div></main>`;
  document.getElementById('start').onclick = () => {
    const v = id => document.getElementById(id).value;
    s = g.newGame({ name: v('name') || 'You', club: +v('club'), cpus: +v('cpus'), level: +v('level'), seasons: +v('seasons') });
    tab = 'play'; save(); render();
  };
}

function boardHTML() {
  const cells = [];
  const at = i => i <= 9 ? [1, i + 1] : i <= 18 ? [i - 8, 10] : i <= 27 ? [10, 28 - i] : [37 - i, 1];
  D.BOARD.forEach((sq, i) => {
    const [r, c] = at(i), info = D.SQUARE[sq];
    const dots = s.managers.filter(m => m.sq === i && !m.bankrupt).map(m => `<span class="dot" style="background:${COLORS[m.i]}"></span>`).join('');
    cells.push(`<div class="sq" style="grid-row:${r};grid-column:${c};background:${info.color}${sq === 'SP' || sq === 'CRISIS' ? ';color:#fff' : ''}"><span>${info.short}</span><span class="dots">${dots}</span></div>`);
  });
  const here = D.SQUARE[D.BOARD[me().sq]].label;
  cells.push(`<div class="centre">${lastDie ? `<div class="die">${lastDie}</div>` : ''}<b>${esc(here)}</b><small>${s.managers.map(m => `<span class="dot" style="background:${COLORS[m.i]}"></span> ${esc(m.name)}`).join(' &nbsp;')}</small></div>`);
  return `<div class="board">${cells.join('')}</div>`;
}

function pendingHTML() {
  const p = s.pending;
  if (!p) return '';
  const h = me();
  switch (p.type) {
    case 'roll': return `<div class="card"><h3>Your move · ${g.weekLabel(s)}</h3>
      <div class="muted">Next: ${g.playsThisWeek(s, h) ? 'you play this week' : 'you have no match this week'}. You can buy from the bank or make transfer offers in Market first.</div>
      ${btn('🎲 Roll the die', { type: 'roll' }, '', 'big')}</div>`;
    case 'info': return `<div class="card"><h3>${esc(p.title)}</h3><div class="cardtext">${esc(p.text)}</div>${btn('OK', { type: 'ok' }, '', 'big')}</div>`;
    case 'choose': return `<div class="card"><h3>${esc(p.title)}</h3><div class="cardtext">${esc(p.text)}</div><div class="btns">${p.options.map(o => btn(esc(o.label), { type: 'choose', id: o.id })).join('')}</div></div>`;
    case 'pick': return `<div class="card"><h3>${esc(p.title)}</h3><div class="muted">${esc(p.text)}</div>
      ${p.pids.map(pid => pl(pid, btn(p.prices ? g.money(p.prices[pid]) : 'Choose', { type: 'pick', pid }, p.prices && p.prices[pid] > h.cash && p.title.startsWith('Buy') ? 'disabled' : ''))).join('')}
      ${p.optional ? btn('Skip', { type: 'skip' }, '', 'alt big') : ''}</div>`;
    case 'sell': {
      const mine = g.squad(s, h).filter(pid => s.owner[pid] === 0);
      const xi = new Set(g.lineup(s, h, { withOut: true }).xi);
      return `<div class="card"><h3>${p.forced ? `Raise ${g.money(p.need)} for ${esc(p.why)}` : 'Bank Finance'}</h3>
      <div class="muted">${p.forced ? 'You cannot pay. Sell players to the bank at ¾ of their nominal value.' : 'Sell any players to the bank at ¾ of their nominal value. Keep enough to field a 4-3-3!'}</div>
      ${mine.map(pid => pl(pid, btn(`Sell ${g.money(g.nominal(pid) * 3 / 4)}`, { type: 'sell', pid }), (xi.has(pid) ? '<span class="tag">XI</span>' : '') + tagsFor(pid))).join('')}
      ${p.forced ? '' : btn('Done', { type: 'done' }, '', 'big')}</div>`;
    }
    case 'auction': {
      const bidder = p.bidder == null ? 'No bids yet' : `${esc(s.managers[p.bidder].name)} bids ${g.money(p.high)}`;
      const opts = [p.next, p.next + p.step, p.next + 4 * p.step, p.next + 10 * p.step].filter((v, i, a) => v <= p.cap && a.indexOf(v) === i);
      const halfNote = p.half && p.lander === 0 ? `<div class="muted">50% auction: you pay only half of your bid.</div>` : '';
      return `<div class="card auction"><h3>${p.src === 'bank' ? 'Bank sale' : p.half ? '50% Auction' : 'Auction'}</h3>
      ${pl(p.pid, `nominal ${g.money(g.nominal(p.pid))}`)}
      <div class="who">${bidder}</div>${halfNote}<div class="muted">Your cash ${g.money(h.cash)}${p.src === 'bank' ? ' · bank minimum is 1½× nominal' : ''}</div>
      <div class="btns">${opts.map(v => btn(`Bid ${g.money(v)}`, { type: 'bid', amount: v })).join('')}</div>
      ${btn(p.bidder == null ? 'No bid' : 'Pass', { type: 'pass' }, '', 'alt big')}</div>`;
    }
    case 'results': return `<div class="card res"><h3>${esc(p.title || 'Results')}</h3>${p.lines.map(l => `<div class="${/·|summary/.test(l) && !/\d-\d/.test(l) ? 'h' : ''}">${esc(l)}</div>`).join('')}${btn('Continue', { type: 'ok' }, '', 'big')}</div>`;
    case 'over': return `<div class="card"><h3>${esc(p.why)}</h3>${ratingsHTML(true)}${btn('New game', { type: 'new' }, '', 'big')}</div>`;
  }
  return '';
}

function feedHTML() {
  return `<div class="card feed"><h3>News</h3>${s.log.slice(0, 40).map(l =>
    `<div class="${l.text.startsWith('—') ? 'wk' : l.mi === 0 ? 'me' : ''}">${esc(l.text)}</div>`).join('')}</div>`;
}

function squadHTML(mi = squadOf) {
  const m = s.managers[mi], lu = g.lineup(s, m), all = g.squad(s, m), xi = new Set(lu.xi);
  const chip = pid => pid == null ? `<div class="chip">—</div>` : `<div class="chip"><b>${esc(P(pid).name.split(' ').slice(-1)[0])}</b>${P(pid).pos}${P(pid).stars}</div>`;
  const row = pos => lu.slots.filter(x => x.pos === pos).map(x => chip(x.pid)).join('');
  const outs = all.filter(p => s.out[p]);
  return `<div class="card"><div class="btns" style="margin-top:0">${s.managers.map(o => btn(esc(o.name), { view: o.i }, '', o.i === mi ? '' : 'alt')).join('')}</div></div>
  <div class="card"><h3>${esc(D.TEAMS[m.club])} · ${esc(m.name)}${m.bankrupt ? ' (bankrupt)' : ''}</h3>
  <div class="muted">Defence ${lu.def} · Attack ${lu.att} · Team ${lu.def + lu.att}${lu.full ? '' : ' · <b style="color:var(--bad)">cannot field a full 4-3-3!</b>'}<br>Cash ${g.money(m.cash)} · Wage bill ${g.money(g.wages(s, m))} · Immunity cards ${m.immunity}</div>
  <div class="pitch"><div class="line">${row('A')}</div><div class="line">${row('M')}</div><div class="line">${row('D')}</div><div class="line">${chip(lu.gk)}</div></div>
  <h3 style="margin-top:12px">Squad</h3>${all.sort((a, b) => 'GDMAU'.indexOf(P(a).pos) - 'GDMAU'.indexOf(P(b).pos) || P(b).stars - P(a).stars)
    .map(pid => pl(pid, xi.has(pid) ? '<span class="tag">XI</span>' : '<span class="muted">reserve</span>', tagsFor(pid))).join('')}
  ${outs.length ? `<p class="muted">Out next game: ${outs.map(p => esc(P(p).name)).join(', ')}</p>` : ''}
  <p class="muted">Best 4-3-3 is picked for you. Utility players fill any position; a utility in goal counts as 1 star.</p></div>`;
}
let squadOf = 0;

function leagueHTML() {
  const rows = s.order || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const mine = t => s.managers.find(m => m.club === t);
  const cups = [];
  if (s.fa) cups.push(s.fa.winner ? `FA Cup winners: ${D.TEAMS[s.fa.winner]}` : `FA Cup: ${s.managers.filter(m => s.fa.slots.includes(m.club)).map(m => esc(m.name)).join(', ') || 'no managers left'} still in`);
  for (const k of ['EC', 'CWC', 'UEFA']) if (s.euro[k].ms.length || s.euro[k].winner != null)
    cups.push(`${D.COMP_NAME[k]}: ${s.euro[k].ms.map(i => esc(s.managers[i].name)).join(', ') || 'out'}`);
  return `<div class="card"><h3>League · season ${s.season}</h3><table><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>F</th><th>A</th><th>Pts</th></tr>
  ${rows.map((t, i) => { const r = s.table[t], m = mine(t); return `<tr class="${m?.i === 0 ? 'me' : ''}"><td>${i + 1}</td><td>${D.TEAMS[t]}${m ? ` <span class="dot" style="background:${COLORS[m.i]}"></span>` : ''}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.f}</td><td>${r.a}</td><td><b>${r.pts}</b></td></tr>`; }).join('')}</table>
  <p class="muted">Win ${s.points[0]} · draw ${s.points[1]} · loss ${s.points[2]}. Ten-team league, everyone plays once.</p></div>
  ${cups.length ? `<div class="card"><h3>Cups</h3>${cups.map(c => `<div>${c}</div>`).join('')}</div>` : ''}
  <div class="card"><h3>Calendar</h3><div class="muted">${D.CALENDAR.map((c, i) => `${i === s.week ? '<b>▶ ' : ''}${c[0] === 'L' ? 'L' + c[1] : (c[0] === 'F' ? 'FA ' : 'EU ') + ['R1', 'R2', 'QF', 'SF', 'F'][c[1] - 1]}${i === s.week ? '</b>' : ''}`).join(' · ')}</div></div>`;
}

function marketHTML() {
  const h = me(), can = g.canTrade(s);
  const theirs = s.managers.filter(m => !m.human && !m.bankrupt);
  const lock = can ? '' : 'disabled';
  return `${s.notice ? `<div class="notice">${esc(s.notice)}</div>` : ''}
  ${can ? '' : '<div class="notice">You can trade at the start of your turn (before rolling).</div>'}
  <div class="card"><h3>Bank</h3><div class="muted">Players sold to the bank. Buy for at least 1½× nominal value; other managers may bid against you.</div>
  ${s.bank.length ? s.bank.map(pid => pl(pid, btn(`From ${g.money(Math.ceil(g.nominal(pid) * 1.5 / 5000) * 5000)}`, { type: 'bankBuy', pid }, lock))).join('') : '<p class="muted">The bank has no players.</p>'}</div>
  <div class="card"><h3>Buy from a manager</h3><div class="muted">${s.transfersClosed ? 'Transfer deadline passed: cup semi-finals have been played.' : 'Make an offer. They sell only if the price beats what the player is worth to them.'}</div>
  ${theirs.map(m => `<h3 style="margin-top:10px">${esc(m.name)} · ${esc(D.TEAMS[m.club])}</h3>` + g.squad(s, m).filter(p => s.owner[p] === m.i).map(pid =>
    pl(pid, `<button data-offer="buy" data-pid="${pid}" ${lock || (s.transfersClosed ? 'disabled' : '')}>Offer</button>`)).join('')).join('')}</div>
  <div class="card"><h3>Sell to a manager</h3>
  ${g.squad(s, h).filter(p => s.owner[p] === 0).map(pid => pl(pid, `<button data-offer="sell" data-pid="${pid}" ${lock || (s.transfersClosed ? 'disabled' : '')}>Offer</button>`)).join('')}</div>`;
}

function ratingsHTML(final = false) {
  const rows = [...s.managers].sort((a, b) => (b.bankrupt ? -1 : g.gamePoints(s, b)) - (a.bankrupt ? -1 : g.gamePoints(s, a)));
  return `${final ? '' : '<div class="card">'}<h3>Manager's rating</h3><table><tr><th></th><th>Manager</th><th>League</th><th>FA</th><th>Eur</th><th>Cash</th><th>Total</th></tr>
  ${rows.map(m => `<tr class="${m.i === 0 ? 'me' : ''}"><td><span class="dot" style="background:${COLORS[m.i]}"></span></td><td>${esc(m.name)}<br><span class="muted">${esc(D.TEAMS[m.club])} · ${g.money(m.cash)}</span></td>
  <td>${m.k1 + (s.leagueStarted ? g.leaguePoints(s.pos[m.club]) : 0)}</td><td>${m.k2}</td><td>${m.k3}</td><td>${m.k7}</td><td><b>${m.bankrupt ? 'out' : g.gamePoints(s, m)}</b></td></tr>`).join('')}</table>
  <p class="muted">Game points: league position (1st = 15 … 10th = 1, banked each season), cup rounds won, and £50,000 of cash = 1 point at the end.</p>${final ? '' : '</div>'}`;
}

function render() {
  if (!s) return setup();
  const h = me();
  const tabs = { play: 'Play', squad: 'Squad', league: 'League', market: 'Market', ratings: 'Rating' };
  const body = { play: () => boardHTML() + pendingHTML() + feedHTML(), squad: () => squadHTML(), league: leagueHTML, market: marketHTML, ratings: () => ratingsHTML() }[tab]();
  const waiting = s.pending && s.pending.type !== 'roll' && tab !== 'play' ? `<div class="notice">Something needs your answer on the Play tab.</div>` : '';
  app.innerHTML = `<header><div class="row"><b>${esc(D.TEAMS[h.club])}</b><b>${g.money(h.cash)}</b></div>
  <div class="row"><small>Season ${s.season}/${s.seasons} · ${s.finished ? 'finished' : g.weekLabel(s)}</small><small>${g.gamePoints(s, h)} game pts</small></div></header>
  <main>${waiting}${body}</main>
  <nav>${Object.entries(tabs).map(([k, v]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${v}</button>`).join('')}</nav>`;
}

app.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  if (b.dataset.tab) { tab = b.dataset.tab; s.notice = null; render(); window.scrollTo(0, 0); return; }
  if (b.dataset.offer) {
    const pid = +b.dataset.pid, buy = b.dataset.offer === 'buy';
    let to = 1;
    if (!buy) {
      const cpus = s.managers.filter(m => !m.human && !m.bankrupt);
      to = cpus.length === 1 ? cpus[0].i : +prompt(`Sell to which manager?\n${cpus.map(m => `${m.i}: ${m.name}`).join('\n')}`, cpus[0].i);
    }
    const price = +prompt(`${buy ? 'Your offer for' : 'Asking price for'} ${P(pid).name} (nominal ${g.money(g.nominal(pid))}), in £:`, g.nominal(pid) * (buy ? 2 : 1));
    if (price > 0) { g.act(s, buy ? { type: 'buyOffer', pid, price } : { type: 'sellOffer', pid, to, price }); save(); render(); }
    return;
  }
  const a = JSON.parse(b.dataset.a || 'null');
  if (!a) return;
  if (a.view != null) { squadOf = a.view; render(); return; }
  if (a.type === 'new') { if (confirm('Start a new game?')) { s = null; save(); render(); } return; }
  if (['bankBuy'].includes(a.type)) tab = 'play';
  send(a);
});

s = await load();
render();
