# Citizenship short, VERSION 1 (Full light)

Story folder: `src/videos/03_citizenship/`. Voice: `public/03_citizenship/voice.mp3` (67.5 s, prepared from your japan_mp3.mpeg).

## Run it on your computer (needs Node.js LTS)
Mac: double-click `render.command` -> pick `03_citizenship` -> light 2 (Full) -> size 1 (Preview).
Any OS:
    npm install
    npm run gates          # paste the output to Claude if anything says FAIL
    npm run preview:full   # -> out/preview_full.mp4
    npm run still:full     # one still

## What changed in the engine (also affects the pachinko short if you re-render it)
- Full faces: big shiny eyes (two glints), glints in the deadpan eyes, new emotions: joy, awe, teary, hopeful;
  sad / worried / proud now use shiny or teary eyes. Skin sheen + cheek blush on every head.
- New looks: kidhero (child you), clerk. Earlier: banker, oldman, mechanic, baker, hero, salaryman.

## Audio prep (done)
Lead silence trimmed, pauses cut to 0.1-0.24 s, ONLY the three hook lines sped up 1.45x (pitch kept) -> hook speech ends at 3.7 s.
Want a true 3.0 s hook? change TEMPO to 1.7 or send a faster re-recording of the first three lines.

## Honest status
- NOT rendered and NOT gate-checked: the build sandbox has no network. Syntax/type scan is clean.
- Word timings are APPROXIMATE (spread over the speech phrases), so captions / pops can be off by tenths of a second.
- Reflections are FAKE (glossy tile sheen + streaks, chrome material), not true mirrors.
- Likely first fixes: camera angles/occlusion in the office and map cells, density of detail, light balance.
