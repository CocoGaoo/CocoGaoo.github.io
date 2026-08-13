import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context = {globalThis: {}};
vm.runInNewContext(fs.readFileSync('curriculum/level1-schema.js', 'utf8'), context);
vm.runInNewContext(fs.readFileSync('curriculum/level1-1.js', 'utf8'), context);

const {MalbitLevel1PartOne, MalbitLevel1Schema} = context.globalThis;
const themes = Array.from(MalbitLevel1PartOne.themes);
const expectedTitles = ['问候与介绍', '物品', '学校', '朋友', '故乡', '学校生活', '饮食', '一天生活', '周末', '过去的事'];
const entityIds = new Set();
let wordCount = 0;

function registerId(id, prefix){
  assert.ok(id.startsWith(prefix), `${id}: expected prefix ${prefix}`);
  assert.ok(!entityIds.has(id), `duplicate entity id: ${id}`);
  entityIds.add(id);
}

assert.deepEqual(themes.map(theme => theme.title), expectedTitles);

for(const theme of themes){
  assert.equal(MalbitLevel1Schema.validateTheme(theme).length, 0, `${theme.title}: schema validation`);
  assert.match(theme.id, /^l1-u\d{2}$/);
  registerId(theme.id, 'l1-u');
  assert.equal(theme.sourceLabel, '依据延世1级能力目标原创');
  assert.ok(Array.isArray(theme.goals) && theme.goals.length >= 2, `${theme.title}: goals`);

  for(const [phase, day] of [['input', theme.inputDay], ['output', theme.outputDay]]){
    assert.ok(day && typeof day === 'object', `${theme.title}: ${phase} day`);
    assert.ok(day.article && typeof day.article.title === 'string');
    assert.equal(day.article.lines.length, 6, `${theme.title}: ${phase} article lines`);
    for(const line of day.article.lines){
      assert.ok(typeof line.ko === 'string' && line.ko.length > 0);
      assert.ok(typeof line.zh === 'string' && line.zh.length > 0);
    }

    assert.ok(day.words.length >= 10 && day.words.length <= 14, `${theme.title}: ${phase} words`);
    for(const word of day.words){
      for(const key of ['id', 'ko', 'pron', 'zh', 'en', 'ipa', 'origin', 'memory', 'soundRule']){
        assert.ok(typeof word[key] === 'string' && word[key].length > 0, `${theme.title}: ${word.id || word.ko} ${key}`);
      }
      assert.match(word.id, /^l1-u\d{2}-w\d{2}$/);
      registerId(word.id, `${theme.id}-w`);
      wordCount++;
      assert.ok(word.ipa.startsWith('/') && word.ipa.endsWith('/'), `${word.id}: English IPA`);
      assert.ok(word.example && word.example.ko && word.example.zh, `${word.id}: example`);
      assert.equal(word.audio.ko, `${word.id}-ko`);
      assert.equal(word.audio.en, `${word.id}-en`);
    }

    assert.ok(day.grammar.length >= 2 && day.grammar.length <= 3, `${theme.title}: ${phase} grammar`);
    for(const grammar of day.grammar){
      assert.ok(grammar.id && grammar.title && grammar.form && grammar.meaning);
      assert.match(grammar.id, /^l1-u\d{2}-g\d{2}$/);
      registerId(grammar.id, `${theme.id}-g`);
      assert.ok(Array.isArray(grammar.examples) && grammar.examples.length >= 1);
      assert.ok(grammar.examples.every(example => example.ko && example.zh));
    }
    assert.ok(day.culture && day.culture.title && day.culture.zh);
    assert.ok(Array.isArray(day.assessment) && day.assessment.length > 0);
    assert.ok(day.assessment.every(item => item.id && item.type && item.prompt));
    const assessmentPrefix = `${theme.id}-${phase === 'input' ? 'a' : 'b'}`;
    for(const item of day.assessment){
      assert.match(item.id, /^l1-u\d{2}-[ab]\d{2}$/);
      registerId(item.id, assessmentPrefix);
      if(item.type === 'listening'){
        assert.equal(item.audioId, `${item.id}-audio`, `${item.id}: stable audio id`);
        assert.ok(typeof item.audioText === 'string' && item.audioText.length > 0, `${item.id}: audio text`);
        assert.ok(Array.isArray(item.options) && item.options.length >= 2, `${item.id}: answer options`);
        assert.equal(new Set(item.options).size, item.options.length, `${item.id}: unique options`);
        assert.ok(item.options.includes(item.answer), `${item.id}: answer must match an option`);
      }
    }
  }

  assert.ok(theme.outputDay.assessment.length >= 6, `${theme.title}: output assessment count`);
  const outputTypes = new Set(theme.outputDay.assessment.map(item => item.type));
  for(const type of ['listening', 'speaking', 'reading', 'authentic-writing']){
    assert.ok(outputTypes.has(type), `${theme.title}: missing ${type}`);
  }
}

assert.equal(wordCount, themes.reduce((count, theme) => count + theme.inputDay.words.length + theme.outputDay.words.length, 0));
console.log(`level one part one: ${themes.length} themes, ${wordCount} words, and ${entityIds.size} unique entity ids validated`);
