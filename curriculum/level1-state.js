(function(root){
  const maxDay=45;
  const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
  const copy=value=>Array.isArray(value)?value.map(copy):object(value)?Object.fromEntries(Object.entries(value).map(([key,item])=>[key,copy(item)])):value;
  const day=value=>Number.isInteger(value)&&value>=1&&value<=maxDay;
  const number=value=>{try{return Number(value)}catch{return NaN}};
  const score=value=>Number.isFinite(number(value))?number(value):0;
  const tags=value=>Array.from(new Set((Array.isArray(value)?value:[]).filter(tag=>typeof tag==='string'&&tag)));
  const stateDay=value=>value===undefined?1:Number.isInteger(number(value))?Math.min(maxDay,Math.max(1,number(value))):null;

  function migrate(rootState){
    const legacy=object(rootState)&&object(rootState.sevenDay)?copy(rootState.sevenDay):null;
    return {version:26,currentDay:1,completedDays:[],themeScores:{},weakTags:[],legacySnapshot:legacy,quickCheck:true};
  }

  function normalize(value){
    if(!object(value)||value.version!==26)return migrate(value);
    const completedDays=Array.from(new Set((Array.isArray(value.completedDays)?value.completedDays:[]).filter(day))).sort((a,b)=>a-b);
    const currentDay=Math.max(stateDay(value.currentDay)||1,completedDays.length?Math.min(maxDay,completedDays.at(-1)+1):1);
    return{...value,version:26,currentDay,completedDays,themeScores:object(value.themeScores)?{...value.themeScores}:{},weakTags:tags(value.weakTags)};
  }

  function canOpen(dayId,state){
    const current=stateDay(object(state)?state.currentDay:undefined);
    return day(dayId)&&current!==null&&dayId<=current;
  }

  function completeDay(dayId,result={},state){
    const current=object(state)&&state.version===26&&day(state.currentDay)&&Array.isArray(state.completedDays)&&object(state.themeScores)&&Array.isArray(state.weakTags)?state:{...migrate(),...(object(state)?state:{}),version:26,currentDay:stateDay(object(state)?state.currentDay:undefined)||1,completedDays:Array.isArray(state&&state.completedDays)?[...state.completedDays]:[],themeScores:object(state&&state.themeScores)?{...state.themeScores}:{},weakTags:tags(state&&state.weakTags)};
    if(!canOpen(dayId,state))return current;
    const next={...current,completedDays:Array.isArray(current.completedDays)?[...current.completedDays]:[],themeScores:object(current.themeScores)?{...current.themeScores}:{},weakTags:tags(current.weakTags)};
    if(score(result&&result.score)>=80){
      if(!next.completedDays.includes(dayId))next.completedDays.push(dayId);
      next.themeScores[dayId]=score(result.score);
      next.currentDay=Math.max(current.currentDay,dayId+1>maxDay?maxDay:dayId+1);
    }else next.weakTags=tags([...next.weakTags,...(result&&result.weakTags||[])]);
    return next;
  }

  root.MalbitLevel1State={migrate,normalize,canOpen,completeDay};
})(globalThis);
