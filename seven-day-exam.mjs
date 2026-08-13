export function gradeExam(quiz,answers={}){
  const details=quiz.map(q=>({...q,picked:Number(answers[q.id]),correct:Number(answers[q.id])===q.answer}));
  const score=Math.round(details.filter(x=>x.correct).length/details.length*100);
  const completed=[...new Set(details.filter(x=>answers[x.id]!==undefined).map(x=>x.type))];
  return {score,passed:score>=80&&['listening','reading','speaking'].every(x=>completed.includes(x)),completed,details};
}
