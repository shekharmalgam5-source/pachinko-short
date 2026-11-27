// WORLD (story 02_pachinko): re-themes the kit's downtown block into a modern-Japan pachinko street and holds the
// story's fixed locations. Imported (for its side effect) by set.tsx and solids.ts BEFORE the town is built.
import {UNITS, NEAR_Z, DEPTH, type Unit} from '../../engine/kits/downtown/townData';
export type V3 = [number, number, number];
const by = (sign: string) => UNITS.find((u) => u.sign === sign)!;
const paint = (u: Unit, o: Partial<Unit>) => Object.assign(u, o);
let done = (globalThis as any).__pachinkoWorld as boolean | undefined;
if (!done) {
  (globalThis as any).__pachinkoWorld = true;
  const PINK = {signBg: '#d6246e', signFg: '#fff36a', awn: ['#d6246e', '#fff36a'] as [string, string]};
  // the story hall (near side, x 4.1..9.6) + three more halls: "a gambling hall on every corner"
  paint(by('HATS & DRY GOODS'), {sign: 'PACHINKO', ...PINK, disp: 3, blade: '777'});
  paint(by('BAKERY'), {sign: 'PACHINKO', signBg: '#ff7a1a', signFg: '#fff8c8', awn: ['#ff7a1a', '#fff8c8'], blade: '777'});
  paint(by('DINER'), {sign: 'PACHINKO', ...PINK, blade: '777'});
  paint(by('MUSIC'), {sign: 'SLOT', signBg: '#6a2fd6', signFg: '#fff36a', awn: ['#6a2fd6', '#fff36a'], blade: undefined});
  paint(by('CAFE'), {sign: 'RAMEN', signBg: '#c8321e', signFg: '#fff8e0', awn: ['#c8321e', '#fff8e0']});
  paint(by('RADIO SHOP'), {sign: 'KARAOKE', signBg: '#1d2a6e', signFg: '#ffd23a', awn: ['#1d2a6e', '#ffd23a']});
  // the separate "shop" next to the hall: starts at x = 12.0, leaving a 2.4 m alley (x 9.6..12.0) between the two buildings
  paint(by('THE OKLAHOMA NEWS'), {x0: 12.0, sign: 'TRADING CO.', signBg: '#2a5f9a', signFg: '#fbf3e0', interior: false, blade: undefined, disp: 5});
  // fill the grocery gap in the middle of the block
  UNITS.push({x0: -4.1, x1: 4.1, side: 1, floors: 2, wall: 'brickD', trim: '#f2e3c0', sign: 'PACHINKO', signBg: '#1d6ad6', signFg: '#fff36a', awn: ['#1d6ad6', '#fff36a'], disp: 7, door: 0.4, blade: '777'});
}
/** the story hall's street door (unit 4.1..9.6, door offset 0.4 from the unit centre) */
export const HALL_DOOR: V3 = [7.25, 0, NEAR_Z + 0.25];
/** alley between the hall (x < 9.6) and the separate shop (x > 12.0) */
export const ALLEY = {x0: 9.6, x1: 12.0, xc: 10.8, zBack: NEAR_Z - DEPTH, zFront: NEAR_Z, h: 5.4};
/** the unmarked exchange window in the shop's alley wall (x = 12.0 face, facing -x) */
export const XWIN = {x: 12.0, y: 1.15, z: 2.2};
/** modern hall interior: a closed room far from the street (own lighting, see look.ts INTERIOR) */
export const INT = {x0: -9, x1: 9, z0: -79, z1: -62, h: 3.6, bankA: -5.0, bankB: 5.0, pitch: 0.62, n: 18, zStart: -75.2,
  counterZ: -77.3, shelfZ: -78.8, seatA: -3.95, seatB: 3.95};
/** the exterior notice board of the hook */
export const NOTICE: V3 = [-2.4, 0, 6.2];
