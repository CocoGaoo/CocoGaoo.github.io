import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const manifest=JSON.parse(fs.readFileSync('audio/seven-day/manifest.json','utf8'));
const context={globalThis:{}};
vm.runInNewContext(fs.readFileSync('seven-day-data.js','utf8'),context);
const ids=[];
const visit=value=>{if(!value||typeof value!=='object')return;if(value.audioId)ids.push(value.audioId);Object.values(value).forEach(visit)};
visit(context.globalThis.MalbitSevenDayData);
assert.ok(ids.length>=80,'expected complete seven-day audio set');
for(const id of new Set(ids)){
  assert.ok(manifest[id],`${id} missing`);
  assert.ok(fs.statSync(manifest[id].src).size>1000,`${id} audio too small`);
  assert.equal(manifest[id].voice,'ko-KR-SunHiNeural');
}
console.log(`audio manifest: ${new Set(ids).size} course clips valid`);
