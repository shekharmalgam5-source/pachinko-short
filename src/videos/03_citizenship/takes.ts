// TAKES (story 03_citizenship): one camera take per beat. az: + = camera on the +x side, 0 = camera on +z looking -z. A key without `move` is a hard cut.
import {K, type Take, type Kick, type Whip, type Flash, type Props} from '../../engine/camera/takes_api';
import {T} from '../../engine/core/clock';
import {SHOT_REAL as R} from './timeline';
import {CELL} from './world';
const M = CELL.map, O = CELL.office;
export const PROPS: Props = {
  officeAll: [[O, 1.4, -72], [3.6, 1.4, 3.5]],
  mapAll: [[M, 0.5, -70], [5, 0.8, 5]],
  scaleP: [[M, 1.4, -70.6], [1.8, 1.5, 0.5]],
  boards: [[M, 0.9, -71], [3.8, 0.9, 0.3]],
  boardJ: [[M + 2.6, 0.9, -71], [1.1, 0.8, 0.2]],
  family: [[M - 0.2, 1.2, -70.5], [1.5, 1.2, 1.4]],
  beam: [[M - 0.2, 1.2, -70.5], [0.5, 0.7, 0.4]],
  passports: [[M - 0.2, 1.35, -70.8], [0.6, 0.3, 0.2]],
};
export const TAKES: Take[] = [
  {name: 'hook', why: 'born in Tokyo / raised in Tokyo / still not Japanese: three quick cuts', keys: [
    K(R.hook, 'woman', 'MS', 0, 4, 36, {push: 1.1}), K(T('hook', 'raised'), 'kidhero', 'MS', -15, 4, 36, {push: 1.1}), K(T('hook', 'still'), 'hero', 'MCU', 0, 3, 34, {push: 1.1})]},
  {name: 'hospital', why: 'the hospital room: parents with the baby', keys: [K(R.hospital, 'woman', 'MS', 15, 5, 38, {push: 1.06})]},
  {name: 'decades', why: 'parents walking their street', keys: [K(R.decades, 'woman', 'FS', -20, 5, 40, {push: 1.04})]},
  {name: 'grow', why: 'speaking Japanese at the vending machine', keys: [K(R.grow, 'kidhero', 'MS', 10, 4, 36, {push: 1.05})]},
  {name: 'school', why: 'class: kid raises a hand', keys: [K(R.school, 'kidhero', 'MS', 40, 6, 38, {push: 1.05})]},
  {name: 'hood', why: 'same neighbourhood', keys: [K(R.hood, 'kidhero', 'MS', -10, 4, 38, {push: 1.06})]},
  {name: 'eighteen', why: 'golden hour, pull back: the only home you know', keys: [
    K(R.eighteen, 'hero', 'MS', 0, 5, 36, {push: 1.02}), K(T('eighteen', 'only'), 'hero', 'WS', 10, 8, 42, {move: 'pullpush', dur: 1.8})]},
  {name: 'apply', why: 'walk to the passport office', keys: [K(R.apply, 'hero', 'FS', -25, 5, 40, {push: 1.05})]},
  {name: 'office', why: 'office wide, then hand over the certificate', keys: [
    K(R.office, 'prop:officeAll', 'WS', 0, 8, 42, {push: 1.04}), K(T('office', 'hand'), 'hero', 'MS', 25, 6, 38, {move: 'arc', dur: 0.9})]},
  {name: 'clerk', why: 'clerk tells you: not a citizen', keys: [
    K(R.clerk, 'clerk', 'MS', 20, 4, 38, {push: 1.05}), K(T('clerk', 'citizen'), 'clerk', 'MCU', 12, 3, 34, {move: 'dolly', dur: 0.7, push: 1.08})]},
  {name: 'confused', why: 'three fast reaction close-ups', keys: [
    K(R.confused, 'hero', 'MCU', 0, 3, 34, {push: 1.05}), K(T('confused', 'born'), 'hero', 'MCU', -8, 3, 32, {push: 1.08}), K(T('confused', 'lived'), 'hero', 'CU', 6, 2, 30, {push: 1.08})]},
  {name: 'records', why: 'records slammed down, clerk shakes her head', keys: [
    K(R.records, 'hero', 'MS', -20, 5, 38, {push: 1.05}), K(T('records', 'nothing'), 'clerk', 'MCU', 15, 3, 34, {push: 1.07})]},
  {name: 'stranger', why: 'you stare: something stranger', keys: [K(R.stranger, 'hero', 'MCU', -10, 4, 34, {push: 1.08})]},
  {name: 'faraway', why: 'tabletop map: far pin, baby with a passport, dotted line to Japan', keys: [
    K(R.faraway, 'prop:mapAll', 'WS', 0, 55, 40, {push: 1.0}), K(T('faraway', 'never'), 'woman', 'MS', 20, 8, 36, {move: 'dolly', dur: 1.2, push: 1.05})]},
  {name: 'question', why: 'the balance scale tips', keys: [
    K(R.question, 'prop:scaleP', 'MS', 0, 8, 38, {push: 1.05}), K(T('question', 'citizen'), 'prop:scaleP', 'FS', 0, 10, 40, {move: 'pullpush', dur: 1.0})]},
  {name: 'usa', why: 'USA check, JAPAN cross', keys: [
    K(R.usa, 'prop:boards', 'WS', 0, 10, 40, {push: 1.03}), K(T('usa', 'grant'), 'prop:boardJ', 'MS', 0, 6, 36, {move: 'pan', dur: 0.6, push: 1.06})]},
  {name: 'rule', why: 'light flows from the parents\' passports to the child', keys: [
    K(R.rule, 'prop:family', 'MS', 0, 8, 38, {push: 1.04}), K(T('rule', 'depends'), 'prop:beam', 'MS', 0, 5, 34, {move: 'dolly', dur: 1.0, push: 1.1}), K(T('rule', 'parents'), 'prop:passports', 'MCU', 0, 4, 32, {move: 'pan', dur: 0.6})]},
  {name: 'twist', why: 'pull into the crowd, end on your face', keys: [
    K(R.twist, 'hero', 'WS', 0, 6, 40, {push: 1.02}), K(T('twist', 'who'), 'hero', 'MCU', -6, 4, 34, {move: 'dolly', dur: 1.2, push: 1.12})]},
];
export const KICKS: Kick[] = [];
export const WHIPS: Whip[] = [];
export const FLASHES: Flash[] = [];
