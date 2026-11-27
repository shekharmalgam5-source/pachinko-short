// "The shopping cart nobody would touch" - Ricks-Clips-style short (formula C). v1: no voice, estimated word timings.
import '@fontsource/archivo-black/400.css';
import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig, Audio, staticFile, delayRender, continueRender, getInputProps} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer} from '@react-three/postprocessing';
import {BlendFunction, BloomEffect, NoiseEffect, ToneMappingEffect, ToneMappingMode} from 'postprocessing';
import * as THREE from 'three';
import {InkPass, GradeEffect, GradeParams, LensBlur} from '../look/ink';
import {LOOK_LIGHT, LOOK_FOG, LOOK_CHAR_TINT, LOOK_HALO, LOOK_GRADE, LOOK_BLACK, LOOK_BLOOM, LOOK_NOISE, LOOK_DOF, LOOK_BG, LOOK_PREM, LOOK_COLOUR, todAt, X, XV} from '../look/look';
import {AOPass, PREM, ColourEffect} from '../look/premium';
import {TOTAL, shotAt, type V3, warp} from '../core/clock';
import {stage, velocities} from '../core/staging';
import {camAt, applyCam, flashAt, Cam} from '../camera/camera';
import {Character, setCharTint} from '../chars/rig';
import {setFaceLight, sunOffset} from '../chars/faceLight';   // engine v2: face light (no-op in the lite tier)
import {WORDS, CAPS} from '@story/timeline';
import {INTERIOR} from '@story/look';
import {AUDIO, SetBefore, SetAfter, useSetData} from '@story/set';
import {moodAt} from '../kits/grocery/store';
export {TOTAL};
const plane = new THREE.PlaneGeometry(1, 1);

// <CAM>  camera v3 lives in ./camera.ts (subject-driven framing solver, real-time clock, shot list in SHOTLIST.md)
const Rig: React.FC<{c: Cam}> = ({c}) => {
  const {camera} = useThree(); applyCam(camera as THREE.PerspectiveCamera, c);
  return null;
};
// </CAM>

// ---------- mood: 0 = warm store, 1 = blue night (day 3 + dust) ----------

// ---------- lights ----------
const col = (h: string) => new THREE.Color(h);
const mix = (a: string, b: string, k: number) => col(a).lerp(col(b), k);
const glowTex = (() => { if (typeof document === 'undefined') return null as any; const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d')!;
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.35, 'rgba(255,255,255,0.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const shaftTex = (() => { if (typeof document === 'undefined') return null as any; const c = document.createElement('canvas'); c.width = 64; c.height = 256; const g = c.getContext('2d')!;
  const v = g.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, 'rgba(255,255,255,0.9)'); v.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = v; g.fillRect(0, 0, 64, 256);
  g.globalCompositeOperation = 'destination-in'; const h = g.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(0.5, 'rgba(0,0,0,1)'); h.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = h; g.fillRect(0, 0, 64, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const LAMPS: V3[] = [[0, 2.95, -10], [0, 2.95, -6], [0, 2.95, -2], [0, 2.95, 1.5]];

const Lights: React.FC<{f: number; extra: string[]; at: THREE.Vector3}> = ({f, extra, at}) => {
  const k = moodAt(f), spotT = useMemo(() => new THREE.Object3D(), []), keyT = useMemo(() => new THREE.Object3D(), []), poolT = useMemo(() => new THREE.Object3D(), []);
  const sh = shotAt(f), wk = !!INTERIOR && INTERIOR.shots.includes(sh.name), ox = wk ? INTERIOR.centre[0] : Math.max(-40, Math.min(40, at.x)), oz = wk ? INTERIOR.centre[1] : Math.max(2, Math.min(16, at.z));
  const sw = extra.includes('sunsweep') ? (sh.t - 0.5) * 2 : 0;   // time-lapse: the sun swings across the street
  const P = LOOK_PREM, IN = wk ? P.interior : null;   // PREMIUM: the workshop is an interior lit by its practical lamp
  keyT.position.set(ox, 0, oz); poolT.position.set(...(IN ? INTERIOR.pool : [2.6, 0, 2.7]) as V3);
  const L0 = LOOK_LIGHT[todAt(f)];   // LOOK rig
  const L = {...L0, hemiI: L0.hemiI * XV('fill', 1), ambI: L0.ambI * XV('fill', 1), sunI: L0.sunI * XV('sun', 1)};   // XV: A/B overrides only
  { const ev = XV('ev', 1); L.sunI *= ev; L.hemiI *= ev; L.ambI *= ev; L.rimI *= ev; L.bounceI *= ev; }
  if (IN) { L.sunI *= IN.sun; L.hemiI *= IN.sky; L.ambI *= IN.amb; L.rimI *= IN.rim; }
  // PREMIUM shadows: the light sits P.shadow.dist m away along the sun direction and its shadow camera covers +-extent m, so
  // off-screen buildings / awnings / cars throw their shadows into the frame (v4: dist 0 = 13 m, +-11 m)
  const SH = P.shadow.extent, SM = P.shadow.mapSize;
  const sunD = sunOffset(L.sunOff, sw); PREM.premSunDir.value.copy(sunD).normalize();
  const sd = PREM.premSunDir.value, sunP: V3 = P.shadow.dist > 0 ? [ox + sd.x * P.shadow.dist, sd.y * P.shadow.dist, oz + sd.z * P.shadow.dist] : [ox + sunD.x, sunD.y, oz + sunD.z];
  const sun = mix(L.sun, '#6d86e8', k), amb = mix(L.amb, '#4a62c8', k);
  const spot = extra.includes('spot') || extra.includes('spot2');
  spotT.position.set(...(extra.includes('spot2') ? [1.2, 0, 1.2] as V3 : [0, 0, 1.2] as V3));
  return (<>
    <primitive object={spotT} /><primitive object={keyT} /><primitive object={poolT} />
    <ambientLight intensity={L.ambI + 0.3 * k} color={amb} />
    {/* sky = warm, floor bounce = teal tile / blue at night */}
    <hemisphereLight args={[mix(L.skyFill, '#4a62c0', k), mix(L.groundFill, '#141c40', k), L.hemiI + 0.1 * k]} />
    {/* key: high warm sun (open roof, so the facade only shades the front strip) */}
    <directionalLight position={sunP} target={keyT} intensity={L.sunI - 1.8 * k} color={sun} castShadow shadow-mapSize={[SM, SM]}
      shadow-camera-left={-SH} shadow-camera-right={SH} shadow-camera-top={SH} shadow-camera-bottom={-SH} shadow-camera-near={1} shadow-camera-far={P.shadow.far} shadow-bias={-0.0004} shadow-normalBias={0.03} shadow-radius={L.shadowRadius} />
    {/* rim / back light: cool in the day, ice-blue at night */}
    <directionalLight position={[ox - 4, 4, oz - 9]} intensity={L.rimI + 0.35 * k} color={mix(L.rim, '#7fa0ff', k)} />
    {/* warm bounce from the floor side facing the camera */}
    <directionalLight position={[0, -2, 6]} intensity={L.bounceI * (1 - k)} color={L.bounce} />
    {spot && <spotLight position={[0.3, 3.4, 1.6]} target={spotT} angle={0.38} penumbra={0.9} intensity={70} color={'#fff0d4'} castShadow shadow-bias={-0.0004} />}
    {/* practical lamp pool for the blue evening */}
    {k > 0.02 && <spotLight position={[2.6, 3.0, 2.3]} target={poolT} angle={0.62} penumbra={1} decay={1.6} distance={9} intensity={22 * k} color={'#ffb35e'} />}
    {k > 0.02 && <pointLight position={[2.6, 2.6, 4.6]} intensity={4 * k} distance={7} color={'#7f9cff'} />}
    {k < 0.98 && <pointLight position={[0, 2.8, 1.5]} intensity={5 * (1 - k)} distance={9} color={'#ffcf8a'} />}
    {wk && !IN && <pointLight position={INTERIOR.warm} intensity={14} distance={9} decay={1.4} color={'#ffd9a0'} />}
    {IN && <spotLight position={INTERIOR.lamp} target={poolT} angle={0.95} penumbra={0.85} intensity={IN.lamp} distance={8} decay={1.5} color={'#ffcf8a'} castShadow shadow-bias={-0.0004} shadow-radius={4} />}
    {IN && <pointLight position={INTERIOR.lampPt} intensity={4} distance={5} decay={1.6} color={'#ffcf8a'} />}
    {/* COLOUR v2: cool daylight from the street side of the workshop (complementary to the warm lamp pool) */}
    {IN && IN.cool > 0 && <pointLight position={INTERIOR.cool} intensity={IN.cool} distance={8} decay={1.4} color={'#8eaaf0'} />}
  </>);
};

// ---------- fx: contact shadows, character halos, lamp glows, light shafts ----------
const addMat = (c: string, o: number, map: THREE.Texture) => new THREE.MeshBasicMaterial({color: c, map, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, fog: false});
const FX: React.FC<{f: number; people: {p: V3}[]; carts: {p: V3}[]; cam: THREE.Vector3}> = ({f, people, carts, cam}) => {
  const k = moodAt(f);
  const mats = useMemo(() => ({
    contact: new THREE.MeshBasicMaterial({color: '#0a0818', map: glowTex, transparent: true, opacity: 0.6, depthWrite: false, fog: false}),
    halo: addMat('#ffffff', 0.2, glowTex), lamp: addMat('#ffffff', 0.8, glowTex), shaft: addMat('#ffffff', 0.1, shaftTex),
  }), []);
  const H = LOOK_HALO[todAt(f)]; mats.halo.color.set(mix(H.color, '#7f9cff', k)); mats.halo.opacity = H.opacity + 0.1 * k;   // LOOK
  mats.lamp.color.set(mix('#ffd490', '#ffb060', k)); mats.lamp.opacity = 0.5 + 0.2 * k;
  mats.shaft.color.set(mix('#ffe0a8', '#6f8cff', k)); mats.shaft.opacity = 0.11 * (1 - k);
  mats.contact.opacity = 0.55 + 0.1 * k;
  const ry = (p: V3) => Math.atan2(cam.x - p[0], cam.z - p[2]);
  return (<>
    {carts.map((c, i) => <mesh key={'c' + i} geometry={plane} material={mats.contact} rotation={[-Math.PI / 2, 0, 0]} position={[c.p[0], 0.008, c.p[2]]} scale={[1.0, 0.7, 1]} renderOrder={1} />)}
    {people.map((p, i) => <group key={'p' + i}>
      <mesh geometry={plane} material={mats.contact} rotation={[-Math.PI / 2, 0, 0]} position={[p.p[0], 0.009, p.p[2]]} scale={[0.95, 0.55, 1]} renderOrder={1} />
      <mesh geometry={plane} material={mats.halo} rotation={[0, ry(p.p), 0]} position={[p.p[0] - Math.sin(ry(p.p)) * 0.12, 0.95, p.p[2] - Math.cos(ry(p.p)) * 0.12]} scale={[1.7, 2.3, 1]} renderOrder={-1} />
    </group>)}
    {LAMPS.map((l, i) => <mesh key={'l' + i} geometry={plane} material={mats.lamp} position={[l[0], l[1] - 0.12, l[2] + 0.2]} rotation={[0, ry(l), 0]} scale={1.3} />)}
    {[[-0.9, -3], [0.7, -7], [0.2, 0]].map(([x, z], i) => <mesh key={'s' + i} geometry={plane} material={mats.shaft} position={[x, 1.8, z]} rotation={[0, 0.5, 0.28]} scale={[0.9, 4, 1]} />)}
  </>);
};

// ---------- post ----------
const GRADE_DAY: GradeParams = {ky: [0.02, 0.11, 0.25, 0.52, 0.8, 0.94, 1], sat: [1.05, 1.16, 1.0], tintS: [0.022, -0.012], tintM: [0.0, 0.006], tintH: [-0.012, 0.014], vig: [0.3, 0.42]};
const GRADE_NIGHT: GradeParams = {ky: [0.02, 0.1, 0.25, 0.5, 0.78, 0.93, 1], sat: [1.1, 1.0, 0.85], tintS: [0.05, -0.02], tintM: [0.045, -0.02], tintH: [0.015, 0.0], vig: [0.42, 0.36]};
const GRADE = GRADE_DAY;
// DOF (v3): LensBlur from src/v3 after the ink pass; focus = view distance to the current camera subject, blur at
// infinity by shot size (CU 28 px .. WS 7 px @1080), so subjects are sharp and background signs go soft.
const _sv = new THREE.Vector3();
const Post: React.FC<{k: number; focus: number; cInf: number; tod: ReturnType<typeof todAt>; anchor: THREE.Vector3}> = ({k, focus, cInf, tod, anchor}) => {
  const {camera, scene} = useThree();
  const fx = useMemo(() => {
    const b = new BloomEffect({blendFunction: BlendFunction.ADD, intensity: LOOK_BLOOM.intensity, luminanceThreshold: LOOK_BLOOM.threshold, luminanceSmoothing: LOOK_BLOOM.smoothing, mipmapBlur: true, levels: 6, radius: LOOK_BLOOM.radius});   // LOOK
    const g = new GradeEffect(LOOK_GRADE.day, 1); g.black = LOOK_BLACK;
    const n = new NoiseEffect({blendFunction: BlendFunction.OVERLAY, premultiply: true}); n.blendMode.opacity.value = LOOK_NOISE;
    const tm = X('agx') ? ToneMappingMode.AGX : X('aces') ? ToneMappingMode.ACES_FILMIC : X('reinhard') ? ToneMappingMode.REINHARD2 : ToneMappingMode.NEUTRAL;
    const A = LOOK_PREM.ao, ao = new AOPass(camera as THREE.PerspectiveCamera, {radius: XV('aor', A.radius), strength: XV('ao', A.strength), bias: 0.004, color: A.color, scale: A.scale, gain: XV('aog', A.gain)});
    const cv = LOOK_COLOUR ? new ColourEffect(LOOK_COLOUR.day) : null;   // COLOUR v2 hue-aware vibrance (null = v5)
    return {ao, ink: new InkPass(scene, camera as THREE.PerspectiveCamera), bloom: b, tone: new ToneMappingEffect({mode: tm}), grade: g, noise: n, lens: new LensBlur({maxCoC: 18, nearScale: 1.1}), cv};
  }, [camera, scene]);
  fx.lens.focus = Math.max(0.3, focus); fx.lens.cInf = cInf * LOOK_DOF.cInfScale; fx.lens.farDim = 0.08;
  { const G = LOOK_GRADE[tod]; fx.grade.set({...G, sat: [G.sat[0], G.sat[1], XV('hsat', G.sat[2])]}, GRADE_NIGHT, k); } fx.bloom.intensity = LOOK_BLOOM.intensity + 0.25 * k;   // LOOK
  // PREMIUM experiments (values move to look.ts once chosen)
  const P = LOOK_PREM;
  PREM.premCookie.value.x = XV('cookie', P.cookie.strength); PREM.premCookie.value.y = XV('ck', P.cookie.tile); PREM.premMacro.value.x = XV('macro', P.macro); PREM.premMacro.value.w = XV('macroh', P.macroGround); PREM.premGround.value.x = XV('ground', P.ground);
  fx.ao.enabledAO = XV('ao', P.ao.strength) > 0; fx.ao.debug = XV('aodbg', 0);
  { camera.updateMatrixWorld(); _sv.copy(anchor).project(camera); }   // subject light pool follows the camera subject on screen
  fx.ao.set({subj: new THREE.Vector2(_sv.x * 0.5 + 0.5, _sv.y * 0.5 + 0.5), pool: [XV('pool', P.pool.gain), XV('edge', P.pool.edge), XV('poolr', P.pool.radius)], fg: [XV('fg', 0), 0.35, 0.85], focus});
  fx.bloom.luminanceMaterial.threshold = XV('bt', LOOK_BLOOM.threshold); fx.bloom.intensity *= XV('bi', 1);
  fx.ink.set(P.ink);
  if (fx.cv && LOOK_COLOUR) fx.cv.set(LOOK_COLOUR[tod]);
  if (X('nograde')) fx.grade.amount = 0; if (X('nolens')) fx.lens.cInf = 0; if (X('nonoise')) fx.noise.blendMode.opacity.value = 0; if (X('nobloom')) fx.bloom.intensity = 0;
  useEffect(() => () => { fx.ink.dispose(); fx.lens.dispose(); fx.ao.dispose(); }, [fx]);
  return useMemo(() => (
    <EffectComposer multisampling={4}>
      <primitive object={fx.ao} dispose={null} /><primitive object={fx.bloom} dispose={null} />{!X('noink') && <primitive object={fx.ink} dispose={null} />}
      <primitive object={fx.lens.pre} dispose={null} /><primitive object={fx.lens.main} dispose={null} />
      {!X('notone') && <primitive object={fx.tone} dispose={null} />}{fx.cv && !X('nocolour') && <primitive object={fx.cv} dispose={null} />}<primitive object={fx.grade} dispose={null} /><primitive object={fx.noise} dispose={null} />
    </EffectComposer>), [fx]);
};

// ---------- captions (matched to Ricks Clips: 1-3 words, lowercase, white heavy + black outline, ~74px@1080 ascender 54px, centre 70 % height, hard swap) ----------
const Caption: React.FC<{f: number; width: number; height: number}> = ({f, width, height}) => {
  const t = f / 30; let ci = -1;
  for (let i = 0; i < CAPS.length; i++) if (WORDS[CAPS[i][0]][1] <= t) ci = i;
  if (ci < 0) return null;
  const [a, b] = CAPS[ci], end = WORDS[b][2] + 0.6, next = CAPS[ci + 1] ? WORDS[CAPS[ci + 1][0]][1] : 1e9;
  if (t > Math.min(end, next)) return null;
  const txt = WORDS.slice(a, b + 1).map((w) => w[0]).join(' ').replace(/["\u201d\u201c]/g, '').toLowerCase();
  const k = width / 1080;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: height * 0.703, transform: 'translateY(-50%)', textAlign: 'center',
      fontFamily: '"Archivo Black", Impact, sans-serif', fontSize: 74 * k, lineHeight: 1.1, color: '#fff', letterSpacing: 0.5 * k,
      WebkitTextStroke: `${11 * k}px #000`, paintOrder: 'stroke fill', textShadow: `0 ${4 * k}px 0 rgba(0,0,0,.5)`, padding: `0 ${50 * k}px`}}>{txt}</div>
  );
};

// ---------- main ----------
const fontsReady = typeof document !== 'undefined' ? document.fonts.load('400 80px "Archivo Black"').then(() => document.fonts.ready) : Promise.resolve();
/** the composition every video renders (story = @story) */
export const Video: React.FC = () => {
  const f = useCurrentFrame(), {width, height} = useVideoConfig();
  const [ready, setReady] = useState(false);
  const [h] = useState(() => delayRender('fonts'));
  useEffect(() => { fontsReady.then(() => { setReady(true); continueRender(h); }); }, [h]);
  if (!ready) return null;
  return <Inner f={warp(f / 30) * 30} rt={f / 30} width={width} height={height} />;
};
const Inner: React.FC<{f: number; rt: number; width: number; height: number}> = ({f, rt, width, height}) => {
  const d = useSetData(), st = stage(f), cc = camAt(rt), cam = cc.p, k = moodAt(f), fl = flashAt(rt), vel = velocities(f, st);
  const tod = todAt(f), FG = LOOK_FOG[tod];   // LOOK
  setCharTint(new THREE.Color(LOOK_CHAR_TINT[tod]).lerp(new THREE.Color('#a3aedb'), k));
  { const sh = shotAt(f), sw = st.extra.includes('sunsweep') ? (sh.t - 0.5) * 2 : 0; setFaceLight(tod, k, sunOffset(LOOK_LIGHT[tod].sunOff, sw)); }   // engine v2
  const bg = new THREE.Color(LOOK_BG[tod]).lerp(new THREE.Color('#1a2350'), k), fogC = new THREE.Color(FG.color).lerp(new THREE.Color('#1a2350'), k);
  const voice = (getInputProps() as any).voice !== false;
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {voice && AUDIO.voice && <Audio src={staticFile(AUDIO.voice)} />}
      {AUDIO.bed && <Audio src={staticFile(AUDIO.bed)} />}
      <div style={{position: 'absolute', inset: 0, filter: cc.blur > 0.5 ? `blur(${cc.blur}px)` : undefined, transform: cc.blur > 0.5 ? `scale(${1 + cc.blur * 0.004})` : undefined}}>
      <ThreeCanvas width={width} height={height} shadows="percentage" gl={{antialias: false}} camera={{fov: 38, near: 0.05, far: 450}}>
        <color attach="background" args={[bg]} />
        {!X('nofog') && <fog attach="fog" args={[fogC, FG.near, FG.far]} />}
        <Rig c={cc} />
        <Lights f={f} extra={st.extra} at={cc.anchor} />
        <SetBefore d={d} f={f} st={st} cam={cam} vel={vel} tod={tod} />
        {st.people.map((p, i) => (!p.bg || Math.abs(p.p[0] - cam.x) < 32) && <Character key={i} c={p} f={f} cam={cam} vel={vel[i]} />)}
        <SetAfter d={d} f={f} st={st} cam={cam} vel={vel} tod={tod} />
        <FX f={f} people={st.people} carts={st.carts} cam={cam} />
        <Post k={k} focus={cc.focus} cInf={cc.cInf} tod={tod} anchor={cc.anchor} />
      </ThreeCanvas>
      </div>
      {fl > 0 && <AbsoluteFill style={{backgroundColor: '#fff', opacity: fl}} />}
      <Caption f={f} width={width} height={height} />
    </AbsoluteFill>
  );
};

