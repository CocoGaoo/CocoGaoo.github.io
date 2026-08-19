import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context={globalThis:{}};
vm.runInNewContext(fs.readFileSync('curriculum/level1-state.js','utf8'),context);
const {migrate,normalize,canOpen,completeDay}=context.globalThis.MalbitLevel1State;
const plain=value=>JSON.parse(JSON.stringify(value));

const legacy={day:3,stages:{d1:[true,true,true]},exams:[{day:1,score:90}]};
const root={sevenDay:legacy,other:{kept:true}};
const migrated=migrate(root);
assert.equal(migrated.version,26);
assert.equal(migrated.currentDay,1);
assert.equal(migrated.quickCheck,true);
assert.deepEqual(plain(migrated.legacySnapshot),legacy);
assert.notEqual(migrated.legacySnapshot,legacy);
assert.notEqual(migrated.legacySnapshot.stages,legacy.stages);
assert.deepEqual(root,{sevenDay:legacy,other:{kept:true}});
legacy.stages.d1[0]=false;
assert.equal(migrated.legacySnapshot.stages.d1[0],true);
assert.equal(canOpen(1,migrated),true);
assert.equal(canOpen(2,migrated),false);

const passed=completeDay(1,{score:80},migrated);
assert.deepEqual(plain(passed.completedDays),[1]);
assert.equal(passed.themeScores[1],80);
assert.equal(passed.currentDay,2);
assert.equal(canOpen(2,passed),true);
assert.equal(canOpen(3,passed),false);
assert.deepEqual(plain(migrated.completedDays),[]);

const failed=completeDay(2,{score:79,weakTags:['particles','listening']},passed);
assert.deepEqual(plain(failed.completedDays),[1]);
assert.deepEqual(plain(failed.themeScores),{1:80});
assert.equal(failed.currentDay,2);
assert.deepEqual(plain(failed.weakTags),['particles','listening']);

const repeated=completeDay(1,{score:80},passed);
assert.deepEqual(plain(repeated),plain(passed));
assert.deepEqual(plain(completeDay(2,{score:20,weakTags:['particles']},failed).weakTags),['particles','listening']);

const empty=migrate(null);
assert.deepEqual(plain(empty.completedDays),[]);
assert.deepEqual(plain(empty.themeScores),{});
assert.deepEqual(plain(empty.weakTags),[]);
assert.equal(empty.legacySnapshot,null);
assert.equal(canOpen(0,empty),false);
assert.equal(canOpen(46,empty),false);
assert.equal(canOpen('1',empty),false);
assert.equal(completeDay(1,{score:80},null).currentDay,2);
assert.strictEqual(completeDay(0,{score:100},empty),empty);
assert.strictEqual(completeDay(46,{score:100},empty),empty);

const invalidFromEmpty=completeDay(0,{score:100},null);
assert.equal(invalidFromEmpty.version,26);
assert.equal(invalidFromEmpty.currentDay,1);
assert.equal(canOpen(1,{currentDay:Symbol('broken')}),false);
const symbolScore=completeDay(1,{score:Symbol('broken')},migrate(null));
assert.equal(symbolScore.currentDay,1);
assert.deepEqual(plain(symbolScore.completedDays),[]);

const refreshed=normalize({version:26,currentDay:4,completedDays:[1,2,3],themeScores:{1:90,2:80,3:100},weakTags:['listening']});
assert.equal(refreshed.currentDay,4);
assert.deepEqual(plain(refreshed.completedDays),[1,2,3]);
assert.deepEqual(plain(refreshed.themeScores),{1:90,2:80,3:100});
assert.equal(canOpen(4,refreshed),true);

console.log('level one state: migration, quick check, unlocks and failures');
