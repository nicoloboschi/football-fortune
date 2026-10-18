// Game data. Rules and structure come from the original Brian Clough's Football Fortunes (CDS 1987):
// board, wages chart, squad table, calendar, cup points and card effects are the original ones.
// Players, clubs and texts are an Italian version: iconic Serie A players of the last 20 years,
// with the same number of players per position and star rating as the original card pack.

const CARDS = {
  G: [[5, 'Gianluigi Buffon'], [4, 'Samir Handanovič'], [4, 'Gianluigi Donnarumma'], [3, 'Júlio César'],
    [3, 'Wojciech Szczęsny'], [3, 'Mike Maignan'], [3, 'Dida'], [2, 'Christian Abbiati'], [2, 'Salvatore Sirigu'],
    [2, 'Mattia Perin'], [1, 'Marco Storari']],
  D: [[5, 'Fabio Cannavaro'], [5, 'Alessandro Nesta'], [5, 'Giorgio Chiellini'], [5, 'Kalidou Koulibaly'],
    [4, 'Paolo Maldini'], [4, 'Leonardo Bonucci'], [4, 'Andrea Barzagli'], [4, 'Thiago Silva'], [4, 'Lúcio'],
    [4, 'Milan Škriniar'], [4, 'Theo Hernández'], [3, 'Walter Samuel'], [3, 'Alessandro Bastoni'],
    [3, 'Marco Materazzi'], [3, 'Matthijs de Ligt'], [3, 'Kostas Manolas'], [3, 'Gleison Bremer'],
    [3, 'Giovanni Di Lorenzo'], [2, 'Cafu'], [2, 'Chris Smalling'], [2, 'Alessio Romagnoli'], [2, 'Francesco Acerbi'],
    [2, 'Medhi Benatia'], [2, 'Fikayo Tomori'], [2, 'Federico Dimarco'], [1, 'Andrea Ranocchia'],
    [1, 'Cristián Zapata'], [1, 'Davide Astori'], [1, 'Philippe Mexès']],
  M: [[5, 'Andrea Pirlo'], [5, 'Kaká'], [5, 'Wesley Sneijder'], [5, 'Paul Pogba'], [4, 'Gennaro Gattuso'],
    [4, 'Arturo Vidal'], [4, 'Claudio Marchisio'], [4, 'Marek Hamšík'], [4, 'Sergej Milinković-Savić'],
    [3, 'Miralem Pjanić'], [3, 'Esteban Cambiasso'], [3, 'Clarence Seedorf'], [3, 'Nicolò Barella'],
    [3, 'Marcelo Brozović'], [3, 'Dejan Stanković'], [2, 'Jorginho'], [2, 'Allan'], [2, 'Franck Kessié'],
    [2, 'Hakan Çalhanoğlu'], [2, 'Sandro Tonali'], [2, 'Stanislav Lobotka'], [1, 'Riccardo Montolivo'],
    [1, 'Sulley Muntari'], [1, 'Felipe Melo'], [1, 'Andrea Poli']],
  A: [[5, 'Francesco Totti'], [5, 'Zlatan Ibrahimović'], [5, 'Gonzalo Higuaín'], [5, 'Cristiano Ronaldo'],
    [4, 'Alessandro Del Piero'], [4, 'Diego Milito'], [4, "Samuel Eto'o"], [4, 'Lautaro Martínez'],
    [4, 'Victor Osimhen'], [3, 'Edinson Cavani'], [3, 'Ciro Immobile'], [3, 'Paulo Dybala'], [3, 'Carlos Tevez'],
    [3, 'Khvicha Kvaratskhelia'], [3, 'Filippo Inzaghi'], [2, 'Antonio Di Natale'], [2, 'Romelu Lukaku'],
    [2, 'Mauro Icardi'], [2, 'Lorenzo Insigne'], [2, 'Dries Mertens'], [2, 'Luca Toni'], [1, 'Giampaolo Pazzini'],
    [1, 'Marco Borriello'], [1, 'Alessandro Matri'], [1, 'Alberto Gilardino']],
  U: [[5, 'Javier Zanetti'], [5, 'Daniele De Rossi'], [5, 'Pavel Nedvěd'], [4, 'Gianluca Zambrotta'],
    [4, 'Juan Cuadrado'], [4, 'Radja Nainggolan'], [3, 'Maicon'], [3, 'Stephan Lichtsteiner'],
    [3, 'Alessandro Florenzi'], [3, 'Rafael Leão'], [3, 'Antonio Candreva'], [2, 'Ivan Perišić'],
    [2, 'Giacomo Bonaventura'], [2, 'Goran Pandev'], [2, 'Alejandro Gómez'], [2, 'Federico Chiesa'],
    [1, 'Matteo Darmian'], [1, 'Mattia De Sciglio'], [1, 'Federico Bernardeschi'], [1, 'Stephan El Shaarawy'],
    [1, 'Simone Pepe']],
};
export const PLAYERS = Object.entries(CARDS).flatMap(([pos, list]) => list.map(([stars, name]) => ({ pos, stars, name })))
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
