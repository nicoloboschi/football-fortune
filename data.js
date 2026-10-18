// Game data. Rules and structure come from the original Brian Clough's Football Fortunes (CDS 1987):
// board, wages chart, squad table, calendar, cup points and card effects are the original ones.
// Players, clubs and texts are an Italian version: iconic Serie A players of the last 20 years,
// with the same number of players per position and star rating as the original card pack.

// [stars, name, iconic club, look]. look = skin 1-6, hair (s short, h buzz, l long, b bald, c curly, m mohawk,
// p ponytail), hair colour (k black, b brown, y blond, g grey), beard 0-2. Drawn by art.js.
const CARDS = {
  G: [[5, 'Gianluigi Buffon', 'JUV', '2sb1'], [4, 'Samir Handanovič', 'INT', '1hb1'], [4, 'Gianluigi Donnarumma', 'MIL', '2sk1'],
    [3, 'Júlio César', 'INT', '3hk1'], [3, 'Wojciech Szczęsny', 'JUV', '1sb1'], [3, 'Mike Maignan', 'MIL', '5hk2'],
    [3, 'Dida', 'MIL', '6hk0'], [2, 'Christian Abbiati', 'MIL', '2sb0'], [2, 'Salvatore Sirigu', 'TOR', '2sk2'],
    [2, 'Mattia Perin', 'GEN', '1sb2'], [1, 'Marco Storari', 'JUV', '2bg1']],
  D: [[5, 'Fabio Cannavaro', 'JUV', '3hk0'], [5, 'Alessandro Nesta', 'MIL', '2sk1'], [5, 'Giorgio Chiellini', 'JUV', '2sk2'],
    [5, 'Kalidou Koulibaly', 'NAP', '6hk1'], [4, 'Paolo Maldini', 'MIL', '2lk0'], [4, 'Leonardo Bonucci', 'JUV', '2sk1'],
    [4, 'Andrea Barzagli', 'JUV', '2hb1'], [4, 'Thiago Silva', 'MIL', '4hk1'], [4, 'Lúcio', 'INT', '4bk0'],
    [4, 'Milan Škriniar', 'INT', '1sb1'], [4, 'Theo Hernández', 'MIL', '3sk1'], [3, 'Walter Samuel', 'INT', '3lk1'],
    [3, 'Alessandro Bastoni', 'INT', '1sb0'], [3, 'Marco Materazzi', 'INT', '2bk1'], [3, 'Matthijs de Ligt', 'JUV', '1sy0'],
    [3, 'Kostas Manolas', 'ROM', '2hk2'], [3, 'Gleison Bremer', 'TOR', '5hk1'], [3, 'Giovanni Di Lorenzo', 'NAP', '2sb1'],
    [2, 'Cafu', 'MIL', '6bk0'], [2, 'Chris Smalling', 'ROM', '5hk1'], [2, 'Alessio Romagnoli', 'MIL', '1sb1'],
    [2, 'Francesco Acerbi', 'LAZ', '1bg2'], [2, 'Medhi Benatia', 'ROM', '4hk2'], [2, 'Fikayo Tomori', 'MIL', '5ck0'],
    [2, 'Federico Dimarco', 'INT', '2sb2'], [1, 'Andrea Ranocchia', 'INT', '2sk2'], [1, 'Cristián Zapata', 'MIL', '5hk0'],
    [1, 'Davide Astori', 'FIO', '2sk2'], [1, 'Philippe Mexès', 'ROM', '2mk1']],
  M: [[5, 'Andrea Pirlo', 'MIL', '2lk2'], [5, 'Kaká', 'MIL', '3sk0'], [5, 'Wesley Sneijder', 'INT', '1sy0'],
    [5, 'Paul Pogba', 'JUV', '6my0'], [4, 'Gennaro Gattuso', 'MIL', '2sk2'], [4, 'Arturo Vidal', 'JUV', '4mk1'],
    [4, 'Claudio Marchisio', 'JUV', '2sk1'], [4, 'Marek Hamšík', 'NAP', '1mk0'], [4, 'Sergej Milinković-Savić', 'LAZ', '1sb1'],
    [3, 'Miralem Pjanić', 'JUV', '2sk1'], [3, 'Esteban Cambiasso', 'INT', '2bk0'], [3, 'Clarence Seedorf', 'MIL', '5hk0'],
    [3, 'Nicolò Barella', 'INT', '2sb1'], [3, 'Marcelo Brozović', 'INT', '1sb1'], [3, 'Dejan Stanković', 'INT', '2sk1'],
    [2, 'Jorginho', 'NAP', '2sk2'], [2, 'Allan', 'NAP', '4sk2'], [2, 'Franck Kessié', 'MIL', '6hk1'],
    [2, 'Hakan Çalhanoğlu', 'INT', '2sk2'], [2, 'Sandro Tonali', 'MIL', '1lb0'], [2, 'Stanislav Lobotka', 'NAP', '1hb1'],
    [1, 'Riccardo Montolivo', 'FIO', '2sb1'], [1, 'Sulley Muntari', 'INT', '6hk0'], [1, 'Felipe Melo', 'JUV', '4sk1'],
    [1, 'Andrea Poli', 'SAM', '2sk1']],
  A: [[5, 'Francesco Totti', 'ROM', '2sb0'], [5, 'Zlatan Ibrahimović', 'MIL', '3pk2'], [5, 'Gonzalo Higuaín', 'NAP', '3sk1'],
    [5, 'Cristiano Ronaldo', 'JUV', '3sk0'], [4, 'Alessandro Del Piero', 'JUV', '2sk0'], [4, 'Diego Milito', 'INT', '3lk1'],
    [4, "Samuel Eto'o", 'INT', '6hk0'], [4, 'Lautaro Martínez', 'INT', '3sk1'], [4, 'Victor Osimhen', 'NAP', '6my0'],
    [3, 'Edinson Cavani', 'NAP', '3lk2'], [3, 'Ciro Immobile', 'LAZ', '2sk2'], [3, 'Paulo Dybala', 'JUV', '2sk1'],
    [3, 'Carlos Tevez', 'JUV', '3sk0'], [3, 'Khvicha Kvaratskhelia', 'NAP', '1lb0'], [3, 'Filippo Inzaghi', 'MIL', '2sk0'],
    [2, 'Antonio Di Natale', 'UDI', '2sk0'], [2, 'Romelu Lukaku', 'INT', '6hk1'], [2, 'Mauro Icardi', 'INT', '2sk1'],
    [2, 'Lorenzo Insigne', 'NAP', '2sk1'], [2, 'Dries Mertens', 'NAP', '1sy0'], [2, 'Luca Toni', 'FIO', '2lk2'],
    [1, 'Giampaolo Pazzini', 'SAM', '2sk0'], [1, 'Marco Borriello', 'GEN', '2sk1'], [1, 'Alessandro Matri', 'CAG', '2sk1'],
    [1, 'Alberto Gilardino', 'FIO', '2sk1']],
  U: [[5, 'Javier Zanetti', 'INT', '3sk0'], [5, 'Daniele De Rossi', 'ROM', '2sy2'], [5, 'Pavel Nedvěd', 'JUV', '1ly0'],
    [4, 'Gianluca Zambrotta', 'JUV', '2sk0'], [4, 'Juan Cuadrado', 'JUV', '5mk0'], [4, 'Radja Nainggolan', 'ROM', '4mk1'],
    [3, 'Maicon', 'INT', '5hk0'], [3, 'Stephan Lichtsteiner', 'JUV', '1sb0'], [3, 'Alessandro Florenzi', 'ROM', '2sk1'],
    [3, 'Rafael Leão', 'MIL', '5ck0'], [3, 'Antonio Candreva', 'LAZ', '2sk2'], [2, 'Ivan Perišić', 'INT', '1sb1'],
    [2, 'Giacomo Bonaventura', 'MIL', '2sk2'], [2, 'Goran Pandev', 'INT', '2hk1'], [2, 'Alejandro Gómez', 'ATA', '2sk1'],
    [2, 'Federico Chiesa', 'FIO', '2sb0'], [1, 'Matteo Darmian', 'INT', '2sk1'], [1, 'Mattia De Sciglio', 'MIL', '2sk0'],
    [1, 'Federico Bernardeschi', 'FIO', '2lb2'], [1, 'Stephan El Shaarawy', 'ROM', '4mk0'], [1, 'Simone Pepe', 'JUV', '2sk1']],
};
const CLUB = { JUV: 1, INT: 2, MIL: 3, NAP: 4, ROM: 5, LAZ: 6, ATA: 7, FIO: 8, BOL: 9, TOR: 10, GEN: 11, SAM: 12, UDI: 13, CAG: 16 };
export const PLAYERS = Object.entries(CARDS).flatMap(([pos, list]) => list.map(([stars, name, club, look]) => ({ pos, stars, name, club: CLUB[club], look })))
  .map((p, id) => ({ id, ...p }));
export const POS_NAME = { G: 'Portiere', D: 'Difensore', M: 'Centrocampista', A: 'Attaccante', U: 'Jolly' };
export const POS_SHORT = { G: 'P', D: 'D', M: 'C', A: 'A', U: 'J' };

// 1-10 Serie A, 11-40 Coppa Italia only (31-40 Serie C, the giant killers), 41-80 European clubs
// European tiers follow the original: 41-50 average, 51-70 weaker, 71-80 strongest.
export const TEAMS = [null, 'Juventus', 'Inter', 'Milan', 'Napoli', 'Roma', 'Lazio', 'Atalanta', 'Fiorentina',
  'Bologna', 'Torino', 'Genoa', 'Sampdoria', 'Udinese', 'Sassuolo', 'Hellas Verona', 'Cagliari', 'Parma', 'Empoli',
  'Lecce', 'Monza', 'Palermo', 'Bari', 'Brescia', 'Cremonese', 'Spezia', 'Venezia', 'Pisa', 'Salernitana',
  'Frosinone', 'Catanzaro', 'Triestina', 'Foggia', 'Padova', 'Vicenza', 'Avellino', 'Pescara', 'Perugia', 'Catania',
  'Ternana', 'Reggina', 'Porto', 'Borussia Dortmund', 'Lione', 'Siviglia', 'Benfica', 'Ajax', 'Bayer Leverkusen',
  'Celtic', 'PSV', 'Galatasaray', 'Fenerbahçe', 'Olympiacos', 'Dinamo Zagabria', 'Stella Rossa', 'Shakhtar',
  'Dinamo Kiev', 'Salisburgo', 'Club Brugge', 'Copenaghen', 'Basilea', 'Feyenoord', 'Sporting Lisbona', 'Braga',
  'Rangers', 'Young Boys', 'Slavia Praga', 'Ferencváros', 'Malmö', 'Marsiglia', 'Monaco', 'Real Madrid',
  'Barcellona', 'Bayern Monaco', 'Manchester City', 'Liverpool', 'PSG', 'Chelsea', 'Manchester United',
  'Atlético Madrid', 'Arsenal'];
// Starting XI shown for Serie A clubs run by the computer (not cards: they never trade).
// Order: keeper, 4 defenders, 3 midfielders, 3 attackers, best first in each line.
// Their stars are dealt each season so that they add up to the club's Defence and Attack.
export const CLUB_XI = [null,
  ['Neto', 'Danilo', 'Alex Sandro', 'Martín Cáceres', 'Zdeněk Grygera', 'Mauro Camoranesi', 'Sami Khedira', 'Adrien Rabiot', 'Mario Mandžukić', 'Álvaro Morata', 'Fernando Llorente'],
  ['Francesco Toldo', 'Iván Córdoba', 'Stefan de Vrij', 'Cristian Chivu', 'Denzel Dumfries', 'Patrick Vieira', 'Thiago Motta', 'Henrikh Mkhitaryan', 'Adriano', 'Marcus Thuram', 'Rodrigo Palacio'],
  ['Marco Amelia', 'Kakha Kaladze', 'Davide Calabria', 'Ignazio Abate', 'Daniele Bonera', 'Massimo Ambrosini', 'Ismaël Bennacer', 'Kevin-Prince Boateng', 'Olivier Giroud', 'Alexandre Pato', 'Robinho'],
  ['Morgan De Sanctis', 'Raúl Albiol', 'Paolo Cannavaro', 'Faouzi Ghoulam', 'Christian Maggio', 'Piotr Zieliński', 'Walter Gargano', 'Blerim Džemaili', 'Ezequiel Lavezzi', 'José Callejón', 'Arkadiusz Milik'],
  ['Alisson', 'Juan', 'Christian Panucci', 'Aleksandar Kolarov', 'Gianluca Mancini', 'Lorenzo Pellegrini', 'David Pizarro', 'Simone Perrotta', 'Mohamed Salah', 'Edin Džeko', 'Mirko Vučinić'],
  ['Federico Marchetti', 'Ştefan Radu', 'Adam Marušić', 'Senad Lulić', 'Giuseppe Biava', 'Luis Alberto', 'Lucas Biglia', 'Cristian Ledesma', 'Miroslav Klose', 'Felipe Anderson', 'Tommaso Rocchi'],
  ['Marco Sportiello', 'Rafael Tolói', 'Berat Djimsiti', 'José Luis Palomino', 'Hans Hateboer', 'Teun Koopmeiners', 'Marten de Roon', 'Remo Freuler', 'Josip Iličić', 'Duván Zapata', 'Ademola Lookman'],
  ['Sébastien Frey', 'Nikola Milenković', 'Dario Dainelli', 'Per Krøldrup', 'Manuel Pasqual', 'Borja Valero', 'Matías Vecino', 'Marco Benassi', 'Dušan Vlahović', 'Adrian Mutu', 'Giuseppe Rossi'],
  ['Łukasz Skorupski', 'Riccardo Calafiori', 'Sam Beukema', 'Lorenzo De Silvestri', 'Adama Soumaoro', 'Lewis Ferguson', 'Gary Medel', 'Diego Pérez', 'Joshua Zirkzee', 'Marco Di Vaio', 'Riccardo Orsolini'],
  ['Vanja Milinković-Savić', 'Kamil Glik', 'Angelo Ogbonna', 'Nicolas Nkoulou', 'Cristian Molinaro', 'Daniele Baselli', 'Tomás Rincón', 'Saša Lukić', 'Andrea Belotti', 'Alessio Cerci', 'Fabio Quagliarella']];

// Kit colours per club, used for badges and shirts: [main, second, pattern]
// pattern: s stripes, h halves, p plain, b chest band, o hoops, v centre stripe
export const KITS = [null,
  ['#ffffff', '#111111', 's'], ['#0a4ea3', '#111111', 's'], ['#d71920', '#111111', 's'], ['#12a0d7', '#ffffff', 'p'],
  ['#8e1f2f', '#f0bc42', 'p'], ['#87d3f2', '#ffffff', 'p'], ['#1e71b8', '#111111', 's'], ['#5b2a86', '#ffffff', 'p'],
  ['#1a2f48', '#a21c26', 's'], ['#8a1e03', '#ffffff', 'p'], ['#a2192c', '#002c5f', 'h'], ['#1b5497', '#ffffff', 'b'],
  ['#ffffff', '#111111', 's'], ['#00a752', '#111111', 's'], ['#002f6c', '#ffd200', 'p'], ['#a6192e', '#002350', 'h'],
  ['#ffffff', '#111111', 'b'], ['#005baa', '#ffffff', 'p'], ['#e30613', '#ffd400', 's'], ['#e2001a', '#ffffff', 'b'],
  ['#f4a7b9', '#111111', 'p'], ['#ffffff', '#d71920', 'b'], ['#0050a5', '#ffffff', 'b'], ['#c8102e', '#a3a3a3', 's'],
  ['#ffffff', '#111111', 'p'], ['#111111', '#f47b20', 'b'], ['#111111', '#1b3f8f', 's'], ['#7b1e3a', '#ffffff', 'p'],
  ['#ffd200', '#0047ab', 'p'], ['#ffd200', '#c8102e', 'h'], ['#c8102e', '#ffffff', 'p'], ['#c8102e', '#111111', 's'],
  ['#ffffff', '#c8102e', 'b'], ['#ffffff', '#c8102e', 's'], ['#00843d', '#ffffff', 'p'], ['#ffffff', '#0a6fb7', 's'],
  ['#c8102e', '#ffffff', 'p'], ['#c8102e', '#003da5', 's'], ['#c8102e', '#00843d', 's'], ['#8b1a2b', '#ffffff', 'p'],
  ['#0047ab', '#ffffff', 's'], ['#fde100', '#111111', 'p'], ['#ffffff', '#1d3c8f', 'b'], ['#ffffff', '#d71920', 'p'],
  ['#e30613', '#ffffff', 'p'], ['#ffffff', '#d2122e', 'v'], ['#e32221', '#111111', 'p'], ['#008a3e', '#ffffff', 'o'],
  ['#ed1c24', '#ffffff', 's'], ['#a90432', '#fdb912', 'h'], ['#163962', '#ffed00', 's'], ['#ed1c24', '#ffffff', 's'],
  ['#0d47a1', '#ffffff', 'p'], ['#d71920', '#ffffff', 's'], ['#f47b20', '#111111', 's'], ['#ffffff', '#1e5aa8', 'p'],
  ['#ffffff', '#d2122e', 'p'], ['#0074bf', '#111111', 's'], ['#ffffff', '#0d3b8e', 'p'], ['#d2122e', '#00205b', 'h'],
  ['#e30613', '#ffffff', 'h'], ['#008057', '#ffffff', 'o'], ['#d2122e', '#ffffff', 'p'], ['#1b458f', '#ffffff', 'p'],
  ['#fdd800', '#111111', 'p'], ['#d2122e', '#ffffff', 'h'], ['#00843d', '#ffffff', 's'], ['#7ec8f2', '#ffffff', 'p'],
  ['#ffffff', '#2faee0', 'p'], ['#e30613', '#ffffff', 'h'], ['#ffffff', '#f0c330', 'p'], ['#a50044', '#004d98', 's'],
  ['#dc052d', '#ffffff', 'p'], ['#6cabdd', '#ffffff', 'p'], ['#c8102e', '#ffffff', 'p'], ['#004170', '#da291c', 'v'],
  ['#034694', '#ffffff', 'p'], ['#da291c', '#ffffff', 'p'], ['#cb3524', '#ffffff', 's'], ['#ef0107', '#ffffff', 'p']];

// European opponents per competition (from the original program's draw table)
export const EURO_POOL = {
  EC: [41, 42, 43, 44, 69, 70, 71, 72, 73, 74],
  CWC: [45, 46, 47, 65, 66, 67, 68, 75, 76, 77],
  UEFA: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 78, 79, 80],
};

// 36 squares clockwise from START, read off the original board scans
const B = { S: 'START', L: 'ML', $: 'SPON', H: 'HALF', P: 'SP', W: 'WAGES', A: 'AUC', F: 'BANK', Z: 'SUNDAY', C: 'CRISIS' };
export const BOARD = 'SL$HPWALFZP$HWLAPFCL$ZPWALFHP$ALWZPF'.split('').map(c => B[c]);
export const SQUARE = {
  START: { label: 'Partenza', short: 'Via', icon: '⚽', color: '#eef1ea' },
  ML: { label: 'Fortuna', short: 'Fortuna', icon: '🤝', color: '#f08a3c' },
  SPON: { label: 'Sponsor', short: 'Sponsor', icon: '👕', color: '#f5d03b' },
  HALF: { label: 'Asta al 50%', short: 'Asta ½', icon: '½', color: '#86c5b5' },
  SP: { label: 'Problemi di formazione', short: 'Formaz.', icon: '📋', color: '#2f7fd0' },
  WAGES: { label: 'Stipendi', short: 'Stipendi', icon: '💶', color: '#5cae4c' },
  AUC: { label: 'Asta', short: 'Asta', icon: '🔨', color: '#6fb1a2' },
  BANK: { label: 'Banca', short: 'Banca', icon: '🏦', color: '#b2dcae' },
  SUNDAY: { label: 'Domenica', short: 'Riposo', icon: '😴', color: '#62a2b4' },
  CRISIS: { label: 'Crisi', short: 'Crisi', icon: '💥', color: '#de3a2f' },
};
// [max total star rating, wage bill]
export const WAGES = [[30, 25000], [35, 35000], [40, 50000], [50, 60000], [60, 80000], [70, 120000], [Infinity, 150000]];

// Starting squads (program DATA): keeper, defenders, midfielders, attackers, utilities
export const SQUAD_ROWS = [
  [3, '1332', '132', '233', '23'], [2, '4322', '412', '224', '31'], [4, '4114', '323', '431', '12'],
  [1, '4233', '243', '413', '42'], [2, '2332', '412', '422', '22'], [3, '3413', '233', '312', '14'],
  [2, '3422', '312', '432', '13'], [1, '4223', '422', '332', '21'], [2, '3224', '433', '124', '24'],
  [2, '3324', '322', '421', '33']];

// Season: 19 match weeks. L = league round, F = cup round, E = European round.
export const CALENDAR = [['L', 1], ['E', 1], ['L', 2], ['F', 1], ['L', 3], ['E', 2], ['L', 4], ['F', 2], ['L', 5],
  ['E', 3], ['L', 6], ['F', 3], ['L', 7], ['E', 4], ['L', 8], ['F', 4], ['L', 9], ['F', 5], ['E', 5]];
export const ROUND_NAMES = ['Primo turno', 'Secondo turno', 'Quarti di finale', 'Semifinale', 'Finale'];
export const CUP_TEAMS = [32, 16, 8, 4, 2];
// Game points per cup round won, and gate bonus (x1,000) per round: program matrix M()
export const CUP_POINTS = { FA: [0, 2, 2, 3, 4], UEFA: [0, 4, 4, 4, 3], CWC: [0, 6, 4, 5, 6], EC: [0, 10, 6, 7, 7] };
export const GATE_BONUS = { FA: [0, 1, 10, 20, 30], UEFA: [0, 1, 10, 20, 30], CWC: [0, 10, 20, 30, 40], EC: [0, 20, 30, 50, 70] };
export const COMP_NAME = { FA: 'Coppa Italia', EC: 'Coppa dei Campioni', CWC: 'Coppa delle Coppe', UEFA: 'Coppa UEFA' };

// Fortuna (Manager's Luck): amount > 0 receive, < 0 pay
export const LUCK = [
  ['I giocatori chiedono un premio pari al monte stipendi.', 'wages'],
  ["Sei costretto a comprare lo stadio: €300.000. Puoi vendere un giocatore a 1,5 volte il suo valore nominale.", 'ground'],
  ['Stadio venduto e preso in affitto: incassi €200.000.', 200000],
  ['Il commercialista trucca i conti e ti lascia un ammanco di €50.000. Paga!', -50000],
  ['Il club dei tifosi dona €75.000.', 75000],
  ['Arriva il pagamento di un vecchio trasferimento: incassi €40.000.', 40000],
  ['Lavori allo stadio: €60.000.', -60000],
  ['Scoperta una truffa dei bigliettai, ma troppo tardi: perdi €15.000.', -15000],
  ['Cartella delle tasse: €20.000.', -20000],
  ["Richiesta dell'IVA: €25.000.", -25000],
  ['Il club dei tifosi dona €40.000.', 40000],
  ['Venduto il campo di allenamento delle riserve: €100.000.', 100000],
  ['Venduta parte del parcheggio dello stadio: €50.000.', 50000],
  ['Finalmente il risarcimento per un giocatore infortunato: €55.000.', 55000],
  ['Il club si quota in Borsa: €300.000.', 300000],
  ['Diritti TV per una diretta: €10.000.', 10000],
  ['Lo sponsor della Serie A ti versa €30.000.', 30000],
  ['Vincita al Totocalcio: €20.000.', 20000],
  ['Ripartizione dei diritti TV: €10.000.', 10000],
  ['Le luci dello stadio vanno rifatte: €70.000.', -70000],
  ['Con le nuove luci lo stadio si usa anche di sera: €55.000 in più.', 55000],
  ['Salgono le vendite del programma: incassi €25.000.', 25000],
  ['Installato il campo sintetico: costa €85.000.', -85000],
  ["Buonuscita all'allenatore esonerato prima della fine del contratto: €20.000.", -20000],
  ['Ritiro precampionato a Miami: costa €30.000.', -30000],
  ['Partita a porte chiuse per indisciplina dei giocatori: perdi €30.000.', -30000],
  ['Il negozio del club fa un utile di €10.000.', 10000],
  ['Il riscaldamento sotto il prato salva partite e incassi: incassi €70.000.', 70000],
  ['Allenatore multato per comportamento antisportivo: €5.000.', -5000],
  ['Lo sponsor di maglia paga: €105.000.', 105000],
  ['Interessi sullo scoperto in banca: €20.000.', -20000],
  ['La banca chiede di rientrare dallo scoperto: €95.000.', -95000],
  ['Il tuo stadio ospita una semifinale di Coppa Italia: incassi €20.000.', 20000],
  ['Gli sky box rendono €50.000.', 50000],
  ['Straordinari dei magazzinieri: ti costano €5.000.', -5000],
  ['Gli abbonamenti vanno a ruba: €75.000.', 75000],
  ['Vendita dei biglietti della lotteria: incassi €35.000.', 35000],
  ['Contributo statale per gli stadi: €40.000.', 40000],
  ['Prestito senza interessi da un dirigente: €20.000.', 20000],
  ["Concerti estivi allo stadio: €25.000 d'incasso in più.", 25000],
].map(([text, effect]) => ({ text, effect }));

// Problemi di formazione (Selection Problems): [text, effect, position]
const SEL = [
  ...Array(4).fill(["Prendi il primo giocatore del mazzo dell'asta a parametro zero.", 'free']),
  ["Uno dei tuoi migliori giocatori viene venduto all'estero al doppio del suo valore nominale.", 'abroad'],
  ['Il tuo portiere titolare si lussa un dito: salta una partita.', 'out', 'G'],
  ['Il tuo miglior difensore si torce il ginocchio: salta una partita.', 'out', 'D'],
  ["Il tuo miglior centrocampista si stira l'inguine: salta una partita.", 'out', 'M'],
  ['Il tuo miglior attaccante si rompe lo zigomo: salta una partita.', 'out', 'A'],
  ...Array(2).fill(['Il tuo miglior difensore è diffidato e squalificato per una partita.', 'out', 'D']),
  ['Il tuo miglior attaccante è diffidato e squalificato per una partita.', 'out', 'A'],
  ['Il tuo miglior centrocampista è diffidato e squalificato per una partita.', 'out', 'M'],
  ['Perdi il tuo miglior portiere per infortunio.', 'lose', 'G'],
  ['Un portiere si ritira.', 'retire', 'G'],
  ...Array(3).fill(["I tifosi convincono dei giocatori a venire da te: asta a metà prezzo.", 'half']),
  ...Array(3).fill(['Immunità: il buon rapporto con lo spogliatoio ti permette di annullare un futuro Problema di formazione.', 'immunity']),
  ["Un vecchio accordo ti obbliga a offrire in prestito il tuo miglior portiere per almeno un quarto del suo valore nominale.", 'loan', 'G'],
  ["Un vecchio accordo ti obbliga a offrire in prestito il tuo miglior difensore per almeno un quarto del suo valore nominale, per una partita.", 'loan', 'D'],
  ["Un vecchio accordo ti obbliga a offrire in prestito il tuo miglior centrocampista per almeno un quarto del suo valore nominale, per una partita.", 'loan', 'M'],
  ["Un vecchio accordo ti obbliga a offrire in prestito il tuo miglior attaccante per almeno un quarto del suo valore nominale, per una partita.", 'loan', 'A'],
  ['Un incidente stradale ti priva dei tuoi due migliori giocatori.', 'crash'],
  ["Grazie ai buoni rapporti con un giocatore avversario in scadenza, puoi comprarlo al suo valore nominale.", 'buyOpp'],
  ['Perdi il tuo miglior difensore per infortunio.', 'lose', 'D'],
  ['Perdi il tuo miglior centrocampista per infortunio.', 'lose', 'M'],
  ['Perdi il tuo miglior attaccante per infortunio.', 'lose', 'A'],
  ['Un difensore si ritira.', 'retire', 'D'],
  ['Un centrocampista si ritira.', 'retire', 'M'],
  ['Un attaccante si ritira.', 'retire', 'A'],
  ['Un portiere va a scadenza e se ne va.', 'retire', 'G'],
  ['Un difensore va a scadenza e se ne va.', 'retire', 'D'],
  ['Un centrocampista va a scadenza e se ne va.', 'retire', 'M'],
  ['Un attaccante va a scadenza e se ne va.', 'retire', 'A'],
];
export const SELECTION = SEL.map(([text, effect, pos]) => ({ text, effect, pos }));
