import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = {globalThis: {}};
vm.runInNewContext(fs.readFileSync('curriculum/level1-schedule.js', 'utf8'), context);
vm.runInNewContext(fs.readFileSync('curriculum/level1-schema.js', 'utf8'), context);

const {MalbitLevel1Schema, MalbitLevel1Schedule} = context.globalThis;
const themes = Array.from({length: 20}, (_, index) => ({
  id: `theme-${index + 1}`,
  title: `Theme ${index + 1}`,
}));
const days = MalbitLevel1Schedule.build(themes);

assert.equal(MalbitLevel1Schema.validateTheme(themes[0]).length, 0);
assert.equal(days.length, 45);
assert.equal(days.filter(x => x.kind === 'lesson').length, 40);
assert.equal(days.filter(x => x.kind === 'checkpoint').length, 5);
assert.deepEqual(Array.from(days.filter(x => x.kind === 'checkpoint'), x => x.id), [10, 20, 30, 40, 45]);
assert.ok(days.every(x => x.minutes.course === 55 && x.minutes.training === 20));

console.log('level one schedule: 45 days generated');
