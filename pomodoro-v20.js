if(studyState.timerSchema!==21){studyState.focusSeconds=Number(studyState.focusSeconds||studyState.elapsed||0);studyState.timerSchema=21}
studyState.phase=studyState.phase==='break'?'break':'focus';
studyState.remaining=Number(studyState.remaining||(studyState.phase==='focus'?1500:300));
studyState.lastTick=studyState.lastTick||null;

function timerNotice(title,body){
 try{const ctx=new (window.AudioContext||window.webkitAudioContext)(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=660;gain.gain.value=.08;osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.35)}catch{}
 if('Notification'in window&&Notification.permission==='granted')new Notification(title,{body});
 const toast=document.createElement('div');toast.className='timer-toast';toast.innerHTML=`<b>${title}</b><span>${body}</span>`;document.body.append(toast);setTimeout(()=>toast.remove(),5000);
}
function advancePomodoro(){
 if(!studyState.running)return;
 const now=Date.now(),last=studyState.lastTick||now;let delta=Math.max(0,Math.floor((now-last)/1000));if(!delta)return;studyState.lastTick=last+delta*1000;
 while(delta>0){const used=Math.min(delta,studyState.remaining);studyState.remaining-=used;delta-=used;if(studyState.phase==='focus')studyState.focusSeconds+=used;if(studyState.remaining<=0){if(studyState.phase==='focus'){studyState.phase='break';studyState.remaining=300;timerNotice('专注完成 ✦','25分钟已计入今日学习。现在休息5分钟，起来喝水、看看远处。')}else{studyState.phase='focus';studyState.remaining=1500;timerNotice('休息结束','休息不计入学习时长。新的25分钟专注开始了。')}}}
 localStorage.setItem('malbit-study-time',JSON.stringify(studyState));
}
function requestTimerNotice(){if('Notification'in window&&Notification.permission==='default')Notification.requestPermission().catch(()=>{})}
function todaySettledSeconds(){const today=new Date().toLocaleDateString('sv-SE');return (studyState.sessions||[]).filter(x=>x.date===today).reduce((n,x)=>n+(x.seconds||0),0)}
function allSettledSeconds(){return (studyState.sessions||[]).reduce((n,x)=>n+(x.seconds||0),0)}
function finishPomodoroStudy(){
 advancePomodoro();const seconds=Number(studyState.focusSeconds||0);if(seconds<10)return alert('先完成一小段专注，再结束今天这次学习。');
 studyState.sessions=studyState.sessions||[];studyState.sessions.push({date:new Date().toLocaleDateString('sv-SE'),seconds,mode:'pomodoro',finishedAt:new Date().toISOString()});studyState.focusSeconds=0;studyState.elapsed=0;studyState.startedAt=null;studyState.running=false;studyState.phase='focus';studyState.remaining=1500;studyState.lastTick=null;clearInterval(studyTicker);saveWorkbench();render();showRitualComplete(seconds);
}

injectStudyRitual=function(){
 const card=document.querySelector('.today-card');if(!card)return;let ritual=card.querySelector('.study-ritual');if(!ritual){ritual=document.createElement('section');ritual.className='study-ritual';card.querySelector('.soft-label').after(ritual)}
 advancePomodoro();const running=studyState.running,focus=studyState.phase==='focus',settled=todaySettledSeconds(),pending=Number(studyState.focusSeconds||0),phaseTotal=focus?1500:300,progress=Math.round((1-studyState.remaining/phaseTotal)*100);
 ritual.innerHTML=`<div class="daily-total"><small>今日累计学习</small><strong>${formatClock(settled)}</strong><span>结束本轮后更新 · 历史累计 ${Math.round(allSettledSeconds()/60)} 分钟</span></div><div class="pomodoro-panel"><div><small>${focus?'专注时间 · 计入学习':'休息时间 · 不计入学习'}</small><b>${formatClock(studyState.remaining)}</b><span>${focus?'完成后休息5分钟':'休息后继续25分钟专注'}</span></div><i style="--timer-progress:${progress}%"></i></div><div class="session-focus"><span>本轮已专注</span><b>${formatClock(pending)}</b></div><div class="ritual-controls"><button id="studyToggle" class="ritual-main">${running?'暂停':(pending?'继续番茄钟':'开始番茄钟')}</button>${pending?'<button id="studyFinish">结束学习并结算</button>':''}<small>专注时长实时记录；点击结束后计入上方“今日累计学习”。</small></div>`;
 ritual.querySelector('#studyToggle').onclick=()=>{requestTimerNotice();if(studyState.running){advancePomodoro();studyState.running=false;studyState.lastTick=null;clearInterval(studyTicker)}else{studyState.running=true;studyState.lastTick=Date.now();studyTicker=setInterval(injectStudyRitual,1000)}saveWorkbench();injectStudyRitual()};
 ritual.querySelector('#studyFinish')?.addEventListener('click',finishPomodoroStudy);
}
finishStudySession=finishPomodoroStudy;
clearInterval(studyTicker);if(studyState.running)studyTicker=setInterval(injectStudyRitual,1000);injectStudyRitual();

