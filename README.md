# Football Fortunes · Serie A

Browser remake of **Brian Clough's Football Fortunes** (CDS Software, 1987): you against computer managers.
Italian version: Serie A clubs, Coppa Italia, iconic Serie A players of the last 20 years. Phone-first, no build step.

```sh
./run.sh          # starts server.py + a Cloudflare quick tunnel, prints the public URL
node test.mjs     # plays 40 random full games and checks money/cards never break
```

The save is `state.json` (server side, plus a browser copy), so a new tunnel URL keeps your game.

## Where the rules come from
- Board (36 squares), wages chart: original board scans.
- 111 player cards: Serie A legends of the last 20 years, with exactly the original pack's count per position and star rating
  (so the economy and balance match the original).
- Match and gate formulas, computer club strengths per level, FA Cup / European draws, game points,
  all 40 Manager's Luck and 37 Selection Problem texts, 80 teams, starting squads:
  decoded from the ZX Spectrum program (BASIC + saved variables).

## Look
- Player cards with home-made cartoon players in their iconic club's shirt (`art.js`, inline SVG).
- Club badges are home-made from club colours and kit patterns, not the real crests.
- Every Serie A club shows real players: computer-run clubs get a real XI (`CLUB_XI`) whose stars are dealt
  to add up to the club's Defence and Attack, so the original strength rules are unchanged.

## Changes from the original
- Italian text, Serie A instead of the First Division, Coppa Italia instead of the FA Cup, modern European clubs
  (kept in the original's strength tiers), euros instead of pounds.
- Computer managers replace the other human players: they roll, bid, borrow and buy with simple rules.
- The computer keeps the money and picks your best 4-3-3 (the original made you do both by hand).
- Loans between managers only happen through Selection Problems cards; transfers are offers to a computer manager.
- Computer club strengths ignore a manager who cannot field a side (the original would set every club to 0).
