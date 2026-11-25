# lantern-galley

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Alhazard29/lantern-galley/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Alhazard29/lantern-galley/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Lantern Galley is an original cooking game: one chef runs a night kitchen on a canal barge for a three-minute dinner service. Take ingredients from the pantry crates, chop them on the boards, sear them in the woks or boil them in the pot, build each bowl on the plating island and carry it to the pass before its ticket walks out. Six recipes share six ingredients, so one chopped pile can save two tickets if you plan your route round the island; tickets come faster as the evening goes on, and rush hour adds the four-part Captain's Feast. Everything is drawn in code on one canvas and every sound is synthesised with WebAudio: no image, font or audio files, no libraries, no build step.

Controls: WASD or the arrow keys to walk, Space (or E) to use the station you stand at, or click any station to walk there and use it. P pauses, M mutes.

## Run it

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts      # hands in game/, screenshots/ and dossier.json
python3 -m http.server 8080 -d game      # then open http://localhost:8080 in desktop Chrome
```

`index.html?scene=service` (also `plating`, `rush`, `summary`) opens a frozen moment reached by replaying real play through the game's own station code; the screenshots in `screenshots/` are unedited headless-Chrome renders of those pages.

---

<sub>Entered on [make.fun](https://make.fun/?ref=4zhb3zrh&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
