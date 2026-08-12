const trialGrammar=[
 {title:'N이/가 어디에 있어요?',tag:'第 1 课同步',meaning:'询问某人或某物在哪里',rule:'名词有收音接 이，无收音接 가；地点疑问用 어디에。',polite:'礼貌体：도서관이 어디에 있어요?',plain:'熟人普通语：도서관이 어디에 있어?',right:'도서관이 어디에 있어요?',wrong:'도서관을 어디예요?',why:'찾다（寻找）等动作才可能使用 을/를；这里表达“图书馆在哪里”，图书馆是存在句的主语。'},
 {title:'地点 + 에 있어요',tag:'第 1 课同步',meaning:'说明人或物存在的位置',rule:'位置后用 에，再接 있어요；옆、뒤、안 等位置词前通常还要有参照地点。',polite:'礼貌体：학교 옆에 있어요.',plain:'熟人普通语：학교 옆에 있어.',right:'학생회관 뒤에 있어요.',wrong:'학생회관 뒤에서 있어요.',why:'에 标记存在的位置；에서 通常标记动作发生的地点，例如 도서관에서 공부해요。'},
 {title:'N하고 N / N도',tag:'第 2 课预习',meaning:'连接名词，或表示“也”',rule:'하고 放在两个名词之间；도 直接放在要强调“也”的名词后，并替换 이/가、은/는 等助词。',polite:'礼貌体：책상하고 의자가 있어요.',plain:'熟人普通语：책상하고 의자가 있어.',right:'컴퓨터도 있어요.',wrong:'컴퓨터가도 있어요.',why:'도 本身承担“也”的助词作用，不能与 가 叠加。'}
];

const trialMedia=[
 {type:'动画精读',level:'当前课 · 25 秒',title:'第一次找教学楼',scene:'原创校园动画式情景',lines:[['하루','한국어교육관이 어디에 있어요?','韩语教育馆在哪里？'],['민준','도서관 옆에 있어요.','在图书馆旁边。']],focus:'听 어디에 和 옆에 的节奏，不逐字翻译。'},
 {type:'综艺反应',level:'当前课 · 20 秒',title:'猜猜教室里有什么',scene:'原创问答式情景',lines:[['민준','교실에 뭐가 있어요?','教室里有什么？'],['하루','책상하고 의자가 있어요!','有书桌和椅子！']],focus:'注意 뭐가 的连读，以及回答时自然上扬的语气。'},
 {type:'韩剧场景',level:'当前课 · 30 秒',title:'图书馆前的约定',scene:'原创校园短剧情景',lines:[['민준','내일도 학교에 와요?','明天也来学校吗？'],['하루','네, 도서관에서 만나요.','嗯，在图书馆见吧。']],focus:'区分存在地点 에 与动作地点 에서；先整体模仿语调。'}
];

function injectGrammarTrial(){
 const box=document.querySelector('#courseDashboard');if(!box||box.querySelector('.grammar-library-trial'))return;
 const section=document.createElement('section');section.className='grammar-library-trial trial-feature';
 section.innerHTML=`<div class="trial-heading"><div><span>GRAMMAR LIBRARY · 语法资料库试用</span><h2>本课语法，随课程逐步点亮</h2><p>先试 2 条同步语法和 1 条下一课预习；不会改变你的课程进度。</p></div><b>试用版 · 3 条</b></div><div class="grammar-library-list">${trialGrammar.map((g,i)=>`<article class="${i===2?'preview':''}"><button class="grammar-summary" data-grammar-trial="${i}" aria-expanded="false"><span><small>${g.tag}</small><strong>${g.title}</strong><em>${g.meaning}</em></span><i>＋</i></button><div class="grammar-expanded" hidden><p class="grammar-rule"><b>接续与作用</b>${g.rule}</p><div class="register-pair"><p><small>对老师 / 陌生人</small>${g.polite}</p><p><small>对亲近朋友</small>${g.plain}</p></div><div class="right-wrong"><p><b>✓ 正确</b>${g.right}</p><p><b>× 易错</b>${g.wrong}</p></div><p class="why-note"><b>为什么：</b>${g.why}</p><div class="trial-actions"><button data-grammar-audio="${i}">🔊 听正确例句</button><button data-grammar-fav="${i}">♡ 收藏例句</button></div></div></article>`).join('')}</div>`;
 const anchor=box.querySelector('.story-course-card');anchor?.after(section);
 section.querySelectorAll('[data-grammar-trial]').forEach(button=>button.onclick=()=>{const detail=button.nextElementSibling,open=detail.hidden;section.querySelectorAll('.grammar-expanded').forEach(x=>x.hidden=true);section.querySelectorAll('.grammar-summary').forEach(x=>{x.setAttribute('aria-expanded','false');x.querySelector('i').textContent='＋'});detail.hidden=!open;button.setAttribute('aria-expanded',String(open));button.querySelector('i').textContent=open?'－':'＋'});
 section.querySelectorAll('[data-grammar-audio]').forEach(button=>button.onclick=()=>speakKorean(trialGrammar[Number(button.dataset.grammarAudio)].right,.84));
 section.querySelectorAll('[data-grammar-fav]').forEach(button=>button.onclick=()=>{const g=trialGrammar[Number(button.dataset.grammarFav)];toggleFavorite({type:'语法资料库',text:g.right,meaning:g.meaning});button.textContent=isFavorite(g.right)?'♥ 已收藏':'♡ 收藏例句'});
}

let activeTrialMedia=0;
function injectMediaTrial(){
 const page=document.querySelector('#listen');if(!page||page.querySelector('.media-library-trial'))return;
 const section=document.createElement('section');section.className='media-library-trial trial-feature';
 section.innerHTML=`<div class="trial-heading"><div><span>IMMERSION · 沉浸素材试用</span><h2>先用短场景，把本课韩语听活</h2><p>暂用原创微情景验证学习方式，不引入版权视频，也不影响原听力训练。</p></div><b>试用版 · 3 段</b></div><div class="media-tabs">${trialMedia.map((m,i)=>`<button data-media-tab="${i}" class="${i===0?'on':''}">${m.type}<small>${m.level}</small></button>`).join('')}</div><article class="media-player" id="trialMediaPlayer"></article>`;
 page.querySelector('.lab-grid')?.before(section);renderTrialMedia();
 section.querySelectorAll('[data-media-tab]').forEach(button=>button.onclick=()=>{activeTrialMedia=Number(button.dataset.mediaTab);section.querySelectorAll('[data-media-tab]').forEach(x=>x.classList.toggle('on',x===button));renderTrialMedia()});
}
function renderTrialMedia(){
 const player=document.querySelector('#trialMediaPlayer');if(!player)return;const m=trialMedia[activeTrialMedia];
 player.innerHTML=`<div class="media-screen"><span>${m.scene}</span><strong>${m.title}</strong><button id="playTrialMedia">▶ 只听一遍</button></div><div class="media-study"><span>本段任务</span><h3>${m.focus}</h3><button id="revealTrialLines">看逐句精读</button><div class="media-lines" hidden>${m.lines.map((x,i)=>`<p><button data-trial-line="${i}">🔊</button><span><b>${x[0]} · ${x[1]}</b><small>${x[2]}</small></span></p>`).join('')}</div><div class="trial-actions"><button id="repeatTrialMedia">0.75× 慢速</button><button id="favoriteTrialMedia">♡ 收藏重点句</button></div></div>`;
 document.querySelector('#playTrialMedia').onclick=()=>speakDialogue(m.lines.map(x=>[x[0],x[1],x[2]]));
 document.querySelector('#repeatTrialMedia').onclick=()=>speakKorean(m.lines.map(x=>x[1]).join(' '),.75);
 document.querySelector('#revealTrialLines').onclick=e=>{const lines=player.querySelector('.media-lines');lines.hidden=!lines.hidden;e.currentTarget.textContent=lines.hidden?'看逐句精读':'收起逐句精读'};
 player.querySelectorAll('[data-trial-line]').forEach(button=>button.onclick=()=>speakKorean(m.lines[Number(button.dataset.trialLine)][1],.82));
 const focusLine=m.lines[m.lines.length-1];document.querySelector('#favoriteTrialMedia').onclick=e=>{toggleFavorite({type:m.type,text:focusLine[1],meaning:focusLine[2]});e.currentTarget.textContent=isFavorite(focusLine[1])?'♥ 已收藏':'♡ 收藏重点句'};
}

const trialCourseRender=renderCourse;renderCourse=()=>{trialCourseRender();injectGrammarTrial()};
injectGrammarTrial();injectMediaTrial();
