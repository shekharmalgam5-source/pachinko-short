// LOOK: premium light / colour / atmosphere preset (see review_premium/PREMIUM_REPORT.md for v5 and review_look/LOOK_GUIDE.md for v4).
// Everything that sets the "look" of the short lives here so it can be ported to other videos as one file:
// lighting rig, toon ramp, fog/haze, sky, palette harmonisation, character tint, post (bloom, grade, vignette, grain, DOF).
import * as THREE from 'three';
import {getInputProps} from 'remotion';
import type {GradeParams} from './ink';
import {patchToon, type ColourOpts} from './premium';
import {TOD} from '@story/look';

/** A/B switch for look experiments: render with --props='{"exp":"noink+nobloom"}'. X('noink') is true for that render only. */
const _exp = (() => { try { return String((getInputProps() as any)?.exp ?? ''); } catch { return ''; } })().split('+');
export const X = (k: string) => _exp.includes(k);
export const XV = (k: string, def: number) => { const e = _exp.find((s) => s.startsWith(k + '=')); return e ? +e.slice(k.length + 1) : def; };

/** X('v4') renders the previous (v4) look for A/B comparisons; everything below falls back to the archived v4 values. */
export const V4 = X('v4');
/** X('v5') renders the v5 (premium, before Colour v2) look: one daylight setup, sepia-warm grade, no sky in the wides. */
export const V5 = V4 || X('v5');

/** time of day / light setup per story beat (todAt): day street, golden-hour street (later beats), practical-lit workshop interior */
/** indoor (ENGINE v1.1): daylight interior (the grocery) - day rig, calmer colour so teal/blue tiles and shelves do not clip */
export type Tod = 'day' | 'golden' | 'workshop' | 'indoor';

/** soft 5-step toon ramp (linear filtered): deep, slightly cool core shadow -> clean white. Replaces v3 `ramp` (0.47/0.75/1.0 nearest). */
export const LOOK_RAMP = (() => {
  const d = new Uint8Array([
    74, 76, 102, 255,     // core shadow side: ~0.30 of the key, violet-blue bias
    128, 128, 150, 255,
    198, 196, 204, 255,
    240, 238, 238, 255,
    255, 255, 255, 255,
  ]);
  const t = new THREE.DataTexture(d, 5, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t;
})();

/** lighting rig per time of day. Intensities are three.js physical units as used by the scene (MeshToon). */
const DAY_V4 = {
  sun: '#fff0da', sunI: 4.6, sunOff: [8, 9, 7] as [number, number, number],   // 3/4 side-front, ~40 deg elevation
  skyFill: '#9dbef2', groundFill: '#c9a983', hemiI: 0.8,   // open-sky fill: makes cast shadows blue-violet
  amb: '#c9cfe6', ambI: 0.12,
  rim: '#d8e8ff', rimI: 0.9,                                    // back/rim from the far side of the street
  bounce: '#ffc890', bounceI: 0.28,                             // warm ground bounce
  shadowRadius: XV('shr', 12),
};
/** PREMIUM day rig (review_premium/PREMIUM_REPORT.md): ~38 deg sun whose shadows cover the whole visible street (LOOK_PREM.shadow),
 *  exposure +0.5 stop to pay for the new shadow area / AO, plum (not sky-blue) fill so cast shadows land on RC's plum (a+, b-) */
const DAY_PREM = {
  sun: '#fff0da', sunI: 6.4, sunOff: [8, 8.2, 7.8] as [number, number, number],
  skyFill: '#c2bcc8', groundFill: '#d6aa8a', hemiI: 1.57,   // muted plum: neutral surfaces in shade land on C* ~12 like RC (#322632 / #2e2539), not saturated violet
  amb: '#c9c2cf', ambI: 0.235,
  rim: '#e4e2ee', rimI: 0.9,   // rim has no shadow map and the toon ramp floor is 0.3, so it also fills every shadow: kept neutral and weaker
  bounce: '#ffc890', bounceI: 0.39,
  shadowRadius: XV('shr', 12),
};
/** COLOUR v2 day rig (review_look/LOOK_GUIDE.md "Colour v2"): sun a touch less yellow (lit neutrals were b* +19 vs RC +7.5), fill bluer-violet
 *  so shadows land cool (RC day shadows b* -4..-13, a* +17), ground fill / bounce less orange (they tinted every shadow and the whole frame sepia) */
const DAY_C2 = {
  sun: '#fff3e2', sunI: 6.4 * XV('sun2', 0.88),   /* v20: day sun -12 % */ sunOff: [8, 8.2, 7.8] as [number, number, number],
  skyFill: '#b4b8dc', groundFill: '#c8ae9a', hemiI: 1.57,
  amb: '#c0c2dc', ambI: 0.235,
  rim: '#e4e6f4', rimI: 0.9,
  bounce: '#ffd8b0', bounceI: 0.3,
  shadowRadius: XV('shr', 12),
};
const GOLDEN_V4 = {
  sun: '#ffc27a', sunI: 3.6, sunOff: [12, 4.5, -6] as [number, number, number],    // low, from behind-side: long shadows + rim
  skyFill: '#8f9ee0', groundFill: '#d49a6a', hemiI: 1.15,
  amb: '#b8a8d8', ambI: 0.14,
  rim: '#ffd0a0', rimI: 1.3,
  bounce: '#ffb070', bounceI: 0.35,
  shadowRadius: XV('shr', 12),
};
/** COLOUR v2 golden hour (story beats from "But then something strange happened", 39.72 s): low (~20 deg) orange sun raking down the street
 *  from the camera side, lavender sky fill so shadows go violet-blue (RC golden: warm 70 %, shadow a* +19 / b* -6), premium exposure */
const GOLDEN_C2 = {
  sun: '#ffb46c', sunI: 6.0, sunOff: [12, 5, 4.5] as [number, number, number],   // v20: deeper orange sun, less pastel fill (was #ffc690 6.6 / #b0b0d8 1.6)
  skyFill: '#9a9ccc', groundFill: '#c89478', hemiI: 1.35,
  amb: '#b8a6cc', ambI: 0.18,
  rim: '#ffd6b0', rimI: 0.8,
  bounce: '#ffb880', bounceI: 0.34,
  shadowRadius: XV('shr', 12),
};
export const LOOK_LIGHT = {
  day: V4 ? DAY_V4 : V5 ? DAY_PREM : DAY_C2,
  golden: V5 ? GOLDEN_V4 : GOLDEN_C2,
  indoor: V4 ? DAY_V4 : V5 ? DAY_PREM : DAY_C2,
  workshop: V4 ? DAY_V4 : V5 ? DAY_PREM : DAY_C2,   // interior scaling + practical lamp: LOOK_PREM.interior (Cart.tsx Lights)
};

/** atmospheric perspective: pale blue haze (day) / peach-lavender haze (golden). fog is linear near..far (m).
 *  Colour v2: haze starts closer and is bluer so the far end of the street, towers and skyline recede (scale instead of a miniature) */
export const LOOK_FOG = V5 ? {
  day: {color: '#c3d6ec', near: 26, far: 175}, golden: {color: '#f2c6a8', near: 22, far: 150}, workshop: {color: '#c3d6ec', near: 26, far: 175},
} : {
  day: {color: '#bcd2ee', near: 16, far: 120}, golden: {color: '#e8b49c', near: 30, far: 170}, workshop: {color: '#bcd2ee', near: 26, far: 175},   // v20: golden haze pushed back (was near 16 far 115 -> milky pastel street)
};

/** painted sky gradient stops (top -> bottom of the sky cylinder; the horizon sits at ~0.86) + distant skyline haze colours.
 *  Colour v2: deeper, cleaner blue zenith, brighter haze band at the horizon, skyline layers in blue haze; golden = lavender -> peach glow */
type Sky = {stops: [number, string][]; cap: string; skyline: [string, string]; cloud: string; cloudShade: string; glow?: [number, string]};
const SKY_V5: Sky = {
  stops: [[0, '#3c7fd6'], [0.42, '#7fb2e8'], [0.74, '#c9dff2'], [0.9, '#e9eef2'], [1, '#f6ead8']],
  cap: '#3c7fd6',
  skyline: ['rgba(150,172,206,.55)', 'rgba(132,150,190,.62)'],
  cloud: 'rgba(255,255,255,.95)', cloudShade: 'rgba(170,182,220,.45)',
};
// @ts-ignore  indoor is added below
export const LOOK_SKY: Record<Tod, Sky> = V5 ? {day: SKY_V5, golden: SKY_V5, workshop: SKY_V5} : {
  day: {stops: [[0, '#2f6fd0'], [0.4, '#5f9ae2'], [0.7, '#a9cdf0'], [0.84, '#d8e8f6'], [0.9, '#e8eff4'], [1, '#dfe6ee']], cap: '#2f6fd0',
    skyline: ['rgba(158,184,222,.75)', 'rgba(138,164,208,.8)'], cloud: 'rgba(255,255,255,.96)', cloudShade: 'rgba(160,178,222,.5)'},
  golden: {stops: [[0, '#3f52b0'], [0.38, '#7a74c0'], [0.62, '#d08aa4'], [0.78, '#f6a070'], [0.88, '#ffc884'], [1, '#eaa888']], cap: '#4f62b8',
    skyline: ['rgba(186,128,150,.55)', 'rgba(150,104,140,.62)'], cloud: 'rgba(255,214,186,.95)', cloudShade: 'rgba(196,128,150,.5)', glow: [0.86, 'rgba(255,226,170,.85)']},
  workshop: {} as Sky,
};
LOOK_SKY.workshop = LOOK_SKY.day;

/** characters are unlit painted billboards: give them the light colour, never a brown cast (heads must stay white). */
export const LOOK_CHAR_TINT: Record<Tod, string> = <any>{day: '#fffdf9', golden: V5 ? '#fff1e2' : '#fff2e6', workshop: V5 ? '#fffdf9' : '#fff6ec'};
/** soft halo behind characters (separates them from busy backgrounds, reads as rim) */
export const LOOK_HALO: Record<Tod, {color: string; opacity: number}> = <any>{day: {color: '#e6f0ff', opacity: 0.16}, golden: {color: '#ffd7a8', opacity: 0.22}, workshop: {color: '#ffe2b8', opacity: 0.16}};

/**
 * palette harmonisation for every authored material colour: cleans "muddy" mid browns/olives, lifts very dark
 * values to a readable floor, makes creams whiter, and keeps saturated accents (reds, blues, teals) punchy.
 */
/**
 * COLOUR v2 palette harmonisation (authored hex -> harmonised hex), applied to every authored colour that goes through lookColor and to the
 * painted awnings. Rule: warm dominant (brick, terracotta, apricot, ochre, cream) + ONE cool complementary family (teal / powder blue /
 * blue-grey stone) + red accents. Pinks, mint and purples are folded into those families (RC frames hold ~3.7 hue families, v5 4.6-4.9),
 * pale cream walls become denser apricot / sand so sunlit colour has body (sunlit chroma v5 22-25 vs RC 33-36), the far towers go hazy blue-grey.
 */
export const LOOK_PALETTE: Record<string, string> = V5 ? {} : {
  '#e9b0a0': '#e39a6e',   // salmon-pink walls (bakery, jeweler) -> apricot terracotta
  '#a8d0b8': '#6fb0bc',   // mint walls (barber, toys) -> powder teal (cool accent)
  '#f2d27a': '#e8b040',   // pale yellow (radio shop) -> ochre gold
  '#efe0c0': '#e8c49a',   // pale cream walls (drug store, tailor, music) -> warm sand
  '#d8cdb4': '#c4ccd4',   // stone (bank, insurance) -> cool blue-grey stone
  '#d0607a': '#2f7f86',   // pink awning -> teal
  '#8a3a5a': '#2a5f9a',   // plum / purple awning + sign -> blue
  '#5b8fb5': '#2f6f9a',   // pale blue awning -> denser blue
  '#e8c8a8': '#d6c2b6', '#d8dce4': '#b6c6da', '#c8a890': '#c2b2ac', '#e4d8c0': '#c6d0dc', '#b8c4cc': '#a6b8cc',   // towers: hazy, cooler
  '#c9b48e': '#b4ac9c',   // far ground: less yellow
  '#b8ad98': '#b2aca2',   // curbs: less yellow
};
export const lookPal = (c: string) => LOOK_PALETTE[c.toLowerCase()] ?? c;
const _h = {h: 0, s: 0, l: 0};
export function lookColor(c: THREE.ColorRepresentation): THREE.Color {
  const col = new THREE.Color(typeof c === 'string' ? lookPal(c) : c); col.getHSL(_h); let {h, s, l} = _h; const deg = h * 360;
  if (l > 0.82) s *= 0.55;                                              // creams -> clean warm white
  else if (deg > 15 && deg < 60 && s < 0.6 && l < 0.6) { s *= 0.82; l = Math.max(l, 0.3); }   // muddy browns/khaki
  else if (deg >= 60 && deg < 100 && s < 0.5) { h += 20 / 360; s *= 0.8; }  // olive -> fresher green
  else if (s > 0.45) s = Math.min(1, s * (V5 ? 1.08 : 1.14));            // accents (Colour v2: 1.08 -> 1.14)
  if (l < 0.16) l = 0.16 + (l - 0.16) * 0.4;                            // value floor (ink is drawn by the ink pass)
  return col.setHSL(h, s, l);
}
export const lookHex = (c: string) => '#' + lookColor(c).getHexString();

/** toon factory for the look: soft ramp + harmonised colour + premium world-space terms (premium.ts). gloss: 0 matte, 1 car paint, 1.5 chrome */
export const lookToon = (o: THREE.MeshToonMaterialParameters, gloss = 0): THREE.MeshToonMaterial => {
  const col = o.color !== undefined ? {color: lookColor(o.color as THREE.ColorRepresentation)} : {};
  if (X('pbr')) { const {gradientMap: _g, ...r} = o as any; return patchToon(new THREE.MeshStandardMaterial({...r, ...col, roughness: gloss > 0 ? 0.35 : 0.8, metalness: 0}), 0) as any; }   // experiment only
  return patchToon(new THREE.MeshToonMaterial({...o, gradientMap: LOOK_RAMP, ...col}), V4 ? 0 : gloss);
};

/** post. Grade = per-zone curve/saturation/tint (v3 GradeEffect). Values tuned against Ricks Clips day frames (see guide). */
const GRADE_V5: Record<'day' | 'golden', GradeParams> = {
  // premium: highlight saturation 1.0 -> 1.2 (sunlit colours stay dense instead of pastel), shadow tint toward plum (Cr) not blue (Cb), vignette 0.4 -> 0.32
  day: V4 ? {ky: [0.0, 0.085, 0.255, 0.56, 0.84, 0.955, 1], sat: [1.15, 1.38, 1.0], tintS: [0.032, 0.012], tintM: [0.004, 0.0], tintH: [-0.004, 0.002], vig: [0.4, 0.42]}
    : {ky: [0.0, 0.085, 0.255, 0.56, 0.84, 0.955, 1], sat: [0.95, 1.38, 1.2], tintS: [0.0, 0.014], tintM: [0.004, 0.0], tintH: [-0.004, 0.002], vig: [0.32, 0.42]},
  golden: {ky: [0.0, 0.12, 0.3, 0.58, 0.83, 0.95, 1], sat: [1.0, 1.12, 1.05], tintS: [0.04, 0.012], tintM: [-0.006, 0.01], tintH: [-0.03, 0.022], vig: [0.34, 0.45]},
};
/** COLOUR v2 grade. Day: no sepia veil (mids/highlights pulled to neutral-cool with +Cb), violet-blue shadows (+Cb +Cr: "warm light, cool
 *  shadows"), saturation moved from a global highlight boost (yellowed the creams) to the hue-aware vibrance of LOOK_COLOUR.
 *  Golden: warm-peach highlights, rose mids, violet shadows. Workshop: calmer saturation, cool shadow corners around the warm lamp pool. */
// @ts-ignore  indoor is added below
export const LOOK_GRADE: Record<Tod, GradeParams> = V5 ? {...GRADE_V5, workshop: GRADE_V5.day} : {
  day: {ky: [0.0, 0.1, 0.25, 0.5, 0.76, 0.905, 0.985], sat: [1.05, 1.4, 1.22], tintS: [XV('tsb', 0.006), 0.01], tintM: [XV('tmb', 0.01), 0.002], tintH: [XV('thb', 0.006), 0.0], vig: [0.32, 0.42]}   /* v18: highlights roll off (no burnt sidewalk), lifted less-blue shadows, richer colour */,
  golden: {ky: [0.0, 0.1, 0.26, 0.51, 0.76, 0.905, 0.985], sat: [1.02, 1.3, 1.15], tintS: [0.014, 0.012], tintM: [0.0, 0.01], tintH: [-0.01, 0.012], vig: [0.34, 0.44]},   // v18
  workshop: {ky: [0.0, 0.08, 0.24, 0.53, 0.82, 0.95, 1], sat: [0.95, 1.05, 1.0], tintS: [0.028, 0.006], tintM: [0.008, 0.002], tintH: [-0.006, 0.006], vig: [0.46, 0.38]},
};
/** COLOUR v2 hue-aware vibrance (premium.ts ColourEffect). vib = [amount, chroma of full gain, fade start, fade end] (BT.709 chroma);
 *  hue = gains for [cool teal..blue, warm orange..yellow, red, pink/magenta]; hue2 = [green, highlight fade-out luma start]. null = off (v5) */
// @ts-ignore  indoor is added below
export const LOOK_COLOUR: Record<Tod, ColourOpts> | null = V5 ? null : {
  day: {vib: [XV('vib', 0.3), 0.08, 0.3, 0.5], hue: [XV('cool', 0.55), XV('warm', 0.05), XV('red', 0.0), XV('pink', -0.45)], hue2: [0.0, XV('hlf', 0.93)]},
  golden: {vib: [0.0, 0.08, 0.3, 0.5], hue: [0.4, -0.12, 0.0, -0.15], hue2: [-0.1, 0.82]},
  workshop: {vib: [0.0, 0.08, 0.3, 0.5], hue: [0.4, -0.42, -0.15, -0.2], hue2: [0.0, 0.84]},
};
export const LOOK_BLACK: [number, number, number] = [10 / 255, 9 / 255, 20 / 255];   // lifted, blue-violet black
/** premium: bloom only on real highlights (threshold .82 -> .92, intensity .55 -> .33). The old bloom was the largest single source of the milky veil. */
export const LOOK_BLOOM = V4 ? {intensity: 0.55, threshold: 0.82, smoothing: 0.25, radius: 0.75} : {intensity: 0.33, threshold: 0.92, smoothing: 0.25, radius: 0.75};
export const LOOK_NOISE = 0.035;            // overlay grain opacity
/** background blur relative to the camera solver's cInf. Colour v2: 0.6 -> 0.47 (the judge measured the background blur ~22 % above RC) */
export const LOOK_DOF = {cInfScale: V5 ? 0.6 : XV('dof', 0.47)};
export const LOOK_BG: Record<Tod, string> = <any>{day: '#c3d6ec', golden: '#f2c6a8', workshop: '#c3d6ec'};


// ---- ENGINE v1.1 'indoor' = day everywhere except colour: grocery v8 frames had highlight saturation p90 0.92 vs v6 0.78 (Mahdi: "colours overdone")
(LOOK_FOG as any).indoor = (LOOK_FOG as any).day;
LOOK_SKY.indoor = LOOK_SKY.day;
LOOK_CHAR_TINT.indoor = LOOK_CHAR_TINT.day;
LOOK_HALO.indoor = LOOK_HALO.day;
LOOK_BG.indoor = LOOK_BG.day;
LOOK_GRADE.indoor = {...LOOK_GRADE.day, sat: [XV('isat0', 1.0), XV('isat1', 1.12), XV('isat2', 0.88)]};
if (LOOK_COLOUR) LOOK_COLOUR.indoor = {vib: [XV('ivib', 0.0), 0.08, 0.3, 0.5], hue: [XV('icool', 0.0), 0.0, 0.0, -0.45], hue2: [0.0, 0.85]};

/**
 * PREMIUM layer (premium.ts + Cart.tsx Lights/Post). Measured against Ricks Clips (review_premium/PREMIUM_REPORT.md).
 *  shadow   the sun's shadow map covers +-26 m around the subject and the light sits 60 m away along its direction, so buildings,
 *           awnings and cars OFF screen still throw shadows into the frame (v4: +-11 m, light 13 m away -> almost no cast shadows)
 *  cookie   soft broken sun patches (tile = size of one pattern repeat in m) - light pools on facades and street
 *  macro    +-amplitude of low-frequency albedo variation on every toon surface (painted unevenness, no flat fills)
 *  ground   darkening of vertical surfaces toward the ground (0.7 m fade): wall bases, posts, car sills
 *  ao       screen-space AO (depth only, half res, bilateral blur): contact darkness in corners, under awnings / cars / feet
 *  pool     light pool on the subject (+gain at the subject's screen position, gaussian radius in screen heights); edge darkens far from it
 *  ink      world ink fades with distance so the background reads as atmosphere and the subject plane stays crisp
 *  interior practical-lit interiors (workshop): sky / sun scaled down, a lamp spot pool with shadows
 *  asphalt  neutral-warm asphalt base (v4 slate #5c5e6c turned the whole shaded street blue-violet); sidewalk a touch darker/warmer
 *           so sunlit pavement is not a big paper-white area (near-white share 9.8 % -> RC 4.8 %)
 *  macroGround  extra gain of the macro variation on horizontal surfaces (big ground planes need more unevenness than walls)
 */
export const LOOK_PREM = V4 ? {
  shadow: {extent: 11, mapSize: 2048, dist: 0, far: 30}, cookie: {strength: 0, tile: 34}, macro: 0, ground: 0,
  ao: {strength: 0, radius: 0.9, gain: 6, color: '#2a2440', scale: 0.5}, pool: {gain: 0, edge: 0, radius: 0.45},
  ink: {farOpacity: 0.85, fadeNear: 18, fadeFar: 30}, interior: null as null | {sun: number; sky: number; amb: number; rim: number; lamp: number; cool: number}, asphalt: '#5c5e6c', sidewalk: '#b9b3a8', macroGround: 1,
} : {
  shadow: {extent: 26, mapSize: 4096, dist: 60, far: 110}, cookie: {strength: 0.3, tile: 34}, macro: 0.1, ground: 0.2,
  ao: {strength: 1.0, radius: 0.9, gain: 6, color: '#2a2440', scale: 0.5}, pool: {gain: 0.08, edge: 0.0, radius: 0.45},
  ink: {farOpacity: 0.5, fadeNear: 9, fadeFar: 26}, interior: (V5 ? {sun: 0.45, sky: 0.45, amb: 0.6, rim: 0.4, lamp: 60, cool: 0} : {sun: 0.28, sky: 0.24, amb: 0.34, rim: 0.3, lamp: 70, cool: 24}) as null | {sun: number; sky: number; amb: number; rim: number; lamp: number; cool: number},
  // Colour v2: ground less yellow-grey (part of the sepia veil): asphalt a touch cooler, sidewalk neutral grey-beige
  asphalt: V5 ? '#67616a' : '#5d5862', sidewalk: V5 ? '#b4ada0' : '#a59c92',   /* v18: warmer asphalt, darker warm sidewalk (was #625f6c / #a8a4a2) */ macroGround: 1.6,
};

/** story-driven time of day: the story lists [start seconds, tod] in '@story/look' TOD (the change always happens on a cut).
 *  X('v5') / X('allday'): day throughout; X('allgold'): golden except interiors. */
export const todAt = (f: number): Tod => {
  if (V5 || X('allday')) return 'day';
  const t = f / 30 + 1e-6; let r: Tod = 'day';
  for (const [a, k] of TOD) if (t >= a) r = k;
  if (r === 'workshop') return r;
  return X('allgold') ? 'golden' : r;
};
