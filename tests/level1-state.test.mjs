import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context={globalThis:{}};
vm.runInNewContext(fs.readFileSync('curriculum/level1-state.js','utf8'),context);
const {migrate,canOpen,completeDay}=context.globalThis.MalbitLevel1State;

const legacy={day:3,stages:{d1:[true,true,true]},exams:[{day:1,score:90}]};
const root={sevenDay:legacy,other:{kept:true}};
const migrated=migrate(root);
assert.equal(migrated.version,26);
assert.equal(migrated.currentDay,1);
assert.equal(migrated.quickCheck,true);
assert.deepEqual(migrated.legacySnapshot,legacy);
assert.notEqual(migrated.legacySnapshot,legacy);
assert.notEqual(migrated.legacySnapshot.stages,legacy.stages);
assert.deepEqual(root,{sevenDay:legacy,other:{kept:true}});
legacy.stages.d1[0]=false;
assert.equal(migrated.legacySnapshot.stages.d1[0],true);
assert.equal(canOpen(1,migrated),true);
assert.equal(canOpen(2,migrated),false);

const passed=completeDay(1,{score:80},migrated);
assert.deepEqual(passed.completedDays,[1]);
assert.equal(passed.themeScores[1],80);
assert.equal(passed.currentDay,2);
assert.equal(canOpen(2,passed),true);
assert.equal(canOpen(3,passed),false);
assert.deepEqual(migrated.completedDays,[]);

const failed=completeDay(2,{score:79,weakTags:['particles','listening']},passed);
assert.deepEqual(failed.completedDays,[1]);
assert.deepEqual(failed.themeScores,{1:80});
assert.equal(failed.currentDay,2);
assert.deepEqual(failed.weakTags,['particles','listening']);

const repeated=completeDay(1,{score:80},passed);
assert.deepEqual(repeated,passed);
assert.deepEqual(completeDay(2,{score:20,weakTags:['particles']},failed).weakTags,['particles','listening']);

const empty=migrate(null);
assert.deepEqual(empty.completedDays,[]);
assert.deepEqual(empty.themeScores,{});
assert.deepEqual(empty.weakTags,[]);
assert.equal(empty.legacySnapshot,null);
assert.equal(canOpen(0,empty),false);
assert.equal(canOpen(46,empty),false);
assert.equal(canOpen('1',empty),false);
assert.equal(completeDay(1,{score:80},null).currentDay,2);
assert.strictEqual(completeDay(0,{score:100},empty),empty);
assert.strictEqual(completeDay(46,{score:100},empty),empty);

console.log('level one state: migration, quick check, unlocks and failures');
