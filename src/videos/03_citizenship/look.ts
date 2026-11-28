// Light story (Full light = REMOTION_LOOK=full). Street: bright day, golden hour for "by eighteen" / the twist. Interiors: practical lamps + our own coloured lights.
import type {Tod} from '../../engine/look/look';
import {SHOT_REAL as R} from './timeline';
export const TOD: [number, Tod][] = [[0, 'day'], [R.eighteen, 'golden'], [R.office, 'day'], [R.stranger, 'day'], [R.twist, 'golden']];
export const INTERIOR = {shots: ['hospital', 'school', 'office', 'clerk', 'confused', 'records', 'faraway', 'question', 'usa', 'rule'] as string[], centre: [0, -70] as [number, number], pool: [0, 0, -70] as [number, number, number],
  lamp: [0, 3.3, -70] as [number, number, number], lampPt: [0, 3.1, -70] as [number, number, number], cool: [0, 2.2, -70] as [number, number, number], warm: [0, 2.7, -70] as [number, number, number]};
export const MOOD = (_f: number) => 0;
