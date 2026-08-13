import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest=JSON.parse(fs.readFileSync('audio/seven-day/manifest.json','utf8'));
for(const id of ['sample-word','sample-sentence','sample-sound-change']){
  assert.ok(manifest[id],`${id} missing`);
  assert.ok(fs.statSync(manifest[id].src).size>1000,`${id} audio too small`);
  assert.equal(manifest[id].voice,'Yuna');
}
console.log('audio manifest: samples valid');
