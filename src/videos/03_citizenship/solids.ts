import './world';
import {townSolids} from '../../engine/kits/downtown/townData';
import {CELL, OFFICE} from './world';
type Box = [number, number, number, number, number, number, string];
const interior: Box[] = [
  [CELL.office - 3.6, CELL.office + 3.6, 0, 1.05, OFFICE.counterZ - 0.35, OFFICE.counterZ + 0.35, 'passport counter'],
  [CELL.hospital + 1.9, CELL.hospital + 2.9, 0, 0.9, -74.5, -72.3, 'hospital bed'],
];
export const SOLIDS: Box[] = [...townSolids(), ...interior];
export const LOGIC_SOLIDS: Box[] = [...townSolids().filter((b) => b[2] < 1.0 && !b[6].startsWith('far car')), ...interior];
export const GATE_WAIVERS: {key: string; kind: string; why: string}[] = [];
