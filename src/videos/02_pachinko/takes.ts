// TAKES (story 02_pachinko): one continuous take per beat; keys name a subject + size + angle, the engine solves the framing.
// az: + = camera on the +x side of the subject, 0 = camera on +z looking -z.  Subjects: 'prop:<name>' (PROPS), a character id, 'arms:<id>'.
import {K, type Take, type Kick, type Whip, type Flash, type Props} from '../../engine/camera/takes_api';
import {T} from '../../engine/core/clock';
import {SHOT_REAL as R} from './timeline';
import {INT, NOTICE} from './world';
export const PROPS: Props = {
  notice: [[NOTICE[0], 1.15, NOTICE[2]], [0.85, 0.6, 0.1]],
  hallMid: [[0, 2.6, 4.2], [4.0, 2.2, 0.6]],
  hallStory: [[6.85, 2.6, 4.2], [2.7, 2.2, 0.6]],
  bankA: [[INT.bankA, 1.0, -70], [0.6, 1.0, 4.5]],
  shelf: [[0, 1.75, INT.shelfZ + 0.2], [2.4, 0.5, 0.3]],
  tokens: [[-1.5, 1.2, INT.counterZ + 0.05], [0.4, 0.2, 0.3]],
  alleyWin: [[11.8, 1.2, 2.2], [0.7, 0.5, 0.9]],
  alleyAll: [[10.8, 2.6, 2.0], [4.0, 2.6, 2.0]],
};
export const TAKES: Take[] = [
  {name: 'hook', why: 'the "gambling is illegal" notice, push in', keys: [K(R.hook, 'prop:notice', 'MS', 8, 4, 38, {push: 1.14})]},
  {name: 'corners', why: 'a hall on every corner: pan from the middle hall to the story hall', keys: [
    K(R.corners, 'prop:hallMid', 'WS', -10, 6, 40, {push: 1.02}),
    K(T('corners', 'hall'), 'prop:hallStory', 'WS', 10, 6, 40, {move: 'pan', dur: 1.0, push: 1.03})]},
  {name: 'hall', why: 'inside: machine bank, then the man with a full bucket', keys: [
    K(R.hall, 'prop:bankA', 'FS', 55, 6, 40, {push: 1.05}),
    K(T('hall', 'thousands'), 'prop:bankA', 'MS', 60, 4, 38, {move: 'arc', dur: 1.0}),
    K(T('hall', 'buckets'), 'oldman', 'MS', 0, 4, 40, {move: 'pan', dur: 0.9, push: 1.08})]},
  {name: 'cop', why: 'the man walks out; a calm policeman strolls past', keys: [
    K(R.cop, 'oldman', 'MS', 15, 4, 40, {push: 1.04}),
    K(T('cop', 'right'), 'cop', 'MS', -10, 4, 40, {move: 'pan', dur: 0.6}),
    K(T('cop', 'arrested'), 'cop', 'MCU', -6, 3, 38, {move: 'dolly', dur: 0.7, push: 1.07})]},
  {name: 'win', why: 'you win: balls pour into the bucket', keys: [K(R.win, 'hero', 'MS', 45, 6, 40, {push: 1.08})]},
  {name: 'counter', why: 'the counter gives no yen: clerk shrugs', keys: [
    K(R.counter, 'baker', 'MS', -8, 4, 38, {push: 1.05}),
    K(T('counter', 'single'), 'baker', 'MCU', -6, 3, 36, {move: 'dolly', dur: 0.6, push: 1.06})]},
  {name: 'prizes', why: 'the prize list pops on its words, then the tokens', keys: [
    K(R.prizes, 'prop:shelf', 'MS', 0, 6, 40, {push: 1.05}),
    K(T('prizes', 'tokens'), 'prop:tokens', 'MCU', 10, 12, 34, {move: 'dolly', dur: 0.8, push: 1.1})]},
  {name: 'guy', why: 'the guy with the tokens walks out', keys: [K(R.guy, 'mechanic', 'MS', 10, 4, 40, {push: 1.05})]},
  {name: 'alley', why: 'follow him around the corner into the alley', keys: [
    K(R.alley, 'mechanic', 'FS', -20, 5, 40, {push: 1.05}),
    K(T('alley', 'corner'), 'mechanic', 'MS', 35, 4, 40, {move: 'arc', dur: 1.0})]},
  {name: 'window', why: 'the unmarked window, then a pull-back: two separate buildings', keys: [
    K(R.window, 'mechanic', 'FS', -30, 6, 38, {push: 1.04}),
    K(T('window', 'separate'), 'prop:alleyAll', 'WS', -30, 14, 40, {move: 'pullpush', dur: 1.0})]},
  {name: 'split', why: 'ping-pong: the hall only gives prizes, the shop only buys', keys: [
    K(R.split, 'prop:hallStory', 'MS', -8, 6, 40, {push: 1.04}),
    K(T('split', 'shop'), 'prop:alleyWin', 'FS', -35, 6, 34, {move: 'pan', dur: 0.7, push: 1.05})]},
  {name: 'slide', why: 'tokens in, cash out, "nobody gambled"', keys: [
    K(R.slide, 'prop:alleyWin', 'MS', -30, 6, 34, {push: 1.04}),
    K(T('slide', 'cash'), 'prop:alleyWin', 'MCU', -25, 5, 30, {move: 'dolly', dur: 0.8, push: 1.1})]},
];
export const KICKS: Kick[] = [];
export const WHIPS: Whip[] = [];
export const FLASHES: Flash[] = [];
