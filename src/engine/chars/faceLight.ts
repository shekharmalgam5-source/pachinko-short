// engine v2 LITE tier: no per-frame face light (faces stay as drawn). The FULL tier (chars_full/faceLight.ts) is swapped in by
// remotion.config.ts when REMOTION_LOOK=full. sunOffset must match chars_full/faceLight.ts.
import * as THREE from 'three';
import {XV, type Tod} from '../look/look';
type M3 = [number, number, number];
export const sunOffset = (sunOff: M3, sw = 0) => new THREE.Vector3((sunOff[0] + sw * 9) * XV('fsx', 1), (sunOff[1] - Math.abs(sw) * 3) * XV('fsy', 1), sunOff[2] * XV('fsz', 1));
export function setFaceLight(_tod: Tod, _k = 0, _sun?: THREE.Vector3) {}
