// usage: node stills.mjs <projectDir> <entry> <compId> <outDir> <frames comma> [envVIDEO]
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'path'; import fs from 'fs';
const [dir, entry, id, out, frames] = process.argv.slice(2);
fs.mkdirSync(out, {recursive: true});
const webpackOverride = (await import(path.join(dir, 'webpack.mjs'))).default;
const serveUrl = await bundle({entryPoint: path.join(dir, entry), webpackOverride});
const opts = {browserExecutable: '/usr/bin/google-chrome', chromeMode: 'chrome-for-testing', chromiumOptions: {gl: 'swangle'}, timeoutInMilliseconds: 600000};
const composition = await selectComposition({serveUrl, id, ...opts});
for (const f of frames.split(',').map(Number)) {
  const t = Date.now();
  await renderStill({composition, serveUrl, output: path.join(out, `f${String(f).padStart(4, '0')}.png`), frame: f, ...opts});
  console.log('frame', f, ((Date.now() - t) / 1000).toFixed(1) + 's');
}
