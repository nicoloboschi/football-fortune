import * as g from './game.js';
import * as D from './data.js';

const COLORS = ['#f2c230', '#e4002b', '#00a3e0', '#ff7a00', '#8a2be2'];
const app = document.getElementById('app');
let s = null, tab = 'play', lastDie = null, squadOf = 0, offer = null, confirmNew = false;

// ---------- persistence: server file (survives a new tunnel URL) + browser copy ----------
async function load() {
  try { const r = await fetch('api/state'); if (r.ok) { const j = await r.json(); if (j && j.v === 2) return j; } } catch {}
  try { const j = JSON.parse(localStorage.getItem("ff-save")); return j?.v === 2 ? j : null; } catch { return null; }
}
function save() {
  const body = JSON.stringify(s);
  try { localStorage.setItem('ff-save', body); } catch {}
  fetch('api/state', { method: 'PUT', body, headers: { 'content-type': 'application/json' } }).catch(() => {});
}

// ---------- helpers ----------
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const stars = n => '★'.repeat(n);
const P = pid => D.PLAYERS[pid];
const me = () => s.managers[0];
const dot = i => `<span class="dot" style="background:${COLORS[i]}"></span>`;
const btn = (label, a, { cls = '', dis = false } = {}) => `<button class="${cls}" data-a="${esc(JSON.stringify(a))}" ${dis ? 'disabled' : ''}>${label}</button>`;
const tagsFor = pid => (s.out[pid] ? '<span class="tag red">fuori 1 gara</span>' : '') + (s.loans.some(l => l.pid === pid && l.to === 0) ? '<span class="tag">in prestito</span>' : '');
const pl = (pid, right = '', tags = '') => `<div class="player"><div class="pname"><span class="pos ${P(pid).pos}">${D.POS_SHORT[P(pid).pos]}</span>
  <div style="min-width:0"><div class="n">${esc(P(pid).name)}</div><span class="stars">${stars(P(pid).stars)}</span> ${tags}</div></div><div>${right}</div></div>`;
const surname = n => n.includes(' ') ? n.split(' ').slice(1).join(' ') : n;

function send(input) {
  if (input.type === 'roll') { const before = me().sq; g.act(s, input); lastDie = (me().sq - before + 36) % 36 || null; }
  else g.act(s, input);
  save(); render();
  if (input.type !== 'bankBuy') window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- setup ----------
function setup() {
  app.innerHTML = `<header><div class="hrow"><div class="crest">⚽</div><div class="club"><b>Football Fortunes</b><small>Serie A · dal gioco di Brian Clough (1987)</small></div></div></header><main>
  <div class="card"><h3>Nuova partita</h3>
    <p class="muted">Alleni un club di Serie A contro allenatori del computer. Giri il tabellone, compri campioni all'asta, affronti Fortuna e Problemi di formazione, poi giochi campionato, Coppa Italia e coppe europee. Vince chi ha più punti alla fine.</p>
    <label>Il tuo nome</label><input id="name" value="Nicolò" maxlength="14">
    <label>La tua squadra</label><select id="club">${D.TEAMS.slice(1, 11).map((t, i) => `<option value="${i + 1}">${t}</option>`).join('')}</select>
    <label>Allenatori avversari</label><select id="cpus"><option>1</option><option selected>2</option><option>3</option><option>4</option></select>
    <label>Difficoltà (forza delle squadre del computer)</label><select id="level"><option value="1">1 · Facile</option><option value="2" selected>2 · Media</option><option value="3">3 · Difficile</option><option value="4">4 · Esperto</option></select>
    <label>Stagioni</label><select id="seasons"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option></select>
    <button class="big" id="start">Fischio d'inizio</button>
  </div></main>`;
  document.getElementById('start').onclick = () => {
    const v = id => document.getElementById(id).value;
    s = g.newGame({ name: v('name') || 'Mister', club: +v('club'), cpus: +v('cpus'), level: +v('level'), seasons: +v('seasons') });
    tab = 'play'; save(); render();
  };
}

// ---------- play ----------
function boardHTML() {
  const at = i => i <= 9 ? [1, i + 1] : i <= 18 ? [i - 8, 10] : i <= 27 ? [10, 28 - i] : [37 - i, 1];
  const cells = D.BOARD.map((sq, i) => {
    const [r, c] = at(i), info = D.SQUARE[sq];
    const dots = s.managers.filter(m => m.sq === i && !m.bankrupt).map(m => dot(m.i)).join('');
    return `<div class="sq${i === me().sq ? ' here' : ''}" style="grid-row:${r};grid-column:${c};background:${info.color}" title="${esc(info.label)}">${info.icon}<span class="dots">${dots}</span></div>`;
  });
  cells.push(`<div class="centre">${lastDie ? `<div class="die">${lastDie}</div>` : ''}<b>${esc(D.SQUARE[D.BOARD[me().sq]].label)}</b>
    <div class="legend">${s.managers.filter(m => !m.bankrupt).map(m => `<span>${dot(m.i)}${esc(m.name)}</span>`).join('')}</div></div>`);
  return `<div class="board">${cells.join('')}</div>`;
}

function matchHTML(l) {
  const mineH = l.mh === 0, mineA = l.ma === 0, mine = mineH || mineA;
  const team = (t, mi, d, a, away) => `<div class="team${away ? ' away' : ''}${mi === 0 ? ' me' : ''}">
    <div class="tn">${!away && mi != null ? dot(mi) : ''}<span>${esc(D.TEAMS[t])}</span>${away && mi != null ? dot(mi) : ''}</div>
    <div class="da">Dif <i>${d}</i> · Att <i>${a}</i></div></div>`;
  const myGoals = mineH ? l.x : l.y, theirs = mineH ? l.y : l.x;
  const cls = !mine ? '' : myGoals > theirs ? 'win' : myGoals < theirs ? 'loss' : '';
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
    case 'info': return `<div class="card hero"><h2>${esc(p.title)}</h2><div class="cardtext">${esc(p.text)}</div>${btn('OK', { type: 'ok' }, { cls: 'big' })}</div>`;
    case 'choose': return `<div class="card hero"><h2>${esc(p.title)}</h2><div class="cardtext">${esc(p.text)}</div>
      <div class="stack">${p.options.map((o, i) => btn(esc(o.label), { type: 'choose', id: o.id }, { cls: i ? 'alt' : '' })).join('')}</div></div>`;
    case 'pick': return `<div class="card hero"><h2>${esc(p.title)}</h2><div class="muted">${esc(p.text)}</div>
      ${p.pids.map(pid => pl(pid, btn(p.prices ? g.money(p.prices[pid]) : 'Scegli', { type: 'pick', pid }, { cls: 'small', dis: p.prices && p.title.startsWith('Compra') && p.prices[pid] > h.cash }))).join('')}
      ${p.optional ? btn('Salta', { type: 'skip' }, { cls: 'alt big' }) : ''}</div>`;
    case 'sell': {
      const mine = g.squad(s, h).filter(pid => s.owner[pid] === 0), xi = new Set(g.lineup(s, h, { withOut: true }).xi);
      return `<div class="card hero"><h2>${p.forced ? 'Servono soldi' : 'Banca'}</h2>
      <h3>${p.forced ? `Ti mancano ${g.money(p.need)}` : 'Vendi alla banca'}</h3>
      <div class="muted">${p.forced ? 'Non puoi pagare: vendi giocatori alla banca a ¾ del loro valore.' : 'Puoi vendere giocatori alla banca a ¾ del valore. Tieni abbastanza uomini per il 4-3-3!'}</div>
      ${mine.map(pid => pl(pid, btn(g.money(g.nominal(pid) * 3 / 4), { type: 'sell', pid }, { cls: 'small' }), (xi.has(pid) ? '<span class="tag">titolare</span>' : '') + tagsFor(pid))).join('')}
      ${p.forced ? '' : btn('Fatto', { type: 'done' }, { cls: 'big' })}</div>`;
    }
    case 'auction': {
      const opts = [p.next, p.next + p.step, p.next + 4 * p.step, p.next + 10 * p.step].filter((v, i, a) => v <= p.cap && a.indexOf(v) === i);
      return `<div class="card hero auction"><h2>${p.src === 'bank' ? 'Vendita della banca' : p.half ? 'Asta al 50%' : 'Asta'}</h2>
      ${pl(p.pid, `<span class="muted">valore ${g.money(g.nominal(p.pid))}</span>`)}
      <div class="bid">${p.bidder == null ? 'Nessuna offerta' : `${dot(p.bidder)} ${esc(s.managers[p.bidder].name)}: ${g.money(p.high)}`}</div>
      <div class="muted">${p.half && p.lander === 0 ? 'Asta al 50%: se vinci paghi metà. ' : ''}${p.src === 'bank' ? 'Minimo 1½ volte il valore. ' : ''}Hai ${g.money(h.cash)}.</div>
      <div class="btns">${opts.map(v => btn(`Offri ${g.money(v)}`, { type: 'bid', amount: v })).join('')}</div>
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

// ---------- squad ----------
function squadHTML() {
  const m = s.managers[squadOf], lu = g.lineup(s, m), all = g.squad(s, m), xi = new Set(lu.xi);
  const chip = pid => pid == null ? `<div class="chip"><b>—</b></div>` : `<div class="chip"><b>${esc(surname(P(pid).name))}</b><span class="stars">${stars(P(pid).stars)}</span></div>`;
  const row = pos => lu.slots.filter(x => x.pos === pos).map(x => chip(x.pid)).join('');
  return `<div class="seg" style="margin-bottom:14px">${s.managers.map(o => btn(`${dot(o.i)} ${esc(o.name)}`, { view: o.i }, { cls: 'small' + (o.i === squadOf ? '' : ' alt') })).join('')}</div>
  <div class="card"><h2>${esc(m.name)}${m.bankrupt ? ' · in bancarotta' : ''}</h2><h3>${esc(D.TEAMS[m.club])}</h3>
  <div class="sums"><div class="sum"><b>${lu.def}</b><small>Difesa</small></div><div class="sum"><b>${lu.att}</b><small>Attacco</small></div><div class="sum"><b>${lu.def + lu.att}</b><small>Totale</small></div></div>
  ${lu.full ? '' : '<div class="notice" style="margin-top:10px">Non riesci a schierare un 4-3-3 completo: forza 0 e niente incasso!</div>'}
  <div class="pitch"><div class="line">${row('A')}</div><div class="line">${row('M')}</div><div class="line">${row('D')}</div><div class="line">${chip(lu.gk)}</div></div>
  <div class="muted" style="margin-top:10px">Cassa ${g.money(m.cash)} · Stipendi ${g.money(g.wages(s, m))} · Carte Immunità ${m.immunity}</div></div>
  <div class="card"><h2>Rosa · ${all.length} giocatori</h2>${all.sort((a, b) => 'GDMAU'.indexOf(P(a).pos) - 'GDMAU'.indexOf(P(b).pos) || P(b).stars - P(a).stars)
    .map(pid => pl(pid, xi.has(pid) ? '<span class="tag">titolare</span>' : '<span class="muted">riserva</span>', tagsFor(pid))).join('')}
  <p class="muted">La formazione migliore (4-3-3) viene scelta da sola. I jolly giocano ovunque; un jolly in porta vale 1 stella. Difesa = portiere + 4 difensori, Attacco = 3 centrocampisti + 3 attaccanti.</p></div>`;
}

// ---------- league ----------
function leagueHTML() {
  const rows = s.order || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], mgr = t => s.managers.find(m => m.club === t);
  const cups = [];
  if (s.fa) cups.push(s.fa.winner ? `🏆 Coppa Italia: ${esc(D.TEAMS[s.fa.winner])}` : `Coppa Italia: ${s.managers.filter(m => s.fa.slots.includes(m.club)).map(m => esc(m.name)).join(', ') || 'nessun allenatore'} ancora in corsa`);
  for (const k of ['EC', 'CWC', 'UEFA']) if (s.euro[k].ms.length || s.euro[k].winner != null)
    cups.push(`${D.COMP_NAME[k]}: ${s.euro[k].ms.map(i => esc(s.managers[i].name)).join(', ') || 'eliminati'}`);
  return `<div class="card"><h2>Serie A · stagione ${s.season}</h2><table><tr><th>#</th><th class="t">Squadra</th><th>G</th><th>V</th><th>N</th><th>P</th><th>DR</th><th>Pt</th></tr>
  ${rows.map((t, i) => { const r = s.table[t], m = mgr(t); return `<tr class="${m?.i === 0 ? 'me' : ''}"><td>${i + 1}</td><td class="t">${m ? dot(m.i) + ' ' : ''}${esc(D.TEAMS[t])}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.f - r.a > 0 ? '+' : ''}${r.f - r.a}</td><td><b>${r.pts}</b></td></tr>`; }).join('')}</table>
  <p class="muted">Vittoria ${s.points[0]} · pareggio ${s.points[1]} · sconfitta ${s.points[2]}. Dieci squadre, girone unico.</p></div>
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
    form = `<div class="card hero"><h2>${o.buy ? 'Offerta di acquisto' : 'Offerta di vendita'}</h2>${pl(o.pid, `<span class="muted">valore ${g.money(g.nominal(o.pid))}</span>`)}
      ${o.buy ? '' : `<label>A chi</label><select id="to">${cpus.map(m => `<option value="${m.i}">${esc(m.name)} · ${esc(D.TEAMS[m.club])}</option>`).join('')}</select>`}
      <label>Prezzo (€)</label><input id="price" type="number" inputmode="numeric" step="5000" min="5000" value="${g.nominal(o.pid) * (o.buy ? 2 : 1)}">
      <div class="btns"><button id="sendOffer">Invia offerta</button><button class="alt" id="cancelOffer">Annulla</button></div></div>`;
  }
  return `${s.notice ? `<div class="notice">${esc(s.notice)}</div>` : ''}
  ${can ? '' : '<div class="notice">Puoi fare mercato a inizio turno, prima di tirare il dado.</div>'}${form}
  <div class="card"><h2>Banca</h2><div class="muted">Giocatori venduti alla banca. Prezzo minimo 1½ volte il valore; gli altri allenatori possono rilanciare.</div>
  ${s.bank.length ? s.bank.map(pid => pl(pid, btn(`da ${g.money(Math.ceil(g.nominal(pid) * 1.5 / 5000) * 5000)}`, { type: 'bankBuy', pid }, { cls: 'small', dis: !can }))).join('') : '<p class="muted">La banca non ha giocatori.</p>'}</div>
  <div class="card"><h2>Compra da un allenatore</h2><div class="muted">${closed ? 'Mercato chiuso: si sono giocate le semifinali di coppa.' : 'Vende solo se il prezzo vale più di quanto il giocatore vale per lui.'}</div>
  ${cpus.map(m => `<div class="rhead">${dot(m.i)} ${esc(m.name)} · ${esc(D.TEAMS[m.club])}</div>` + g.squad(s, m).filter(p => s.owner[p] === m.i).map(pid =>
    pl(pid, `<button class="small" data-offer="buy" data-pid="${pid}" ${!can || closed ? 'disabled' : ''}>Offri</button>`)).join('')).join('')}</div>
  <div class="card"><h2>Vendi a un allenatore</h2>
  ${g.squad(s, h).filter(p => s.owner[p] === 0).map(pid => pl(pid, `<button class="small" data-offer="sell" data-pid="${pid}" ${!can || closed ? 'disabled' : ''}>Offri</button>`)).join('')}</div>`;
}

// ---------- ratings ----------
function ratingsHTML(final = false) {
  const rows = [...s.managers].sort((a, b) => (b.bankrupt ? -1 : g.gamePoints(s, b)) - (a.bankrupt ? -1 : g.gamePoints(s, a)));
  const t = `<table><tr><th class="t">Allenatore</th><th>Camp.</th><th>CI</th><th>Eur</th><th>Cassa</th><th>Tot</th></tr>
  ${rows.map(m => `<tr class="${m.i === 0 ? 'me' : ''}"><td class="t">${dot(m.i)} ${esc(m.name)}<br><span class="muted">${esc(D.TEAMS[m.club])} · ${g.money(m.cash)}</span></td>
  <td>${m.k1 + (s.leagueStarted ? g.leaguePoints(s.pos[m.club]) : 0)}</td><td>${m.k2}</td><td>${m.k3}</td><td>${m.k7}</td><td><b>${m.bankrupt ? '—' : g.gamePoints(s, m)}</b></td></tr>`).join('')}</table>
  <p class="muted">Punti partita: piazzamento in campionato (1° = 15 … 10° = 1, sommati ogni stagione), turni di coppa vinti, e alla fine 1 punto ogni €50.000 in cassa.</p>`;
  return final ? t : `<div class="card"><h2>Classifica allenatori</h2>${t}</div>`;
}

function render() {
  if (!s) return setup();
  const h = me();
  if (s.pending?.type === 'results') s.lastResults = s.pending.lines;
  const tabs = { play: ['🎲', 'Gioca'], squad: ['👕', 'Rosa'], league: ['🏆', 'Serie A'], market: ['💶', 'Mercato'], ratings: ['⭐', 'Punti'] };
  const body = { play: () => pendingHTML() + boardHTML() + '<div style="height:14px"></div>' + feedHTML(), squad: squadHTML, league: leagueHTML, market: marketHTML, ratings: () => ratingsHTML() }[tab]();
  const waiting = s.pending && s.pending.type !== 'roll' && tab !== 'play' ? `<div class="notice">C'è una decisione da prendere in “Gioca”.</div>` : '';
  app.innerHTML = `<header><div class="hrow"><div class="crest" style="background:${COLORS[0]};color:#2a2000">${esc(D.TEAMS[h.club].slice(0, 3).toUpperCase())}</div>
    <div class="club"><b>${esc(D.TEAMS[h.club])}</b><small>${esc(h.name)} · Stagione ${s.season}/${s.seasons} · ${s.finished ? 'finita' : esc(g.weekLabel(s))}</small></div></div>
    <div class="pills"><span class="pill gold">${g.money(h.cash)}</span><span class="pill">${g.gamePoints(s, h)} punti</span><span class="pill">${s.pos[h.club]}° in classifica</span></div></header>
  <main>${waiting}${body}</main>
  <nav>${Object.entries(tabs).map(([k, [ic, v]]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}"><span>${ic}</span>${v}</button>`).join('')}</nav>`;
}

app.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || b.disabled) return;
  if (b.dataset.tab) { tab = b.dataset.tab; s.notice = null; offer = null; render(); window.scrollTo(0, 0); return; }
  if (b.dataset.offer) { offer = { pid: +b.dataset.pid, buy: b.dataset.offer === 'buy' }; s.notice = null; render(); window.scrollTo(0, 0); return; }
  if (b.id === 'cancelOffer') { offer = null; render(); return; }
  if (b.id === 'sendOffer') {
    const price = +document.getElementById('price').value, to = +(document.getElementById('to')?.value ?? 0);
    g.act(s, offer.buy ? { type: 'buyOffer', pid: offer.pid, price } : { type: 'sellOffer', pid: offer.pid, to, price });
    offer = null; save(); render(); window.scrollTo(0, 0); return;
  }
  const a = JSON.parse(b.dataset.a || 'null');
  if (!a) return;
  if (a.view != null) { squadOf = a.view; render(); return; }
  if (a.type === 'new') { if (!confirmNew) { confirmNew = true; render(); return; } confirmNew = false; s = null; save(); render(); return; }
  if (a.type === 'bankBuy') tab = 'play';
  send(a);
});

s = await load();
render();
