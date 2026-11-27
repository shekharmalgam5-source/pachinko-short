// Solids for the checkers (x0,x1,y0,y1,z0,z1,name). Street = the kit's town (re-themed in world.ts) + the story's interior furniture.
import './world';
import {townSolids} from '../../engine/kits/downtown/townData';
import {INT, ALLEY} from './world';
type Box = [number, number, number, number, number, number, string];
const zA = INT.zStart, zB = INT.zStart + INT.pitch * (INT.n - 1);
const interior: Box[] = [
  [INT.bankA - 0.32, INT.bankA + 0.32, 0, 1.9, zA - 0.4, zB + 0.4, 'machine bank A'],
  [INT.bankB - 0.32, INT.bankB + 0.32, 0, 1.9, zA - 0.4, zB + 0.4, 'machine bank B'],
  [-2.4, 2.4, 0, 1.05, INT.counterZ - 0.35, INT.counterZ + 0.35, 'prize counter'],
];
const alley: Box[] = [[ALLEY.xc - 0.25, ALLEY.xc + 0.25, 0, 0.9, ALLEY.zBack + 0.2, ALLEY.zBack + 0.7, 'alley crate']];
export const SOLIDS: Box[] = [...townSolids(), ...interior, ...alley];
export const LOGIC_SOLIDS: Box[] = [...townSolids().filter((b) => b[2] < 1.0 && !b[6].startsWith('far car')), ...interior, ...alley];
export const GATE_WAIVERS: {key: string; kind: string; why: string}[] = [];
