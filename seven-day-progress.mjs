export function progressSummary(value={}){
  const completedStages=Object.values(value.stages||{}).flat().filter(Boolean).length;
  const passedDays=new Set((value.exams||[]).filter(x=>x.score>=80).map(x=>x.day)).size;
  return {day:Math.min(7,Math.max(1,Number(value.day)||1)),completedStages,totalStages:21,passedDays,percent:Math.round(completedStages/21*100)};
}
