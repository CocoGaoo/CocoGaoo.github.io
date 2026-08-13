import fs from 'node:fs';
import vm from 'node:vm';

const context = {globalThis: {}};
for (const file of ['curriculum/level1-schema.js', 'curriculum/level1-schedule.js', 'curriculum/level1-1.js', 'curriculum/level1-2.js']) {
  vm.runInNewContext(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), context);
}

const items = {};
const add = (id, text, lang) => {
  if (items[id]) throw new Error(`Duplicate audio ID: ${id}`);
  items[id] = {text, lang, voice: lang === 'ko' ? 'ko-KR-SunHiNeural' : 'en-US-JennyNeural'};
};
const number = value => String(value).padStart(2, '0');
const daysArg = process.argv.indexOf('--days');
const dayCount = daysArg === -1 ? null : Number(process.argv[daysArg + 1]);
if (daysArg !== -1 && (!Number.isInteger(dayCount) || dayCount < 1 || dayCount > 45)) throw new Error('--days must be between 1 and 45');
const themes = [...context.globalThis.MalbitLevel1PartOne.themes, ...context.globalThis.MalbitLevel1PartTwo.themes];
const selectedDays = dayCount === null
  ? themes.flatMap(theme => [[theme.id, 'input'], [theme.id, 'output']])
  : context.globalThis.MalbitLevel1Schedule.build(themes).slice(0, dayCount).filter(day => day.kind === 'lesson').map(day => [day.themeId, day.phase]);

for (const [themeId, phase] of selectedDays) {
  const theme = themes.find(item => item.id === themeId);
  const day = theme[`${phase}Day`];
    day.article.lines.forEach((line, index) => add(`${theme.id}-${phase}-article-${number(index + 1)}`, line.ko, 'ko'));
    for (const word of day.words) {
      add(word.audio.ko, word.ko, 'ko');
      add(word.audio.en, word.en, 'en');
      add(`${word.id}-example`, word.example.ko, 'ko');
    }
    for (const grammar of day.grammar) grammar.examples.forEach((example, index) => add(`${grammar.id}-example-${number(index + 1)}`, example.ko, 'ko'));
    for (const item of day.assessment) if (item.type === 'listening') add(item.audioId, item.audioText, 'ko');
}

process.stdout.write(JSON.stringify(items));
