// DETAIL LIBRARY (story 03): small reusable set dressing so no wall or floor stays flat: posters, vending machines, bikes,
// power cables, lanterns, clocks, plants, benches, desks, flags, glossy-floor sheen. All parametric, all cheap meshes.
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {lookToon} from '../../engine/look/look';
export type V3 = [number, number, number];
export const BOX = new THREE.BoxGeometry(1, 1, 1), SPH = new THREE.SphereGeometry(1, 14, 10), CYL = new THREE.CylinderGeometry(1, 1, 1, 18), PLN = new THREE.PlaneGeometry(1, 1);
const cache: Record<string, THREE.Material> = {};
export const toon = (c: string, gloss = 0) => (cache[c + gloss] ??= lookToon({color: c}, gloss));
export const shiny = (c: string) => toon(c, 2.2);                       // chrome-ish: strong specular
export const glowM = (r: number, g: number, b: number) => new THREE.MeshBasicMaterial({color: new THREE.Color(r, g, b), toneMapped: false});
export const Bx: React.FC<{p: V3; s: V3; m: THREE.Material; cast?: boolean; ry?: number; rz?: number}> = ({p, s, m, cast = true, ry = 0, rz = 0}) =>
  <mesh geometry={BOX} material={m} position={p} scale={s} rotation={[0, ry, rz]} castShadow={cast} receiveShadow />;
export const Sp: React.FC<{p: V3; r: number | V3; m: THREE.Material}> = ({p, r, m}) => <mesh geometry={SPH} material={m} position={p} scale={typeof r === 'number' ? [r, r, r] : r} castShadow />;
export const Cy: React.FC<{p: V3; r: number; h: number; m: THREE.Material; rz?: number}> = ({p, r, h, m, rz = 0}) => <mesh geometry={CYL} material={m} position={p} scale={[r, h, r]} rotation={[0, 0, rz]} castShadow />;

// ---- canvas textures ----
const texCache: Record<string, THREE.Texture> = {};
export function canvasTex(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return (texCache[key] = t);
}
const FONT = '900 {S}px "Archivo Black", Impact, sans-serif';
export function textTex(lines: string[], bg: string, fg: string, w = 512, h = 256, border = true) {
  return canvasTex('t|' + lines.join('/') + bg + fg + w, w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h); if (border) { g.lineWidth = 12; g.strokeStyle = fg; g.strokeRect(9, 9, w - 18, h - 18); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((t, i) => { let fs = (h * 0.7) / lines.length; g.font = FONT.replace('{S}', String(fs)); while (g.measureText(t).width > w * 0.84) { fs *= 0.94; g.font = FONT.replace('{S}', String(fs)); } g.fillText(t, w / 2, (h / lines.length) * (i + 0.5)); });
  });
}
export const Sign: React.FC<{p: V3; s: [number, number]; lines: string[]; bg: string; fg: string; ry?: number; lit?: number; border?: boolean}> = ({p, s, lines, bg, fg, ry = 0, lit = 1, border = true}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({map: textTex(lines, bg, fg, 512, Math.round(512 * s[1] / s[0] / 0.5) > 600 ? 512 : 256, border), color: new THREE.Color(lit, lit, lit), toneMapped: false}), [lines.join('|'), bg, fg, lit]);
  return <mesh geometry={PLN} material={m} position={p} scale={[s[0], s[1], 1]} rotation={[0, ry, 0]} />;
};
/** glossy floor: tile pattern + diagonal window reflections + a faint mirrored sheen near the walls (fake reflections) */
export const GlossFloor: React.FC<{p: V3; s: [number, number]; base: string; line: string; streak?: number}> = ({p, s, base, line, streak = 0.18}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({map: canvasTex(`fl|${base}|${line}|${streak}`, 512, 512, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h); g.strokeStyle = line; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); }
    for (let k = 0; k < 3; k++) { const gr = g.createLinearGradient(0, 0, w, h); const o = 0.15 + k * 0.3; gr.addColorStop(Math.max(0, o - 0.06), 'rgba(255,255,255,0)'); gr.addColorStop(o, `rgba(255,255,255,${streak})`); gr.addColorStop(Math.min(1, o + 0.06), 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }
    const v = g.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
  })}), [base, line, streak]);
  m.map!.wrapS = m.map!.wrapT = THREE.RepeatWrapping; m.map!.repeat.set(Math.max(1, Math.round(s[0] / 4)), Math.max(1, Math.round(s[1] / 4)));
  return <mesh geometry={PLN} material={m} position={p} scale={[s[0], s[1], 1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />;
};
/** Poster: framed colourful print; seed picks the picture */
export const Poster: React.FC<{p: V3; s: [number, number]; seed: number; ry?: number}> = ({p, s, seed, ry = 0}) => {
  const pal = [['#e8483a', '#fff3c4', '#1d2a6e'], ['#1d9a8c', '#fff8e0', '#d6246e'], ['#f2b234', '#2a2a40', '#e8483a'], ['#6a2fd6', '#fff36a', '#1d9a8c']][seed % 4];
  const m = useMemo(() => new THREE.MeshBasicMaterial({map: canvasTex('po' + seed, 256, 384, (g, w, h) => {
    g.fillStyle = pal[0]; g.fillRect(0, 0, w, h); g.fillStyle = pal[1]; g.beginPath(); g.arc(w * 0.5, h * 0.38, w * 0.28, 0, 7); g.fill();
    g.fillStyle = pal[2]; g.fillRect(w * 0.12, h * 0.74, w * 0.76, h * 0.07); g.fillRect(w * 0.12, h * 0.85, w * 0.5, h * 0.05);
    g.strokeStyle = pal[1]; g.lineWidth = 8; g.strokeRect(6, 6, w - 12, h - 12); })}), [seed]);
  return <group position={p} rotation={[0, ry, 0]}><Bx p={[0, 0, -0.012]} s={[s[0] + 0.06, s[1] + 0.06, 0.02]} m={toon('#2a2a33')} cast={false} /><mesh geometry={PLN} material={m} scale={[s[0], s[1], 1]} /></group>;
};
export const Vending: React.FC<{p: V3; col: string; ry?: number; f?: number}> = ({p, col, ry = 0, f = 0}) => {
  const lit = useMemo(() => glowM(1.5, 1.5, 1.3), []);
  return <group position={p} rotation={[0, ry, 0]}>
    <Bx p={[0, 0.9, 0]} s={[0.9, 1.8, 0.75]} m={shiny(col)} />
    <mesh geometry={PLN} material={lit} position={[0, 1.18, 0.385]} scale={[0.72, 0.84, 1]} />
    {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <Bx key={r + '_' + c} p={[-0.22 + c * 0.22, 1.46 - r * 0.2, 0.39]} s={[0.13, 0.15, 0.03]} m={toon(['#e8483a', '#2f9a5a', '#f2b234', '#3a7ad6'][(r + c) % 4])} cast={false} />))}
    <Bx p={[0, 0.3, 0.385]} s={[0.5, 0.12, 0.03]} m={toon('#1a1a22')} cast={false} />
    <Bx p={[0.32, 0.55, 0.39]} s={[0.1, 0.22, 0.03]} m={toon('#bfc6d4')} cast={false} />
  </group>;
};
export const Bike: React.FC<{p: V3; ry?: number; col?: string}> = ({p, ry = 0, col = '#d6246e'}) => <group position={p} rotation={[0, ry, 0]}>
  {[-0.42, 0.42].map((x) => <mesh key={x} position={[x, 0.32, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.31, 0.03, 8, 22]} /><meshToonMaterial color='#22222a' /></mesh>)}
  <Bx p={[0, 0.55, 0]} s={[0.9, 0.05, 0.05]} m={shiny(col)} rz={0.12} /><Bx p={[-0.05, 0.4, 0]} s={[0.05, 0.4, 0.05]} m={shiny(col)} rz={-0.5} />
  <Bx p={[0.38, 0.8, 0]} s={[0.05, 0.05, 0.4]} m={toon('#22222a')} /><Bx p={[-0.12, 0.8, 0]} s={[0.22, 0.05, 0.12]} m={toon('#22222a')} />
  <Bx p={[0.3, 0.98, 0]} s={[0.35, 0.22, 0.02]} m={toon('#f2b234')} cast={false} />
</group>;
export const Plant: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => <group position={p} scale={s}>
  <Cy p={[0, 0.18, 0]} r={0.2} h={0.36} m={toon('#b8643a')} />
  {[[0, 0.7, 0, 0.26], [-0.14, 0.58, 0.05, 0.2], [0.15, 0.62, -0.04, 0.2], [0.02, 0.9, 0.04, 0.17]].map((q, i) => <Sp key={i} p={[q[0], q[1], q[2]]} r={q[3]} m={toon(i % 2 ? '#2f9a5a' : '#3fbf6a')} />)}</group>;
export const Lantern: React.FC<{p: V3; col?: string; f?: number}> = ({p, col = '#e8483a', f = 0}) => {
  const m = useMemo(() => glowM(1.6, 0.5, 0.4), []); m.color.setRGB(1.5 + 0.2 * Math.sin(f * 0.1 + p[0]), 0.45, 0.35);
  return <group position={p}><Cy p={[0, 0.3, 0]} r={0.015} h={0.6} m={toon('#2a2a33')} />
    <mesh geometry={SPH} material={m} position={[0, 0, 0]} scale={[0.17, 0.22, 0.17]} /><Bx p={[0, 0.23, 0]} s={[0.12, 0.03, 0.12]} m={toon('#2a2a33')} cast={false} /><Bx p={[0, -0.23, 0]} s={[0.12, 0.03, 0.12]} m={toon('#2a2a33')} cast={false} /></group>;
};
export const WallClock: React.FC<{p: V3; f: number; ry?: number}> = ({p, f, ry = 0}) => {
  const t = f / 30; return <group position={p} rotation={[0, ry, 0]}>
    <Cy p={[0, 0, 0]} r={0.3} h={0.06} m={toon('#2a2a33')} rz={Math.PI / 2} />
    <mesh position={[0, 0, 0.032]} scale={[0.26, 0.26, 1]}><circleGeometry args={[1, 24]} /><meshBasicMaterial color='#fbf3e0' /></mesh>
    <Bx p={[0.02 * Math.sin(t * 0.05), 0.05, 0.04]} s={[0.02, 0.18, 0.01]} m={toon('#2a2a33')} cast={false} rz={-t * 0.05} />
    <Bx p={[0, 0.07, 0.045]} s={[0.012, 0.23, 0.01]} m={toon('#d3221a')} cast={false} rz={-t * 0.6} /></group>;
};
export const Bench: React.FC<{p: V3; len?: number; ry?: number}> = ({p, len = 2.4, ry = 0}) => <group position={p} rotation={[0, ry, 0]}>
  <Bx p={[0, 0.45, 0]} s={[len, 0.08, 0.5]} m={toon('#2a5f9a')} /><Bx p={[0, 0.85, -0.22]} s={[len, 0.4, 0.06]} m={toon('#2a5f9a')} />
  {[-1, 1].map((s) => <Bx key={s} p={[s * (len / 2 - 0.1), 0.22, 0]} s={[0.07, 0.45, 0.45]} m={shiny('#b8bec9')} />)}</group>;
export const Desk: React.FC<{p: V3}> = ({p}) => <group position={p}><Bx p={[0, 0.68, 0]} s={[0.7, 0.05, 0.5]} m={toon('#d9b27a')} />
  {[[-0.3, -0.2], [0.3, -0.2], [-0.3, 0.2], [0.3, 0.2]].map((q, i) => <Cy key={i} p={[q[0], 0.33, q[1]]} r={0.025} h={0.66} m={shiny('#b8bec9')} />)}
  <Bx p={[0, 0.2, 0.55]} s={[0.4, 0.04, 0.4]} m={toon('#c8844a')} /><Bx p={[0, 0.5, 0.74]} s={[0.4, 0.4, 0.04]} m={toon('#c8844a')} /></group>;
export const Flag: React.FC<{p: V3; ry?: number}> = ({p, ry = 0}) => <group position={p} rotation={[0, ry, 0]}>
  <Cy p={[0, 1.2, 0]} r={0.025} h={2.4} m={shiny('#d8c070')} /><Bx p={[0.45, 1.9, 0]} s={[0.9, 0.6, 0.02]} m={toon('#fbf8f0')} /><Cy p={[0.45, 1.9, 0.015]} r={0.16} h={0.01} m={toon('#d3221a')} rz={Math.PI / 2} />
  <Cy p={[0, 0.04, 0]} r={0.2} h={0.08} m={toon('#2a2a33')} /></group>;
/** power pole + cables across the street (street shots) */
export const PowerLine: React.FC<{x: number; z: number; len: number}> = ({x, z, len}) => <group position={[x, 0, z]}>
  <Cy p={[0, 3.2, 0]} r={0.08} h={6.4} m={toon('#6a5a4a')} /><Bx p={[0, 5.9, 0]} s={[1.4, 0.08, 0.08]} m={toon('#6a5a4a')} />
  {[-0.6, 0, 0.6].map((o, i) => <Bx key={i} p={[len / 2, 5.88 - i * 0.02 - Math.abs(o) * 0, o * 0.1]} s={[len, 0.02, 0.02]} m={toon('#22222a')} cast={false} />)}
  <Bx p={[0.4, 5.3, 0]} s={[0.5, 0.35, 0.3]} m={toon('#7a7a86')} /></group>;
