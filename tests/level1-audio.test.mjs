import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = {globalThis: {}};
for (const file of ['content-v25.js','curriculum/level1-schema.js', 'curriculum/level1-schedule.js', 'curriculum/level1-1.js', 'curriculum/level1-2.js','curriculum/level1-state.js','level1-course-v26.js']) {
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), context);
}

const requiredAudio = [];
const add = (id, text, lang) => requiredAudio.push({id, text, lang, voice: lang === 'ko' ? 'ko-KR-SunHiNeural' : 'en-US-JennyNeural'});
const addExamples = (id, examples) => examples.forEach((example, index) => add(`${id}-example-${String(index + 1).padStart(2, '0')}`, example.ko, 'ko'));

const themes = [...context.globalThis.MalbitLevel1PartOne.themes, ...context.globalThis.MalbitLevel1PartTwo.themes];
const usableDays=context.globalThis.MalbitLevel1Course.usableDays;
const publishedDays = context.globalThis.MalbitLevel1Schedule.build(themes).slice(0, usableDays).filter(day => day.kind === 'lesson');
assert.equal(usableDays,8);
assert.equal(publishedDays.length,8,'all published days are lessons before the first checkpoint');
for (const {themeId, phase} of publishedDays) {
  const theme = themes.find(item => item.id === themeId);
  const day = theme[`${phase}Day`];
    day.article.lines.forEach((line, index) => add(`${theme.id}-${phase}-article-${String(index + 1).padStart(2, '0')}`, line.ko, 'ko'));
    for (const word of day.words) {
      add(word.audio.ko, word.ko, 'ko');
      add(word.audio.en, word.en, 'en');
      add(`${word.id}-example`, word.example.ko, 'ko');
    }
    for (const grammar of day.grammar) addExamples(grammar.id, grammar.examples);
    for (const item of day.assessment) if (item.type === 'listening') add(item.audioId, item.audioText, 'ko');
}

const ids = new Set();
for (const item of requiredAudio) assert.ok(!ids.has(item.id), `duplicate audio id: ${item.id}`), ids.add(item.id);
assert.ok(requiredAudio.some(item => item.id.endsWith('-ko')));
assert.ok(requiredAudio.some(item => item.id.endsWith('-en')));
assert.ok(requiredAudio.some(item => item.id.includes('-article-')));
assert.ok(requiredAudio.some(item => item.id.endsWith('-example')));
assert.ok(requiredAudio.some(item => item.id.includes('-example-')));
assert.ok(requiredAudio.some(item => item.id.endsWith('-audio')));

const manifest = fs.existsSync('audio/level1/manifest.json')
  ? JSON.parse(fs.readFileSync('audio/level1/manifest.json', 'utf8'))
  : {};
for (const item of requiredAudio) {
  assert.ok(manifest[item.id], `${item.id} missing`);
  assert.equal(manifest[item.id].text, item.text, `${item.id} text`);
  assert.equal(manifest[item.id].lang, item.lang, `${item.id} lang`);
  assert.equal(manifest[item.id].voice, item.voice, `${item.id} voice`);
  assert.match(manifest[item.id].src, /^audio\/level1\/.+\.mp3$/, `${item.id} src`);
  assert.ok(fs.statSync(manifest[item.id].src).size > 1000, `${item.id} audio too small`);
}

console.log(`level one audio: ${requiredAudio.length} clips valid`);
