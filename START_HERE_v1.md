# Pachinko short, VERSION 1 (Full light)

Built from the animated-shorts-kit. Story folder: `src/videos/02_pachinko/`. Voice: `public/02_pachinko/voice.mp3` (52.43 s).

## Run it on your computer (needs Node.js LTS)
Mac: double-click `render.command` -> pick `02_pachinko` -> light 2 (Full) -> size 1 (Preview).
Any OS:
    npm install
    npm run gates          # the checks (06_CHECKS). Paste the output to Claude if anything says FAIL.
    npm run preview:full   # -> out/preview_full.mp4 (540x960)
    npm run still:full     # one still, frame 60
(Windows: `REMOTION_LOOK=full` is unix syntax; use Git Bash/WSL, or render.command's npx lines.)

## What v1 honestly is
- NOT rendered and NOT gate-checked yet: the build sandbox has no network, so dependencies could not be installed.
  Code passes a syntax / type scan; framing and logic gates have never run.
- Word timings are APPROXIMATE (spread across the speech phrases of your audio), so captions and the popping prize items
  can be off by a few tenths of a second. Real word timings (Whisper) fix this in v2.
- The steel-ball bucket is a simple prop floating beside the person's hand; seated players use the side-view rig.
- Likely first fixes: camera azimuth/occlusion in the hall and alley, hero/clerk overlap at the counter.
