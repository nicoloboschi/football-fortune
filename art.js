// Home-made club badges and cartoon players, drawn as inline SVG from club colours and a short look code.
// No real club crests or photos are used.
import * as D from './data.js';

let uid = 0;
const SKIN = [null, '#f7d7c0', '#efc29c', '#d9a273', '#b9804f', '#8d5a37', '#5c3a23'];
const HAIR = { k: '#1f1b18', b: '#5a3a22', y: '#e4c36a', g: '#9d9d9d' };

// shirt pattern inside a clip path; x,y,w,h is the area to fill
function pattern(kit, x, y, w, h) {
  const [c1, c2, p] = kit, r = (a, b, c, d, f) => `<rect x="${a}" y="${b}" width="${c}" height="${d}" fill="${f}"/>`;
  let out = r(x, y, w, h, c1);
  if (p === 's') for (let i = x + w / 10; i < x + w; i += w / 5) out += r(i, y, w / 10, h, c2);
  if (p === 'h') out += r(x + w / 2, y, w / 2, h, c2);
  if (p === 'b') out += r(x, y + h * 0.3, w, h * 0.18, c2);
  if (p === 'o') for (let i = y + h / 8; i < y + h; i += h / 4) out += r(x, i, w, h / 8, c2);
  if (p === 'v') out += r(x + w * 0.4, y, w * 0.2, h, c2);
  return out;
}

export function initials(team) {
  const n = D.TEAMS[team].replace(/[^\p{L} ]/gu, '').split(' ').filter(Boolean);
  return (n.length > 1 ? n.map(w => w[0]).join('').slice(0, 3) : n[0].slice(0, 3)).toUpperCase();
}

export function crest(team, size = 28) {
  if (!team || !D.KITS[team]) return '';
  const id = 'c' + (++uid), kit = D.KITS[team];
  const shield = 'M5 4 H43 V24 C43 38 32 46 24 50 C16 46 5 38 5 24 Z';
  return `<svg class="crest-svg" width="${size}" height="${size * 54 / 48}" viewBox="0 0 48 54" aria-label="${D.TEAMS[team]}">
  <defs><clipPath id="${id}"><path d="${shield}"/></clipPath></defs>
  <g clip-path="url(#${id})">${pattern(kit, 0, 0, 48, 54)}</g>
  <path d="${shield}" fill="none" stroke="#1a1a1a" stroke-width="2.4" stroke-linejoin="round"/>
  <rect x="9" y="17" width="30" height="13" rx="3" fill="#fff" stroke="#1a1a1a" stroke-width="1.2"/>
  <text x="24" y="27" text-anchor="middle" font-size="10" font-weight="900" font-family="system-ui, sans-serif" fill="#111">${initials(team)}</text></svg>`;
}

// cartoon footballer in his club's shirt; p is a player ({ club, look })
export function avatar(p) {
  const id = 'a' + (++uid), kit = D.KITS[p.club];
  const [skinN, style, hc, beard] = p.look;
  const skin = SKIN[+skinN], hair = HAIR[hc];
  const dark = c => ['#111111', '#1f1b18', '#002c5f', '#1a2f48', '#163962', '#002350', '#002f6c'].includes(c);
  const shorts = kit[0] === '#ffffff' ? '#111' : (dark(kit[1]) || kit[1] === '#ffffff' ? '#fff' : kit[1]);
  let hairSvg = '';
  const top = `<path d="M29 39 C27 20 38 13 50 13 C62 13 73 20 71 39 C68 29 60 25 50 25 C40 25 32 29 29 39Z" fill="${hair}"/>`;
  if (style === 's') hairSvg = top;
  if (style === 'h') hairSvg = `<path d="M30 36 C30 22 39 16 50 16 C61 16 70 22 70 36 C66 28 59 24 50 24 C41 24 34 28 30 36Z" fill="${hair}" opacity=".75"/>`;
  if (style === 'l') hairSvg = `<path d="M27 58 C24 40 26 14 50 13 C74 14 76 40 73 58 L68 58 C69 44 66 30 50 26 C34 30 31 44 32 58Z" fill="${hair}"/>` + top;
  if (style === 'b') hairSvg = `<path d="M30 42 C30 36 31 33 33 31 L33 40Z M70 42 C70 36 69 33 67 31 L67 40Z" fill="${hair}" opacity=".7"/>`;
  if (style === 'c') hairSvg = [[34, 22], [42, 16], [50, 14], [58, 16], [66, 22], [30, 30], [70, 30], [38, 19], [62, 19]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${hair}"/>`).join('');
  if (style === 'm') hairSvg = `<path d="M44 26 C44 16 46 8 50 7 C54 8 56 16 56 26Z" fill="${hair}"/><path d="M31 36 C31 28 34 24 38 22 L38 30Z M69 36 C69 28 66 24 62 22 L62 30Z" fill="${hair}" opacity=".5"/>`;
  if (style === 'p') hairSvg = `<circle cx="50" cy="10" r="6" fill="${hair}"/>` + top.replace('C40 25 32 29 29 39Z', 'C40 25 32 29 29 39Z').replace('M29 39', 'M30 38');
  const beardSvg = beard === '0' ? '' : `<path d="M31 42 C33 58 42 62 50 62 C58 62 67 58 69 42 C66 52 60 55 50 55 C40 55 34 52 31 42Z" fill="${hair}" opacity="${beard === '1' ? 0.35 : 0.95}"/>`;
  return `<svg class="avatar" viewBox="0 0 100 112" aria-hidden="true">
  <defs><clipPath id="${id}"><path d="M33 64 C33 58 39 56 50 56 C61 56 67 58 67 64 L66 86 L34 86Z"/></clipPath></defs>
  <ellipse cx="50" cy="106" rx="22" ry="4" fill="rgba(0,0,0,.14)"/>
  <rect x="40" y="88" width="7" height="14" rx="2" fill="#f4f4f4"/><rect x="53" y="88" width="7" height="14" rx="2" fill="#f4f4f4"/>
  <ellipse cx="43" cy="103" rx="6" ry="3" fill="#1d1d1d"/><ellipse cx="57" cy="103" rx="6" ry="3" fill="#1d1d1d"/>
  <rect x="35" y="80" width="30" height="12" rx="3" fill="${shorts}"/>
  <path d="M34 60 L24 76 L30 80 L37 70Z" fill="${kit[0]}" stroke="rgba(0,0,0,.15)"/><path d="M66 60 L76 76 L70 80 L63 70Z" fill="${kit[0]}" stroke="rgba(0,0,0,.15)"/>
  <circle cx="27" cy="80" r="4" fill="${skin}"/><circle cx="73" cy="80" r="4" fill="${skin}"/>
  <g clip-path="url(#${id})">${pattern(kit, 30, 54, 40, 34)}</g>
  <path d="M33 64 C33 58 39 56 50 56 C61 56 67 58 67 64 L66 86 L34 86Z" fill="none" stroke="rgba(0,0,0,.18)"/>
  <circle cx="30" cy="40" r="4" fill="${skin}"/><circle cx="70" cy="40" r="4" fill="${skin}"/>
  <circle cx="50" cy="38" r="21" fill="${skin}"/>
  ${beardSvg}${hairSvg}
  <ellipse cx="43" cy="40" rx="2.8" ry="3.4" fill="#1d1d1d"/><ellipse cx="57" cy="40" rx="2.8" ry="3.4" fill="#1d1d1d"/>
  <circle cx="44" cy="39" r=".9" fill="#fff"/><circle cx="58" cy="39" r=".9" fill="#fff"/>
  <circle cx="37" cy="46" r="3" fill="#f39a9a" opacity=".55"/><circle cx="63" cy="46" r="3" fill="#f39a9a" opacity=".55"/>
  <path d="M44 48 Q50 53 56 48" fill="none" stroke="#7a2e22" stroke-width="2" stroke-linecap="round"/></svg>`;
}
