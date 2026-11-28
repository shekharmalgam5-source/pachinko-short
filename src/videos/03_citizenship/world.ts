// WORLD (story 03_citizenship): the kit's downtown block re-themed as a Tokyo street (hospital, passport office, konbini...)
// + four interior "cells" in one row (hospital room, classroom, passport office, tabletop world map). Imported for its side effect.
import {UNITS, NEAR_Z, type Unit} from '../../engine/kits/downtown/townData';
export type V3 = [number, number, number];
const by = (sign: string) => UNITS.find((u) => u.sign === sign)!;
const paint = (u: Unit, o: Partial<Unit>) => Object.assign(u, o);
if (!(globalThis as any).__citizenshipWorld) {
  (globalThis as any).__citizenshipWorld = true;
  paint(by('HATS & DRY GOODS'), {sign: 'PASSPORT', signBg: '#1d3a6e', signFg: '#ffffff', awn: ['#1d3a6e', '#ffffff'], disp: 2, blade: 'PASSPORT'});
  paint(by('BAKERY'), {sign: 'HOSPITAL', signBg: '#f4faf6', signFg: '#d3221a', awn: ['#f4faf6', '#d3221a'], blade: '+'});
  paint(by('DINER'), {sign: 'SUSHI', signBg: '#c8321e', signFg: '#fff8e0', awn: ['#c8321e', '#fff8e0'], blade: undefined});
  paint(by('MUSIC'), {sign: 'BOOKS', signBg: '#6a2fd6', signFg: '#fff8c8', awn: ['#6a2fd6', '#fff8c8'], blade: undefined});
  paint(by('CAFE'), {sign: 'RAMEN', signBg: '#ff7a1a', signFg: '#fff8e0', awn: ['#ff7a1a', '#fff8e0']});
  paint(by('RADIO SHOP'), {sign: 'PHARMACY', signBg: '#1d9a52', signFg: '#ffffff', awn: ['#1d9a52', '#ffffff']});
  paint(by('THE OKLAHOMA NEWS'), {sign: 'DAILY NEWS', signBg: '#2a5f9a', signFg: '#fbf3e0', blade: undefined});
  UNITS.push({x0: -4.1, x1: 4.1, side: 1, floors: 2, wall: 'brickD', trim: '#f2e3c0', sign: 'KONBINI', signBg: '#1d9a52', signFg: '#fff8e0', awn: ['#1d9a52', '#fff8e0'], disp: 7, door: 0.4, blade: '24H'});
}
export const PASS_DOOR: V3 = [7.25, 0, NEAR_Z + 0.25];       // passport office door (unit 4.1..9.6, door offset 0.4)
export const HOSP_DOOR: V3 = [-6.85, 0, NEAR_Z + 0.25];      // hospital (unit -9.6..-4.1)
export const WALK_Z = 6.3;                                   // sidewalk line
/** interior cells in one row: z -76 (back wall) .. -64 (front), 11 m wide each, 3.6 m high */
export const CELL = {z0: -76, z1: -64, cz: -70, w: 11, h: 3.6, hospital: -18, school: -6, office: 6, map: 18};
export const OFFICE = {counterZ: -74.2, clerkZ: -75.1, customerZ: -72.9};
