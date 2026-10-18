# Football Fortunes

Browser remake of **Brian Clough's Football Fortunes** (CDS Software, 1987): you against computer managers.
Phone-first, no build step.

```sh
./run.sh          # starts server.py + a Cloudflare quick tunnel, prints the public URL
node test.mjs     # plays 40 random full games and checks money/cards never break
```

The save is `state.json` (server side, plus a browser copy), so a new tunnel URL keeps your game.

## Where the rules come from
- Board (36 squares), wages chart: original board scans.
- 111 player cards: the original card list.
- Match and gate formulas, computer club strengths per level, FA Cup / European draws, game points,
  all 40 Manager's Luck and 37 Selection Problem texts, 80 teams, starting squads:
  decoded from the ZX Spectrum program (BASIC + saved variables).

## Changes from the original
- Computer managers replace the other human players: they roll, bid, borrow and buy with simple rules.
- The computer keeps the money and picks your best 4-3-3 (the original made you do both by hand).
- Loans between managers only happen through Selection Problems cards; transfers are offers to a computer manager.
- Computer club strengths ignore a manager who cannot field a side (the original would set every club to 0).
