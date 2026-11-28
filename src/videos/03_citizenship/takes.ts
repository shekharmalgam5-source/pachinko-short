// TAKES (story 03_citizenship) v2: camera pulled back one size step everywhere (faces were too close). az: + = camera on the +x side, 0 = camera on +z.
// A key without `move` is a hard cut.
import {K, type Take, type Kick, type Whip, type Flash, type Props} from '../../engine/camera/takes_api';
import {T} from '../../engine/core/clock';
import {SHOT_REAL as R} from './timeline';
import {CELL} from './world';
const M = CELL.map, O = CELL.office;
export const PROPS: Props = {
  officeAll: [[O, 1.4, -72], [4.2, 1.4, 3.5]],
  mapAll: [[M, 0.5, -70], [5, 0.8, 5]],
  scaleP: [[M, 1.4, -70.6], [1.8, 1.5, 0.5]],
  boards: [[M, 0.9, -71], [3.8, 0.9, 0.3]],
  boardJ: [[M + 2.6, 0.9, -71], [1.1, 0.8, 0.2]],
  family: [[M - 0.2, 1.0, -70.5], [1.5, 1.2, 1.4]],
  beam: [[M - 0.2, 0.8, -70.6], [0.7, 0.7, 0.5]],
  passports: [[M - 0.2, 0.95, -70.9], [0.9, 0.4, 0.3]],
};
export const TAKES: Take[] = [
  {name: 'hook', why: 'born in Tokyo / raised in Tokyo / still not Japanese: three quick cuts', keys: [
    K(R.hook, 'woman', 'FS', 0, 5, 36, {push: 1.04}), K(T('hook', 'raised'), 'kidhero', 'FS', -15, 5, 36, {push: 1.04}), K(T('hook', 'still'), 'hero', 'MS', 0, 4, 36, {push: 1.05})]},
  {name: 'hospital', why: 'the hospital room: parents with the baby', keys: [K(R.hospital, 'woman', 'FS', 15, 6, 38, {push: 1.04})]},
  {name: 'decades', why: 'parents walking their street', keys: [K(R.decades, 'woman', 'WS', -20, 6, 40, {push: 1.03})]},
  {name: 'grow', why: 'speaking Japanese at the vending machine', keys: [K(R.grow, 'kidhero', 'FS', 10, 5, 36, {push: 1.04})]},
  {name: 'school', why: 'class: kid raises a hand', keys: [K(R.school, 'kidhero', 'FS', 40, 8, 38, {push: 1.04})]},
  {name: 'hood', why: 'same neighbourhood', keys: [K(R.hood, 'kidhero', 'FS', -10, 5, 38, {push: 1.04})]},
  {name: 'eighteen', why: 'golden hour, pull back: the only home you know', keys: [
    K(R.eighteen, 'hero', 'FS', 0, 6, 36, {push: 1.02}), K(T('eighteen', 'only'), 'hero', 'EWS', 10, 9, 42, {move: 'pullpush', dur: 1.8})]},
  {name: 'apply', why: 'walk to the passport office', keys: [K(R.apply, 'hero', 'WS', -25, 6, 40, {push: 1.03})]},
  {name: 'office', why: 'office wide, then hand over the certificate', keys: [
    K(R.office, 'prop:officeAll', 'WS', 0, 9, 42, {push: 1.03}), K(T('office', 'hand'), 'hero', 'FS', 25, 8, 38, {move: 'arc', dur: 0.9})]},
  {name: 'clerk', why: 'clerk tells you: not a citizen', keys: [
    K(R.clerk, 'clerk', 'FS', 20, 12, 38, {push: 1.04}), K(T('clerk', 'citizen'), 'clerk', 'MS', 12, 10, 36, {move: 'dolly', dur: 0.7, push: 1.05})]},
  {name: 'confused', why: 'three reaction beats, kept at waist-up so the face is not crowded', keys: [
    K(R.confused, 'hero', 'MS', 0, 4, 36, {push: 1.04}), K(T('confused', 'born'), 'hero', 'MS', -8, 4, 36, {push: 1.05}), K(T('confused', 'lived'), 'hero', 'MCU', 6, 3, 34, {push: 1.05})]},
  {name: 'records', why: 'records slammed down, clerk shakes her head', keys: [
    K(R.records, 'hero', 'FS', -20, 8, 38, {push: 1.04}), K(T('records', 'nothing'), 'clerk', 'MS', 15, 8, 36, {push: 1.05})]},
  {name: 'stranger', why: 'you stare: something stranger', keys: [K(R.stranger, 'hero', 'MS', -10, 5, 36, {push: 1.05})]},
  {name: 'faraway', why: 'tabletop map: far pin, baby with a passport, dotted line to Japan', keys: [
    K(R.faraway, 'prop:mapAll', 'FS', 0, 50, 40, {push: 1.0}), K(T('faraway', 'never'), 'woman', 'FS', 20, 10, 36, {move: 'dolly', dur: 1.2, push: 1.03})]},
  {name: 'question', why: 'the balance scale tips', keys: [
    K(R.question, 'prop:scaleP', 'FS', 0, 9, 38, {push: 1.04}), K(T('question', 'citizen'), 'prop:scaleP', 'WS', 0, 11, 40, {move: 'pullpush', dur: 1.0})]},
  {name: 'usa', why: 'USA check, JAPAN cross', keys: [
    K(R.usa, 'prop:boards', 'WS', 0, 11, 40, {push: 1.02}), K(T('usa', 'grant'), 'prop:boardJ', 'FS', 0, 7, 36, {move: 'pan', dur: 0.6, push: 1.04})]},
  {name: 'rule', why: 'light flows from the parents\' passports to the child', keys: [
    K(R.rule, 'prop:family', 'FS', 0, 9, 38, {push: 1.03}), K(T('rule', 'depends'), 'prop:beam', 'FS', 0, 7, 36, {move: 'dolly', dur: 1.0, push: 1.05}), K(T('rule', 'parents'), 'prop:passports', 'MS', 0, 5, 34, {move: 'pan', dur: 0.6})]},
  {name: 'twist', why: 'pull into the crowd, end on your face', keys: [
    K(R.twist, 'hero', 'WS', 0, 7, 40, {push: 1.02}), K(T('twist', 'who'), 'hero', 'MS', -6, 5, 36, {move: 'dolly', dur: 1.2, push: 1.06})]},
];
export const KICKS: Kick[] = [];
export const WHIPS: Whip[] = [];
export const FLASHES: Flash[] = [];
