studyState.mode=studyState.mode||'forward';
studyState.phase=studyState.phase||'focus';
studyState.remaining=Number(studyState.remaining||(studyState.phase==='focus'?1500:300));
studyState.focusSeconds=Number(studyState.focusSeconds||0);
studyState.lastTick=studyState.lastTick||null;

function timerNotice(title,body){
 try{const ctx=new (window.AudioContext||window.webkitAudioContext)(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.frequency.value=660;gain.gain.value=.08;osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(ctx.currentTime+.35)}catch{}
 if('Notification'in window&&Notification.permission==='granted')new Notification(title,{body});
 const toast=document.createElement('div');toast.className='timer-toast';toast.innerHTML=`<b>${title}</b><span>${body}</span>`;document.body.append(toast);setTimeout(()=>toast.remove(),5000);
}
function advancePomodoro(){
 if(!studyState.running||studyState.mode!=='pomodoro')return;
 const now=Date.now(),last=studyState.lastTick||now;let delta=Math.max(0,Math.floor((now-last)/1000));if(!delta)return;studyState.lastTick=last+delta*1000;
 while(delta>0){const used=Math.min(delta,studyState.remaining);studyState.remaining-=used;delta-=used;if(studyState.phase==='focus')studyState.focusSeconds+=used;if(studyState.remaining<=0){if(studyState.phase==='focus'){studyState.phase='break';studyState.remaining=300;timerNotice('专注完成 ✦','已经学习25分钟，起来喝水、看看远处，休息5分钟。')}else{studyState.phase='focus';studyState.remaining=1500;timerNotice('休息结束','新的25分钟开始了，回到今天的韩语吧。')}}}
 localStorage.setItem('malbit-study-time',JSON.stringify(studyState));
}
function pomodoroClock(){advancePomodoro();return formatClock(studyState.remaining)}
function requestTimerNotice(){if('Notification'in window&&Notification.permission==='default')Notification.requestPermission().catch(()=>{})}

injectStudyRitual=function(){
 const card=document.querySelector('.today-card');if(!card)return;let ritual=card.querySelector('.study-ritual');if(!ritual){ritual=document.createElement('section');ritual.className='study-ritual';card.querySelector('.soft-label').after(ritual)}
 const today=new Date().toLocaleDateString('sv-SE'),todayMin=Math.round((studyState.sessions||[]).filter(x=>x.date===today).reduce((n,x)=>n+x.seconds,0)/60),pomodoro=studyState.mode==='pomodoro',running=studyState.running,clock=pomodoro?pomodoroClock():formatClock(currentElapsed()),phase=pomodoro?(studyState.phase==='focus'?'专注中 · 25分钟':'休息中 · 5分钟'):'正向计时';
 ritual.innerHTML=`<div class="timer-mode" role="tablist" aria-label="计时方式"><button data-timer-mode="forward" class="${!pomodoro?'on':''}" ${running?'disabled':''}>正向计时</button><button data-timer-mode="pomodoro" class="${pomodoro?'on':''}" ${running?'disabled':''}>番茄钟</button></div><div class="ritual-copy"><small>${pomodoro?'25分钟专注 · 5分钟休息':'自由学习 · 从零开始累计'}</small><strong>${studyStreak()||0} 天连续学习</strong><span>今日 ${todayMin} 分钟 · 累计 ${totalStudyMinutes()} 分钟</span></div><div class="ritual-clock ${pomodoro?'countdown':''}"><b>${clock}</b><span>${phase}</span>${pomodoro?`<i style="--timer-progress:${Math.round((1-studyState.remaining/(studyState.phase==='focus'?1500:300))*100)}%"></i>`:''}</div><div class="ritual-controls"><button id="studyToggle" class="ritual-main">${running?'暂停':((pomodoro?studyState.focusSeconds:studyState.elapsed)?'继续':'开始学习')}</button>${((pomodoro?studyState.focusSeconds:currentElapsed())>0)?'<button id="studyFinish">结束并打卡</button>':''}<small>${pomodoro?'休息时间不会计入学习时长':'结束后计入今日与累计学习时长'}</small></div>`;
 ritual.querySelectorAll('[data-timer-mode]').forEach(button=>button.onclick=()=>{studyState.mode=button.dataset.timerMode;studyState.elapsed=0;studyState.startedAt=null;studyState.phase='focus';studyState.remaining=1500;studyState.focusSeconds=0;studyState.lastTick=null;saveWorkbench();injectStudyRitual()});
 ritual.querySelector('#studyToggle').onclick=()=>{requestTimerNotice();if(studyState.running){if(pomodoro){advancePomodoro();studyState.lastTick=null}else{studyState.elapsed=currentElapsed();studyState.startedAt=null}studyState.running=false;clearInterval(studyTicker)}else{studyState.running=true;if(pomodoro)studyState.lastTick=Date.now();else studyState.startedAt=Date.now();studyTicker=setInterval(injectStudyRitual,1000)}saveWorkbench();injectStudyRitual()};
 ritual.querySelector('#studyFinish')?.addEventListener('click',finishStudySession);
}
finishStudySession=function(){if(studyState.mode==='pomodoro')advancePomodoro();const seconds=studyState.mode==='pomodoro'?studyState.focusSeconds:currentElapsed();if(seconds<10)return alert('先专注学习一小会儿，再完成今天的打卡。');studyState.sessions=studyState.sessions||[];studyState.sessions.push({date:new Date().toLocaleDateString('sv-SE'),seconds,mode:studyState.mode,finishedAt:new Date().toISOString()});studyState.elapsed=0;studyState.startedAt=null;studyState.running=false;studyState.phase='focus';studyState.remaining=1500;studyState.focusSeconds=0;studyState.lastTick=null;clearInterval(studyTicker);saveWorkbench();render();showRitualComplete(seconds)};
clearInterval(studyTicker);if(studyState.running)studyTicker=setInterval(injectStudyRitual,1000);injectStudyRitual();

