#!/bin/bash
# Double-click (Mac) -> pick a video -> checks -> pick the LIGHT -> render on YOUR computer (fast).
# Windows/Linux: run the same npx lines in a terminal (see CODE_README.md).
cd "$(dirname "$0")"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
if ! command -v node >/dev/null; then echo "Install Node.js (LTS) from https://nodejs.org, then run this again."; read -p "Press Enter"; exit 1; fi
[ -d node_modules/remotion ] || { echo "First run: installing (a few minutes)..."; npm install || { read -p "npm install failed. Press Enter"; exit 1; }; }
VIDS=($(ls -d src/videos/[0-9]*/ | xargs -n1 basename))
echo "Videos:"; for i in "${!VIDS[@]}"; do echo "  $((i+1))) ${VIDS[$i]}"; done
if [ ${#VIDS[@]} -eq 1 ]; then n=1; else read -p "Which video? " n; fi
export VIDEO=${VIDS[$((n-1))]}
echo "== checks =="; npx tsx --tsconfig src/videos/$VIDEO/tsconfig.json src/engine/check/gates.ts || { echo "CHECKS FAILED - send this window to Claude."; read -p "Press Enter"; exit 1; }
echo "LIGHT:  1) Lite  (soft premium light + colour)   2) Full  (Lite + face shading + brush line weight)   3) Both (to compare)"
read -p "Choose 1, 2 or 3: " lk
case "$lk" in 2) LOOKS="full";; 3) LOOKS="lite full";; *) LOOKS="lite";; esac
echo "SIZE:  1) Preview (540x960, fast)   2) Full HD (1080x1920)"; read -p "Choose 1 or 2: " c
if [ "$c" = "2" ]; then COMP=Video; SUF=full; else COMP=Preview; SUF=preview; fi
mkdir -p out
for L in $LOOKS; do
  export REMOTION_LOOK=$L
  F="out/${VIDEO}_${L}_${SUF}.mp4"; for x in b c d e f g h; do [ -e "$F" ] || break; F="out/${VIDEO}_${L}_${SUF}_$x.mp4"; done
  echo "== rendering $F =="
  npx remotion render src/index.ts $COMP "$F" --codec h264 --concurrency=2 && echo "Saved: $F"
done
open out 2>/dev/null
read -p "Done. Press Enter to close."
