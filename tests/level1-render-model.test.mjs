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
]) vm.runInNewContext(fs.readFileSync(file,'utf8'),context);

const api=context.globalThis.MalbitLevel1Course;
const state={version:26,currentDay:1,completedDays:[],themeScores:{},weakTags:[]};
const view=api.homeSummary({currentDay:11,completedDays:[1,2,3,4,5,6,7,8,9,10]});
assert.equal(view.day,11);
assert.equal(view.totalDays,45);
assert.equal(view.courseMinutes,55);
assert.equal(view.trainingMinutes,20);

const directory=api.directorySummary(state,new Date('2026-08-13T00:00:00Z'));
assert.equal(directory.days.length,45);
assert.equal(directory.days[0].status,'current');
assert.equal(directory.days[6].status,'locked');
assert.equal(directory.days[7].status,'preview');
assert.equal(directory.days[0].expectedDate,'08-13');
assert.equal(directory.days[6].expectedDate,'08-19');
assert.equal(directory.days[9].source,'阶段复习');

const manifest=JSON.parse(fs.readFileSync('audio/level1/manifest.json','utf8'));
const lesson=api.lessonSummary(1,manifest);
assert.equal(lesson.courseMinutes,55);
assert.equal(lesson.trainingMinutes,20);
assert.equal(lesson.goals.length,2);
assert.equal(lesson.article.lines.length,6);
assert.ok(lesson.article.lines.every(line=>line.audio?.src));
assert.ok(lesson.words.every(word=>word.audio.ko?.src&&word.audio.en?.src));
assert.equal(lesson.culture.paragraphs.length,3);
assert.ok(lesson.culture.paragraphs.every(paragraph=>paragraph.ko&&paragraph.zh));

const answers=Object.fromEntries(lesson.assessment.map(item=>[item.id,item.options?.includes(item.answer)?item.answer:'已完成']));
const passed=api.gradeAssessment(lesson.assessment,answers);
assert.equal(passed.score,100);
assert.equal(passed.passed,true);
const failed=api.gradeAssessment(lesson.assessment,{...answers,[lesson.assessment[0].id]:'错误答案'});
assert.equal(failed.score,75);
assert.equal(failed.passed,false);
assert.deepEqual(Array.from(failed.weakTags),['listening']);

console.log('level one render model: seven usable days, mapped audio, assessment gate and 45-day preview');
