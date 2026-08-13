import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context={globalThis:{}};
vm.runInNewContext(fs.readFileSync('seven-day-data.js','utf8'),context);
const data=context.globalThis.MalbitSevenDayData;
assert.equal(data.version,1);
assert.equal(data.days.length,7);
for(const [index,day] of data.days.entries()){
  assert.equal(day.id,index+1);
  assert.ok(day.article.lines.length>=6&&day.article.lines.length<=10,`Day ${day.id} article length`);
  assert.ok(day.words.length>=8&&day.words.length<=12,`Day ${day.id} word count`);
  assert.ok(day.grammar.length>=2&&day.grammar.length<=3,`Day ${day.id} grammar count`);
  assert.deepEqual(new Set(day.quiz.map(x=>x.type)),new Set(['listening','speaking','reading','writing']));
  assert.match(day.video.bvid,/^BV[0-9A-Za-z]+$/);
  for(const word of day.words)for(const key of ['ko','pron','zh','en','ipa','origin','memory','soundRule','example','audioId'])assert.ok(word[key],`Day ${day.id} ${word.ko||'word'} missing ${key}`);
}
console.log('seven-day data: 7 days valid');
