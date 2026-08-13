(function(root){
  const maxDay=45;
  const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
  const copy=value=>Array.isArray(value)?value.map(copy):object(value)?Object.fromEntries(Object.entries(value).map(([key,item])=>[key,copy(item)])):value;
  const day=value=>Number.isInteger(value)&&value>=1&&value<=maxDay;
  const score=value=>Number.isFinite(Number(value))?Number(value):0;
  const tags=value=>Array.from(new Set((Array.isArray(value)?value:[]).filter(tag=>typeof tag==='string'&&tag)));

  function migrate(rootState){
    const legacy=object(rootState)&&object(rootState.sevenDay)?copy(rootState.sevenDay):null;
    return {version:26,currentDay:1,completedDays:[],themeScores:{},weakTags:[],legacySnapshot:legacy,quickCheck:true};
  }

  function canOpen(dayId,state){
    return day(dayId)&&day(Math.min(maxDay,Math.max(1,Number(state&&state.currentDay)||1)))&&dayId<=Math.min(maxDay,Math.max(1,Number(state&&state.currentDay)||1));
  }

  function completeDay(dayId,result={},state){
    const current=object(state)?state:migrate();
    if(!canOpen(dayId,current))return state;
    const next={...current,completedDays:Array.isArray(current.completedDays)?[...current.completedDays]:[],themeScores:object(current.themeScores)?{...current.themeScores}:{},weakTags:tags(current.weakTags)};
    if(score(result&&result.score)>=80){
      if(!next.completedDays.includes(dayId))next.completedDays.push(dayId);
      next.themeScores[dayId]=score(result.score);
      next.currentDay=Math.max(1,Math.min(maxDay,Math.max(Number(current.currentDay)||1,dayId+1)));
    }else next.weakTags=tags([...next.weakTags,...(result&&result.weakTags||[])]);
    return next;
  }

  root.MalbitLevel1State={migrate,canOpen,completeDay};
})(globalThis);
