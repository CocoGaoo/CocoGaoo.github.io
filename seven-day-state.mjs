export function normalizeSevenDay(value={}){
  return {
    day:Math.min(7,Math.max(1,Number(value.day)||1)),
    stages:value.stages&&typeof value.stages==='object'?value.stages:{},
    exams:Array.isArray(value.exams)?value.exams:[],
    speech:value.speech&&typeof value.speech==='object'?value.speech:{},
  };
}

export function readState(raw={}){
  return {...raw,sevenDay:normalizeSevenDay(raw.sevenDay)};
}

export function canAdvance(attempt={}){
  const done=new Set(attempt.completed||[]);
  return Number(attempt.score)>=80&&['listening','reading','speaking'].every(type=>done.has(type));
}
