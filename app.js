import * as g from './game.js';
import * as D from './data.js';
import { crest, avatar } from './art.js';

const COLORS = ['#f2c230', '#e4002b', '#00a3e0', '#ff7a00', '#8a2be2', '#2bb673', '#ff5fa2', '#8b5a2b', '#9aa0a6', '#00c2c7'];
const app = document.getElementById('app');
let s = null, tab = 'play', lastDie = null, squadOf = null, offer = null, confirmNew = false, anim = null;

// ---------- persistence: server file (survives a new tunnel URL) + browser copy ----------
async function load() {
  try { const r = await fetch('api/state'); if (r.ok || r.status === 404) { const j = await r.json(); return j?.v === 2 ? j : null; } } catch {} // server wins, even when reset
  try { const j = JSON.parse(localStorage.getItem('ff-save')); return j?.v === 2 ? j : null; } catch { return null; }
}
function save() {
  const body = JSON.stringify(s);
  try { localStorage.setItem('ff-save', body); } catch {}
  fetch('api/state', { method: 'PUT', body, headers: { 'content-type': 'application/json' } }).catch(() => {});
}

// ---------- helpers ----------
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const P = pid => D.PLAYERS[pid];
const me = () => s.managers[0];
const dot = i => `<span class="dot" style="background:${COLORS[i]}"></span>`;
const btn = (label, a, { cls = '', dis = false } = {}) => `<button class="${cls}" data-a="${esc(JSON.stringify(a))}" ${dis ? 'disabled' : ''}>${label}</button>`;
const club = (t, size = 22) => `<span class="clubname">${crest(t, size)}<span>${esc(D.TEAMS[t])}</span></span>`;
const tagsFor = pid => (s.out[pid] ? '<span class="tag red">fuori 1 gara</span>' : '') + (s.loans.some(l => l.pid === pid && l.to === 0) ? '<span class="tag">in prestito</span>' : '');

// Player card: level + stars, cartoon in his club shirt, first name, SURNAME, role. p = player object.
function cardHTML(p, footer = '', { tags = '', big = false } = {}) {
  const sp = p.name.indexOf(' '), first = sp > 0 ? p.name.slice(0, sp) : '', last = sp > 0 ? p.name.slice(sp + 1) : p.name;
  const fs = last.length > 12 ? 9 : last.length > 9 ? 11 : last.length > 7 ? 12 : 14;
  return `<div class="pcard ${p.pos}${big ? ' big' : ''}"><div class="ph"><div><small>LIVELLO</small><div class="st">${'★'.repeat(p.stars)}<span>${'★'.repeat(5 - p.stars)}</span></div></div><div class="num">${p.stars}</div></div>
    <div class="art">${avatar(p)}<span class="pclub">${crest(p.club, 18)}</span></div>
    <div class="first">${esc(first) || '&nbsp;'}</div><div class="last" style="font-size:${big ? fs + 6 : fs}px">${esc(last.toUpperCase())}</div>
    <div class="role">${D.POS_NAME[p.pos].toUpperCase()}</div>${tags ? `<div class="ctags">${tags}</div>` : ''}${footer ? `<div class="cfoot">${footer}</div>` : ''}</div>`;
}
const cards = list => `<div class="cards">${list.join('')}</div>`;
// squads always grouped by role, best first in each group
const ROLES = { G: 'Portieri', D: 'Difensori', M: 'Centrocampisti', A: 'Attaccanti', U: 'Jolly' };
const byRole = (pids, fn) => Object.keys(ROLES).map(pos => { const ps = pids.filter(p => P(p).pos === pos).sort((x, y) => P(y).stars - P(x).stars);
  return ps.length ? `<div class="rolehead ${pos}">${ROLES[pos]} · ${ps.length}</div>${cards(ps.map(fn))}` : ''; }).join('');
const short = n => n >= 1e6 ? `€${(n / 1e6).toFixed(1).replace('.', ',')}M` : `€${Math.round(n / 1000)}k`;
const posTxt = t => t <= 10 && s.pos[t] ? `${s.pos[t]}°` : '';
const tacticsHTML = m => `<div class="tactics">${g.FORMATIONS.map(f => { const l = g.lineup(s, m, { f });
  return btn(`<b>${f}</b><small>${l.full ? `Dif ${l.def} · Att ${l.att}` : 'incompleto'}</small>`, { type: 'formation', f }, { cls: (m.formation || '4-3-3') === f ? 'on' : 'alt' }); }).join('')}</div>`;
// a club's current Defence/Attack: live line-up for a coach's club, last known numbers otherwise
function strengthOf(t) {
  const m = g.managerOf(s, t);
  if (!m) return { d: s.D[t], a: s.A[t], m: null };
  const l = g.lineup(s, m); return { d: l.def, a: l.att, m };
}

// every coach at a glance: league position, Defence/Attack, cash
function coachesHTML() {
  return `<div class="coaches">${g.active(s).sort((x, y) => s.pos[x.club] - s.pos[y.club]).map(m => { const l = g.lineup(s, m);
    return `<button class="coach${m.human ? ' me' : ''}" data-team="${m.club}">${crest(m.club, 16)}<span><b>${s.pos[m.club]}° ${esc(m.name)} · ${s.table[m.club].pts} pt</b>
      <small>D${l.def} A${l.att} · ${short(m.cash)}</small></span></button>`; }).join('')}</div>`;
}

// my squad under an auction, and what the player on sale would change
function mySquadHTML(pid) {
  const h = me(), now = g.lineup(s, h), wit = g.lineup(s, h, { add: pid }), xi = new Set(now.xi);
  const diff = (x, y) => x === y ? `${y}` : `${x} → <b class="${y > x ? 'win' : 'loss'}">${y}</b>`;
  return `<div class="rhead">La tua rosa · ${esc(h.formation || '4-3-3')}</div>
    <div class="muted">Con lui: Difesa ${diff(now.def, wit.def)} · Attacco ${diff(now.att, wit.att)}${wit.xi.includes(pid) ? ' · sarebbe titolare' : ' · sarebbe riserva'}</div>
    ${byRole(g.squad(s, h), p => cardHTML(P(p), '', { tags: xi.has(p) ? '<span class="tag">titolare</span>' : '<span class="tag">riserva</span>' }))}`;
}

function previewHTML() {
  const h = me(), x = g.nextMatch(s, h), [type, round] = D.CALENDAR[s.week];
  const side = t => { const st = strengthOf(t);
    return `<div class="vside${st.m?.human ? ' me' : ''}">${crest(t, 46)}<b>${esc(D.TEAMS[t])}</b>
      <small>${posTxt(t) ? posTxt(t) + ' in classifica' : '&nbsp;'}</small><small>${st.m ? dot(st.m.i) + ' ' + esc(st.m.name) + ' · ' + esc(st.m.formation || '4-3-3') : 'computer'}</small>
      <div class="da">Dif <i>${st.d}</i> · Att <i>${st.a}</i></div></div>`; };
  const others = type === 'L' ? s.fixtures[round - 1].filter(([p, q]) => p !== x.h || q !== x.a).map(([p, q]) =>
    `<div class="fx"><span>${posTxt(p)}</span>${club(p, 18)}<i>–</i>${club(q, 18)}<span>${posTxt(q)}</span></div>`).join('') : '';
  return `<div class="card hero"><h2>Prossima partita</h2><h3>${esc(g.weekLabel(s))}</h3>
    <div class="versus">${side(x.h)}<div class="vs">VS</div>${side(x.a)}</div>
    <div class="rhead">Il tuo modulo</div>${tacticsHTML(h)}
    <div class="muted">Gol: (tuo Attacco − loro Difesa) ÷ 3, più un po' di fortuna.</div>
    ${others ? `<div class="rhead">Le altre partite</div>${others}` : ''}
    ${btn('⚽  Gioca la partita', { type: 'ok' }, { cls: 'big' })}</div>`;
}

const wait = ms => new Promise(r => setTimeout(r, ms));
function send(input) {
  const prev = s.pending, tick = s.tick || 0, cash = me().cash;
  if (input.type === 'roll') { const from = me().sq; g.act(s, input); lastDie = (me().sq - from + 36) % 36 || null; save(); return rollAnim(from).then(() => { toasts(tick); cashFlash(cash); }); }
  g.act(s, input);
  save(); render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (prev?.type === 'auction' && !(s.pending?.type === 'auction' && s.pending.pid === prev.pid)) auctionResult(prev.pid, tick);
  toasts(tick); cashFlash(cash);
}

// the money pill flashes green or red with the change
function cashFlash(before) {
  const d = me().cash - before, pill = document.querySelector('.pill.gold');
  if (!d || !pill) return;
  const el = document.createElement('span');
  el.className = `delta ${d > 0 ? 'up' : 'down'}`; el.textContent = (d > 0 ? '+' : '−') + g.money(Math.abs(d)).replace('-', '');
  pill.classList.add('flash'); pill.appendChild(el);
  setTimeout(() => { el.remove(); pill.classList.remove('flash'); }, 2600);
}

// What the other coaches just did, as notes that slide in and fade away on their own (tap to dismiss).
function toasts(tick) {
  const all = s.log.filter(l => l.t > tick && l.mi != null && !l.text.startsWith('—')).reverse();
  const news = [...all.filter(l => l.mi === 0), ...all.filter(l => l.mi !== 0).slice(-4)];
  let box = document.querySelector('.toasts');
  if (!box) { box = document.createElement('div'); box.className = 'toasts'; document.body.appendChild(box); }
  news.forEach((l, i) => {
    const el = document.createElement('div');
    el.className = l.mi === 0 ? 'toast me' : 'toast'; el.style.animationDelay = `${i * 500}ms, ${i * 500 + 3200}ms`;
    el.innerHTML = `${dot(l.mi)}<span>${esc(l.text)}</span>`;
    el.addEventListener('click', () => el.remove());
    el.addEventListener('animationend', e => { if (e.animationName === 'tout') el.remove(); });
    box.appendChild(el);
  });
}

// Die tumbles, lands on the number, then my token hops square by square.
async function rollAnim(from) {
  if (!lastDie) { render(); return; }
  anim = { pos: from, face: 1 + g.rnd(6), rolling: true };
  render();
  document.querySelector('.board')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  for (let i = 0; i < 9; i++) { await wait(70); anim.face = 1 + g.rnd(6); const d = document.querySelector('.die'); if (d) d.textContent = anim.face; }
  anim.face = lastDie; anim.rolling = false; render(); await wait(500);
  for (let k = 1; k <= lastDie; k++) { anim.pos = (from + k) % 36; render(); await wait(230); }
  await wait(600);
  anim = null; render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Full-screen card with a stamp: won (confetti), lost to someone (shake), or unsold.
function auctionResult(pid, tick) {
  const owner = s.owner[pid], won = owner === 0, sold = typeof owner === 'number';
  // the log line about this player (other auctions may have followed it), oldest first
  const name = g.card(pid);
  const text = s.log.filter(l => l.t > tick).reverse().map(l => l.text).find(t => t.includes(name) && (t.includes(' compra ') || t.startsWith('Nessuna offerta'))) || '';
  const el = document.createElement('div');
  el.className = `overlay ${won ? 'won' : sold ? 'lost' : 'none'}`;
  const bits = won ? Array.from({ length: 28 }, (_, i) => `<i style="left:${g.rnd(100)}%;background:${COLORS[i % 5]};animation-delay:${g.rnd(500)}ms;animation-duration:${1400 + g.rnd(900)}ms"></i>`).join('') : '';
  el.innerHTML = `${bits}<div class="obox"><div class="ocard">${cardHTML(P(pid), '', { big: true })}<div class="stamp">${won ? 'TUO!' : sold ? 'PERSO' : 'INVENDUTO'}</div></div>
    <div class="otext">${sold && !won ? dot(owner) + ' ' : ''}${esc(text)}</div><button class="big">Avanti</button></div>`;
  el.addEventListener('click', () => el.remove());
  document.body.appendChild(el);
}

// ---------- setup ----------
function setup() {
  app.innerHTML = `<header><div class="hrow"><div class="crest">⚽</div><div class="club"><b>Football Fortunes</b><small>Serie A · dal gioco di Brian Clough (1987)</small></div></div></header><main>
  <div class="card"><h3>Nuova partita</h3>
    <p class="muted">Alleni un club di Serie A contro allenatori del computer. Giri il tabellone, compri campioni all'asta, affronti Fortuna e Problemi di formazione, poi giochi campionato, Coppa Italia e coppe europee. Vince chi ha più punti alla fine.</p>
    <label>Il tuo nome</label><input id="name" value="Nicolò" maxlength="14">
    <label>La tua squadra</label><div class="clubpick">${D.TEAMS.slice(1, 11).map((t, i) => `<button class="alt small${i ? '' : ' on'}" data-club="${i + 1}">${crest(i + 1, 24)}<span>${t}</span></button>`).join('')}</div>
    <label>Difficoltà (forza delle avversarie in coppa)</label><select id="level"><option value="1">1 · Facile</option><option value="2" selected>2 · Media</option><option value="3">3 · Difficile</option><option value="4">4 · Esperto</option></select>
    <label>Stagioni</label><select id="seasons"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option><option value="0">Infinite</option></select>
    <button class="big" id="start">Fischio d'inizio</button>
  </div></main>`;
  let pickedClub = 1;
  app.querySelectorAll('[data-club]').forEach(b => b.onclick = () => {
    pickedClub = +b.dataset.club; app.querySelectorAll('[data-club]').forEach(x => x.classList.toggle('on', x === b));
  });
  document.getElementById('start').onclick = () => {
    const v = id => document.getElementById(id).value;
    s = g.newGame({ name: v('name') || 'Mister', club: pickedClub, level: +v('level'), seasons: +v('seasons') });
    tab = 'play'; squadOf = null; save(); render();
  };
}

// ---------- play ----------
function boardHTML() {
  const at = i => i <= 9 ? [1, i + 1] : i <= 18 ? [i - 8, 10] : i <= 27 ? [10, 28 - i] : [37 - i, 1];
  const cells = D.BOARD.map((sq, i) => {
    const [r, c] = at(i), info = D.SQUARE[sq];
    const posOf = m => m.human && anim ? anim.pos : m.sq;
    const dots = s.managers.filter(m => posOf(m) === i && !m.bankrupt).map(m => m.human ? `<span class="dot tok" style="background:${COLORS[0]}"></span>` : dot(m.i)).join('');
    return `<div class="sq${i === (anim ? anim.pos : me().sq) ? ' here' : ''}" style="grid-row:${r};grid-column:${c};background:${info.color}" title="${esc(info.label)}">${info.icon}<span class="dots">${dots}</span></div>`;
  });
  const face = anim ? anim.face : lastDie, where = anim ? anim.pos : me().sq;
  cells.push(`<div class="centre">${face ? `<div class="die${anim?.rolling ? ' rolling' : anim ? ' landed' : ''}">${face}</div>` : ''}<b>${esc(D.SQUARE[D.BOARD[where]].label)}</b>
    <div class="legend">${s.managers.filter(m => !m.bankrupt).map(m => `<span>${dot(m.i)}${esc(m.name)}</span>`).join('')}</div></div>`);
  return `<div class="board">${cells.join('')}</div>`;
}

function matchHTML(l) {
  const mineH = l.mh === 0, mineA = l.ma === 0, mine = mineH || mineA;
  const team = (t, mi, d, a, away) => `<div class="team${away ? ' away' : ''}${mi === 0 ? ' me' : ''}">
    <div class="tn">${away ? '' : crest(t, 20)}<span>${esc(D.TEAMS[t])}${posTxt(t) ? ` <em>${posTxt(t)}</em>` : ''}</span>${away ? crest(t, 20) : ''}</div>
    <div class="da">${!away && mi != null ? dot(mi) + ' ' : ''}Dif <i>${d}</i> · Att <i>${a}</i>${away && mi != null ? ' ' + dot(mi) : ''}</div></div>`;
  const my = mineH ? l.x : l.y, their = mineH ? l.y : l.x;
  const cls = !mine ? '' : my > their ? 'win' : my < their ? 'loss' : '';
  return `<div class="match${mine ? ' mine' : ''}">${team(l.h, l.mh, l.hd, l.ha, false)}<div class="score ${cls}">${l.x} - ${l.y}</div>${team(l.a, l.ma, l.ad, l.aa, true)}
    ${l.g != null && (l.mh != null || l.ma != null) ? `<div class="gate">Incasso ${g.money(l.g)} · metà a ogni allenatore</div>` : ''}</div>`;
}
const linesHTML = lines => lines.map(l => l.k === 'm' ? matchHTML(l) : l.k === 'h' ? `<div class="rhead">${esc(l.text)}</div>` : `<div class="note">${esc(l.text)}</div>`).join('');

function pendingHTML() {
  const p = s.pending, h = me();
  if (!p) return '';
  switch (p.type) {
    case 'roll': return `<div class="card hero"><h2>Tocca a te</h2><h3>${esc(g.weekLabel(s))}</h3>
      <div class="muted">${g.playsThisWeek(s, h) ? 'Questa settimana giochi.' : 'Questa settimana non giochi.'} Prima di tirare puoi comprare dalla banca o fare offerte nel Mercato.</div>
      ${btn('🎲  Tira il dado', { type: 'roll' }, { cls: 'big' })}</div>`;
    case 'preview': return previewHTML();
    case 'info': return `<div class="card hero"><h2>${esc(p.title)}</h2><div class="cardtext">${esc(p.text)}</div>${btn('OK', { type: 'ok' }, { cls: 'big' })}</div>`;
    case 'choose': return `<div class="card hero"><h2>${esc(p.title)}</h2><div class="cardtext">${esc(p.text)}</div>
      <div class="stack">${p.options.map((o, i) => btn(esc(o.label), { type: 'choose', id: o.id }, { cls: i ? 'alt' : '' })).join('')}</div></div>`;
    case 'pick': return `<div class="card hero"><h2>${esc(p.title)}</h2><div class="muted">${esc(p.text)}</div>
      ${byRole(p.pids, pid => cardHTML(P(pid), btn(p.prices ? g.money(p.prices[pid]) : 'Scegli', { type: 'pick', pid }, { cls: 'small', dis: p.prices && p.title.startsWith('Compra') && p.prices[pid] > h.cash })))}
      ${p.optional ? btn('Salta', { type: 'skip' }, { cls: 'alt big' }) : ''}</div>`;
    case 'sell': {
      const mine = g.squad(s, h).filter(pid => s.owner[pid] === 0), xi = new Set(g.lineup(s, h, { withOut: true }).xi);
      return `<div class="card hero"><h2>${p.forced ? 'Servono soldi' : 'Banca'}</h2>
      <h3>${p.forced ? `Ti mancano ${g.money(p.need)}` : 'Vendi alla banca'}</h3>
      <div class="muted">${p.forced ? 'Non puoi pagare: vendi giocatori alla banca a ¾ del loro valore.' : 'Puoi vendere giocatori alla banca a ¾ del valore. Tieni abbastanza uomini per il tuo modulo!'}</div>
      ${byRole(mine, pid => cardHTML(P(pid), btn(`Vendi ${g.money(g.nominal(pid) * 3 / 4)}`, { type: 'sell', pid }, { cls: 'small' }), { tags: (xi.has(pid) ? '<span class="tag">titolare</span>' : '') + tagsFor(pid) }))}
      ${p.forced ? '' : btn('Fatto', { type: 'done' }, { cls: 'big' })}</div>`;
    }
    case 'auction': {
      const opts = [p.next, p.next + p.step, p.next + 4 * p.step, p.next + 10 * p.step].filter((v, i, a) => v <= p.cap && a.indexOf(v) === i);
      return `<div class="card hero auction"><h2>${p.src === 'bank' ? 'Vendita della banca' : p.half ? 'Asta al 50%' : 'Asta'} · valore ${g.money(g.nominal(p.pid))}</h2>
      <div class="owner">${p.lander === 0 ? '<b>La tua asta</b>' : `${dot(p.lander)} <b>Asta di ${esc(s.managers[p.lander].name)}</b>`}
        <span class="muted">${p.src === 'bank' ? (p.lander === 0 ? 'compri dalla banca' : 'vuole comprare dalla banca') : p.lander === 0 ? 'sei finito sulla casella Asta' : 'è finito sulla casella Asta'}${p.half && p.lander !== 0 ? ` · se vince ${esc(s.managers[p.lander].name)} paga metà` : ''}</span></div>
      <div class="solo">${cardHTML(P(p.pid), '', { big: true })}</div>
      <div class="bid">${p.bidder == null ? 'Nessuna offerta' : `${dot(p.bidder)} ${esc(s.managers[p.bidder].name)}: ${g.money(p.high)}`}</div>
      <div class="muted">${p.half && p.lander === 0 ? 'Asta al 50%: se vinci paghi metà. ' : ''}${p.src === 'bank' ? 'Minimo 1½ volte il valore. ' : ''}Hai ${g.money(h.cash)}.</div>
      <div class="btns">${opts.map(v => btn(`Offri ${g.money(v)}`, { type: 'bid', amount: v })).join('')}</div>
      ${mySquadHTML(p.pid)}
      ${btn(p.bidder == null ? 'Non offro' : 'Lascio', { type: 'pass' }, { cls: 'alt big' })}</div>`;
    }
    case 'results': return `<div class="card hero"><h2>${esc(p.title || 'Risultati')}</h2>${linesHTML(p.lines)}${btn('Avanti', { type: 'ok' }, { cls: 'big' })}</div>`;
    case 'over': return `<div class="card hero"><h3>${esc(p.why)}</h3>${ratingsHTML(true)}
      ${btn(confirmNew ? 'Sicuro? Tocca ancora' : 'Nuova partita', { type: 'new' }, { cls: 'big' })}</div>`;
  }
  return '';
}

function feedHTML() {
  return `<div class="card feed"><h2>Notizie</h2>${s.log.slice(0, 40).map(l =>
    `<div class="${l.text.startsWith('—') ? 'wk' : l.mi === 0 ? 'me' : ''}">${l.mi != null && !l.text.startsWith('—') ? dot(l.mi) + ' ' : ''}${esc(l.text.replace(/^— | —$/g, ''))}</div>`).join('')}</div>`;
}

// ---------- squads: every Serie A club ----------
function pitch(lines) {
  const chip = p => p ? `<div class="chip"><b>${esc(p.name.includes(' ') ? p.name.slice(p.name.indexOf(' ') + 1) : p.name)}</b><span class="stars">${'★'.repeat(p.stars)}</span></div>` : `<div class="chip"><b>—</b></div>`;
  return `<div class="pitch">${lines.map(l => `<div class="line">${l.map(chip).join('')}</div>`).join('')}</div>`;
}
const sums = (d, a) => `<div class="sums"><div class="sum"><b>${d}</b><small>Difesa</small></div><div class="sum"><b>${a}</b><small>Attacco</small></div><div class="sum"><b>${d + a}</b><small>Totale</small></div></div>`;

function squadHTML() {
  const team = squadOf ?? me().club;
  const picker = `<div class="seg" style="margin-bottom:14px">${(s.order || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).map(t => {
    const m = g.managerOf(s, t);
    return `<button class="small clubbtn${t === team ? '' : ' alt'}" data-team="${t}">${crest(t, 20)}${m ? dot(m.i) : ''}</button>`;
  }).join('')}</div>`;
  const m = g.managerOf(s, team);
  if (!m) return picker + `<div class="card"><h3>${club(team, 26)}</h3><p class="muted">Allenatore in bancarotta: la squadra non ha più giocatori.</p></div>`;
  const lu = g.lineup(s, m), all = g.squad(s, m), xiSet = new Set(lu.xi), byPos = pos => lu.slots.filter(x => x.pos === pos).map(x => x.pid == null ? null : P(x.pid));
  return picker + `<div class="card"><h2>${dot(m.i)} ${esc(m.name)}${m.bankrupt ? ' · in bancarotta' : ''}</h2><h3>${club(team, 26)} <span class="muted">· ${s.pos[team]}° in classifica</span></h3>${sums(lu.def, lu.att)}
  ${lu.full ? '' : `<div class="notice" style="margin-top:10px">Non riesci a schierare un ${m.formation || '4-3-3'} completo: forza 0 e niente incasso!</div>`}
  <div class="rhead">Modulo ${esc(m.formation || '4-3-3')}</div>
  ${m.human ? tacticsHTML(m) : ''}
  ${pitch([byPos('A'), byPos('M'), byPos('D'), [lu.gk == null ? null : P(lu.gk)]])}
  <div class="muted" style="margin-top:10px">Cassa ${g.money(m.cash)} · Stipendi ${g.money(g.wages(s, m))} · Carte Immunità ${m.immunity}</div></div>
  <div class="card"><h2>Rosa · ${all.length} giocatori</h2>${byRole(all, pid => cardHTML(P(pid), '', { tags: (xiSet.has(pid) ? '<span class="tag">titolare</span>' : '<span class="tag">riserva</span>') + tagsFor(pid) }))}
  <p class="muted">Scegli il modulo, i migliori giocatori vengono messi da soli. Più difensori alzano la Difesa, più centrocampisti e attaccanti l'Attacco. I jolly giocano ovunque; un jolly in porta vale 1 stella.</p></div>`;
}

// ---------- league ----------
function leagueHTML() {
  const rows = s.order || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], mgr = t => s.managers.find(m => m.club === t);
  const cups = [];
  if (s.fa) cups.push(s.fa.winner ? `🏆 Coppa Italia: ${club(s.fa.winner)}` : `Coppa Italia: ${s.managers.filter(m => s.fa.slots.includes(m.club)).map(m => esc(m.name)).join(', ') || 'nessun allenatore'} ancora in corsa`);
  for (const k of ['EC', 'CWC', 'UEFA']) if (s.euro[k].ms.length || s.euro[k].winner != null)
    cups.push(`${D.COMP_NAME[k]}: ${s.euro[k].ms.map(i => esc(s.managers[i].name)).join(', ') || 'eliminati'}`);
  return `<div class="card"><h2>Serie A · stagione ${s.season}</h2><table><tr><th>#</th><th class="t">Squadra</th><th>G</th><th>V</th><th>N</th><th>P</th><th>DR</th><th>Pt</th></tr>
  ${rows.map((t, i) => { const r = s.table[t], m = mgr(t); return `<tr class="${m?.i === 0 ? 'me' : ''}" data-team="${t}"><td>${i + 1}</td><td class="t">${club(t, 20)}${m ? ' ' + dot(m.i) : ''}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.f - r.a > 0 ? '+' : ''}${r.f - r.a}</td><td><b>${r.pts}</b></td></tr>`; }).join('')}</table>
  <p class="muted">Tocca una squadra per vedere la rosa. Vittoria ${s.points[0]} · pareggio ${s.points[1]} · sconfitta ${s.points[2]}.</p></div>
  ${s.lastResults ? `<div class="card"><h2>Ultimi risultati</h2>${linesHTML(s.lastResults)}</div>` : ''}
  ${cups.length ? `<div class="card"><h2>Coppe</h2>${cups.map(c => `<div style="padding:4px 0">${c}</div>`).join('')}</div>` : ''}
  <div class="card"><h2>Calendario</h2><div class="muted">${D.CALENDAR.map((c, i) => { const t = c[0] === 'L' ? 'A' + c[1] : (c[0] === 'F' ? 'CI ' : 'EU ') + ['1T', '2T', 'QF', 'SF', 'F'][c[1] - 1]; return i === s.week ? `<b style="color:var(--ink)">▶ ${t}</b>` : t; }).join(' · ')}</div>
  <p class="muted">A = Serie A · CI = Coppa Italia · EU = coppe europee (dalla 2ª stagione)</p></div>`;
}

// ---------- market ----------
function marketHTML() {
  const h = me(), can = g.canTrade(s), closed = s.transfersClosed;
  const cpus = s.managers.filter(m => !m.human && !m.bankrupt);
  let form = '';
  if (offer) {
    const o = offer;
    form = `<div class="card hero"><h2>${o.buy ? 'Offerta di acquisto' : 'Offerta di vendita'} · valore ${g.money(g.nominal(o.pid))}</h2><div class="solo">${cardHTML(P(o.pid))}</div>
      ${o.buy ? '' : `<label>A chi</label><select id="to">${cpus.map(m => `<option value="${m.i}">${esc(m.name)} · ${esc(D.TEAMS[m.club])}</option>`).join('')}</select>`}
      <label>Prezzo (€)</label><input id="price" type="number" inputmode="numeric" step="5000" min="5000" value="${g.nominal(o.pid) * (o.buy ? 2 : 1)}">
      <div class="btns"><button id="sendOffer">Invia offerta</button><button class="alt" id="cancelOffer">Annulla</button></div></div>`;
  }
  const offerBtn = (kind, pid) => `<button class="small" data-offer="${kind}" data-pid="${pid}" ${!can || closed ? 'disabled' : ''}>Offri</button>`;
  return `${s.notice ? `<div class="notice">${esc(s.notice)}</div>` : ''}
  ${can ? '' : '<div class="notice">Puoi fare mercato a inizio turno, prima di tirare il dado.</div>'}${form}
  <div class="card"><h2>Banca</h2><div class="muted">Giocatori venduti alla banca. Prezzo minimo 1½ volte il valore; gli altri allenatori possono rilanciare.</div>
  ${s.bank.length ? byRole(s.bank, pid => cardHTML(P(pid), btn(`da ${g.money(Math.ceil(g.nominal(pid) * 1.5 / 5000) * 5000)}`, { type: 'bankBuy', pid }, { cls: 'small', dis: !can }))) : '<p class="muted">La banca non ha giocatori.</p>'}</div>
  <div class="card"><h2>Compra da un allenatore</h2><div class="muted">${closed ? 'Mercato chiuso: si sono giocate le semifinali di coppa.' : 'Vende solo se il prezzo vale più di quanto il giocatore vale per lui.'}</div>
  ${cpus.map(m => `<div class="rhead">${dot(m.i)} ${esc(m.name)} · ${club(m.club, 18)}</div>` + byRole(g.squad(s, m).filter(p => s.owner[p] === m.i), pid => cardHTML(P(pid), offerBtn('buy', pid)))).join('')}</div>
  <div class="card"><h2>Vendi a un allenatore</h2>${byRole(g.squad(s, h).filter(p => s.owner[p] === 0), pid => cardHTML(P(pid), offerBtn('sell', pid)))}</div>`;
}

// ---------- ratings ----------
function ratingsHTML(final = false) {
  const rows = [...s.managers].sort((a, b) => (b.bankrupt ? -1 : g.gamePoints(s, b)) - (a.bankrupt ? -1 : g.gamePoints(s, a)));
  const t = `<table><tr><th class="t">Allenatore</th><th>Camp.</th><th>CI</th><th>Eur</th><th>Cassa</th><th>Tot</th></tr>
  ${rows.map(m => `<tr class="${m.i === 0 ? 'me' : ''}"><td class="t">${dot(m.i)} ${esc(m.name)}<br>${club(m.club, 16)}<br><span class="muted">${g.money(m.cash)}</span></td>
  <td>${m.k1 + (s.leagueStarted ? g.leaguePoints(s.pos[m.club]) : 0)}</td><td>${m.k2}</td><td>${m.k3}</td><td>${m.k7}</td><td><b>${m.bankrupt ? '—' : g.gamePoints(s, m)}</b></td></tr>`).join('')}</table>
  <p class="muted">Punti partita: piazzamento in campionato (1° = 15 … 10° = 1, sommati ogni stagione), turni di coppa vinti, e alla fine 1 punto ogni €50.000 in cassa.</p>`;
  return final ? t : `<div class="card"><h2>Classifica allenatori</h2>${t}</div>`;
}

function render() {
  if (!s) return setup();
  const h = me();
  if (s.pending?.type === 'results') s.lastResults = s.pending.lines;
  const tabs = { play: ['🎲', 'Gioca'], squad: ['👕', 'Rose'], league: ['🏆', 'Serie A'], market: ['💶', 'Mercato'], ratings: ['⭐', 'Punti'] };
  const body = { play: () => anim ? boardHTML() : pendingHTML() + boardHTML() + '<div style="height:14px"></div>' + feedHTML(), squad: squadHTML, league: leagueHTML, market: marketHTML, ratings: () => ratingsHTML() + `<div class="card"><h3>Ricomincia</h3><div class="muted">Cancella questa partita e ne inizia una nuova.</div>${btn(confirmNew ? 'Sicuro? Tocca ancora' : 'Ricomincia da capo', { type: 'new' }, { cls: confirmNew ? 'big' : 'alt big' })}</div>` }[tab]();
  const waiting = s.pending && s.pending.type !== 'roll' && tab !== 'play' ? `<div class="notice">C'è una decisione da prendere in “Gioca”.</div>` : '';
  app.innerHTML = `<header><div class="hrow">${crest(h.club, 40)}
    <div class="club"><b>${esc(D.TEAMS[h.club])}</b><small>${esc(h.name)} · Stagione ${s.season}${s.seasons ? '/' + s.seasons : ''} · ${s.finished ? 'finita' : esc(g.weekLabel(s))}</small></div></div>
    <div class="pills"><span class="pill gold">${g.money(h.cash)}</span><span class="pill">${g.gamePoints(s, h)} punti</span><span class="pill">${s.pos[h.club]}° in classifica</span></div>${coachesHTML()}</header>
  <main>${waiting}${body}</main>
  <div class="actbar"></div>
  <nav>${Object.entries(tabs).map(([k, [ic, v]]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}"><span>${ic}</span>${v}</button>`).join('')}</nav>`;
  // the card's main button (roll, next, pass...) sits in a bar above the tabs, always in reach
  const main = tab === 'play' && !anim && app.querySelector('main .hero > button.big:last-child');
  if (main) app.querySelector('.actbar').appendChild(main);
}

app.addEventListener('click', e => {
  if (!s || anim) return;
  const row = e.target.closest('tr[data-team]');
  if (row) { squadOf = +row.dataset.team; tab = 'squad'; render(); window.scrollTo(0, 0); return; }
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  if (b.dataset.tab) { tab = b.dataset.tab; confirmNew = false; s.notice = null; offer = null; if (tab === 'squad') squadOf = null; render(); window.scrollTo(0, 0); return; }
  if (b.dataset.team) { squadOf = +b.dataset.team; tab = 'squad'; render(); window.scrollTo(0, 0); return; }
  if (b.dataset.offer) { offer = { pid: +b.dataset.pid, buy: b.dataset.offer === 'buy' }; s.notice = null; render(); window.scrollTo(0, 0); return; }
  if (b.id === 'cancelOffer') { offer = null; render(); return; }
  if (b.id === 'sendOffer') {
    const price = +document.getElementById('price').value, to = +(document.getElementById('to')?.value ?? 0);
    g.act(s, offer.buy ? { type: 'buyOffer', pid: offer.pid, price } : { type: 'sellOffer', pid: offer.pid, to, price });
    offer = null; save(); render(); window.scrollTo(0, 0); return;
  }
  const a = JSON.parse(b.dataset.a || 'null');
  if (!a) return;
  if (a.type === 'new') { if (!confirmNew) { confirmNew = true; render(); return; } confirmNew = false; s = null; tab = 'play'; save(); render(); return; }
  if (a.type === 'formation') { g.act(s, a); save(); render(); return; }
  if (a.type === 'bankBuy') tab = 'play';
  send(a);
});

// a page left open on the phone picks up new game code when you come back to it
const version = () => fetch('api/version').then(r => r.text()).catch(() => null);
const v0 = await version();
document.addEventListener('visibilitychange', async () => { if (document.hidden || anim || !v0) return; const v = await version(); if (v && v !== v0) location.reload(); });

s = await load();
render();
