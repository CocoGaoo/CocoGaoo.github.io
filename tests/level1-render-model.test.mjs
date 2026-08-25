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
assert.equal(api.usableDays,14);
const plain=value=>JSON.parse(JSON.stringify(value));
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
assert.equal(directory.days[7].status,'locked');
assert.equal(directory.days[8].status,'locked');
assert.equal(directory.days[9].status,'locked');
assert.equal(directory.days[10].status,'locked');
assert.equal(directory.days[11].status,'locked');
assert.equal(directory.days[12].status,'locked');
assert.equal(directory.days[13].status,'locked');
assert.equal(directory.days[14].status,'preview');
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
assert.ok(lesson.assessment.length>=2);
assert.ok(lesson.assessment.every(item=>Array.isArray(item.options)&&item.options.length>=2));
assert.ok(lesson.assessment.every(item=>item.answer!=='开放作答'));

const dayEight=api.lessonSummary(8,manifest);
assert.equal(dayEight.id,8);
assert.ok(dayEight.article.lines.every(line=>line.audio?.src));
assert.ok(dayEight.words.every(word=>word.audio.ko?.src&&word.audio.en?.src));
assert.ok(dayEight.assessment.every(item=>item.answer!=='开放作答'));

const dayNine=api.lessonSummary(9,manifest);
assert.equal(dayNine.id,9);
assert.ok(dayNine.article.lines.every(line=>line.audio?.src));
assert.ok(dayNine.words.every(word=>word.audio.ko?.src&&word.audio.en?.src));
assert.ok(dayNine.assessment.every(item=>item.answer!=='开放作答'));

const dayEleven=api.lessonSummary(11,manifest);
assert.equal(dayEleven.id,11);
assert.ok(dayEleven.article.lines.every(line=>line.audio?.src));
assert.ok(dayEleven.words.every(word=>word.audio.ko?.src&&word.audio.en?.src));
assert.ok(dayEleven.assessment.every(item=>item.answer!=='开放作答'));

const dayTwelve=api.lessonSummary(12,manifest);
assert.equal(dayTwelve.id,12);
assert.ok(dayTwelve.article.lines.every(line=>line.audio?.src));
assert.ok(dayTwelve.words.every(word=>word.audio.ko?.src&&word.audio.en?.src));
assert.ok(dayTwelve.assessment.every(item=>item.answer!=='开放作答'));

const dayThirteen=api.lessonSummary(13,manifest);
assert.equal(dayThirteen.id,13);
assert.ok(dayThirteen.article.lines.every(line=>line.audio?.src));
assert.ok(dayThirteen.words.every(word=>word.audio.ko?.src&&word.audio.en?.src));
assert.ok(dayThirteen.assessment.every(item=>item.answer!=='开放作答'));

const dayFourteen=api.lessonSummary(14,manifest);
assert.equal(dayFourteen.id,14);
assert.ok(dayFourteen.article.lines.every(line=>line.audio?.src));
assert.ok(dayFourteen.words.every(word=>word.audio.ko?.src&&word.audio.en?.src));
assert.ok(dayFourteen.assessment.every(item=>item.answer!=='开放作答'));

const answers=Object.fromEntries(lesson.assessment.map(item=>[item.id,item.options?.includes(item.answer)?item.answer:'已完成']));
const passed=api.gradeAssessment(lesson.assessment,answers);
assert.equal(passed.score,100);
assert.equal(passed.passed,true);
const failed=api.gradeAssessment(lesson.assessment,{...answers,[lesson.assessment[0].id]:'错误答案'});
assert.equal(failed.score,50);
assert.equal(failed.passed,false);
assert.deepEqual(Array.from(failed.weakTags),['listening']);

const completed={version:26,currentDay:3,completedDays:[1,2],themeScores:{1:100,2:80},weakTags:[]};
const reviewA=api.dailyReview(completed,'2026-08-19');
const reviewARefresh=api.dailyReview(completed,'2026-08-19');
const reviewTomorrow=api.dailyReview(completed,'2026-08-20');
assert.equal(reviewA.length,5);
assert.deepEqual(plain(reviewARefresh),plain(reviewA));
assert.notDeepEqual(plain(reviewTomorrow),plain(reviewA));
assert.ok(reviewA.every(item=>item.ko&&item.zh&&item.options.includes(item.ko)));
assert.ok(new Set(reviewA.map(item=>item.options.indexOf(item.ko))).size>1);

assert.equal(api.nextLessonAfterPass(1,{passed:true}),2);
assert.equal(api.nextLessonAfterPass(7,{passed:true}),8);
assert.equal(api.nextLessonAfterPass(8,{passed:true}),9);
assert.equal(api.nextLessonAfterPass(9,{passed:true}),10);
assert.equal(api.nextLessonAfterPass(10,{passed:true}),11);
assert.equal(api.nextLessonAfterPass(11,{passed:true}),12);
assert.equal(api.nextLessonAfterPass(12,{passed:true}),13);
assert.equal(api.nextLessonAfterPass(13,{passed:true}),14);
assert.equal(api.nextLessonAfterPass(14,{passed:true}),null);
assert.equal(api.nextLessonAfterPass(1,{passed:false}),null);

const topik=api.topikQuestions({completedDays:[1,2]},manifest);
assert.ok(topik.length>=2);
assert.ok(topik.every(item=>item.themeId==='l1-u01'));
assert.ok(topik.every(item=>Array.isArray(item.options)&&item.options.length>=2));
assert.ok(topik.every(item=>!['writing','speaking','authentic-writing','reflection'].includes(item.type)));
assert.deepEqual(plain(api.topikQuestions({completedDays:[]},manifest)),[]);
assert.ok(api.topikQuestions({completedDays:[8]},manifest).every(item=>item.dayId===8));
assert.ok(api.topikQuestions({completedDays:[9]},manifest).every(item=>item.dayId===9));
assert.ok(api.topikQuestions({completedDays:[11]},manifest).every(item=>item.dayId===11));
assert.ok(api.topikQuestions({completedDays:[12]},manifest).every(item=>item.dayId===12));
assert.ok(api.topikQuestions({completedDays:[13]},manifest).every(item=>item.dayId===13));
assert.ok(api.topikQuestions({completedDays:[14]},manifest).every(item=>item.dayId===14));

const checkpoint=api.checkpointSummary(10,manifest);
assert.equal(checkpoint.id,10);
assert.ok(checkpoint.questions.length>=5);
assert.ok(checkpoint.questions.every(item=>item.options?.length>=2));
assert.equal(new Set(checkpoint.questions.map(item=>item.id)).size,checkpoint.questions.length);
assert.equal(api.gradeAssessment(checkpoint.questions,Object.fromEntries(checkpoint.questions.map(item=>[item.id,item.answer]))).score,100);

console.log('level one render model: fourteen usable days, checkpoint gate and 45-day preview');
