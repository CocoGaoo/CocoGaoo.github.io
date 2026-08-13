import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context={globalThis:{}};
vm.runInNewContext(fs.readFileSync('seven-day-classroom-data.js','utf8'),context);
const days=context.globalThis.MalbitSevenDayClassroom.days;
assert.equal(Object.keys(days).length,7);
for(let id=1;id<=7;id++){
  const day=days[id];
  assert.ok(day.goal.length>=3,`day ${id} needs learning goals`);
  assert.equal(day.lineNotes.length,6,`day ${id} needs six line explanations`);
  assert.ok(day.lineNotes.every(x=>x.chunks.length>=2&&x.tip),`day ${id} line notes incomplete`);
  assert.ok(day.contrast.length>=2,`day ${id} needs contrasts`);
  assert.ok(day.substitution.frames.length>=3,`day ${id} needs substitutions`);
  assert.equal(day.checks.length,3,`day ${id} needs three checks`);
  assert.ok(day.checks.every(x=>x.options.length>=2&&Number.isInteger(x.answer)&&x.why));
}
assert.match(days[2].contrast.map(x=>x.title).join(' '),/이것.*그것.*저것/);
assert.match(days[2].contrast.map(x=>x.body).join(' '),/은\/는.*이\/가/);
console.log('seven-day classroom: seven complete guided lessons');
