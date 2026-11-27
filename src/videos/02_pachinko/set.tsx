// SET (story 02_pachinko): kit street (Town, Car, StreetClock, re-themed in world.ts) + NEW pachinko props:
// hall interior (machine banks, prize counter), steel-ball bucket, exchange window in the alley, neon strips, notice board.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {lookToon, type Tod} from '../../engine/look/look';
import {Town, StreetClock} from '../../engine/kits/downtown/town';
import {Car} from '../../engine/kits/downtown/street';
import {UNITS, NEAR_Z, FAR_Z} from '../../engine/kits/downtown/townData';
import {T} from '../../engine/core/clock';
import {INT, ALLEY, XWIN, NOTICE} from './world';
import type {Stage} from './stage';
export const AUDIO: {voice: string | null; bed: string | null} = {voice: '02_pachinko/voice.mp3', bed: null};
export const useSetData = () => ({});
type P = {d: any; f: number; st: Stage; cam: THREE.Vector3; vel: (THREE.Vector3 | null)[]; tod: Tod};

// ---------- tiny helpers ----------
const BOX = new THREE.BoxGeometry(1, 1, 1), SPH = new THREE.SphereGeometry(1, 14, 10), CYL = new THREE.CylinderGeometry(1, 1, 1, 18), PLN = new THREE.PlaneGeometry(1, 1);
const cache: Record<string, THREE.Material> = {};
const toon = (c: string, gloss = 0) => (cache[c + gloss] ??= lookToon({color: c}, gloss));
const glow = (r: number, g: number, b: number) => new THREE.MeshBasicMaterial({color: new THREE.Color(r, g, b), toneMapped: false});
type V3 = [number, number, number];
const Bx: React.FC<{p: V3; s: V3; m: THREE.Material; cast?: boolean; ry?: number}> = ({p, s, m, cast = true, ry = 0}) =>
  <mesh geometry={BOX} material={m} position={p} scale={s} rotation={[0, ry, 0]} castShadow={cast} receiveShadow />;
const Sp: React.FC<{p: V3; r: number | V3; m: THREE.Material}> = ({p, r, m}) => <mesh geometry={SPH} material={m} position={p} scale={typeof r === 'number' ? [r, r, r] : r} castShadow />;
const Cy: React.FC<{p: V3; r: number; h: number; m: THREE.Material}> = ({p, r, h, m}) => <mesh geometry={CYL} material={m} position={p} scale={[r, h, r]} castShadow />;
let _sign: Record<string, THREE.Texture> = {};
function signTex(lines: string[], bg: string, fg: string, w = 512, h = 256) {
  const key = lines.join('|') + bg + fg; if (_sign[key]) return _sign[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!;
  g.fillStyle = bg; g.fillRect(0, 0, w, h); g.lineWidth = 14; g.strokeStyle = fg; g.strokeRect(10, 10, w - 20, h - 20);
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((t, i) => { let fs = (h * 0.7) / lines.length; g.font = `900 ${fs}px "Archivo Black", Impact, sans-serif`; while (g.measureText(t).width > w * 0.84) { fs *= 0.94; g.font = `900 ${fs}px "Archivo Black", Impact, sans-serif`; } g.fillText(t, w / 2, (h / lines.length) * (i + 0.5)); });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return (_sign[key] = t);
}
const SignPlane: React.FC<{p: V3; s: [number, number]; lines: string[]; bg: string; fg: string; ry?: number; lit?: boolean}> = ({p, s, lines, bg, fg, ry = 0, lit = true}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({map: signTex(lines, bg, fg), color: lit ? new THREE.Color(1.15, 1.15, 1.15) : '#ffffff', toneMapped: false}), [lines.join('|'), bg, fg]);
  return <mesh geometry={PLN} material={m} position={p} scale={[s[0], s[1], 1]} rotation={[0, ry, 0]} />;
};
/** flashing neon / panel colours: deterministic in f */
const hue = (f: number, i: number, sp = 0.012) => new THREE.Color().setHSL(((f * sp + i / 6) % 1 + 1) % 1, 0.95, 0.56).multiplyScalar(1.7);

// ---------- steel-ball bucket ----------
export const Bucket: React.FC<{p: V3; fill: number}> = ({p, fill}) => {
  const steel = toon('#c3cad6', 1.5), ball = toon('#e4e9f2', 1.5), dark = toon('#6c7586');
  const balls = useMemo(() => Array.from({length: 18}, (_, i) => [((i * 37) % 11 - 5) * 0.022, ((i * 53) % 7) * 0.012, ((i * 29) % 9 - 4) * 0.022] as V3), []);
  return <group position={p}>
    <mesh geometry={CYL} material={steel} position={[0, 0.17, 0]} scale={[0.19, 0.34, 0.19]} castShadow />
    <mesh geometry={CYL} material={dark} position={[0, 0.345, 0]} scale={[0.205, 0.03, 0.205]} />
    {fill > 0.02 && <Sp p={[0, 0.33 + 0.06 * fill, 0]} r={[0.17, 0.07 * fill + 0.01, 0.17]} m={ball} />}
    {fill > 0.3 && balls.map((b, i) => <Sp key={i} p={[b[0], 0.37 + b[1] * fill, b[2]]} r={0.022} m={ball} />)}
  </group>;
};

// ---------- hall interior ----------
const Interior: React.FC<{f: number}> = ({f}) => {
  const M = useMemo(() => ({
    pan: Array.from({length: 6}, () => glow(1, 1, 1)), lamp: Array.from({length: 6}, () => glow(1, 1, 1)), strip: glow(1.6, 1.4, 1.1),
  }), []);
  M.pan.forEach((m, i) => m.color.copy(hue(f + i * 5, i)));
  M.lamp.forEach((m, i) => m.color.copy(hue(f * 1.7 + i * 9, i + 3, 0.02)));
  const cab = toon('#e8e2f2'), cabD = toon('#3a2d5a'), trim = toon('#ffcf3a'), carpet = toon('#4b2a63'), aisle = toon('#7a3f8a'), stool = toon('#d6246e');
  const {x0, x1, z0, z1, h} = INT, w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const banks = [{x: INT.bankA, face: 1}, {x: INT.bankB, face: -1}];
  const rows = Array.from({length: INT.n}, (_, i) => INT.zStart + i * INT.pitch);
  const t = f / 30, tp = (n: string) => T('prizes', n);
  const popAt = (t0: number) => { const u = t - t0; return u < 0 ? 1 : 1 + 0.45 * Math.max(0, 1 - u / 0.4); };
  return <group>
    {/* room shell: back-face material, so a camera outside the room sees through the walls */}
    <mesh position={[cx, h / 2, cz]} scale={[w, h, d]} geometry={BOX} material={useMemo(() => lookToon({color: '#2a2050', side: THREE.BackSide}), [])} castShadow receiveShadow />
    <Bx p={[cx, -0.05, cz]} s={[w, 0.1, d]} m={carpet} cast={false} />
    <Bx p={[0, 0.004, cz]} s={[5.4, 0.02, d - 0.2]} m={aisle} cast={false} />
    {/* ceiling light strips */}
    {[-6, -2, 2, 6].map((x) => <mesh key={x} geometry={BOX} material={M.strip} position={[x, h - 0.05, cz]} scale={[0.25, 0.04, d - 1]} />)}
    {/* machine banks: cabinet + flashing glass panel + top lamp + stool */}
    {banks.map((b, bi) => rows.map((z, i) => <group key={bi + '_' + i}>
      <Bx p={[b.x, 0.95, z]} s={[0.62, 1.9, 0.5]} m={i % 2 ? cab : cabD} />
      <mesh geometry={PLN} material={M.pan[(i + bi * 2) % 6]} position={[b.x + b.face * 0.32, 1.25, z]} scale={[0.46, 0.7, 1]} rotation={[0, b.face * Math.PI / 2, 0]} />
      <mesh geometry={PLN} material={M.lamp[(i * 5 + bi) % 6]} position={[b.x + b.face * 0.32, 1.78, z]} scale={[0.46, 0.16, 1]} rotation={[0, b.face * Math.PI / 2, 0]} />
      <Bx p={[b.x + b.face * 0.45, 0.8, z]} s={[0.3, 0.1, 0.44]} m={trim} cast={false} />
      <Cy p={[b.x + b.face * 1.05, 0.22, z]} r={0.19} h={0.44} m={stool} />
    </group>))}
    {/* prize counter + back wall shelves */}
    <Bx p={[0, 0.52, INT.counterZ]} s={[4.8, 1.05, 0.7]} m={toon('#e9b64a')} />
    <Bx p={[0, 1.08, INT.counterZ]} s={[4.9, 0.06, 0.78]} m={toon('#fbf3e0')} />
    <SignPlane p={[0, 2.75, INT.shelfZ + 0.06]} s={[3.2, 0.7]} lines={['PRIZES']} bg='#1d6ad6' fg='#fff36a' />
    <Bx p={[0, 1.55, INT.shelfZ + 0.2]} s={[4.4, 0.06, 0.4]} m={toon('#c79a5c')} />
    {/* prize items, each pops on its word: cookies, chocolate, shampoo */}
    <group position={[-1.5, 1.7, INT.shelfZ + 0.2]} scale={popAt(tp('cookies'))}>{[0, 1, 2].map((i) => <Bx key={i} p={[i * 0.34 - 0.34, 0.14, 0]} s={[0.3, 0.26, 0.16]} m={toon(['#e8483a', '#f2b234', '#e8483a'][i])} />)}</group>
    <group position={[-0.1, 1.7, INT.shelfZ + 0.2]} scale={popAt(tp('chocolate'))}>{[0, 1, 2].map((i) => <Bx key={i} p={[i * 0.3 - 0.3, 0.1, 0]} s={[0.22, 0.32, 0.05]} m={toon(['#5a3a2a', '#8a5a3a', '#5a3a2a'][i])} />)}</group>
    <group position={[1.3, 1.7, INT.shelfZ + 0.2]} scale={popAt(tp('shampoo'))}>{[0, 1, 2].map((i) => <group key={i}><Cy p={[i * 0.3 - 0.3, 0.16, 0]} r={0.07} h={0.32} m={toon(['#e59aa8', '#7fb6e8', '#e59aa8'][i])} /><Cy p={[i * 0.3 - 0.3, 0.34, 0]} r={0.04} h={0.06} m={toon('#fbf3e0')} /></group>)}</group>
    {/* tokens: small plastic cards in a tray on the counter, pop on "tokens" */}
    <group position={[-1.5, 1.15, INT.counterZ + 0.05]} scale={popAt(tp('tokens'))}>
      <Bx p={[0, 0, 0]} s={[0.5, 0.05, 0.3]} m={toon('#fbf3e0')} />
      {[0, 1, 2, 3].map((i) => <Bx key={i} p={[-0.17 + i * 0.115, 0.06, 0]} s={[0.09, 0.05, 0.12]} m={toon(i % 2 ? '#ffd23a' : '#f2f6ff', 1)} />)}
    </group>
    {/* front wall door frame (glowing) */}
    <Bx p={[0, 1.2, z1 - 0.1]} s={[1.5, 2.4, 0.08]} m={toon('#fff2c0')} cast={false} />
  </group>;
};

// ---------- alley (between the hall and the separate shop) + the unmarked window ----------
const Alley: React.FC<{f: number; k: {tok: number; cash: number}}> = ({f, k}) => {
  const {x0, x1, xc, zBack, zFront} = ALLEY;
  const conc = toon('#8a8a96'), wall = toon('#d8d2c4'), frame = toon('#2a2a33'), ledge = toon('#b8b0a0');
  const cashM = useMemo(() => new THREE.MeshBasicMaterial({color: '#7fd08a'}), []);
  const tokM = toon('#ffd23a', 1), sleeve = toon('#3a4a5a'), hand = toon('#f0d2b6');
  const wz = XWIN.z, wx = XWIN.x - 0.02, y = XWIN.y;
  // tokens slide in (k.tok 0..1), the hand + cash slide out (k.cash 0..1)
  const tin = k.tok, cout = k.cash;
  return <group>
    <Bx p={[xc, -0.004, (zBack + zFront) / 2]} s={[x1 - x0, 0.03, zFront - zBack]} m={conc} cast={false} />
    <Bx p={[xc, ALLEY.h / 2, zBack]} s={[x1 - x0, ALLEY.h, 0.2]} m={wall} />
    <Bx p={[xc + 0.45, 0.45, zBack + 0.45]} s={[0.5, 0.9, 0.5]} m={toon('#9a7a52')} />
    {/* window: dark opening, no sign, small ledge */}
    <Bx p={[wx - 0.01, y, wz]} s={[0.04, 0.46, 0.8]} m={frame} cast={false} />
    <Bx p={[wx - 0.1, y - 0.25, wz]} s={[0.22, 0.05, 0.86]} m={ledge} />
    <mesh geometry={PLN} material={new THREE.MeshBasicMaterial({color: new THREE.Color(1.2, 0.95, 0.6)})} position={[wx + 0.01, y, wz]} scale={[0.5, 0.3, 1]} rotation={[0, -Math.PI / 2, 0]} />
    {/* tokens slid across the ledge */}
    {tin > 0.01 && tin < 1.2 && <group position={[wx - 0.9 + 0.8 * Math.min(1, tin), y - 0.2, wz]}>{[0, 1, 2].map((i) => <Bx key={i} p={[0, 0.03, i * 0.09 - 0.09]} s={[0.1, 0.04, 0.07]} m={tokM} cast={false} />)}</group>}
    {/* the hand from inside with cash */}
    {cout > 0.01 && <group position={[wx + 0.55 - 0.95 * Math.min(1, cout), y - 0.12, wz]}>
      <Bx p={[0.3, 0, 0]} s={[0.6, 0.12, 0.14]} m={sleeve} cast={false} />
      <Sp p={[-0.02, 0, 0]} r={[0.07, 0.06, 0.06]} m={hand} />
      <Bx p={[-0.1, 0.02, 0]} s={[0.18, 0.02, 0.1]} m={cashM} cast={false} />
    </group>}
  </group>;
};

// ---------- neon strips on the hall awnings + notice board ----------
const Neon: React.FC<{f: number}> = ({f}) => {
  const ms = useMemo(() => [glow(1, 1, 1), glow(1, 1, 1), glow(1, 1, 1)], []);
  ms.forEach((m, i) => m.color.copy(hue(f * 1.4 + i * 11, i + 1, 0.025)));
  const halls = UNITS.filter((u) => u.sign === 'PACHINKO' || u.sign === 'SLOT');
  return <group>{halls.map((u, i) => {
    const near = u.side === 1, z = near ? NEAR_Z + 1.26 : FAR_Z - 1.26;
    return <mesh key={i} geometry={BOX} material={ms[i % 3]} position={[(u.x0 + u.x1) / 2, 2.42, z]} scale={[u.x1 - u.x0 - 0.1, 0.07, 0.05]} />;
  })}</group>;
};
const Notice: React.FC = () => <group position={NOTICE}>
  <Cy p={[-0.55, 0.55, 0]} r={0.04} h={1.1} m={toon('#3a3a44')} /><Cy p={[0.55, 0.55, 0]} r={0.04} h={1.1} m={toon('#3a3a44')} />
  <Bx p={[0, 1.15, 0]} s={[1.5, 0.96, 0.06]} m={toon('#f8f4ea')} />
  <SignPlane p={[0, 1.15, 0.04]} s={[1.4, 0.86]} lines={['GAMBLING', 'IS ILLEGAL']} bg='#d3221a' fg='#fff8e0' />
</group>;

// ---------- the story's dynamic bits are encoded in Stage.extra strings ('bucket:x,y,z,fill', 'balls:x,y,z,u', 'xwin:tok,cash') ----------
const num = (s: string) => s.split(',').map(Number);
const Balls: React.FC<{f: number; a: V3; b: V3; on: number}> = ({f, a, b, on}) => {
  const m = toon('#e4e9f2', 1.5);
  if (on < 0.01) return null;
  return <group>{Array.from({length: 14}, (_, i) => { const u = (((f * 0.07 + i / 14) % 1) + 1) % 1, x = a[0] + (b[0] - a[0]) * u, y = a[1] - (a[1] - b[1]) * u * u, z = a[2] + ((i % 5) - 2) * 0.03;
    return <Sp key={i} p={[x, y, z]} r={0.024} m={m} />; })}</group>;
};
export const SetBefore: React.FC<P> = ({f, st, tod}) => {
  const ex = st.extra, get = (k: string) => { const s = ex.find((e) => e.startsWith(k + ':')); return s ? num(s.slice(k.length + 1)) : null; };
  const bk = ex.filter((e) => e.startsWith('bucket:')).map((e) => num(e.slice(7))), bl = get('balls'), xw = get('xwin');
  return (<>
    <Town tod={tod} /><StreetClock hours={st.clock} />
    {st.cars.map((c, i) => <Car key={i} c={c} />)}
    <Neon f={f} /><Notice />
    <Interior f={f} />
    <Alley f={f} k={{tok: xw ? xw[0] : 0, cash: xw ? xw[1] : 0}} />
    {bk.map((b, i) => <Bucket key={i} p={[b[0], b[1], b[2]]} fill={b[3]} />)}
    {bl && <Balls f={f} a={[bl[0], bl[1], bl[2]]} b={[bl[0] + 0.55, 0.42, bl[2] + 0.5]} on={bl[3]} />}
    {/* our own lights: neon colours in the hall, a warm bulb in the alley */}
    <pointLight position={[-3, 2.6, -70]} intensity={9} distance={10} decay={1.6} color={'#ff3fa4'} />
    <pointLight position={[3, 2.6, -68]} intensity={9} distance={10} decay={1.6} color={'#3fb8ff'} />
    <pointLight position={[0, 2.8, -76.5]} intensity={8} distance={7} decay={1.6} color={'#ffe9a8'} />
    <pointLight position={[ALLEY.xc, 3.6, 1.8]} intensity={14} distance={8} decay={1.5} color={'#ffd9a0'} />
  </>);
};
export const SetAfter: React.FC<P> = () => null;
