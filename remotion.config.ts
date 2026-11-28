import {Config} from '@remotion/cli/config';
import path from 'path';
import webpack from 'webpack';
// Mac: use the GPU (Metal). Other systems keep Remotion's default.
if (process.platform === 'darwin') Config.setChromiumOpenGlRenderer('angle');
// @story = src/videos/<VIDEO> (render.command sets VIDEO).
// LIGHT: REMOTION_LOOK=lite (default) | full. "full" swaps engine/chars for engine/chars_full (face light + brush line weight).
Config.overrideWebpackConfig((c) => {
  const v = process.env.VIDEO || '03_citizenship';
  const full = process.env.REMOTION_LOOK === 'full';
  const plugins = full ? [...(c.plugins ?? []), new webpack.NormalModuleReplacementPlugin(/(^|\/)chars\/(rig|charparts|faceLight)$/, (r: any) => { r.request = r.request.replace(/chars\/(rig|charparts|faceLight)$/, 'chars_full/$1'); })] : c.plugins;
  return {...c, plugins, resolve: {...c.resolve, alias: {...(c.resolve?.alias ?? {}), '@story': path.resolve(process.cwd(), 'src/videos', v)}}};
});
