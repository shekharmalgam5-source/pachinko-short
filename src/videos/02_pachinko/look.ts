// Light story: full light is chosen with REMOTION_LOOK=full (render.command / npm run preview:full). Street = bright day;
// the hall interior (shots below) is lit by its practical lamp + our own neon point lights (set.tsx).
import type {Tod} from '../../engine/look/look';
export const TOD: [number, Tod][] = [[0, 'day']];
export const INTERIOR = {shots: ['hall', 'win', 'counter', 'prizes', 'guy'] as string[], centre: [0, -70.5] as [number, number], pool: [0, 0, -74] as [number, number, number],
  lamp: [0, 3.3, -73] as [number, number, number], lampPt: [0, 3.1, -72] as [number, number, number], cool: [0, 2.2, -68] as [number, number, number], warm: [0, 2.7, -70] as [number, number, number]};
/** night mood 0..1 (0 = none) */
export const MOOD = (_f: number) => 0;
