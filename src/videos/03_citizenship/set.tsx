// SET (story 03_citizenship): Tokyo street (kit Town, re-themed in world.ts + dressed with the detail library) and four interior cells.
// Dynamic props come from Stage.extra strings: pass:x,y,z,glow | baby:x,y,z | paper:x,y,z,mark | stack:x,y,z | qm:x,y,z,u | scale:tilt | beam:u | stamp:usa,japan | ticket:n
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {lookToon, type Tod} from '../../engine/look/look';
import {Town, StreetClock} from '../../engine/kits/downtown/town';
import {Car} from '../../engine/kits/downtown/street';
import {NEAR_Z} from '../../engine/kits/downtown/townData';
import {CELL, OFFICE} from './world';
import {BOX, SPH, CYL, PLN, Bx, Sp, Cy, toon, shiny, glowM, canvasTex, textTex, Sign, GlossFloor, Poster, Vending, Bike, Plant, Lantern, WallClock, Bench, Desk, Flag, PowerLine, Sakura, Nobori, Crosswalk, Bollard, Mailbox, TrafficLight, Stanchion, Lockers, Globe, Cranes, MobileToy, Cloud, PlaneModel, Pagoda, Suitcase, Tower, CeilingLamp, Backdrop, type V3} from './detail';
import {shotAt, type Stage} from './stage';
export const AUDIO: {voice: string | null; bed: string | null} = {voice: '03_citizenship/voice.mp3', bed: null};
export const useSetData = () => ({});
type P = {d: any; f: number; st: Stage; cam: THREE.Vector3; vel: (THREE.Vector3 | null)[]; tod: Tod};
const num = (s: string) => s.split(',').map(Number);

const Shell: React.FC<{cx: number; col: string}> = ({cx, col}) => {
  const m = useMemo(() => lookToon({color: col, side: THREE.BackSide}), [col]);
  return <mesh position={[cx, CELL.h / 2, CELL.cz]} scale={[CELL.w, CELL.h, CELL.z1 - CELL.z0]} geometry={BOX} material={m} castShadow receiveShadow />;
};
const skyTex = () => canvasTex('sky', 1024, 480, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#79b8f0'); gr.addColorStop(1, '#fbe3c4'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.9)'; for (const [x, y, r] of [[160, 90, 46], [230, 100, 38], [700, 70, 50], [780, 84, 36]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  for (let i = 0; i < 16; i++) { const bw = 40 + (i * 37) % 50, bh = 80 + (i * 91) % 200, x = i * 66 - 10; g.fillStyle = ['#6f86b8', '#8a9cc8', '#5a6c9e', '#a3b2d6'][i % 4]; g.fillRect(x, h - bh, bw, bh);
    g.fillStyle = 'rgba(255,240,180,.8)'; for (let yy = h - bh + 10; yy < h - 8; yy += 22) for (let xx = x + 6; xx < x + bw - 8; xx += 14) g.fillRect(xx, yy, 6, 9); }
  g.fillStyle = '#e8483a'; g.beginPath(); g.moveTo(512, 40); g.lineTo(560, h); g.lineTo(464, h); g.closePath(); g.fill(); g.fillStyle = '#fff'; for (let i = 0; i < 5; i++) g.fillRect(494 + i * 3, 120 + i * 55, 36 - i * 6, 10);
});
const mapTex = () => canvasTex('map', 1024, 768, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2a6fb0'); gr.addColorStop(1, '#1d4f8a'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 2; for (let i = 0; i <= 16; i++) { g.beginPath(); g.moveTo(i * w / 16, 0); g.lineTo(i * w / 16, h); g.stroke(); } for (let j = 0; j <= 12; j++) { g.beginPath(); g.moveTo(0, j * h / 12); g.lineTo(w, j * h / 12); g.stroke(); }
  const land = (pts: number[][], c: string) => { g.fillStyle = c; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 4; g.stroke(); };
  land([[560, 150], [720, 120], [900, 200], [940, 330], [800, 420], [650, 380], [580, 300]], '#5aa86a');   // big continent (right)
  land([[80, 200], [260, 150], [330, 260], [280, 380], [160, 420], [90, 330]], '#6cb46c');                    // west continent (left)
  land([[300, 470], [420, 450], [470, 600], [380, 700], [310, 620]], '#7cba6a');
  land([[505, 190], [530, 175], [542, 215], [520, 240]], '#e8483a');                                       // JAPAN (red) near the left-centre of the map
  g.fillStyle = 'rgba(255,255,255,.5)'; for (let i = 0; i < 60; i++) g.fillRect((i * 97) % w, (i * 53) % h, 3, 3);
});
const Passport: React.FC<{p: V3; glow: number; f: number}> = ({p, glow, f}) => {
  const halo = useMemo(() => new THREE.MeshBasicMaterial({color: '#ffd45a', transparent: true, opacity: 0.4, toneMapped: false, depthWrite: false}), []);
  return <group position={p} rotation={[0.2, 0, 0.1]}>
    <Bx p={[0, 0, 0]} s={[0.3, 0.42, 0.05]} m={shiny('#1d2f6a')} cast={false} /><Cy p={[0, 0.03, 0.03]} r={0.07} h={0.01} m={shiny('#e8c860')} rz={Math.PI / 2} />
    <Bx p={[0, -0.12, 0.03]} s={[0.18, 0.02, 0.01]} m={toon('#e8c860')} cast={false} />
    {glow > 0.02 && <mesh geometry={SPH} material={halo} scale={[0.2 * (1 + 0.1 * Math.sin(f * 0.2)) * glow, 0.24 * glow, 0.12]} />}
  </group>;
};
const Baby: React.FC<{p: V3}> = ({p}) => <group position={p}>
  <Sp p={[0, 0, 0]} r={[0.15, 0.12, 0.22]} m={toon('#fff2e0')} /><Sp p={[0, 0.1, 0.17]} r={0.11} m={toon('#f8e0cc')} /><Sp p={[0, 0.19, 0.17]} r={[0.115, 0.06, 0.115]} m={toon('#f4a0b0')} />
  {[-0.04, 0.04].map((x) => <Sp key={x} p={[x, 0.11, 0.275]} r={0.014} m={toon('#241726')} />)}<Sp p={[0, 0.07, 0.275]} r={[0.02, 0.01, 0.01]} m={toon('#e0707a')} /></group>;
const QMarks: React.FC<{p: V3; u: number; f: number}> = ({p, u, f}) => {
  const ms = useMemo(() => new THREE.MeshBasicMaterial({map: canvasTex('qm', 128, 128, (g) => { g.fillStyle = '#ffd23a'; g.strokeStyle = '#241726'; g.lineWidth = 10; g.font = '900 120px "Archivo Black", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeText('?', 64, 70); g.fillText('?', 64, 70); }), transparent: true, toneMapped: false}), []);
  if (u < 0.02) return null;
  return <group position={p}>{[[-0.5, 0.2, 0.0], [0.5, 0.3, 0.8], [0.0, 0.6, 1.6]].map((q, i) => <mesh key={i} geometry={PLN} material={ms} position={[q[0], q[1] + 0.05 * Math.sin(f * 0.13 + q[2]), 0.1 * i]} scale={[0.34 * u, 0.34 * u, 1]} rotation={[0, 0, 0.2 * (i - 1) + 0.08 * Math.sin(f * 0.1 + i)]} />)}</group>;
};
const Check: React.FC<{p: V3; ok: boolean; u: number; size?: number}> = ({p, ok, u, size = 0.7}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({map: canvasTex(ok ? 'ck' : 'xx', 128, 128, (g) => { g.lineCap = 'round'; g.lineWidth = 22; g.strokeStyle = ok ? '#2fbf5a' : '#e8302a'; g.beginPath(); if (ok) { g.moveTo(24, 70); g.lineTo(52, 100); g.lineTo(106, 30); } else { g.moveTo(26, 26); g.lineTo(102, 102); g.moveTo(102, 26); g.lineTo(26, 102); } g.stroke(); }), transparent: true, toneMapped: false}), [ok]);
  return u < 0.02 ? null : <mesh geometry={PLN} material={m} position={p} scale={[size * (1 + 0.5 * (1 - u)) * u, size * (1 + 0.5 * (1 - u)) * u, 1]} />;
};

// ---------- cells ----------
const Hospital: React.FC<{f: number; lit: boolean}> = ({f, lit}) => {
  const cx = CELL.hospital, z0 = CELL.z0, sky = useMemo(() => new THREE.MeshBasicMaterial({map: skyTex(), toneMapped: false}), []);
  const mon = useMemo(() => glowM(0.3, 1.6, 0.6), []);
  return <group>
    <Shell cx={cx} col='#e7f2ee' />
    <GlossFloor p={[cx, 0.005, CELL.cz]} s={[CELL.w, 12]} base='#d4e8e2' line='#a9cbc4' streak={0.22} />
    <mesh geometry={PLN} material={sky} position={[cx, 2.1, z0 + 0.06]} scale={[5.4, 2.3, 1]} />
    <Bx p={[cx, 3.3, z0 + 0.1]} s={[5.7, 0.14, 0.12]} m={toon('#fbfbfb')} /><Bx p={[cx, 0.92, z0 + 0.15]} s={[5.7, 0.14, 0.32]} m={toon('#fbfbfb')} />
    {[-2.8, 2.8].map((x) => <Bx key={x} p={[cx + x, 2.1, z0 + 0.1]} s={[0.14, 2.5, 0.12]} m={toon('#fbfbfb')} />)}
    {[-3.4, 3.4].map((x) => <Bx key={x} p={[cx + x, 1.9, z0 + 0.3]} s={[0.7, 2.7, 0.2]} m={toon('#59b8b0')} />)}
    {/* bed + blanket + pillow, bassinet, monitor, IV stand, flowers, cross sign, posters */}
    <group position={[cx + 2.4, 0, -73.4]}><Bx p={[0, 0.4, 0]} s={[1.0, 0.45, 2.0]} m={toon('#f4f6f8')} /><Bx p={[0, 0.65, 0.3]} s={[0.96, 0.12, 1.3]} m={toon('#8cc8e8')} /><Bx p={[0, 0.7, -0.75]} s={[0.7, 0.14, 0.4]} m={toon('#ffffff')} /><Bx p={[0, 0.85, -1.05]} s={[1.05, 0.8, 0.08]} m={toon('#d9b27a')} /></group>
    <group position={[cx - 2.6, 0, -73.2]}><Bx p={[0, 0.55, 0]} s={[0.9, 0.35, 0.55]} m={toon('#fdf4e6')} /><Bx p={[0, 0.8, 0]} s={[0.9, 0.2, 0.06]} m={toon('#f4a0b0')} />{[-0.4, 0.4].map((x) => [-0.22, 0.22].map((z) => <Cy key={x + '_' + z} p={[x, 0.2, z]} r={0.03} h={0.4} m={shiny('#c8ccd6')} />))}</group>
    <group position={[cx + 4.3, 0, -74.6]}><Bx p={[0, 1.3, 0]} s={[0.9, 0.7, 0.4]} m={toon('#3a4252')} /><mesh geometry={PLN} material={mon} position={[0, 1.3, 0.21]} scale={[0.7, 0.5, 1]} />
      <Bx p={[((f * 0.02) % 0.6) - 0.3, 1.3 + 0.12 * Math.sin(f * 0.5), 0.22]} s={[0.04, 0.1, 0.01]} m={toon('#101820')} cast={false} /><Bx p={[0, 0.5, 0]} s={[0.8, 1.0, 0.4]} m={toon('#c8ccd6')} /></group>
    <group position={[cx - 4.4, 0, -72.4]}><Cy p={[0, 0.9, 0]} r={0.03} h={1.8} m={shiny('#c8ccd6')} /><Bx p={[0.2, 1.75, 0]} s={[0.5, 0.04, 0.04]} m={shiny('#c8ccd6')} /><Bx p={[0.38, 1.55, 0]} s={[0.14, 0.3, 0.05]} m={toon('#bfe8ff')} /></group>
    <group position={[cx + 3.8, 0, -71.4]}><Bx p={[0, 0.35, 0]} s={[0.6, 0.7, 0.6]} m={toon('#d9b27a')} /><Cy p={[0, 0.85, 0]} r={0.1} h={0.28} m={toon('#7fc8e8')} />{[[0, 1.1, 0, '#e8483a'], [-0.1, 1.05, 0.04, '#f2b234'], [0.1, 1.05, -0.04, '#f48fb0']].map((q, i) => <Sp key={i} p={[q[0] as number, q[1] as number, q[2] as number]} r={0.1} m={toon(q[3] as string)} />)}</group>
    <Sign p={[cx - 3.9, 2.9, z0 + 0.05]} s={[0.9, 0.9]} lines={['+']} bg='#ffffff' fg='#d3221a' /><Poster p={[cx - 5.45, 1.8, -70]} s={[0.7, 1.0]} seed={1} ry={Math.PI / 2} /><Poster p={[cx - 5.45, 1.8, -72.2]} s={[0.7, 1.0]} seed={3} ry={Math.PI / 2} />
    <Plant p={[cx - 4.8, 0, -74.8]} s={1.3} /><WallClock p={[cx + 5.4, 2.7, -72]} f={f} ry={-Math.PI / 2} />
    <MobileToy p={[cx - 2.6, 1.5, -73.2]} f={f} /><Bx p={[cx - 5.35, 1.0, -70]} s={[0.08, 0.06, 11.6]} m={toon('#c8d8d4')} cast={false} /><Bx p={[cx, 3.35, -74.2]} s={[10, 0.05, 0.05]} m={toon('#cfcfd8')} cast={false} />
    <group position={[cx - 4.6, 0, -74.3]}><Bx p={[0, 0.5, 0]} s={[1.2, 1.0, 0.5]} m={toon('#f4f6f8')} />{[0, 1, 2].map((i) => <Bx key={i} p={[0, 0.25 + i * 0.3, 0.26]} s={[1.0, 0.02, 0.01]} m={toon('#9ab0ac')} cast={false} />)}<Sp p={[0.3, 1.1, 0]} r={0.1} m={toon('#f48fb0')} /><Bx p={[-0.25, 1.08, 0]} s={[0.2, 0.16, 0.2]} m={toon('#8fd4f4')} /></group>
    <Bx p={[cx, 0.012, -68]} s={[10, 0.01, 0.2]} m={toon('#59b8b0')} cast={false} /><Poster p={[cx + 5.45, 1.7, -69.2]} s={[0.9, 0.7]} seed={2} ry={-Math.PI / 2} /><CeilingLamp p={[cx - 2.2, 3.4, -70]} /><CeilingLamp p={[cx + 2.2, 3.4, -70]} />
    {lit && <><pointLight position={[cx, 2.9, -71]} intensity={16} distance={13} decay={1.4} color='#fff1de' /><pointLight position={[cx, 2.4, -75]} intensity={9} distance={8} decay={1.5} color='#bfe4ff' /></>}
  </group>;
};
const School: React.FC<{f: number; lit: boolean}> = ({f, lit}) => {
  const cx = CELL.school, z0 = CELL.z0;
  const board = useMemo(() => new THREE.MeshBasicMaterial({map: canvasTex('board', 1024, 384, (g, w, h) => { g.fillStyle = '#1f4a3c'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d9b27a'; g.lineWidth = 16; g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = 'rgba(255,255,255,.92)'; g.font = '900 120px "Archivo Black", Impact, sans-serif'; g.textAlign = 'center'; g.fillText('KONNICHIWA', w / 2, 170); g.font = '900 70px "Archivo Black", Impact, sans-serif'; g.fillText('A  I  U  E  O', w / 2, 290);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(40, 300, w - 80, 30); })}), []);
  return <group>
    <Shell cx={cx} col='#f4ead0' />
    <GlossFloor p={[cx, 0.005, CELL.cz]} s={[CELL.w, 12]} base='#d6ac72' line='#b88a4c' streak={0.2} />
    <mesh geometry={PLN} material={board} position={[cx, 1.9, z0 + 0.06]} scale={[5.2, 1.95, 1]} />
    <Bx p={[cx, 0.95, z0 + 0.12]} s={[5.3, 0.06, 0.2]} m={toon('#d9b27a')} />
    <group position={[cx + 4.3, 0, -73.5]}><Bx p={[0, 0.7, 0]} s={[1.1, 0.06, 0.6]} m={toon('#b8844a')} /><Bx p={[0, 0.35, 0]} s={[1.0, 0.7, 0.5]} m={toon('#a8743a')} /></group>
    {[-3, -1, 1, 3].map((x) => [-72.2, -70.4, -68.6].map((z) => <Desk key={x + '_' + z} p={[cx + x, 0, z]} />))}
    {/* right wall windows with sunlight bars, left shelves + posters, clock, flag */}
    {[-72.5, -69.5, -66.5].map((z, i) => <group key={i}><Bx p={[cx + 5.45, 2.0, z]} s={[0.05, 1.5, 1.6]} m={toon('#fbfbfb')} cast={false} /><mesh geometry={PLN} material={glowM(1.5, 1.4, 1.1)} position={[cx + 5.4, 2.0, z]} scale={[1.4, 1.3, 1]} rotation={[0, -Math.PI / 2, 0]} /></group>)}
    <Bx p={[cx - 5.3, 0.6, -71]} s={[0.4, 1.2, 4]} m={toon('#c8844a')} />{[0, 1, 2, 3, 4, 5].map((i) => <Bx key={i} p={[cx - 5.25, 1.35, -72.6 + i * 0.55]} s={[0.25, 0.3, 0.4]} m={toon(['#e8483a', '#3a7ad6', '#f2b234', '#2f9a5a'][i % 4])} cast={false} />)}
    <Poster p={[cx - 5.45, 2.4, -68.5]} s={[0.8, 1.1]} seed={0} ry={Math.PI / 2} /><Poster p={[cx - 5.45, 2.4, -66.8]} s={[0.8, 1.1]} seed={2} ry={Math.PI / 2} />
    <WallClock p={[cx + 3.2, 3.1, z0 + 0.1]} f={f} /><Flag p={[cx - 4.6, 0, -75.2]} />
    <Lockers p={[cx + 2.9, 0, z0 + 0.3]} n={4} /><Globe p={[cx + 4.3, 0.73, -73.5]} f={f} /><Cranes a={[cx - 5, 3.2, -70]} b={[cx + 5, 3.2, -70]} /><Cranes a={[cx - 5, 3.2, -73]} b={[cx + 5, 3.2, -73]} />
    <CeilingLamp p={[cx - 3, 3.4, -71]} /><CeilingLamp p={[cx + 3, 3.4, -71]} /><CeilingLamp p={[cx, 3.4, -67]} /><Poster p={[cx - 3.2, 3.0, z0 + 0.08]} s={[0.9, 0.6]} seed={1} /><Plant p={[cx + 5.0, 0, -65.2]} s={1.2} />
    {lit && <><pointLight position={[cx, 3.0, -70]} intensity={18} distance={14} decay={1.4} color='#fff4dc' /><pointLight position={[cx + 4.5, 2.2, -69]} intensity={10} distance={8} decay={1.5} color='#ffe8b0' /></>}
  </group>;
};
const Office: React.FC<{f: number; no: number; lit: boolean}> = ({f, no, lit}) => {
  const cx = CELL.office, z0 = CELL.z0, glass = useMemo(() => new THREE.MeshBasicMaterial({color: '#bfe6ff', transparent: true, opacity: 0.22, depthWrite: false}), []);
  const led = useMemo(() => new THREE.MeshBasicMaterial({map: canvasTex('led' + no, 256, 128, (g, w, h) => { g.fillStyle = '#1a0a0a'; g.fillRect(0, 0, w, h); g.fillStyle = '#ff3a2a'; g.font = '900 96px "Archivo Black", Impact, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('NO.' + no, w / 2, h / 2 + 4); }), toneMapped: false}), [no]);
  return <group>
    <Shell cx={cx} col='#e8e0cc' />
    <GlossFloor p={[cx, 0.005, CELL.cz]} s={[CELL.w, 12]} base='#e9dfc9' line='#c9b99a' streak={0.28} />
    {[-3, 3].map((x) => <Bx key={x} p={[cx + x, 0.012, -70]} s={[0.12, 0.01, 10]} m={toon('#f2b234')} cast={false} />)}
    {/* counter with glass partition and two service windows */}
    <Bx p={[cx, 0.52, OFFICE.counterZ]} s={[7.2, 1.05, 0.7]} m={toon('#a88458')} /><Bx p={[cx, 1.08, OFFICE.counterZ]} s={[7.3, 0.06, 0.8]} m={shiny('#e8e0cc')} />
    <mesh geometry={PLN} material={glass} position={[cx, 1.75, OFFICE.counterZ + 0.2]} scale={[7.2, 1.3, 1]} />{[-3.6, -1.2, 1.2, 3.6].map((x) => <Bx key={x} p={[cx + x, 1.75, OFFICE.counterZ + 0.2]} s={[0.07, 1.3, 0.07]} m={shiny('#c8ccd6')} />)}
    <Sign p={[cx, 2.95, z0 + 0.05]} s={[3.4, 0.8]} lines={['PASSPORT']} bg='#1d3a6e' fg='#ffffff' /><mesh geometry={PLN} material={led} position={[cx - 3.4, 2.95, z0 + 0.05]} scale={[1.3, 0.65, 1]} />
    {[-2.4, 0, 2.4].map((x, i) => <Sign key={x} p={[cx + x, 2.45, OFFICE.counterZ + 0.25]} s={[0.5, 0.5]} lines={[String(i + 1)]} bg='#1d3a6e' fg='#fff36a' />)}
    {[-3.3, -2.4, -1.5, -0.6, 0.3, 1.2, 2.1, 3.0].map((x) => <Bx key={x} p={[cx + x, 0.5, OFFICE.counterZ + 0.355]} s={[0.05, 0.8, 0.01]} m={toon('#4a3220')} cast={false} />)}<Bx p={[cx, 0.07, OFFICE.counterZ + 0.36]} s={[7.1, 0.12, 0.02]} m={shiny('#d8c070')} cast={false} />
    <Stanchion a={[cx - 4.6, 0, -71.4]} b={[cx - 2.0, 0, -71.4]} /><Stanchion a={[cx - 2.0, 0, -71.4]} b={[cx + 1.2, 0, -71.4]} /><Stanchion a={[cx + 1.2, 0, -71.4]} b={[cx + 4.4, 0, -71.4]} />
    <group position={[cx - 4.9, 0, -72.8]}><Bx p={[0, 0.8, 0]} s={[0.3, 1.6, 0.7]} m={toon('#c8ccd6')} />{[0, 1, 2, 3].map((i) => <Bx key={i} p={[0.17, 0.5 + i * 0.3, 0]} s={[0.03, 0.22, 0.5]} m={toon(['#e8483a', '#3a7ad6', '#f2b234', '#2f9a5a'][i])} cast={false} />)}</group>
    <group position={[cx + 4.9, 0, -69]}><Bx p={[0, 0.5, 0]} s={[0.4, 1.0, 0.4]} m={shiny('#e8f2f8')} /><Cy p={[0, 1.25, 0]} r={0.16} h={0.45} m={toon('#8fd4f4')} /></group>
    {[-3, 0, 3].map((x) => <CeilingLamp key={'c' + x} p={[cx + x, 3.42, -70]} />)}<Poster p={[cx + 5.45, 1.9, -67.8]} s={[0.8, 1.1]} seed={2} ry={-Math.PI / 2} />
    <group position={[cx + 4.6, 0, -73]}><Bx p={[0, 0.7, 0]} s={[0.55, 1.4, 0.5]} m={shiny('#d3221a')} /><Bx p={[0, 1.15, 0.26]} s={[0.4, 0.3, 0.02]} m={toon('#101820')} cast={false} /><Bx p={[0.0, 0.8, 0.26]} s={[0.3, 0.08, 0.02]} m={toon('#fbf8f0')} cast={false} /></group>
    <Bench p={[cx - 3.2, 0, -67.2]} ry={Math.PI} /><Bench p={[cx + 0.2, 0, -67.2]} ry={Math.PI} />
    <Flag p={[cx - 5.0, 0, -75.3]} /><Plant p={[cx + 5.0, 0, -75.2]} s={1.5} /><Plant p={[cx + 5.0, 0, -65.2]} s={1.3} /><WallClock p={[cx + 3.4, 2.95, z0 + 0.1]} f={f} />
    <Poster p={[cx - 5.45, 1.9, -71]} s={[0.8, 1.1]} seed={1} ry={Math.PI / 2} /><Poster p={[cx - 5.45, 1.9, -69.6]} s={[0.8, 1.1]} seed={3} ry={Math.PI / 2} /><Poster p={[cx + 5.45, 1.9, -70.5]} s={[0.8, 1.1]} seed={0} ry={-Math.PI / 2} />
    {[-3, 0, 3].map((x) => <mesh key={x} geometry={BOX} material={glowM(1.6, 1.55, 1.4)} position={[cx + x, CELL.h - 0.04, -70]} scale={[1.8, 0.04, 8]} />)}
    {lit && <><pointLight position={[cx, 3.0, -70]} intensity={20} distance={14} decay={1.4} color='#fff6e4' /><pointLight position={[cx, 2.0, -74.5]} intensity={8} distance={7} decay={1.5} color='#cfe6ff' /></>}
  </group>;
};
const MapCell: React.FC<{f: number; tilt: number; beam: number; stamp: [number, number]; showScale: boolean; showBoards: boolean; lit: boolean}> = ({f, tilt, beam, stamp, showScale, showBoards, lit}) => {
  const cx = CELL.map, mm = useMemo(() => new THREE.MeshBasicMaterial({map: mapTex()}), []);
  const dot = useMemo(() => glowM(1.8, 1.4, 0.4), []), gold = useMemo(() => glowM(1.9, 1.5, 0.5), []);
  const a: V3 = [cx + 3.0, 0.3, -72.4], b: V3 = [cx - 3.2, 0.3, -68.4];
  return <group>
    <Shell cx={cx} col='#16264a' />
    <Backdrop p={[cx, 2.0, CELL.z0 + 0.05]} s={[CELL.w, 4]} /><Backdrop p={[cx - 5.45, 2.0, CELL.cz]} s={[12, 4]} ry={Math.PI / 2} /><Backdrop p={[cx + 5.45, 2.0, CELL.cz]} s={[12, 4]} ry={-Math.PI / 2} />
    <Cloud p={[cx - 3, 3.0, -72]} s={0.9} f={f} /><Cloud p={[cx + 2, 2.7, -69]} s={1.1} f={f} /><Cloud p={[cx + 4, 3.1, -74]} s={0.8} f={f} /><Cloud p={[cx - 1, 2.9, -66]} s={1.0} f={f} />
    <Pagoda p={[cx - 3.9, 0.02, -67.6]} s={0.9} /><Tower p={[cx - 2.6, 0.02, -67.2]} h={1.3} col='#6f86b8' /><Tower p={[cx - 2.0, 0.02, -67.8]} h={1.8} col='#8a9cc8' />
    <Tower p={[cx + 3.8, 0.02, -73.6]} h={1.5} col='#a3b2d6' /><Tower p={[cx + 4.5, 0.02, -73.0]} h={1.1} col='#6f86b8' /><Suitcase p={[cx + 2.4, 0.02, -71.2]} col='#e8483a' ry={0.4} /><Suitcase p={[cx + 2.0, 0.02, -71.0]} col='#2a9ad6' ry={-0.3} />
    <PlaneModel p={[cx - 0.1 + 0.8 * Math.sin(f * 0.02), 1.9, -70.4]} ry={-2.57} />
    <mesh geometry={PLN} material={mm} position={[cx, 0.012, CELL.cz]} scale={[CELL.w - 0.6, 11.4, 1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
    {/* dotted flight arc (animated dots) from the far pin to Japan */}
    {Array.from({length: 22}, (_, i) => { const u = (i / 22 + f * 0.004) % 1, x = a[0] + (b[0] - a[0]) * u, z = a[2] + (b[2] - a[2]) * u; return <Sp key={i} p={[x, 0.25 + 1.5 * Math.sin(u * Math.PI), z]} r={0.07} m={dot} />; })}
    <group position={[a[0], 0, a[2]]}><Cy p={[0, 0.25, 0]} r={0.03} h={0.5} m={shiny('#c8ccd6')} /><Sp p={[0, 0.55, 0]} r={0.16} m={toon('#2fbf5a', 2)} /></group>
    <group position={[b[0], 0, b[2]]}><Cy p={[0, 0.25, 0]} r={0.03} h={0.5} m={shiny('#c8ccd6')} /><Sp p={[0, 0.55, 0]} r={0.16} m={toon('#e8302a', 2)} /></group>
    {/* balance scale */}
    {showScale && <group position={[cx, 0, -70.6]}>
      <Cy p={[0, 0.9, 0]} r={0.07} h={1.8} m={shiny('#d8c070')} /><Cy p={[0, 0.04, 0]} r={0.5} h={0.08} m={shiny('#d8c070')} />
      <group position={[0, 1.8, 0]} rotation={[0, 0, tilt * 0.3]}><Bx p={[0, 0, 0]} s={[3.2, 0.08, 0.1]} m={shiny('#d8c070')} />
        {[-1.55, 1.55].map((x, i) => <group key={x} position={[x, 0, 0]} rotation={[0, 0, -tilt * 0.3]}><Bx p={[0, -0.5, 0]} s={[0.02, 1.0, 0.02]} m={shiny('#d8c070')} /><Cy p={[0, -1.0, 0]} r={0.55} h={0.06} m={shiny('#e8dca0')} />
          {i === 0 ? <Passport p={[0, -0.78, 0]} glow={1} f={f} /> : <Bx p={[0, -0.9, 0]} s={[0.3, 0.2, 0.3]} m={toon('#bfc6d4')} />}</group>)}</group></group>}
    {/* USA / JAPAN boards with check / cross stamps */}
    {showBoards && <group position={[cx - 2.6, 0, -71.0]}><Bx p={[0, 0.9, 0]} s={[2.0, 1.5, 0.08]} m={toon('#fbfbfb')} /><Sign p={[0, 0.9, 0.05]} s={[1.9, 1.4]} lines={['USA', 'BORN HERE', '= CITIZEN']} bg='#1d2a6e' fg='#ffffff' /><Cy p={[-0.8, 0.0, 0]} r={0.05} h={0.3} m={toon('#2a2a33')} /><Check p={[0.55, 1.35, 0.14]} ok u={stamp[0]} /></group>}
    {showBoards && <group position={[cx + 2.6, 0, -71.0]}><Bx p={[0, 0.9, 0]} s={[2.0, 1.5, 0.08]} m={toon('#fbfbfb')} /><Sign p={[0, 0.9, 0.05]} s={[1.9, 1.4]} lines={['JAPAN', 'BORN HERE', 'IS NOT ENOUGH']} bg='#b2191a' fg='#ffffff' /><Check p={[0.55, 1.35, 0.14]} ok={false} u={stamp[1]} /></group>}
    {/* family-tree light: gold beam flows from the parents' passports down to the child */}
    {beam > 0.02 && <group><mesh geometry={BOX} material={gold} position={[cx - 0.2, 0.95 - 0.25 * beam, -70.8]} scale={[0.05, 0.5 * beam, 0.05]} />{Array.from({length: 7}, (_, i) => { const u = (i / 7 + f * 0.02) % 1; return <Sp key={i} p={[cx - 0.2 + 0.14 * Math.sin(u * 9 + i), 0.95 - 0.55 * u, -70.8 + 0.14 * Math.cos(u * 9 + i)]} r={0.035 * beam} m={dot} />; })}</group>}
    {lit && <><pointLight position={[cx, 3.0, -70]} intensity={24} distance={14} decay={1.3} color='#fff0d6' /><pointLight position={[cx - 3, 2.0, -68]} intensity={8} distance={7} decay={1.5} color='#ff8a8a' /><pointLight position={[cx + 3, 2.0, -72]} intensity={8} distance={7} decay={1.5} color='#8affb0' /></>}
  </group>;
};
// ---------- street dressing (so the Tokyo block is not flat) ----------
const StreetDetail: React.FC<{f: number}> = ({f}) => <group>
  <Vending p={[-1.9, 0, NEAR_Z + 0.5]} col='#d6246e' /><Vending p={[-1.0, 0, NEAR_Z + 0.5]} col='#2a5f9a' /><Vending p={[11.2, 0, NEAR_Z + 0.5]} col='#2f9a5a' />
  <Bike p={[2.6, 0, NEAR_Z + 1.5]} ry={0.3} col='#d6246e' /><Bike p={[3.4, 0, NEAR_Z + 1.6]} ry={-0.2} col='#2a9ad6' /><Bike p={[-11.0, 0, NEAR_Z + 1.5]} ry={0.1} col='#f2b234' />
  <PowerLine x={-12.5} z={8.1} len={26} /><PowerLine x={13.5} z={8.1} len={18} />
  <Lantern p={[5.2, 2.2, NEAR_Z + 1.1]} f={f} /><Lantern p={[8.6, 2.2, NEAR_Z + 1.1]} f={f} /><Lantern p={[-8.6, 2.2, NEAR_Z + 1.1]} f={f} col='#2f9a5a' />
  <Poster p={[-3.0, 1.7, NEAR_Z + 0.04]} s={[0.55, 0.8]} seed={1} /><Poster p={[2.9, 1.7, NEAR_Z + 0.04]} s={[0.55, 0.8]} seed={2} /><Poster p={[-8.2, 1.4, NEAR_Z + 0.04]} s={[0.5, 0.7]} seed={3} />
  <Sakura p={[-11.4, 0, 8.0]} s={1.15} /><Sakura p={[14.6, 0, 8.0]} s={1.1} /><Sakura p={[-14.8, 0, 8.0]} s={1.0} />
  <Nobori p={[4.5, 0, NEAR_Z + 1.5]} col='#1d3a6e' text='PASS' /><Nobori p={[9.9, 0, NEAR_Z + 1.5]} col='#1d3a6e' text='PASS' /><Nobori p={[-9.9, 0, NEAR_Z + 1.5]} col='#d3221a' text='+' />
  <Crosswalk x={-16} z0={8.9} z1={17.5} /><Bollard p={[-9.0, 0, 8.45]} /><Bollard p={[-5.0, 0, 8.45]} /><Bollard p={[-0.5, 0, 8.45]} /><Bollard p={[5.0, 0, 8.45]} /><Bollard p={[9.5, 0, 8.45]} />
  <Mailbox p={[12.4, 0, NEAR_Z + 0.6]} /><TrafficLight p={[-14.2, 0, 8.45]} f={f} /><TrafficLight p={[16.2, 0, 8.45]} f={f} />
  <Plant p={[-4.3, 0, 7.9]} s={1.4} /><Plant p={[4.2, 0, 7.9]} s={1.4} /><Plant p={[12.6, 0, 7.9]} s={1.2} /><Plant p={[-12.6, 0, 7.9]} s={1.2} />
</group>;

export const SetBefore: React.FC<P> = ({f, st, tod}) => {
  const ex = st.extra, get = (k: string) => { const s = ex.find((e) => e.startsWith(k + ':')); return s ? num(s.slice(k.length + 1)) : null; };
  const all = (k: string) => ex.filter((e) => e.startsWith(k + ':')).map((e) => num(e.slice(k.length + 1)));
  const tilt = get('scale')?.[0] ?? 0, beam = get('beam')?.[0] ?? 0, stamp = (get('stamp') ?? [0, 0]) as [number, number], no = Math.round(get('ticket')?.[0] ?? 42), qm = get('qm');
  const sh = shotAt(f).name, inH = sh === 'hospital', inS = sh === 'school', inO = ['office', 'clerk', 'confused', 'records'].includes(sh), inM = ['faraway', 'question', 'usa', 'rule'].includes(sh);
  return (<>
    <Town tod={tod} /><StreetClock hours={st.clock} />
    {st.cars.map((c, i) => <Car key={i} c={c} />)}
    <StreetDetail f={f} />
    <Hospital f={f} lit={inH} /><School f={f} lit={inS} /><Office f={f} no={no} lit={inO} /><MapCell f={f} tilt={tilt} beam={beam} stamp={stamp} showScale={get('scale') !== null} showBoards={get('stamp') !== null} lit={inM} />
    {all('pass').map((q, i) => <Passport key={i} p={[q[0], q[1], q[2]]} glow={q[3] ?? 0} f={f} />)}
    {all('baby').map((q, i) => <Baby key={i} p={[q[0], q[1], q[2]]} />)}
    {all('paper').map((q, i) => <group key={i} position={[q[0], q[1], q[2]]} rotation={[0.3, 0, 0.1]}><Bx p={[0, 0, 0]} s={[0.34, 0.46, 0.015]} m={toon('#fffdf2')} cast={false} />{[0, 1, 2, 3].map((r) => <Bx key={r} p={[0, 0.14 - r * 0.07, 0.01]} s={[0.24, 0.015, 0.004]} m={toon('#8a8a96')} cast={false} />)}{q[3] > 0.5 && <Check p={[0, 0, 0.03]} ok={false} u={1} />}</group>)}
    {all('stack').map((q, i) => <group key={i} position={[q[0], q[1], q[2]]}>{[0, 1, 2, 3, 4].map((r) => <Bx key={r} p={[0.01 * (r % 2), 0.03 + r * 0.045, 0]} s={[0.42, 0.04, 0.3]} m={toon(['#fffdf2', '#f4e8c0', '#e8f2ff'][r % 3])} cast={false} />)}</group>)}
    {all('xmark').map((q, i) => <Check key={'x' + i} p={[q[0], q[1], q[2]]} ok={false} u={1} size={1.3} />)}
    {qm && <QMarks p={[qm[0], qm[1], qm[2]]} u={qm[3]} f={f} />}
    <pointLight position={[0, 4.5, 11]} intensity={4} distance={30} decay={1.2} color='#fff0dc' />
  </>);
};
export const SetAfter: React.FC<P> = () => null;
