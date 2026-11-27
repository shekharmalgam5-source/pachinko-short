// STAGE (story 02_pachinko): who / what is where per frame (identity timeline: old frame = real frame).
// Dynamic props travel in Stage.extra as strings: 'bucket:x,y,z,fill', 'balls:x,y,z,on', 'xwin:tokensSlide,cashSlide'.
import {TOTAL, shotAt, W, T, cl, SHOT_REAL, type V3} from '../../engine/core/clock';
import {autoGaze} from '../../engine/core/staging';
import {PersonP, seq} from '../../engine/chars/rig';
import type {CarP, MeterP, Things} from '../../engine/kits/downtown/street';
import type {CartP} from '../../engine/kits/grocery/store';
import {HALL_DOOR, ALLEY, XWIN, INT, NOTICE} from './world';
export {TOTAL, shotAt};
export type Stage = {people: PersonP[]; carts: CartP[]; extra: string[]; cars: CarP[]; meters: MeterP[]; things: Things; clock: number; nStoryCars: number};

type Key = [number, number, number];   // [local frame, x, z]
const path = (lf: number, k: Key[]): [number, number] => {
  if (lf <= k[0][0]) return [k[0][1], k[0][2]];
  for (let i = 1; i < k.length; i++) if (lf <= k[i][0]) { const [a, x0, z0] = k[i - 1], [b, x1, z1] = k[i], u = (lf - a) / (b - a); return [x0 + (x1 - x0) * u, z0 + (z1 - z0) * u]; }
  const e = k[k.length - 1]; return [e[1], e[2]];
};
/** a person walking along a key path (idle when the path stands still) */
const walker = (who: PersonP['who'], lf: number, k: Key[], o: Partial<PersonP> = {}): PersonP => {
  const [x, z] = path(lf, k), [x2, z2] = path(lf + 1, k), moving = Math.hypot(x2 - x, z2 - z) > 1e-4;
  return {who, p: [x, 0, z], act: moving ? 'walk' : 'idle', ...o};
};
const fx = (n: number) => n.toFixed(3);
const bucketAt = (x: number, y: number, z: number, fill = 1) => `bucket:${fx(x)},${fx(y)},${fx(z)},${fx(fill)}`;

// seated background players in the machine banks (hero's machine = bank A, row 9)
const HERO_ROW = 9, zRow = (i: number) => INT.zStart + i * INT.pitch;
const SEATED: [number, 'A' | 'B', PersonP['who']][] = [[1, 'A', 'salaryman'], [4, 'A', 'shopper2'], [6, 'A', 'grandma'], [12, 'A', 'banker'], [15, 'A', 'man'],
  [0, 'B', 'shopper'], [2, 'B', 'rancher'], [5, 'B', 'salaryman'], [8, 'B', 'grandma'], [11, 'B', 'shopper2'], [14, 'B', 'banker'], [16, 'B', 'man']];
const seated = (): PersonP[] => SEATED.map(([i, bank, who], n) => ({who, p: [bank === 'A' ? INT.seatA : INT.seatB, 0, zRow(i)] as V3, sit: true, bg: true, view: 'side' as const, dir: (bank === 'A' ? -1 : 1) as 1 | -1, act: 'idle' as const, expr: 'neutral' as const, seed: n * 2.7}));

export function stage(f: number): Stage {
  const s = shotAt(f), lf = s.lf, P: PersonP[] = [], K: CarP[] = [], Mt: MeterP[] = [], X: string[] = [];
  // no story cars: the four story parking spaces stay empty so nothing blocks the halls' doors
  const heroZ = zRow(HERO_ROW), nameAt = s.name;
  switch (nameAt) {
    case 'hook': case 'corners': {   // street, passers-by (absolute frame so they keep walking across the two beats)
      P.push(walker('salaryman', f, [[0, 2, 6.9], [160, -6, 6.9]], {bg: true, expr: 'neutral'}));
      P.push(walker('shopper', f, [[0, -9, 7.7], [160, -1, 7.7]], {bg: true, expr: 'happy'}));
      P.push(walker('banker', f, [[0, 15, 19.6], [160, 7, 19.6]], {bg: true}));
      break;
    }
    case 'hall': {   // the man with a full bucket walks out through the rows
      const k: Key[] = [[0, 0.5, -73], [198, 0.5, -64.5]], [x, z] = path(lf, k);
      P.push(walker('oldman', lf, k, {expr: 'happy', gaze: 'cam'})); X.push(bucketAt(x + 0.3, 0.22, z + 0.08));
      const k2: Key[] = [[0, -0.7, -64.2], [198, -0.7, -72.5]], [x2, z2] = path(lf, k2);
      P.push(walker('salaryman', lf, k2, {bg: true})); X.push(bucketAt(x2 + 0.3, 0.22, z2 + 0.08));
      P.push(...seated()); break;
    }
    case 'cop': {   // the man leaves the hall past a calm policeman
      const k: Key[] = [[0, HALL_DOOR[0], HALL_DOOR[2] + 0.1], [25, 7.1, 6.0], [123, 1.8, 6.0]], [x, z] = path(lf, k);
      P.push(walker('oldman', lf, k, {expr: 'happy'})); X.push(bucketAt(x, 0.25, z + 0.28));
      const c = walker('cop', lf, [[0, 12.5, 7.3], [70, 6.0, 7.3]], {});
      P.push({...c, ...(lf >= W('cop', 'arrested') ? {act: 'wave' as const, expr: 'smug' as const} : lf >= 70 ? {act: 'idle' as const, expr: 'smug' as const} : {expr: 'neutral' as const}), ...(lf >= 70 ? {gaze: 'cam' as const} : {})});
      break;
    }
    case 'win': {   // you win: balls pour into the bucket
      P.push({who: 'hero', p: [INT.seatA, 0, heroZ], sit: true, view: 'side', dir: -1,
        ...seq(lf, [[0, 'idle', 'surprised'], [22, 'cheer', 'happy'], [W('win', 'cash'), 'proud', 'smug']])});
      X.push(`balls:${fx(INT.bankA + 0.5)},0.88,${fx(heroZ)},${lf > 8 && lf < 82 ? 1 : 0}`); X.push(bucketAt(INT.seatA, 0, heroZ + 0.5, cl(lf / 70)));
      P.push(...seated().filter((_, i) => SEATED[i][0] !== HERO_ROW)); break;
    }
    case 'counter': case 'prizes': {   // the prize counter
      const zc = INT.counterZ + 1.0, zClerk = INT.counterZ - 0.9;
      P.push({who: 'hero', p: [0.5, 0, zc], view: 'back', act: 'idle', expr: 'worried'});
      P.push({who: 'baker', p: [-0.8, 0, zClerk], view: 'front',
        ...(nameAt === 'counter' ? seq(lf, [[0, 'talk', 'fake'], [W('counter', 'single'), 'shrug', 'smug']]) : seq(lf, [[0, 'present', 'fake'], [W('prizes', 'tokens'), 'idle', 'smug']]))});
      P.push({who: 'mechanic', p: [-2.0, 0, zc], view: 'back',
        ...(nameAt === 'prizes' ? seq(lf, [[0, 'idle', 'neutral'], [W('prizes', 'tokens'), 'present', 'smug']]) : {act: 'idle' as const, expr: 'neutral' as const})});
      X.push(bucketAt(0.9, 0.3, zc, 1)); break;
    }
    case 'guy': {   // the guy with the tokens heads for the door
      const zc = INT.counterZ + 1.0;
      P.push(walker('mechanic', lf, [[0, -2.0, zc], [20, -2.0, zc + 1.0], [102, -1.0, zc + 6.0]], {expr: 'smug'}));
      P.push({who: 'hero', p: [0.5, 0, zc], view: 'back', act: 'idle', expr: 'surprised'});
      P.push({who: 'baker', p: [-0.8, 0, INT.counterZ - 0.9], view: 'front', act: 'idle', expr: 'fake'});
      X.push(bucketAt(0.9, 0.3, zc, 1)); break;
    }
    case 'alley': {   // follow him around the corner into the alley
      const dz = HALL_DOOR[2] + 0.1, ax = ALLEY.xc, gk: Key[] = [[0, HALL_DOOR[0], dz], [15, HALL_DOOR[0], 5.8], [55, ax, 5.8], [120, ax + 0.05, XWIN.z]];
      P.push({...walker('mechanic', lf, gk, {expr: 'smug'}), ...(lf >= 120 ? {view: 'side' as const, dir: 1 as const} : {})});
      if (lf >= 28) P.push(walker('hero', lf, [[28, HALL_DOOR[0], dz], [43, HALL_DOOR[0], 5.8], [83, ax, 5.8], [125, ax, XWIN.z + 1.7]], {expr: 'worried'}));
      break;
    }
    case 'window': case 'split': case 'slide': {   // the unmarked window: tokens in, cash out
      P.push({who: 'mechanic', p: [ALLEY.xc + 0.05, 0, XWIN.z], view: 'side', dir: 1,
        ...(nameAt === 'slide' ? seq(lf, [[0, 'idle', 'smug'], [W('slide', 'slides'), 'present', 'smug']]) : {act: 'idle' as const, expr: 'smug' as const})});
      P.push({who: 'hero', p: [ALLEY.xc, 0, XWIN.z + 1.7], view: 'side', dir: 1, act: 'think', expr: nameAt === 'window' ? 'surprised' : 'worried'});
      if (nameAt === 'slide') {
        const now = SHOT_REAL.slide + lf / 30, tok = cl((now - T('slide', 'slides', 1)) / 0.9), cash = cl((now - T('slide', 'hand')) / 0.9);
        X.push(`xwin:${fx(tok)},${fx(cash)}`);
        P.push(walker('cop', lf, [[0, 17.5, 7.3], [168, 9.8, 7.3]], {expr: 'neutral'}));
      }
      break;
    }
  }
  autoGaze(P, Mt);
  return {people: P, carts: [], extra: X, cars: K, meters: Mt, things: {}, clock: 9 + f / 30 / 120, nStoryCars: K.length};
}
