(function(root){
  function build(themes){
    const checkpointDays=new Set([10,20,30,40,45]);
    let themeIndex=0,phase='input';
    return Array.from({length:45},(_,index)=>{
      const id=index+1;
      if(checkpointDays.has(id))return{id,kind:'checkpoint',themeId:null,phase:id===45?'final':'review',minutes:{course:55,training:20},title:id===45?'1级结业考':'阶段复习'};
      const theme=themes[themeIndex];
      const day={id,kind:'lesson',themeId:theme.id,phase,minutes:{course:55,training:20},title:theme.title};
      if(phase==='output'){themeIndex++;phase='input'}else phase='output';
      return day;
    });
  }

  root.MalbitLevel1Schedule={build};
})(globalThis);
