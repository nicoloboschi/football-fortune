// Game data from the original Brian Clough's Football Fortunes (CDS 1987):
// player cards from the board-game card list, everything else from the ZX Spectrum program.

const CARDS = {
  G: [[5, 'Ray Clemence'], [4, 'Neville Southall'], [4, 'Jim Leighton'], [3, 'Gary Bailey'], [3, 'Bruce Grobbelaar'],
    [3, 'Chris Turner'], [3, 'Chris Woods'], [2, 'Tony Coton'], [2, 'Phil Parkes'], [2, 'Martin Hodge'], [1, 'Bob Bolder']],
  D: [[5, 'Gary Stevens'], [5, "David O'Leary"], [5, 'Willie Miller'], [5, 'Terry Butcher'], [4, 'Arthur Albiston'],
    [4, 'Alvin Martin'], [4, 'Kevin Ratcliffe'], [4, 'Alex McLeish'], [4, 'Mark Wright'], [4, 'Viv Anderson'],
    [4, 'Alan Hansen'], [3, 'Graham Roberts'], [3, 'Terry Fenwick'], [3, 'Derek Mountfield'], [3, 'Chris Hughton'],
    [3, 'Barry Venison'], [3, 'Dave Watson'], [3, 'David Neary'], [2, 'Steve Wicks'], [2, 'Kevin Moran'],
    [2, 'Mal Donaghy'], [2, 'Steve Foster'], [2, 'Pat Van den Hauwe'], [2, 'Colin Pates'], [2, 'John Gidman'],
    [1, 'Shaun Elliott'], [1, 'Mel Sterland'], [1, 'Alan Kennedy'], [1, 'Chris Fairclough']],
  M: [[5, 'Graeme Souness'], [5, 'Kenny Dalglish'], [5, 'Liam Brady'], [5, 'Peter Reid'], [4, 'Ray Wilkins'],
    [4, 'Ossie Ardiles'], [4, 'Ronnie Whelan'], [4, 'Trevor Steven'], [4, 'Gordon Strachan'], [3, 'John Wark'],
    [3, 'Steve McMahon'], [3, 'Alan Devonshire'], [3, 'Steve Hodge'], [3, 'Remi Moses'], [3, 'Kevin Sheedy'],
    [2, 'Brian Talbot'], [2, 'Paul Allen'], [2, 'Stewart Robson'], [2, 'Paul Bracewell'], [2, 'Graham Rix'],
    [2, 'Gordon Cowans'], [1, 'Tony Galvin'], [1, 'Mike Hazard'], [1, 'Sammy Lee'], [1, 'Eric Gates']],
  A: [[5, 'Peter Beardsley'], [5, 'Gary Lineker'], [5, 'Mark Hughes'], [5, 'Ian Rush'], [4, 'Graeme Sharp'],
    [4, 'David Speedie'], [4, 'Frank McAvennie'], [4, 'Kerry Dixon'], [4, 'Charlie Nicholas'], [3, 'Steve Archibald'],
    [3, 'John Barnes'], [3, 'Trevor Francis'], [3, 'Paul Sturrock'], [3, 'Jesper Olsen'], [3, 'Mark Hateley'],
    [2, 'Tony Cottee'], [2, 'Nigel Clough'], [2, 'Gary Bannister'], [2, 'Clive Allen'], [2, 'Alan Gray'],
    [2, 'Maurice Johnston'], [1, 'John Aldridge'], [1, 'Steve Moran'], [1, 'Terry Gibson'], [1, 'Luther Blissett']],
  U: [[5, 'Mark Lawrenson'], [5, 'Gary Stevens'], [5, 'Norman Whiteside'], [4, 'Steve Nicol'], [4, 'Richard Gough'],
    [4, 'Colin Gibson'], [3, 'Craig Johnston'], [3, 'Kevin Richardson'], [3, 'Johnny Metgod'], [3, 'Jan Molby'],
    [3, 'Paul McGrath'], [2, 'Adrian Heath'], [2, 'Frank Stapleton'], [2, 'Roy Aitken'], [2, 'Garry Birtles'],
    [2, 'Neale Cooper'], [1, 'Gary Mabbutt'], [1, 'Mick Holmes'], [1, 'David Armstrong'], [1, 'Paul Power'],
    [1, 'Mike Duxbury']],
};
export const PLAYERS = Object.entries(CARDS).flatMap(([pos, list]) => list.map(([stars, name]) => ({ pos, stars, name })))
  .map((p, id) => ({ id, ...p }));
export const POS_NAME = { G: 'Goalkeeper', D: 'Defender', M: 'Midfielder', A: 'Attacker', U: 'Utility' };

// 1-10 league, 11-40 FA Cup only (31-40 non-league), 41-80 European
export const TEAMS = [null, 'Liverpool', 'Everton', 'West Ham', 'Man Utd', 'Sheffield Wed', 'Arsenal', "Nott'm Forest",
  'Luton', 'Spurs', 'Newcastle', 'Watford', 'QPR', 'Southampton', 'Man City', 'Aston Villa', 'Coventry', 'Oxford',
  'Leicester', 'Norwich', 'Chelsea', 'Ipswich', 'Birmingham', 'West Brom', 'Portsmouth', 'Crystal Palace', 'Hull City',
  'Wimbledon', 'Millwall', 'Leeds', 'Derby County', 'Worcester City', 'Walthamstow', 'Yeovil', 'Hayes', 'Hereford Utd',
  'Orient', 'York City', 'Rotherham Utd', 'Middlesbrough', 'Doncaster Rvrs', 'FC Bruges', "B. M'gladbach", 'St Etienne',
  'Atl. Madrid', 'Panathinaikos', 'Feyenoord', 'AC Milan', 'Dynamo Tbilisi', 'Anderlecht', 'Celtic', 'Malmo',
  'Partizan Belgrade', 'Ein. Frankfurt', 'Standard Liege', 'Carl Zeiss Jena', 'Valencia', 'Sporting Lisbon',
  'F. Dusseldorf', 'Cork', 'Napoli', 'FC Magdeburg', 'Ferencvaros', 'Rangers', 'Real Zaragoza', 'Vitoria Setubal',
  'PSV Eindhoven', 'Ath. Bilbao', 'Twente', 'CSKA Sofia', 'Red Star Belgrade', 'Bayern Munich', 'Real Madrid',
  'Juventus', 'Barcelona', 'SV Hamburg', 'Ajax', 'Inter Milan', 'Benfica', 'Aberdeen', 'Dynamo Kiev'];
// European opponents per competition (from the program's draw table)
export const EURO_POOL = {
  EC: [41, 42, 43, 44, 69, 70, 71, 72, 73, 74],
  CWC: [45, 46, 47, 65, 66, 67, 68, 75, 76, 77],
  UEFA: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 78, 79, 80],
};

// 36 squares clockwise from START, read off the board scans
const B = { S: 'START', L: 'ML', $: 'SPON', H: 'HALF', P: 'SP', W: 'WAGES', A: 'AUC', F: 'BANK', Z: 'SUNDAY', C: 'CRISIS' };
export const BOARD = 'SL$HPWALFZP$HWLAPFCL$ZPWALFHP$ALWZPF'.split('').map(c => B[c]);
export const SQUARE = {
  START: { label: 'Start', short: 'Start', color: '#f4f1e6' }, ML: { label: "Manager's Luck", short: 'Luck', color: '#e8873a' },
  SPON: { label: 'Sponsorship', short: 'Sponsor', color: '#f2d43a' }, HALF: { label: '50% Auction', short: '½ Auction', color: '#8fc4b6' },
  SP: { label: 'Selection Problems', short: 'Selection', color: '#2f7fd0' }, WAGES: { label: 'Wages', short: 'Wages', color: '#5aa64a' },
  AUC: { label: 'Auction', short: 'Auction', color: '#76b0a3' }, BANK: { label: 'Bank Finance', short: 'Bank', color: '#a9d3a5' },
  SUNDAY: { label: 'Sunday', short: 'Sunday', color: '#5f9fb0' }, CRISIS: { label: 'Crisis', short: 'Crisis', color: '#d9332b' },
};
// [max total star rating, wage bill]
export const WAGES = [[30, 25000], [35, 35000], [40, 50000], [50, 60000], [60, 80000], [70, 120000], [Infinity, 150000]];

// Starting squads (program DATA): keeper, defenders, midfielders, attackers, utilities
export const SQUAD_ROWS = [
  [3, '1332', '132', '233', '23'], [2, '4322', '412', '224', '31'], [4, '4114', '323', '431', '12'],
  [1, '4233', '243', '413', '42'], [2, '2332', '412', '422', '22'], [3, '3413', '233', '312', '14'],
  [2, '3422', '312', '432', '13'], [1, '4223', '422', '332', '21'], [2, '3224', '433', '124', '24'],
  [2, '3324', '322', '421', '33']];

// Season: 19 match weeks. L = league round, F = FA Cup round, E = European round.
export const CALENDAR = [['L', 1], ['E', 1], ['L', 2], ['F', 1], ['L', 3], ['E', 2], ['L', 4], ['F', 2], ['L', 5],
  ['E', 3], ['L', 6], ['F', 3], ['L', 7], ['E', 4], ['L', 8], ['F', 4], ['L', 9], ['F', 5], ['E', 5]];
export const ROUND_NAMES = ['1st Round', '2nd Round', 'Quarter Final', 'Semi Final', 'Final'];
export const CUP_TEAMS = [32, 16, 8, 4, 2];
// Game points per cup round won, and gate bonus (x£1,000) per round: program matrix M()
export const CUP_POINTS = { FA: [0, 2, 2, 3, 4], UEFA: [0, 4, 4, 4, 3], CWC: [0, 6, 4, 5, 6], EC: [0, 10, 6, 7, 7] };
export const GATE_BONUS = { FA: [0, 1, 10, 20, 30], UEFA: [0, 1, 10, 20, 30], CWC: [0, 10, 20, 30, 40], EC: [0, 20, 30, 50, 70] };
export const COMP_NAME = { FA: 'FA Cup', EC: 'European Cup', CWC: 'Cup Winners Cup', UEFA: 'UEFA Cup' };

// Manager's Luck: amount > 0 receive, < 0 pay
export const LUCK = [
  ['Players demand a bonus equal to their wages payment.', 'wages'],
  ['Ground purchase forced on you: £300,000. You can sell one player at 1.5 times the nominal value.', 'ground'],
  ['Ground sold and leased back, receive £200,000.', 200000],
  ['Your accountant fiddles the books and leaves you with a discrepancy of £50,000. Pay up!', -50000],
  ['Supporters club makes a donation of £75,000.', 75000],
  ['Delayed payment from old transfer agreement, receive £40,000.', 40000],
  ['Ground improvements require £60,000.', -60000],
  ['Gatekeeper conspiracy uncovered but too late to prevent loss of £15,000.', -15000],
  ['Corporation tax demand £20,000.', -20000],
  ['VAT demand £25,000.', -25000],
  ['Supporters club donate £40,000.', 40000],
  ['Reserves training ground sold £100,000.', 100000],
  ['Part of ground car park sold £50,000.', 50000],
  ['Compensation at last for injured player £55,000.', 55000],
  ['Club is floated on the stock market £300,000.', 300000],
  ['Compensation for live T.V. coverage £10,000.', 10000],
  ['Sponsorship of the league now means you receive £30,000.', 30000],
  ['Pools shareout gives you £20,000.', 20000],
  ['T.V. pool shareout gives you £10,000.', 10000],
  ['Floodlights need improving £70,000.', -70000],
  ['Floodlights enable the ground to be used in the evening generating an extra £55,000.', 55000],
  ['Program sales increase, receive £25,000.', 25000],
  ['Astro turf installed, costs £85,000.', -85000],
  ['Compensation for previous manager fired before end of contract £20,000.', -20000],
  ['Pre-season training in Miami cost £30,000.', -30000],
  ['Team forced to play behind closed doors because of poor player discipline, lose £30,000.', -30000],
  ['Supporters club shop make a profit of £10,000.', 10000],
  ['Undersoil heating installed saves games and gate receipts, receive £70,000.', 70000],
  ['Manager fined for bringing game into disrepute £5,000.', -5000],
  ['Team sponsor pays up £105,000.', 105000],
  ['Bank interest on overdraft £20,000.', -20000],
  ['Bank demand repayment of the overdraft £95,000.', -95000],
  ['Club stage F.A. Cup semi-final, receive £20,000.', 20000],
  ['Luxury boxes bring in £50,000.', 50000],
  ['Groundstaff overtime costs you £5,000.', -5000],
  ['Early season ticket sales bring in £75,000.', 75000],
  ['Lottery ticket sales, receive £35,000.', 35000],
  ['Football Grounds Improvement Trust grant you £40,000.', 40000],
  ['Interest free loan from club director £20,000.', 20000],
  ['Summer use of stadium gives you £25,000 additional gate receipts.', 25000],
].map(([text, effect]) => ({ text, effect }));

// Selection Problems: [text, effect, position]
const SEL = [
  ...Array(4).fill(['Take the top player from the Auction Pile as a free transfer.', 'free']),
  ['One of your top players is sold abroad for twice his nominal value.', 'abroad'],
  ['Your No.1 keeper dislocates his finger and is out for one game.', 'out', 'G'],
  ['Your No.1 defender twists his knee and is out for one game.', 'out', 'D'],
  ['Your No.1 midfielder strains his groin and is out for one game.', 'out', 'M'],
  ['Your No.1 attacker breaks his cheekbone and is out for one game.', 'out', 'A'],
  ...Array(2).fill(['Your top defender reaches the point where he is automatically suspended from one game.', 'out', 'D']),
  ['Your top attacker reaches the point where he is automatically suspended from one game.', 'out', 'A'],
  ['Your top midfielder reaches the point where he is automatically suspended from one game.', 'out', 'M'],
  ['You lose your highest rated keeper through injury.', 'lose', 'G'],
  ['A keeper retires from your club.', 'retire', 'G'],
  ...Array(3).fill(['Friendly supporters encourage players to join the club. Half price auction.', 'half']),
  ...Array(3).fill(['Immunity - good relations with your players mean that you can play this against any Selection Problems you might get.', 'immunity']),
  ['Old agreement requires you to offer for loan your best keeper for a minimum of a quarter of his nominal value.', 'loan', 'G'],
  ['Old agreement requires you to offer for loan your best defender for a minimum of a quarter of his nominal value for one game.', 'loan', 'D'],
  ['Old agreement requires you to offer for loan your best midfielder for a minimum of a quarter of his nominal value for one game.', 'loan', 'M'],
  ['Old agreement requires you to offer for loan your best attacker for a minimum of a quarter of his nominal value for one game.', 'loan', 'A'],
  ['A car crash deprives you of your two best players.', 'crash'],
  ["Good relations with one of your opponent's players means that now his contract has expired you can buy him for his nominal value.", 'buyOpp'],
  ['You lose your highest rated defender through injury.', 'lose', 'D'],
  ['You lose your highest rated midfielder through injury.', 'lose', 'M'],
  ['You lose your highest rated attacker through injury.', 'lose', 'A'],
  ['A defender retires from your club.', 'retire', 'D'],
  ['A midfielder retires from your club.', 'retire', 'M'],
  ['An attacker retires from your club.', 'retire', 'A'],
  ['A keeper gets his freedom of contract and leaves.', 'retire', 'G'],
  ['A defender gets his freedom of contract and leaves.', 'retire', 'D'],
  ['A midfielder gets his freedom of contract and leaves.', 'retire', 'M'],
  ['An attacker gets his freedom of contract and leaves.', 'retire', 'A'],
];
export const SELECTION = SEL.map(([text, effect, pos]) => ({ text, effect, pos }));
