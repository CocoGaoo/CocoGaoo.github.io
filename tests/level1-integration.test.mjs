import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context={globalThis:{}};
for(const file of [
  'content-v25.js',
  'curriculum/level1-1.js',
  'curriculum/level1-2.js',
  'curriculum/level1-schedule.js',
  'curriculum/level1-state.js',
  'level1-course-v26.js'
])vm.runInNewContext(fs.readFileSync(file,'utf8'),context);

const api=context.globalThis.MalbitLevel1Course;
const favorites=api.favoriteWords({favoriteWordIds:['l1-u04-w11']});
assert.equal(favorites.length,1);
assert.equal(favorites[0].id,'l1-u04-w11');
assert.ok(favorites[0].ko&&favorites[0].zh);

const mixed=api.mistakeView(
  [{id:'u1-0',type:'词汇',q:'旧题',your:'A',answer:'B',why:'旧解析',reviewed:false}],
  {mistakes:[{id:'lesson:q1',dayId:8,source:'lesson',type:'reading',prompt:'新题',selected:'A',answer:'B',explanation:'新解析',reviewed:false}]}
);
assert.deepEqual(Array.from(mixed,item=>item.id),['legacy:u1-0','level1:lesson:q1']);
assert.deepEqual(Array.from(mixed,item=>item.source),['legacy','lesson']);
assert.equal(mixed[1].dayId,8);

const manifest=JSON.parse(fs.readFileSync('audio/level1/manifest.json','utf8'));
const lesson=api.lessonSummary(1,manifest);
const answers=Object.fromEntries(lesson.assessment.map(item=>[item.id,item.answer]));
answers[lesson.assessment[0].id]='错误答案';
const result=api.gradeAssessment(lesson.assessment,answers);
const wrong=result.feedback.find(item=>!item.ok);
assert.equal(wrong.itemId,lesson.assessment[0].id);
assert.equal(wrong.prompt,lesson.assessment[0].prompt);
assert.equal(wrong.selected,'错误答案');
assert.equal(wrong.answer,lesson.assessment[0].answer);
assert.ok(wrong.explanation);

console.log('level one integration: favorites and mixed mistakes');
