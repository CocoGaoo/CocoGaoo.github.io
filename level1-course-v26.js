(function(root){
  const themes=[...(root.MalbitLevel1PartOne?.themes||[]),...(root.MalbitLevel1PartTwo?.themes||[])];
  const days=root.MalbitLevel1Schedule?.build(themes)||[];
  const themeById=new Map(themes.map(theme=>[theme.id,theme]));
  const storeKey='malbit-level1-v26';
  const usableDays=13;
  let manifest={};
  let container=null;
  let openId=null;

  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const clean=value=>String(value??'').trim().replace(/\s+/g,' ');

  function defaultState(){
    return root.MalbitLevel1State?.migrate(null)||{version:26,currentDay:1,completedDays:[],themeScores:{},weakTags:[],quickCheck:true};
  }

  function loadState(){
    try{
      const saved=JSON.parse(localStorage.getItem(storeKey)||'null');
      if(saved?.version===26)return root.MalbitLevel1State.normalize(saved);
      const legacy=JSON.parse(localStorage.getItem('malbit-course')||'{}');
      return root.MalbitLevel1State?.migrate(legacy)||defaultState();
    }catch{return defaultState()}
  }

  function saveState(state){
    localStorage.setItem(storeKey,JSON.stringify(state));
    window.dispatchEvent(new Event('malbit-progress-changed'));
  }

  function homeSummary(state={}){
    return{
      day:Math.min(45,Math.max(1,Number(state.currentDay)||1)),
      totalDays:45,
      courseMinutes:55,
      trainingMinutes:20,
      completedDays:Array.isArray(state.completedDays)?state.completedDays.length:0
    };
  }

  function expectedDate(start,index){
    const date=new Date(start);
    date.setDate(date.getDate()+index);
    return `${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }

  function directorySummary(state=defaultState(),start=new Date()){
    const current=Math.min(usableDays,Math.max(1,Number(state.currentDay)||1));
    const completed=new Set(Array.isArray(state.completedDays)?state.completedDays:[]);
    return{
      totalDays:45,
      days:days.map((day,index)=>({
        ...day,
        expectedDate:expectedDate(start,index),
        source:day.kind==='checkpoint'?'阶段复习':Number(day.themeId.replace('l1-u',''))<=10?'1-1 · 公开主题顺序':'1-2 · 能力目标原创',
        status:day.id>usableDays?'preview':completed.has(day.id)?'done':day.id===current?'current':'locked'
      }))
    };
  }

  function audioItem(id,audioManifest){
    const item=audioManifest?.[id];
    return item?.src?{id,src:item.src,lang:item.lang}:null;
  }

  function lessonSummary(dayId,audioManifest={}){
    const scheduleDay=days.find(day=>day.id===Number(dayId));
    if(!scheduleDay||scheduleDay.kind!=='lesson'||scheduleDay.id>usableDays)return null;
    const theme=themeById.get(scheduleDay.themeId);
    const lesson=scheduleDay.phase==='input'?theme.inputDay:theme.outputDay;
    const articlePrefix=`${theme.id}-${scheduleDay.phase}-article`;
    const culture=root.MalbitContentV25?.cultures?.[scheduleDay.id];
    const paragraphs=culture?.paragraphs||lesson.culture.paragraphs||[
      {ko:'문화 읽기 한국어 자료를 준비하고 있어요.',zh:lesson.culture.zh},
      {ko:'오늘의 표현을 실제 상황과 연결해 보세요.',zh:'把今天的表达和实际情景联系起来。'},
      {ko:'예의와 상황에 맞는 표현을 함께 익혀요.',zh:'同时学习符合礼貌和场景的表达。'}
    ];
    return{
      id:scheduleDay.id,
      title:lesson.article.title,
      themeTitle:theme.title,
      sourceLabel:theme.sourceLabel,
      phase:scheduleDay.phase,
      courseMinutes:scheduleDay.minutes.course,
      trainingMinutes:scheduleDay.minutes.training,
      goals:theme.goals,
      article:{...lesson.article,lines:lesson.article.lines.map((line,index)=>({...line,audio:audioItem(`${articlePrefix}-${String(index+1).padStart(2,'0')}`,audioManifest)}))},
      words:lesson.words.map(word=>({...word,audio:{ko:audioItem(word.audio.ko,audioManifest),en:audioItem(word.audio.en,audioManifest)}})),
      grammar:lesson.grammar,
      culture:{title:culture?.title||lesson.culture.title,paragraphs},
      assessment:choiceAssessment(lesson.assessment).map(item=>({...item,audio:audioItem(item.audioId,audioManifest)}))
    };
  }

  function choiceAssessment(items=[]){
    const objective=items.filter(item=>item.answer!=='开放作答');
    return objective.map((item,index)=>{
      if(Array.isArray(item.options))return item;
      const distractors=objective.map(other=>other.answer).filter(answer=>answer!==item.answer);
      for(const fallback of ['课文中没有提到','以上都不正确'])if(!distractors.includes(fallback))distractors.push(fallback);
      const options=[item.answer,...distractors.slice(0,2)];
      const shift=index%options.length;
      return{...item,options:[...options.slice(shift),...options.slice(0,shift)]};
    });
  }

  function favoriteWords(state={}){
    const ids=new Set(Array.isArray(state.favoriteWordIds)?state.favoriteWordIds:[]);
    return themes.flatMap(theme=>[...theme.inputDay.words,...theme.outputDay.words]).filter(word=>ids.has(word.id));
  }

  function mistakeView(legacyMistakes=[],state={}){
    const legacy=(Array.isArray(legacyMistakes)?legacyMistakes:[]).filter(item=>!item.reviewed).map(item=>({id:`legacy:${item.id}`,storage:'legacy',storageId:item.id,source:'legacy',type:item.type,prompt:item.q,selected:item.your,answer:item.answer,explanation:item.why}));
    const level1=(Array.isArray(state.mistakes)?state.mistakes:[]).filter(item=>!item.reviewed).map(item=>({...item,id:`level1:${item.id}`,storage:'level1',storageId:item.id}));
    return[...legacy,...level1];
  }

  function dateIndex(dateKey){
    const parts=String(dateKey).split('-').map(Number);
    return parts.length===3&&parts.every(Number.isFinite)?Math.floor(Date.UTC(parts[0],parts[1]-1,parts[2])/864e5):0;
  }

  function hash(value){
    return [...String(value)].reduce((total,char)=>(total*31+char.charCodeAt(0))>>>0,2166136261);
  }

  function dailyReview(state={},dateKey=''){
    const completed=new Set(Array.isArray(state.completedDays)?state.completedDays:[]);
    const pool=days.filter(day=>completed.has(day.id)&&day.kind==='lesson').flatMap(day=>{
      const theme=themeById.get(day.themeId),lesson=day.phase==='input'?theme.inputDay:theme.outputDay;
      return lesson.article.lines.map((line,index)=>({id:`${day.id}-${index+1}`,dayId:day.id,...line}));
    });
    if(!pool.length)return[];
    const shuffled=[...pool].sort((a,b)=>hash(a.id)-hash(b.id));
    const start=((dateIndex(dateKey)%shuffled.length)+shuffled.length)%shuffled.length;
    return Array.from({length:Math.min(5,shuffled.length)},(_,index)=>{
      const item=shuffled[(start+index)%shuffled.length];
      const options=[item.ko,shuffled[(start+index+1)%shuffled.length].ko,shuffled[(start+index+2)%shuffled.length].ko].filter((value,i,array)=>array.indexOf(value)===i);
      const shift=(start+index)%options.length;
      return{...item,options:[...options.slice(shift),...options.slice(0,shift)]};
    });
  }

  function topikQuestions(state={},audioManifest=manifest){
    const completed=new Set(Array.isArray(state.completedDays)?state.completedDays:[]),excluded=new Set(['writing','speaking','authentic-writing','reflection']);
    return days.filter(day=>completed.has(day.id)&&day.kind==='lesson'&&day.id<=usableDays).flatMap(day=>{
      const lesson=lessonSummary(day.id,audioManifest);
      return lesson.assessment.filter(item=>!excluded.has(item.type)).map(item=>({id:`course-topik:${item.id}`,dayId:day.id,themeId:day.themeId,type:item.type,prompt:item.prompt,options:item.options,answer:item.options.indexOf(item.answer),why:item.explanation||`参考答案：${item.answer}`,audio:item.audio}));
    });
  }

  function checkpointSummary(dayId,audioManifest=manifest){
    const checkpoint=days.find(day=>day.id===Number(dayId));
    if(!checkpoint||checkpoint.kind!=='checkpoint'||checkpoint.id>usableDays)return null;
    const completedDays=days.filter(day=>day.kind==='lesson'&&day.id<checkpoint.id).map(day=>day.id);
    const questions=topikQuestions({completedDays},audioManifest).slice(0,10).map(item=>({...item,id:`checkpoint:${checkpoint.id}:${item.id}`,answer:item.options[item.answer],explanation:item.why}));
    return{id:checkpoint.id,title:checkpoint.title,questions};
  }

  function nextLessonAfterPass(dayId,result){
    return result?.passed&&Number(dayId)<usableDays?Number(dayId)+1:null;
  }

  function todayKey(date=new Date()){
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }

  function gradeAssessment(items=[],answers={}){
    let correct=0;
    const feedback=items.map(item=>{
      const answer=clean(answers[item.id]);
      const exact=Array.isArray(item.options);
      const ok=exact?answer===clean(item.answer):Boolean(answer);
      if(ok)correct++;
      return{id:item.id,itemId:item.id,ok,selected:answer||'未作答',answer:item.answer,reference:item.answer,type:item.type,prompt:item.prompt,explanation:item.explanation||`参考答案：${item.answer}`};
    });
    const score=items.length?Math.round(correct/items.length*100):0;
    return{score,passed:score>=80,feedback,weakTags:Array.from(new Set(feedback.filter(item=>!item.ok).map(item=>item.type)))};
  }

  function audioButton(audio,label){
    return audio?`<button type="button" data-l1-audio="${esc(audio.src)}">🔊 ${esc(label)}</button>`:`<button type="button" disabled>音频准备中</button>`;
  }

  function renderHomeSummary(){
    const grid=document.querySelector('#home .dashboard-grid');
    if(!grid)return;
    grid.querySelector('.l1-home-summary')?.remove();
    const state=loadState(),summary=homeSummary(state),day=days[summary.day-1];
    const card=document.createElement('article');
    card.className='l1-home-summary';
    card.innerHTML=`<div><span>LEVEL 1 · 本周可学习版</span><h2>第 ${summary.day} 天 · ${esc(day?.title||'继续课程')}</h2><p>核心课程 ${summary.courseMinutes} 分钟 + 训练 ${summary.trainingMinutes} 分钟</p></div><div><b>${summary.completedDays}<small>/ ${summary.totalDays} 天</small></b><button type="button">进入课程 →</button></div>`;
    card.querySelector('button').onclick=()=>document.querySelector('[data-view-link="course"]')?.click();
    grid.append(card);
  }

  function renderDirectory(){
    if(!container)return;
    openId=null;
    const state=loadState(),model=directorySummary(state),current=Math.min(usableDays,state.currentDay||1);
    const groups=[[1,22,'延世 1-1 路线'],[23,45,'延世 1-2 路线']];
    const review=dailyReview(state,todayKey());
    container.innerHTML=`<section class="l1-overview"><header><div><span>45 天路线 · 前 10 天可学习</span><h2>每天 55 分钟课程 + 20 分钟训练</h2><p>未来课程可预览目录；静态音频完成前不会使用系统语音替代。</p></div><button type="button" id="l1Continue">继续第 ${current} 天 →</button></header><section class="l1-daily-review"><div><span>每日记忆强化</span><h3>今日随机 5 句</h3><p>${review.length?'题目今天固定，明天自动更换。':'通过第一课后，从已学课文中生成。'}</p></div><button type="button" id="l1Review" ${review.length?'':'disabled'}>开始复习 →</button></section>${groups.map(([from,to,title])=>`<section class="l1-part"><div class="l1-part-title"><h3>${title}</h3><span>${from}–${to} 天</span></div><ol>${model.days.slice(from-1,to).map(day=>`<li class="${day.status}"><button type="button" data-l1-day="${day.id}" ${day.status==='locked'?'disabled':''}><b>${day.status==='done'?'✓':day.id}</b><span><strong>${esc(day.title)}</strong><small>${day.kind==='checkpoint'?'复习考核':day.phase==='input'?'A 日 · 输入':'B 日 · 输出'} · ${day.expectedDate}</small><em>${esc(day.source)}</em></span><i>${day.status==='done'?'已通过':day.status==='current'?'继续':day.status==='preview'?'预览 · 音频准备中':'未解锁'}</i></button></li>`).join('')}</ol></section>`).join('')}</section>`;
    container.querySelector('#l1Continue').onclick=()=>openDay(current);
    container.querySelector('#l1Review').onclick=()=>renderDailyReview(review);
    container.querySelectorAll('[data-l1-day]').forEach(button=>button.onclick=()=>openDay(Number(button.dataset.l1Day)));
  }

  function renderDailyReview(items){
    container.innerHTML=`<section class="l1-preview l1-review"><button type="button" id="l1Back">← 返回 45 天目录</button><span>每日记忆强化 · ${esc(todayKey())}</span><h2>从已学课程随机抽取 5 句</h2><p>根据中文选择对应的韩语句子；今天可反复练习同一组。</p><form id="l1ReviewForm">${items.map((item,index)=>`<fieldset class="l1-question"><legend>${index+1}. ${esc(item.zh)}</legend><div>${item.options.map(option=>`<label><input type="radio" name="review${index}" value="${esc(option)}"><span>${esc(option)}</span></label>`).join('')}</div></fieldset>`).join('')}<button class="l1-submit" type="submit">提交复习</button><output id="l1ReviewResult"></output></form></section>`;
    container.querySelector('#l1Back').onclick=renderDirectory;
    container.querySelector('#l1ReviewForm').onsubmit=event=>{
      event.preventDefault();
      const form=new FormData(event.currentTarget);
      const correct=items.filter((item,index)=>form.get(`review${index}`)===item.ko).length;
      const output=container.querySelector('#l1ReviewResult');
      output.className=correct===items.length?'pass':'retry';
      output.innerHTML=`<strong>${correct} / ${items.length}</strong><span>${correct===items.length?'全部答对，可以再练一轮。':'再看一遍课文原句后重试。'}</span>`;
    };
  }

  function renderPreview(day){
    container.innerHTML=`<section class="l1-preview"><button type="button" id="l1Back">← 返回 45 天目录</button><span>DAY ${day.id} · 目录预览</span><h2>${esc(day.title)}</h2><p>这一天的课程内容已列入路线，静态音频仍在准备中。请先完成当前已开放课程。</p><button type="button" disabled>音频准备中</button></section>`;
    container.querySelector('#l1Back').onclick=renderDirectory;
  }

  function renderCheckpoint(checkpoint){
    container.innerHTML=`<section class="l1-preview l1-checkpoint"><button type="button" id="l1Back">← 返回 45 天目录</button><span>DAY ${checkpoint.id} · 阶段复习</span><h2>${esc(checkpoint.title)}</h2><p>从前 9 天已学内容中抽取选择题，达到 80 分即可进入下一阶段。</p><form id="l1CheckpointForm">${checkpoint.questions.map(assessmentField).join('')}<button class="l1-submit" type="submit">提交阶段考核</button><output id="l1Result"></output></form></section>`;
    container.querySelector('#l1Back').onclick=renderDirectory;
    container.querySelectorAll('[data-l1-audio]').forEach(button=>button.onclick=()=>play(button.dataset.l1Audio));
    container.querySelector('#l1CheckpointForm').onsubmit=event=>{
      event.preventDefault();
      const answers={};
      checkpoint.questions.forEach(item=>answers[item.id]=container.querySelector(`[data-l1-question="${item.id}"] input:checked`)?.value);
      const result=gradeAssessment(checkpoint.questions,answers);
      result.feedback.forEach(item=>{
        const feedback=container.querySelector(`[data-l1-question="${item.id}"] .l1-feedback`);
        feedback.className=`l1-feedback ${item.ok?'correct':'wrong'}`;
        feedback.textContent=item.ok?'✓ 已完成。':`需要复习。参考：${item.reference}`;
      });
      let next=root.MalbitLevel1State.completeCheckpoint(checkpoint.id,result,loadState());
      const mistakes=result.feedback.filter(item=>!item.ok).map(item=>({id:item.itemId,dayId:checkpoint.id,source:'checkpoint',type:item.type,prompt:item.prompt,selected:item.selected,answer:item.answer,explanation:item.explanation,reviewed:false,updatedAt:new Date().toISOString()}));
      next=root.MalbitLevel1State.recordMistakes(mistakes,next);
      saveState(next);
      root.renderMistakes?.();
      const output=container.querySelector('#l1Result');
      output.className=result.passed?'pass':'retry';
      output.innerHTML=`<strong>${result.score} 分</strong><span>${result.passed?'阶段达标，下一天已解锁。':'未到 80 分，请复习错题后重试。'}</span>`;
      if(result.passed)setTimeout(()=>openDay(checkpoint.id+1),900);
    };
  }

  function assessmentField(item,index){
    const audio=item.type==='listening'?audioButton(item.audio,'播放题目音频'):'';
    return `<fieldset class="l1-question" data-l1-question="${esc(item.id)}"><legend>${index+1}. ${esc(item.prompt)}</legend>${audio}<div>${item.options.map(option=>`<label><input type="radio" name="${esc(item.id)}" value="${esc(option)}"><span>${esc(option)}</span></label>`).join('')}</div><p class="l1-feedback"></p></fieldset>`;
  }

  function renderLesson(lesson){
    const favorites=new Set(loadState().favoriteWordIds||[]);
    container.innerHTML=`<article class="l1-lesson"><header><button type="button" id="l1Back">← 45 天目录</button><div><small>DAY ${lesson.id} · ${lesson.phase==='input'?'A 日输入':'B 日输出'} · ${esc(lesson.sourceLabel)}</small><h2>${esc(lesson.themeTitle)} · ${esc(lesson.title)}</h2></div><b>${lesson.courseMinutes}<small>课程</small> + ${lesson.trainingMinutes}<small>训练</small></b></header>${lesson.id===1?'<p class="l1-quick">第一课可快速验收：直接完成末尾考核，80 分即可解锁下一天。</p>':''}<section class="l1-goals"><span>学习目标</span><ul>${lesson.goals.map(goal=>`<li>${esc(goal)}</li>`).join('')}</ul></section><section class="l1-section"><div class="l1-heading"><span>01 · 双语课文</span><h3>逐句听、读、理解</h3></div><div class="l1-article">${lesson.article.lines.map((line,index)=>`<article>${audioButton(line.audio,`播放第 ${index+1} 句`)}<div><b>${esc(line.ko)}</b><p>${esc(line.zh)}</p></div><small>${String(index+1).padStart(2,'0')}</small></article>`).join('')}</div></section><section class="l1-section"><div class="l1-heading"><span>02 · 词汇卡</span><h3>韩中英、发音与记忆线索</h3></div><div class="l1-words">${lesson.words.map(word=>`<article><header><h3>${esc(word.ko)}</h3><span>[${esc(word.pron)}]</span></header><button type="button" class="l1-word-favorite" data-l1-favorite="${esc(word.id)}">${favorites.has(word.id)?'♥ 已收藏':'♡ 收藏'}</button><p><b>${esc(word.zh)}</b> · ${esc(word.en)} <small>${esc(word.ipa)}</small></p><div class="l1-audio-pair">${audioButton(word.audio.ko,'韩语发音')}${audioButton(word.audio.en,'英语发音')}</div><dl><div><dt>词源</dt><dd>${esc(word.origin)}</dd></div><div><dt>记忆</dt><dd>${esc(word.memory)}</dd></div><div><dt>音变</dt><dd>${esc(word.soundRule)}</dd></div></dl><blockquote><b>${esc(word.example.ko)}</b><span>${esc(word.example.zh)}</span></blockquote></article>`).join('')}</div></section><section class="l1-section"><div class="l1-heading"><span>03 · 语法详解</span><h3>形式、意义和双语例句</h3></div><div class="l1-grammar">${lesson.grammar.map(grammar=>`<article><span>GRAMMAR</span><h3>${esc(grammar.title)}</h3><b>${esc(grammar.form)}</b><p>${esc(grammar.meaning)}</p>${grammar.examples.map(example=>`<blockquote><b>${esc(example.ko)}</b><span>${esc(example.zh)}</span></blockquote>`).join('')}</article>`).join('')}</div></section><section class="l1-section"><div class="l1-heading"><span>04 · 双语文化</span><h3>${esc(lesson.culture.title)}</h3></div><div class="l1-culture">${lesson.culture.paragraphs.map((paragraph,index)=>`<article><small>0${index+1}</small><p lang="ko">${esc(paragraph.ko)}</p><b>${esc(paragraph.zh)}</b></article>`).join('')}</div></section><form class="l1-section l1-assessment" id="l1Assessment"><div class="l1-heading"><span>05 · 今日考核</span><h3>提交后即时反馈 · 80 分解锁下一天</h3></div>${lesson.assessment.map(assessmentField).join('')}<button class="l1-submit" type="submit">提交考核</button><output id="l1Result"></output></form></article>`;
    bindLesson(lesson);
  }

  function play(src){
    if(!src)return;
    const audio=new Audio(src);
    audio.play().catch(()=>{});
  }

  function bindLesson(lesson){
    container.querySelector('#l1Back').onclick=renderDirectory;
    container.querySelectorAll('[data-l1-audio]').forEach(button=>button.onclick=()=>play(button.dataset.l1Audio));
    container.querySelectorAll('[data-l1-favorite]').forEach(button=>button.onclick=()=>{
      const next=root.MalbitLevel1State.toggleFavorite(button.dataset.l1Favorite,loadState());
      saveState(next);
      button.textContent=next.favoriteWordIds.includes(button.dataset.l1Favorite)?'♥ 已收藏':'♡ 收藏';
      root.renderFavorites?.();
    });
    container.querySelector('#l1Assessment').onsubmit=event=>{
      event.preventDefault();
      const answers={};
      lesson.assessment.forEach(item=>{
        const field=container.querySelector(`[data-l1-question="${item.id}"]`);
        answers[item.id]=field.querySelector('input:checked')?.value;
      });
      const result=gradeAssessment(lesson.assessment,answers);
      result.feedback.forEach(item=>{
        const field=container.querySelector(`[data-l1-question="${item.id}"]`),feedback=field.querySelector('.l1-feedback');
        feedback.className=`l1-feedback ${item.ok?'correct':'wrong'}`;
        feedback.textContent=item.ok?'✓ 已完成。':`需要复习。参考：${item.reference}`;
      });
      const output=container.querySelector('#l1Result');
      output.className=result.passed?'pass':'retry';
      output.innerHTML=`<strong>${result.score} 分</strong><span>${result.passed?'达标，下一天已解锁。':'未到 80 分，复习反馈后再试一次。'}</span>`;
      let next=root.MalbitLevel1State.completeDay(lesson.id,{score:result.score,weakTags:result.weakTags},loadState());
      const mistakes=result.feedback.filter(item=>!item.ok).map(item=>({id:`lesson:${item.itemId}`,dayId:lesson.id,source:'lesson',type:item.type,prompt:item.prompt,selected:item.selected,answer:item.answer,explanation:item.explanation,reviewed:false,updatedAt:new Date().toISOString()}));
      next=root.MalbitLevel1State.recordMistakes(mistakes,next);
      saveState(next);
      renderHomeSummary();
      root.renderMistakes?.();
      if(result.passed){
        const nextDay=nextLessonAfterPass(lesson.id,result);
        if(nextDay)setTimeout(()=>openDay(nextDay),900);
        else setTimeout(renderDirectory,900);
      }
      output.scrollIntoView({behavior:'smooth',block:'center'});
    };
  }

  function openDay(dayId){
    const day=days.find(item=>item.id===Number(dayId));
    if(!container||!day)return false;
    if(day.id>usableDays){renderPreview(day);return true}
    const state=loadState();
    if(!root.MalbitLevel1State.canOpen(day.id,state))return false;
    if(day.kind==='checkpoint'){
      const checkpoint=checkpointSummary(day.id,manifest);
      if(!checkpoint)return false;
      openId=day.id;
      renderCheckpoint(checkpoint);
      window.scrollTo(0,0);
      return true;
    }
    const lesson=lessonSummary(day.id,manifest);
    if(!lesson)return false;
    openId=day.id;
    renderLesson(lesson);
    window.scrollTo(0,0);
    return true;
  }

  function mount(target=document.querySelector('#courseDashboard')){
    if(!target||!days.length)return;
    container=target;
    renderDirectory();
    renderHomeSummary();
    root.renderFavorites?.();
    root.renderMistakes?.();
    root.MalbitTopikPracticeV25?.render();
  }

  root.MalbitLevel1Course={mount,openDay,usableDays,loadState,saveState,homeSummary,directorySummary,lessonSummary,checkpointSummary,gradeAssessment,dailyReview,topikQuestions,nextLessonAfterPass,favoriteWords,mistakeView};

  if(typeof document!=='undefined'){
    fetch('audio/level1/manifest.json?v=35').then(response=>response.ok?response.json():{}).then(data=>{manifest=data;if(openId)openDay(openId)}).catch(()=>{});
    mount();
    document.querySelector('[data-view-link="course"]')?.addEventListener('click',()=>setTimeout(renderDirectory));
    window.addEventListener('malbit-progress-changed',renderHomeSummary);
  }
})(globalThis);
