(()=>{
function build(input={}){
 const now=Number(input.now)||Date.now(),date=input.date||new Date(now).toLocaleDateString('sv-SE'),course=input.course||{},seven=course.sevenDay||{},stages=seven.stages||{};
 const day=Math.min(7,Math.max(1,Number(seven.day)||1)),done=Array.isArray(stages[`d${day}`])?stages[`d${day}`]:[],first=done.findIndex(x=>!x),stage=Math.min(3,done.length===0?1:first<0?3:first+1);
 const sessions=input.studyTime?.sessions||[],settled=sessions.filter(x=>x.date===date).reduce((n,x)=>n+Number(x.seconds||0),0),pending=Number(input.studyTime?.focusSeconds||0);
 return{blocks:['today','session','growth','review'],day,stage,completedStages:Object.values(stages).flat().filter(Boolean).length,passedDays:new Set((seven.exams||[]).filter(x=>Number(x.score)>=80).map(x=>x.day)).size,todayMinutes:Math.floor((settled+pending)/60),settledMinutes:Math.floor(settled/60),pendingMinutes:Math.floor(pending/60),dueWords:Object.values(course.memory||{}).filter(x=>Number(x.due||0)<=now).length,openMistakes:(input.mistakes||[]).filter(x=>!x.reviewed).length,reviewedWords:course.today?.date===date?Number(course.today.reviewed||0):0,timer:{running:Boolean(input.studyTime?.running),phase:input.studyTime?.phase==='break'?'break':'focus',remaining:Number(input.studyTime?.remaining||1500)}}
}
globalThis.MalbitHomeFocusModel={build};
})();
