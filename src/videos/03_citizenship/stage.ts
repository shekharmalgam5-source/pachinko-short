// STAGE (story 03_citizenship). Identity timeline (old frame = real frame). Dynamic props go in Stage.extra strings (see set.tsx).
import {TOTAL, shotAt, W, cl, type V3} from '../../engine/core/clock';
import {autoGaze} from '../../engine/core/staging';
import {PersonP, seq} from '../../engine/chars/rig';
import type {CarP, MeterP, Things} from '../../engine/kits/downtown/street';
import type {CartP} from '../../engine/kits/grocery/store';
import {CELL, OFFICE, PASS_DOOR, HOSP_DOOR, WALK_Z} from './world';
export {TOTAL, shotAt};
export type Stage = {people: PersonP[]; carts: CartP[]; extra: string[]; cars: CarP[]; meters: MeterP[]; things: Things; clock: number; nStoryCars: number};
type Key = [number, number, number];
const path = (lf: number, k: Key[]): [number, number] => {
  if (lf <= k[0][0]) return [k[0][1], k[0][2]];
  for (let i = 1; i < k.length; i++) if (lf <= k[i][0]) { const [a, x0, z0] = k[i - 1], [b, x1, z1] = k[i], u = (lf - a) / (b - a); return [x0 + (x1 - x0) * u, z0 + (z1 - z0) * u]; }
  const e = k[k.length - 1]; return [e[1], e[2]];
};
const walker = (who: PersonP['who'], lf: number, k: Key[], o: Partial<PersonP> = {}): PersonP => {
  const [x, z] = path(lf, k), [x2, z2] = path(lf + 1, k), moving = Math.hypot(x2 - x, z2 - z) > 1e-4;
  return {who, p: [x, 0, z], act: moving ? 'walk' : 'idle', ...o};
};
const fx = (n: number) => n.toFixed(3);
const at = (who: PersonP['who'], x: number, z: number, o: Partial<PersonP> = {}): PersonP => ({who, p: [x, 0, z] as V3, act: 'idle', ...o});
const H = CELL.hospital, S = CELL.school, O = CELL.office, M = CELL.map;
const OX = O - 2.4;   // customer / clerk: centre of service window 1
const staff = (): PersonP[] => [at('banker', O, OFFICE.clerkZ, {bg: true, expr: 'neutral'}), at('woman', O + 2.4, OFFICE.clerkZ, {bg: true, expr: 'happy'})];

export function stage(f: number): Stage {
  const s = shotAt(f), lf = s.lf, P: PersonP[] = [], X: string[] = [];
  switch (s.name) {
    case 'hook': {   // three 1-second beats, all on the street: hospital door / kid to school / you at 18 with the rejected form
      P.push(at('woman', -6.3, 5.5, {expr: 'joy'}), at('man', -7.3, 5.5, {expr: 'awe'})); X.push('baby:-6.75,0.7,5.6');
      P.push(walker('kidhero', lf, [[0, -1.5, 6.4], [121, -5.0, 6.4]], {expr: 'joy'}), walker('kid', lf, [[0, -0.7, 6.8], [121, -4.2, 6.8]], {bg: true, expr: 'happy'}));
      P.push(at('hero', PASS_DOOR[0], 5.7, {act: 'slump', expr: 'shock'})); X.push(`xmark:${fx(PASS_DOOR[0] + 1.5)},1.9,4.2`);
      break;
    }
    case 'hospital': {   // born in a hospital in Tokyo
      P.push(at('woman', H + 2.0, -71.6, {expr: 'joy'}), at('man', H + 3.1, -71.6, {expr: 'awe'})); X.push(`baby:${fx(H + 1.45)},0.7,-71.3`); break;
    }
    case 'decades': {   // parents living their life in Tokyo
      P.push(walker('woman', lf, [[0, -6.0, WALK_Z], [51, -4.4, WALK_Z]], {expr: 'happy'}), walker('man', lf, [[0, -6.9, WALK_Z], [51, -5.3, WALK_Z]], {expr: 'happy'})); break;
    }
    case 'grow': {   // speaking Japanese with friends at the vending machine
      P.push(at('kidhero', -1.5, 5.8, {act: 'talk', expr: 'joy'}), at('kid', -0.5, 5.8, {bg: true, expr: 'happy'})); break;
    }
    case 'school': {   // class: kidhero raises a hand
      P.push(at('kidhero', S + 1, -69.85, {sit: true, view: 'back', act: 'point', expr: 'joy'}));
      P.push(at('kid', S - 1, -69.85, {sit: true, view: 'back', bg: true}), at('kid', S + 3, -68.05, {sit: true, view: 'back', bg: true}), at('kid', S - 3, -71.65, {sit: true, view: 'back', bg: true}), at('kid', S + 3, -71.65, {sit: true, view: 'back', bg: true}));
      P.push(at('goldman', S, -74.6, {act: 'talk', expr: 'happy'})); break;
    }
    case 'hood': {   // same neighbourhood, always
      P.push(at('kidhero', 3.0, 6.6, {act: 'cheer', expr: 'joy'}), at('kid', 1.8, 6.9, {bg: true, expr: 'joy'}), at('kid', 4.3, 6.9, {bg: true, expr: 'happy'})); break;
    }
    case 'eighteen': {   // by eighteen Japan is the only home you know (golden hour)
      P.push(at('hero', -2.0, 6.6, {expr: 'hopeful'}));
      P.push(walker('salaryman', lf, [[0, 6, 7.3], [107, 3.0, 7.3]], {bg: true}), walker('banker', lf, [[0, -9, 7.0], [107, -6.4, 7.0]], {bg: true})); break;
    }
    case 'apply': {   // you walk to the passport office
      const k: Key[] = [[0, 3.4, 6.4], [75, 7.0, 6.4]], [x, z] = path(lf, k);
      P.push(walker('hero', lf, k, {expr: 'hopeful'})); void x; void z; break;
    }
    case 'office': {   // hand over the birth certificate and wait
      const hand = lf >= W('office', 'hand') + 18;
      P.push(at('hero', OX, OFFICE.customerZ, {view: 'back', expr: 'hopeful', ...seq(lf, [[0, 'idle', 'hopeful'], [W('office', 'hand'), 'present', 'hopeful'], [W('office', 'wait'), 'idle', 'worried']])}));
      P.push(at('clerk', OX, OFFICE.clerkZ, {expr: 'neutral'}));
      P.push(at('oldman', O - 3.5, -67.2, {sit: true, view: 'back', bg: true}), at('grandma', O - 2.7, -67.2, {sit: true, view: 'back', bg: true}), at('salaryman', O + 0.5, -67.2, {sit: true, view: 'back', bg: true}));
      if (hand) X.push(`paper:${fx(OX + 0.05)},1.13,${fx(OFFICE.counterZ + 0.05)},0`); X.push('ticket:42'); P.push(...staff()); break;
    }
    case 'clerk': {   // "you're not a Japanese citizen"
      P.push(at('hero', OX, OFFICE.customerZ, {view: 'back'}));
      P.push(at('clerk', OX, OFFICE.clerkZ, seq(lf, [[0, 'idle', 'neutral'], [W('clerk', 'tells'), 'talk', 'worried'], [W('clerk', 'citizen'), 'shrug', 'sad']])));
      X.push(`paper:${fx(OX + 0.05)},1.13,${fx(OFFICE.counterZ + 0.05)},0`, 'ticket:42'); P.push(...staff()); break;
    }
    case 'confused': {   // three fast reaction beats: confused / born here / lived here
      P.push(at('hero', OX, OFFICE.customerZ, seq(lf, [[0, 'idle', 'shock'], [W('confused', 'born'), 'slump', 'teary'], [W('confused', 'lived'), 'present', 'teary']])));
      P.push(at('clerk', OX, OFFICE.clerkZ, {expr: 'worried'}));
      X.push(`qm:${fx(OX)},2.25,${fx(OFFICE.customerZ)},${fx(cl(lf / 12))}`, `paper:${fx(OX + 0.05)},1.13,${fx(OFFICE.counterZ + 0.05)},1`, 'ticket:42'); P.push(...staff()); break;
    }
    case 'records': {   // school records slammed on the counter, nothing changes
      const stack = lf >= W('records', 'records');
      P.push(at('hero', OX, OFFICE.customerZ, seq(lf, [[0, 'present', 'hopeful'], [W('records', 'nothing'), 'slump', 'teary']])));
      P.push(at('clerk', OX, OFFICE.clerkZ, seq(lf, [[0, 'idle', 'worried'], [W('records', 'records') + 14, 'shrug', 'sad'], [W('records', 'nothing'), 'shrug', 'sad']])));
      if (stack) X.push(`stack:${fx(OX - 0.2)},1.11,${fx(OFFICE.counterZ + 0.05)}`); X.push('ticket:42'); P.push(...staff()); break;
    }
    case 'stranger': {   // outside, a strange discovery
      P.push(at('hero', 6.2, 6.4, {act: 'think', expr: 'awe'})); break;
    }
    case 'faraway': {   // someone born thousands of miles away, never been to Japan, citizen from birth
      P.push(at('woman', M + 3.0, -71.6, {expr: 'joy'}), at('hero', M - 3.2, -67.8, {expr: 'worried'}));
      X.push(`baby:${fx(M + 2.5)},0.62,-71.2`, `pass:${fx(M + 3.55)},0.72,-71.3,0.5`); break;
    }
    case 'question': {   // how can that be? the scale tips
      const t = cl((lf - W('question', 'citizen')) / 22);
      P.push(at('woman', M + 3.4, -72.8, {expr: 'joy'}), at('hero', M - 3.4, -68.6, {act: 'think', expr: 'teary'}));
      X.push(`scale:${fx(t)}`); break;
    }
    case 'usa': {   // unlike the United States: born here = citizen (check) / Japan: not enough (cross)
      X.push(`stamp:${fx(cl((lf - W('usa', 'united')) / 10))},${fx(cl((lf - W('usa', 'grant')) / 10))}`);
      P.push(at('hero', M, -67.4, {act: 'point', expr: 'worried'})); break;
    }
    case 'rule': {   // parents' passports pass citizenship down to the child
      P.push(at('man', M - 1.0, -71.4, {expr: 'proud'}), at('woman', M + 0.6, -71.4, {expr: 'proud'}), at('kidhero', M - 0.2, -69.3, {expr: 'hopeful'}));
      X.push(`pass:${fx(M - 0.62)},0.95,-70.9,0.7`, `pass:${fx(M + 0.22)},0.95,-70.9,0.7`, `beam:${fx(cl((lf - W('rule', 'depends')) / 45))}`); break;
    }
    case 'twist': {   // pull back into the crowd, end on your face
      P.push(at('hero', 0.0, 6.7, {expr: 'teary'}));
      P.push(walker('salaryman', lf, [[0, 5, 7.6], [119, 2.0, 7.6]], {bg: true}), walker('banker', lf, [[0, -6, 7.4], [119, -3.0, 7.4]], {bg: true}), walker('grandma', lf, [[0, 7, 6.9], [119, 4.4, 6.9]], {bg: true})); break;
    }
  }
  const Mt: MeterP[] = [], K: CarP[] = [];
  autoGaze(P, Mt);
  return {people: P, carts: [], extra: X, cars: K, meters: Mt, things: {}, clock: 9 + f / 30 / 120, nStoryCars: 0};
}
