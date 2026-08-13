import fs from 'node:fs';
import vm from 'node:vm';

const context={globalThis:{}};
vm.runInNewContext(fs.readFileSync(new URL('../seven-day-data.js',import.meta.url),'utf8'),context);
const result={};
const visit=value=>{
  if(!value||typeof value!=='object')return;
  if(value.audioId&&value.ko)result[value.audioId]=value.ko;
  Object.values(value).forEach(visit);
};
visit(context.globalThis.MalbitSevenDayData);
process.stdout.write(JSON.stringify(result));
