# Reference code — a working mini studio (Three.js + @react-three/fiber + Remotion, TypeScript)
Tested: installs, type-checks, passes the checkers and renders the example video.

## Run it
1. Install Node.js (LTS) from nodejs.org.
2. Mac: double-click `render.command` (installs once, runs the checks, asks LIGHT: Lite / Full / Both, renders to `out/`).
   Any OS: `npm install` → `npm run gates` → `npm run still` (one frame, Lite) / `npm run still:full` → `npm run preview` / `npm run preview:full`.
   Windows: set the light with `set REMOTION_LOOK=full` before the npx command.
3. Edit live: `npm run studio`.
Rendering happens on your own computer (fast). Don't render on a cloud machine.

## Make your own video
Copy `src/videos/01_example` to `src/videos/02_my_story`, then edit:
timeline.ts (words + shots; generated from your voice with `src/engine/tools/timeline.py`), stage.ts (who stands where),
takes.ts (camera), set.tsx (which sets/props), look.ts (story mood). Then run render.command and pick it.

| path | what |
|---|---|
| src/engine/chars/charparts.ts | 20 characters (LOOKS, SHAPES), body parts, faces, 16 expressions |
| src/engine/chars/rig.tsx | character rig: poses, walk, grips (cart handle), carrying, gaze, mouth |
| src/engine/kits/grocery/store.tsx | grocery interior + shop front + shopping cart + extras |
| src/engine/kits/downtown/* | 1930s street block (28 shops), cars, parking meters, street clock |
| src/engine/look/draw.ts | procedural textures (brick, tiles, wallpaper, signs, labels, coins, clock…) |
| src/engine/look/look.ts, premium.ts, ink.ts | Premium light + colour (Lite): sun shadows over the whole frame, grade, sunsets, AO (off on faces), outlines |
| src/engine/chars_full/* | Full light: sun-following ball face shading, brush line weight, wedge brows, black glasses (swapped in when REMOTION_LOOK=full) |
| src/engine/render/Video.tsx | Render: lights, post chain (AO > bloom > ink > lens > tone > colour > grade > grain), captions |
| src/engine/core/* | clock (shots/words → frames), staging (paths, cars, seats, auto-gaze) |
| src/engine/camera/* | framing solver + continuous camera "takes" |
| src/engine/check/* | logic checker, framing checker, hard gates |
| src/engine/tools/* | timeline.py (voice words → timeline), sheet.py (contact sheets), align.py, sbs.py |

Light tiers: see `../references/08_PREMIUM_LIGHT.md`.
