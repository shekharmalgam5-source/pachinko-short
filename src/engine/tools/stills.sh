#!/bin/bash
# usage: ./stills.sh <outprefix> <frames comma> [comp] [entry]
P=$1; FR=$2; C=${3:-MemeChipsV3}; E=${4:-src/index.ts}
mkdir -p $(dirname $P)
npx remotion bundle $E --out-dir /tmp/bundle_$$ >/dev/null 2>&1 || { npx remotion bundle $E --out-dir /tmp/bundle_$$ 2>&1 | grep -i error | head; exit 1; }
for fr in ${FR//,/ }; do npx remotion still /tmp/bundle_$$ $C ${P}${fr}.jpg --frame=$fr --scale=${SCALE:-0.5} --timeout=240000 2>&1 | grep -iE "error" | head -3; done
rm -rf /tmp/bundle_$$
python3 - "$P" "$FR" <<'PY'
import sys; from PIL import Image
p,fr=sys.argv[1],sys.argv[2].split(',')
ims=[Image.open(f'{p}{f}.jpg').resize((270,480)) for f in fr]
S=Image.new('RGB',(270*len(ims),480)); [S.paste(im,(i*270,0)) for i,im in enumerate(ims)]; S.save(f'{p}sheet.jpg')
PY
