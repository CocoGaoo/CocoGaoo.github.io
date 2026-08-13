import assert from 'node:assert/strict';
import {readState,canAdvance} from '../seven-day-state.mjs';

assert.deepEqual(readState({unit:2}).sevenDay,{day:1,stages:{},exams:[],speech:{}});
assert.equal(readState({sevenDay:{day:3}}).sevenDay.day,3);
assert.equal(readState({sevenDay:{day:99}}).sevenDay.day,7);
assert.equal(canAdvance({score:80,completed:['listening','reading','speaking']}),true);
assert.equal(canAdvance({score:79,completed:['listening','reading','speaking']}),false);
assert.equal(canAdvance({score:100,completed:['listening','reading']}),false);
console.log('seven-day state: compatible and gated');
