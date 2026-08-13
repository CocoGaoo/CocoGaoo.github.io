import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const context={globalThis:{}};
vm.runInNewContext(fs.readFileSync('content-v25.js','utf8'),context);
const {cultures,drills,evaluateWriting}=context.globalThis.MalbitContentV25;

assert.equal(Object.keys(cultures).length,7);
for(const culture of Object.values(cultures)){
  assert.ok(culture.paragraphs.length>=3,'culture needs a real short reading');
  assert.ok(culture.paragraphs.every(x=>x.ko&&x.zh),'each paragraph is bilingual');
  assert.ok(culture.keywords.length>=3,'culture needs learning support');
  assert.ok(culture.question.options.length>=2&&Number.isInteger(culture.question.answer));
}
assert.deepEqual(Array.from(Object.keys(drills)),['listening','reading','writing','mock']);
for(const [type,items] of Object.entries(drills)){
  assert.equal(items.length,2,`${type} needs two sample questions`);
}
assert.ok(drills.listening.every(x=>x.audioText));
assert.ok(drills.writing.every(x=>x.kind==='input'&&x.reference&&x.keywords.length));
assert.deepEqual(JSON.parse(JSON.stringify(evaluateWriting('오후 세 시에 도서관 앞에서 만나요.',drills.writing[1]))),{matched:['세 시에','도서관 앞에서','만나요'],missing:[],complete:true});
assert.deepEqual(Array.from(evaluateWriting('세 시에 만나요.',drills.writing[1]).missing),['도서관 앞에서']);
assert.ok([...drills.listening,...drills.reading,...drills.mock].every(x=>x.options.length>=2&&Number.isInteger(x.answer)&&x.why));
console.log('v25 content: 7 culture readings and 8 TOPIK drills');
