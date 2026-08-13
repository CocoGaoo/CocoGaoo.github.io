import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../home-focus-model.js',import.meta.url),'utf8');
const sandbox={globalThis:{}};
vm.runInNewContext(source,sandbox);
const {build}=sandbox.globalThis.MalbitHomeFocusModel;

const today='2026-08-13';
const model=build({
  now:new Date(`${today}T12:00:00+08:00`).getTime(),
  date:today,
  course:{
    sevenDay:{day:2,stages:{d1:[true,true,true],d2:[true,false,false]},exams:[{day:1,score:90}]},
    memory:{학교:{due:0,lapses:2},교실:{due:Date.now()+86400000,lapses:0}},
    today:{date:today,reviewed:7}
  },
  mistakes:[{reviewed:false},{reviewed:true}],
  studyTime:{sessions:[{date:today,seconds:1500},{date:today,seconds:600}],focusSeconds:300,phase:'focus',remaining:1200}
});

assert.deepEqual(Array.from(model.blocks),['today','session','growth','review']);
assert.equal(model.day,2);
assert.equal(model.stage,2);
assert.equal(model.todayMinutes,40);
assert.equal(model.passedDays,1);
assert.equal(model.dueWords,1);
assert.equal(model.openMistakes,1);
assert.equal(model.reviewedWords,7);
console.log('home focus model: one route, four useful blocks');
