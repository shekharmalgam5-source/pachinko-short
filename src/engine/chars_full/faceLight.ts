// FACE-AGENT: per-frame FACE LIGHT (replaces the fixed v10 lilac crescent + hat-brim band baked into headTex).
// Measured on Ricks Clips (agents/face/REPORT.md): an RC face is a softly lit BALL, not a flat card with a cel band:
//  - day: core stays paper white (L* 98-100, neutral); only the outer ~0.3-0.4 R on the side AWAY from the light falls off,
//    softly (no hard terminator), to a cool lilac rim (L* ~89-92, a* +6, b* -4..-12)
//  - the shaded side follows the real light: it sits on the far side of the head from the sun / lamp in screen space
//  - a face standing in a cast shadow gets the shadow (RC even shows hard shadow edges across a face); dim scenes tint the
//    whole face (interior lamp: warm cream L* ~85-91 b* +14; night: lilac L* ~84-90 a* +17..22)
//  - hats: RC shows NO brim band on the forehead; here the brim throws a REAL (analytic) shadow, computed per frame from the
//    sun direction, kept soft and at reduced strength (penumbra grows with distance from the brim)
// Implementation: head + hat cards use a patched MeshLambertMaterial (only so three.js binds the sun's shadow map); the
// lighting itself is ours: sun direction -> card space in the vertex shader (follows camera orbit, head roll, mirror flip),
// sphere normal from the texture's head-centred UV, soft wrap ramp, shadow-map lookup, analytic brim shadow.
import * as THREE from 'three';
import {XV, type Tod} from '../look/look';

type M3 = [number, number, number];
/** linear multipliers on the painted face colour (computed from RC Lab targets, see REPORT.md). lit = sunlit core,
 *  rim = sunlit side's soft falloff, cast = face inside a cast shadow, castRim = its far rim. shape = [T0, T1, zMin, brimK] */
export const FACE_LIGHT: Record<Tod | 'night', {lit: M3; rim: M3; cast: M3; castRim: M3; shape: [number, number, number, number]}> = {
  // RC day: core L 98-100 neutral; rim L ~89 a +7 b -9; (no RC face in a day cast shadow in the sample: L 85 lilac keeps it readable)
  // self-shadow (rim) = cast shadow = Lab (83, 6.5, -9) at full shade (no sun either way); rim inside a cast shadow (74, 8.5, -12) -> measured outer bin ~89-90 after ink anti-aliasing and the grade (RC 89-92)
  // lit: RC day cores are neutral-warm white (a* ~0, b* +1.6..1.9); ours came out a* +1.5 b* -1.6 (lilac cast) -> warm it slightly
  day: {lit: [1.02, 1.02, 0.92], rim: [0.68, 0.62, 0.6], cast: [0.78, 0.73, 0.71], castRim: [0.66, 0.6, 0.58], shape: [-0.7, 0.5, 0.5, 0.5]},   // v16: warm-neutral shade (no purple), form 0.6. v15: wide soft ramp (v13 [-0.4, 0.2] read as a white half + purple half)
  // golden (estimated): warm-peach core, violet rim (RC golden shadows a* +19 b* -6)
  golden: {lit: [1.018, 0.944, 0.864], rim: [0.74, 0.6, 0.56], cast: [0.76, 0.64, 0.6], castRim: [0.62, 0.5, 0.48], shape: [-0.45, 0.05, 0.5, 0.5]},
  // RC practical-lamp interiors (rc6 / rc4_055 / rc7_021): whole face warm cream L ~90 b* +14, broader falloff (dL 11-19)
  workshop: {lit: [1.0, 0.96, 0.88], rim: [0.84, 0.74, 0.72], cast: [0.74, 0.66, 0.66], castRim: [0.6, 0.52, 0.55], shape: [-0.6, 0.35, 0.45, 0.5]},   // v14: lighter cream (v13 values read pink-grey / dirty)
  // RC night (rc2_035 / rc2_045): lilac-pink face L ~84-90 a* +17..22
  indoor: {lit: [1.02, 1.02, 0.92], rim: [0.68, 0.62, 0.6], cast: [0.78, 0.73, 0.71], castRim: [0.66, 0.6, 0.58], shape: [-0.7, 0.5, 0.5, 0.5]},   // engine v2: daylight interior = day face light
  night: {lit: [0.93, 0.92, 0.98], rim: [0.74, 0.72, 0.84], cast: [0.7, 0.68, 0.8], castRim: [0.6, 0.58, 0.72], shape: [-0.7, 0.5, 0.5, 0.5]},   // engine v2: cool moonlight, NOT purple (old night preset turned faces violet)
};
/** lamp used as the face key light in practical-lit interiors (Cart.tsx Lights: IN spot) */
const WORKSHOP_LAMP: M3 = [11.7, 2.3, -0.4];

const v3 = (a: M3) => new THREE.Vector3(...a);
/** shared uniforms of every face/hat material (values updated once per frame by setFaceLight) */
export const FACE_U = {
  fSun: {value: new THREE.Vector3(0.57, 0.59, 0.56)},      // world, toward the sun: set by setFaceLight every frame (same maths as Cart.tsx Lights)
  fLamp: {value: new THREE.Vector4(0, 0, 0, 0)},           // xyz world lamp position, w: 0 = sun direction, 1 = lamp
  fLitMul: {value: new THREE.Vector3(1, 1, 1)}, fRimMul: {value: v3(FACE_LIGHT.day.rim)},
  fCastMul: {value: v3(FACE_LIGHT.day.cast)}, fCastRimMul: {value: v3(FACE_LIGHT.day.castRim)},
  fShape: {value: new THREE.Vector4(...FACE_LIGHT.day.shape)},
  fFormK: {value: 0.5}, fDirK: {value: 0.6},   // v15
  fCastK: {value: 1},                                      // how much the scene's cast shadows darken faces (0..1)
  fDbg: {value: 0},
  fChinK: {value: 0.8},                                    // strength of the always-on chin falloff (RC: every face is darker underneath)
};
/** sun direction (unnormalised offset) exactly as Cart.tsx Lights builds it: preset sunOff, 'sunsweep' time-lapse swing sw (-1..1),
 *  test-only overrides exp fsx / fsy / fsz */
export const sunOffset = (sunOff: M3, sw = 0) => new THREE.Vector3((sunOff[0] + sw * 9) * XV('fsx', 1), (sunOff[1] - Math.abs(sw) * 3) * XV('fsy', 1), sunOff[2] * XV('fsz', 1));
/** per frame (call before the scene renders): time-of-day preset, blended toward night by the mood k (same k as setCharTint),
 *  and the world sun offset of this frame (sunOffset). The face light keeps its own copy of the sun (set here, before the scene
 *  renders) instead of reading PREM.premSunDir, which Lights only sets while the R3F tree renders. */
export function setFaceLight(tod: Tod, k = 0, sun?: THREE.Vector3) {
  if (sun) FACE_U.fSun.value.copy(sun).normalize();
  const a = FACE_LIGHT[tod], b = FACE_LIGHT.night, L = (x: M3, y: M3) => new THREE.Vector3(...x).lerp(new THREE.Vector3(...y), k);
  FACE_U.fLitMul.value.copy(L(a.lit, b.lit)); FACE_U.fRimMul.value.copy(L(a.rim, b.rim));
  FACE_U.fCastMul.value.copy(L(a.cast, b.cast)); FACE_U.fCastRimMul.value.copy(L(a.castRim, b.castRim));
  const s = a.shape; FACE_U.fShape.value.set(XV('fT0', s[0]), XV('fT1', s[1]), XV('fz', s[2]), XV('fbrim', s[3]));
  FACE_U.fCastK.value = XV('fcast', tod === 'workshop' ? 0.5 : 1); FACE_U.fChinK.value = XV('fchin', 0.75); FACE_U.fFormK.value = XV('fform', 0.7); FACE_U.fDirK.value = XV('fdir', 0.75); FACE_U.fDbg.value = XV('fdbg', 0);
  if (tod === 'workshop') FACE_U.fLamp.value.set(...WORKSHOP_LAMP, 1); else FACE_U.fLamp.value.set(0, 0, 0, 0);
}

/** card-space light for the LINES agent / anything else that needs it: x = card right (screen right for an unflipped
 *  character), y = up, z = toward the camera. Same maths as the shader (before the z clamp). dir = the rig's mirror (1/-1). */
export function lightInCard(charPos: M3 | THREE.Vector3, cam: THREE.Vector3, dir = 1, roll = 0, sunW: THREE.Vector3 = FACE_U.fSun.value): THREE.Vector3 {
  const p = Array.isArray(charPos) ? new THREE.Vector3(...charPos) : charPos;
  const yaw = Math.atan2(cam.x - p.x, cam.z - p.z);
  const lw = FACE_U.fLamp.value.w > 0.5 ? new THREE.Vector3(FACE_U.fLamp.value.x, FACE_U.fLamp.value.y, FACE_U.fLamp.value.z).sub(p).normalize() : sunW.clone().normalize();
  let x = dir * (lw.x * Math.cos(yaw) - lw.z * Math.sin(yaw)), y = lw.y;
  const z = lw.x * Math.sin(yaw) + lw.z * Math.cos(yaw);
  if (roll) { const c = Math.cos(-roll), s = Math.sin(-roll); [x, y] = [x * c - y * s, x * s + y * c]; }
  return new THREE.Vector3(x, y, z);
}
/** the same light with the face shader's frontal clamp (the direction the visible shade falls away from on the face) */
export function faceShadeDir(charPos: M3 | THREE.Vector3, cam: THREE.Vector3, dir = 1, roll = 0): THREE.Vector3 {
  const l = lightInCard(charPos, cam, dir, roll); l.z = Math.max(l.z, FACE_U.fShape.value.z); return l.normalize();
}

export type FaceDims = {w: number; h: number; ax: number; ay: number; rx: number; ry: number; kind: 'head' | 'hat'; brim?: {y: number; R: number}};
const VERT_PARS = /* glsl */`
uniform vec3 premSunDir;
uniform vec4 fLamp;
varying vec3 vFL;
`;
const VERT_MAIN = /* glsl */`
  {
    vec3 fwp = (modelMatrix * vec4(transformed, 1.0)).xyz;
    vec3 fLw = normalize(mix(premSunDir, normalize(fLamp.xyz - fwp), fLamp.w));
    vec3 fcX = normalize(modelMatrix[0].xyz), fcY = normalize(modelMatrix[1].xyz), fcZ = normalize(cross(modelMatrix[0].xyz, modelMatrix[1].xyz));
    // mirrored cards (rig dir = -1) flip x only: keep z toward the viewer
    if (dot(fcZ, normalize(modelMatrix[2].xyz)) < 0.0) fcZ = -fcZ;
    vFL = vec3(dot(fLw, fcX), dot(fLw, fcY), dot(fLw, fcZ));
  }
`;
const FRAG_PARS = /* glsl */`
uniform vec3 fLitMul, fRimMul, fCastMul, fCastRimMul;
uniform vec4 fShape, fHead, fR, fBrim;
uniform float fCastK, fChinK, fDbg, fFormK, fDirK;
varying vec3 vFL;
`;
const FRAG_MAIN = /* glsl */`
  {
    // head-local coordinates in head radii (x right, y up) from the texture's head-centred anchor
    vec2 fcm = vec2(vMapUv.x * fHead.x - fHead.z, (1.0 - vMapUv.y) * fHead.y - fHead.w);
    vec2 fhu = vec2(fcm.x / fR.x, -fcm.y / fR.y);
    vec3 fL = normalize(vec3(vFL.xy, max(vFL.z, fShape.z)));
    vec3 fn;
    if (fR.z < 0.5) { float r2 = dot(fhu, fhu); fn = r2 < 1.0 ? vec3(fhu, sqrt(1.0 - r2)) : normalize(vec3(fhu, 0.0)); }
    else { float u = clamp(fhu.x / 1.45, -1.0, 1.0); fn = normalize(vec3(u, 0.45, sqrt(max(1.0 - u * u, 0.0)))); }   // hat: crown ~ upright cylinder
    float fLit = 1.0 - fDirK * (1.0 - smoothstep(fShape.x, fShape.y, dot(fn, fL)));   // v15: softer, weaker directional side
    // v15 RC 'ball' form: every face darkens softly toward its rim (more at the bottom and away from the light), even in frontal light
    if (fR.z < 0.5) { float fr = length(fhu - vec2(fL.x, fL.y) * 0.22 - vec2(0.0, 0.12)); fLit = min(fLit, 1.0 - fFormK * smoothstep(0.1, 0.9, fr)); }
    fLit = max(fLit, 0.35);   // v15: never a dark half-face (backlit faces stay mostly light, like RC)
    // RC: the chin / underside is always in the soft falloff (sky light comes from above), whatever the sun does
    if (fR.z < 0.5) fLit = min(fLit, 1.0 - fChinK * (1.0 - smoothstep(-1.0, -0.05, fn.y)));   // v19: much wider, softer chin fade (v18 -0.8..-0.38 drew a thin line under the jaw)
    // scene cast shadow (sun shadow map) at this point of the card
    float fVis = 1.0;
    #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
      DirectionalLightShadow fds = directionalLightShadows[ 0 ];
      fVis = getShadow( directionalShadowMap[ 0 ], fds.shadowMapSize, fds.shadowIntensity, fds.shadowBias, fds.shadowRadius, vDirectionalShadowCoord[ 0 ] );
    #endif
    fVis = mix(1.0, fVis, fCastK);
    // hat brim: a disc of radius R at height y (head units) throws a real shadow onto the ball; soft penumbra grows with distance
    float fOcc = 0.0;
    if (fBrim.z > 0.5 && fR.z < 0.5 && fhu.y < fBrim.x && fL.y > 0.05) {
      float r2 = dot(fhu, fhu), fz = sqrt(max(1.0 - r2, 0.0));
      float t = (fBrim.x - fhu.y) / fL.y;
      vec2 fh = vec2(fhu.x + t * fL.x, fz + t * fL.z);
      float pen = 0.06 + 0.22 * t;
      fOcc = 1.0 - smoothstep(fBrim.y - pen, fBrim.y + pen * 0.5, length(fh));
    }
    // ...plus the sky light the brim takes away: a soft gradient right under the brim (no edge), always on
    float fAO = 0.0;
    if (fBrim.z > 0.5 && fR.z < 0.5) fAO = 1.0 - smoothstep(0.12, 0.55, fBrim.x - fhu.y);
    float fSun = fVis * (1.0 - fOcc * fShape.w) * (1.0 - fAO * fBrim.w);
    vec3 fInSun = mix(fRimMul, fLitMul, fLit), fInShade = mix(fCastRimMul, fCastMul, fLit);
    outgoingLight = diffuseColor.rgb * mix(fInShade, fInSun, fSun);
    if (fDbg > 0.5) outgoingLight = fDbg > 1.5 ? normalize(vFL) * 0.5 + 0.5 : vec3(fVis, 1.0 - fOcc, fLit);
    #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
      if (fDbg > 2.5) outgoingLight = fract(vDirectionalShadowCoord[ 0 ].xyz * vec3(20.0, 20.0, 50.0));   // fdbg=3: shadow-map coordinates (stripes)
    #endif   // debug view (exp fdbg=1): R = sun visibility, G = brim, B = ramp; fdbg=2: card-space light
  }
`;

/** face / hat card material: same inputs as the old MeshBasicMaterial (map, alpha test, double side, toneMapped) */
export function faceMaterial(map: THREE.Texture, d: FaceDims, toneMapped: boolean): THREE.MeshLambertMaterial {
  const m = new THREE.MeshLambertMaterial({map, alphaTest: 0.5, alphaToCoverage: true, side: THREE.DoubleSide, toneMapped});
  const own = {
    fHead: {value: new THREE.Vector4(d.w, d.h, d.ax, d.ay)},
    fR: {value: new THREE.Vector4(d.rx, d.ry, d.kind === 'hat' ? 1 : 0, 0)},
    fBrim: {value: new THREE.Vector4(d.brim?.y ?? 0, d.brim?.R ?? 0, d.brim ? 1 : 0, XV('fao', 0.3))},   // w: strength of the under-brim sky occlusion
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, own, {premSunDir: FACE_U.fSun, fLamp: FACE_U.fLamp, fLitMul: FACE_U.fLitMul, fRimMul: FACE_U.fRimMul,
      fCastMul: FACE_U.fCastMul, fCastRimMul: FACE_U.fCastRimMul, fShape: FACE_U.fShape, fCastK: FACE_U.fCastK, fChinK: FACE_U.fChinK, fFormK: FACE_U.fFormK, fDirK: FACE_U.fDirK, fDbg: FACE_U.fDbg});
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + VERT_PARS)
      .replace('#include <project_vertex>', '#include <project_vertex>\n' + VERT_MAIN);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FRAG_PARS)
      .replace('#include <opaque_fragment>', FRAG_MAIN + '\n#include <opaque_fragment>');
  };
  m.customProgramCacheKey = () => 'faceLight1';
  return m;
}
