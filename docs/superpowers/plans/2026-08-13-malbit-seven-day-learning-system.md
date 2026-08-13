# 语光 7 天韩语学习系统实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有语光网站中交付从《延世韩国语 1》第二课起步、每天 75 分钟、包含真人视频、AI 标准音、双语短文、记忆训练、多题型小考和总体进度的 7 天可用样板。

**Architecture:** 新功能以独立 `MalbitSevenDay` 命名空间接入现有课程和首页，不覆盖旧的全局 `render()`。课程内容存放在单独数据文件，学习状态兼容地写入现有 `malbit-course`，并沿用现有 Supabase 同步；音频由离线脚本生成静态文件，运行时按“AI 静态音频 → 设备朗读”降级，真人视频使用 B站官方 iframe。

**Tech Stack:** 原生 HTML/CSS/JavaScript、Web Audio/MediaRecorder、Web Speech API、Bilibili iframe、localStorage、现有 Supabase REST 同步、Node.js 内置测试、Python/本地开源 TTS 生成脚本。

**Spec:** `docs/superpowers/specs/2026-08-13-malbit-seven-day-learning-system-design.md`

## Global Constraints

- 保留现有五项主导航、青春莫兰迪配色、收藏、复习、多端同步和学习报告。
- 课程按实际学习日推进；每天 75 分钟，三轮各 25 分钟。
- 不使用“勾选即掌握”；总分达到 80%，且听力、阅读、口语完成后才能推进。
- 不新增付费服务、独立后端、内容后台、小程序、独立域名或主导航栏目。
- 主课真人视频优先使用“韩语外教-马黎娜”B站官方外链播放器。
- 不显示虚假的口音百分制；口语仅记录识别状态或回放自评状态。
- 新状态必须兼容并保留所有旧学习数据。
- iPhone 14 Pro 主要操作需尽量单屏完成，同时保持 iPad 和电脑布局。

---

### Task 1: 建立可测试的课程数据模型

**Files:**
- Create: `seven-day-data.js`
- Create: `tests/seven-day-data.test.mjs`
- Modify: `index.html`
- Modify: `sw.js`

**Interfaces:**
- Produces: `globalThis.MalbitSevenDayData`，结构为 `{version:number, days:Day[]}`。
- `Day` 包含 `id,title,scene,video,article,words,grammar,quiz,culture`。
- `video` 包含 `bvid,page,start,end,title,sourceUrl`。
- `article.lines` 每项包含 `ko,zh,audioId`。
- `words` 每项包含 `ko,pron,zh,en,ipa,origin,memory,soundRule,example,audioId`。
- `quiz` 每项包含 `id,type,prompt,audioId?,options,answer,explanation`。

- [ ] **Step 1: 写数据契约失败测试**

```js
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

const context={globalThis:{}};
vm.runInNewContext(fs.readFileSync('seven-day-data.js','utf8'),context);
const data=context.globalThis.MalbitSevenDayData;
assert.equal(data.days.length,7);
for(const [index,day] of data.days.entries()){
  assert.equal(day.id,index+1);
  assert.ok(day.article.lines.length>=6&&day.article.lines.length<=10);
  assert.ok(day.words.length>=8&&day.words.length<=12);
  assert.ok(day.grammar.length>=2&&day.grammar.length<=3);
  assert.deepEqual(new Set(day.quiz.map(x=>x.type)),new Set(['listening','speaking','reading','writing']));
  assert.match(day.video.bvid,/^BV[0-9A-Za-z]+$/);
}
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node tests/seven-day-data.test.mjs`

Expected: FAIL，提示 `seven-day-data.js` 不存在。

- [ ] **Step 3: 编写完整 7 天课程数据**

```js
globalThis.MalbitSevenDayData={
  version:1,
  days:[{
    id:1,
    title:'教学楼在哪里？',
    scene:'小澄第一次来到韩国校园，向同学询问教学楼。',
    video:{bvid:'BV1t54y1S7bY',page:6,start:0,end:420,title:'延世韩国语第一册·有/在',sourceUrl:'https://www.bilibili.com/video/BV1t54y1S7bY/'},
    article:{title:'캠퍼스에 처음 왔어요',lines:[
      {ko:'오늘 한국 대학교에 처음 왔어요.',zh:'今天我第一次来到韩国大学。',audioId:'d1-l1'}
    ]},
    words:[{
      ko:'대학교',pron:'대학교',zh:'大学',en:'university',ipa:'/ˌjuːnɪˈvɜːrsəti/',origin:'汉字词：大學校',memory:'대=大，학=学，교=校，按“大-学-校”三块记。',soundRule:'按音节稳定读 [대-학-교]。',example:'대학교에 처음 왔어요.',audioId:'d1-w-university'
    }],
    grammar:[{
      form:'이/가 있어요·없어요',meaning:'有/没有；在/不在',rule:'有收音用 이，无收音用 가。',honorific:'礼貌体 있어요；普通体 있어。',examples:[{ko:'도서관이 있어요.',zh:'有图书馆。',audioId:'d1-g1'}]
    }],
    quiz:[
      {id:'d1-q1',type:'listening',prompt:'听音频，人物在哪里？',audioId:'d1-l1',options:['大学','食堂','家'],answer:0,explanation:'대학교表示大学。'},
      {id:'d1-q2',type:'speaking',prompt:'跟读并完成回放。',audioId:'d1-g1',options:['已完成'],answer:0,explanation:'重点模仿整句节奏。'},
      {id:'d1-q3',type:'reading',prompt:'短文中的人物今天做什么？',options:['第一次到大学','回家','去旅行'],answer:0,explanation:'처음 왔어요表示第一次来。'},
      {id:'d1-q4',type:'writing',prompt:'选择正确句子。',options:['도서관이 있어요.','도서관을 있어요.'],answer:0,explanation:'存在句的主体使用이/가。'}
    ],
    culture:{title:'韩国大学校园',ko:'한국 대학교 캠퍼스에는 학생 식당과 도서관이 있어요.',zh:'韩国大学校园里有学生食堂和图书馆。'}
  }]
};
```

实际文件按设计表补足 7 天全部数据，不复制教材原文；上述 Day 1 代码是字段标准，所有天必须满足测试契约。

- [ ] **Step 4: 在 HTML 和 Service Worker 中接入版本化数据文件**

在 `index.html` 最新功能脚本之前加入：

```html
<script src="seven-day-data.js?v=23"></script>
```

将 `sw.js` 缓存名更新为 `malbit-v23`，并加入 `./seven-day-data.js?v=23`。

- [ ] **Step 5: 运行数据测试与静态检查**

Run: `node tests/seven-day-data.test.mjs && node --check seven-day-data.js && git diff --check`

Expected: 全部退出码为 0。

- [ ] **Step 6: 提交数据模型**

```bash
git add seven-day-data.js tests/seven-day-data.test.mjs index.html sw.js
git commit -m "Add seven-day Korean course data"
```

---

### Task 2: 制作并验收 AI 标准音试听

**Files:**
- Create: `scripts/generate-korean-audio.py`
- Create: `audio/seven-day/sample-word.mp3`
- Create: `audio/seven-day/sample-sentence.mp3`
- Create: `audio/seven-day/sample-sound-change.mp3`
- Create: `audio/seven-day/manifest.json`
- Create: `tests/audio-manifest.test.mjs`
- Modify: `sw.js`

**Interfaces:**
- Produces: `audio/seven-day/manifest.json`，映射 `{[audioId]: {src,text,kind}}`。
- 生成脚本接受 `--sample` 和 `--all`；`--sample` 只生成三条试听。
- 后续播放器消费 `src`，找不到时调用 `speakKorean(text)`。

- [ ] **Step 1: 写音频清单失败测试**

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync('audio/seven-day/manifest.json','utf8'));
for(const id of ['sample-word','sample-sentence','sample-sound-change']){
  assert.ok(manifest[id]);
  assert.ok(fs.statSync(manifest[id].src).size>1000);
}
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node tests/audio-manifest.test.mjs`

Expected: FAIL，提示清单不存在。

- [ ] **Step 3: 探测并选择本机可用的免费韩语 TTS**

生成脚本按顺序尝试本机可安装/可执行的开源引擎，最终固定一个模型名称与许可证信息到文件头；不得调用按次收费 API。脚本入口：

```python
SAMPLES = {
    "sample-word": "대학교",
    "sample-sentence": "오늘 한국 대학교에 처음 왔어요.",
    "sample-sound-change": "학생 식당 옆에 작은 도서관이 있어요.",
}
```

若当前机器无法得到合格开源韩语音色，停止在三条试听，不生成全部音频，并在页面保留真人视频 + 设备朗读降级。

- [ ] **Step 4: 生成三条试听和清单**

Run: `python3 scripts/generate-korean-audio.py --sample`

Expected: 生成三个可播放 MP3 和清单；用户先试听确认。

- [ ] **Step 5: 用户确认后生成全部课程音频**

Run: `python3 scripts/generate-korean-audio.py --all`

Expected: 数据文件中每个 `audioId` 都能在清单中找到；新增测试遍历所有 `audioId` 并验证文件大于 1KB。

- [ ] **Step 6: 缓存音频清单和试听文件**

把 `manifest.json` 和静态音频加入 `sw.js`；大量音频采用运行时缓存，不把全部文件塞入安装阶段的 `addAll`，避免单个音频失败导致 Service Worker 安装失败。

- [ ] **Step 7: 运行测试并提交**

Run: `node tests/audio-manifest.test.mjs && git diff --check`

Expected: PASS。

```bash
git add scripts/generate-korean-audio.py audio/seven-day tests/audio-manifest.test.mjs sw.js
git commit -m "Add Korean AI audio assets"
```

---

### Task 3: 实现 7 天课程播放器与记忆学习界面

**Files:**
- Create: `seven-day-course.js`
- Create: `seven-day-state.mjs`
- Create: `seven-day-course.css`
- Create: `tests/seven-day-state.test.mjs`
- Modify: `index.html`
- Modify: `sw.js`

**Interfaces:**
- Produces: `globalThis.MalbitSevenDay`。
- `MalbitSevenDay.mount(container:HTMLElement):void`
- `MalbitSevenDay.open(dayId:number,stage?:0|1|2):void`
- `MalbitSevenDay.play(audioId:string,text:string):Promise<'static'|'device'>`
- `MalbitSevenDay.readState(raw:object):SevenDayState`
- `SevenDayState` 为 `{day:number, stages:Record<string,boolean[]>, exams:ExamAttempt[], speech:Record<string,string>}`。

- [ ] **Step 1: 写旧状态兼容失败测试**

```js
import assert from 'node:assert/strict';
import {readState} from '../seven-day-state.mjs';
assert.deepEqual(readState({unit:2}).sevenDay,{day:1,stages:{},exams:[],speech:{}});
assert.equal(readState({sevenDay:{day:3}}).sevenDay.day,3);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node tests/seven-day-state.test.mjs`

Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现最小状态归一化与独立挂载入口**

```js
function normalizeSevenDay(value={}){
  return {day:Math.min(7,Math.max(1,Number(value.day)||1)),stages:value.stages||{},exams:Array.isArray(value.exams)?value.exams:[],speech:value.speech||{}};
}
```

`mount()` 只替换 `#courseDashboard` 内的课程内容，不改导航，不覆盖全局 `render()`。

- [ ] **Step 4: 实现三轮课程界面**

- Stage 0：响应式 B站 iframe、建议片段、双语短文、逐句 AI 播放。
- Stage 1：8–12 张词卡、实际读音、中英/音标、词源、音变、记忆线索、语法详解。
- Stage 2：测试区入口和课外文化阅读。
- 手机使用纵向单列；平板双列；桌面内容与日程轨道双栏。

- [ ] **Step 5: 实现音频三层降级**

```js
async function play(audioId,text){
  const item=audioManifest[audioId];
  if(item){try{await new Audio(item.src).play();return 'static'}catch{}}
  speakKorean(text,.86);
  return 'device';
}
```

播放器加载失败时显示来源链接和“继续文字/音频学习”按钮，不阻断课程。

- [ ] **Step 6: 接入现有课程入口和版本缓存**

在 `index.html` 添加版本化 CSS/JS；`courseDashboard` 的主按钮打开 `MalbitSevenDay.open(currentDay)`。更新 `sw.js` 至 `malbit-v24`。

- [ ] **Step 7: 运行测试与浏览器关键路径检查**

Run: `node tests/seven-day-state.test.mjs && node --check seven-day-course.js && git diff --check`

浏览器检查：Day 1 三阶段切换、视频 iframe、短文逐句音频、词卡展开、手机 390px 无横向溢出、控制台无 error。

- [ ] **Step 8: 提交课程界面**

```bash
git add seven-day-course.js seven-day-course.css tests/seven-day-state.test.mjs index.html sw.js
git commit -m "Build seven-day course experience"
```

---

### Task 4: 实现听说读与选择式写作小考

**Files:**
- Create: `seven-day-exam.js`
- Create: `seven-day-exam.css`
- Create: `seven-day-exam-core.mjs`
- Create: `tests/seven-day-exam.test.mjs`
- Modify: `seven-day-course.js`
- Modify: `index.html`
- Modify: `sw.js`

**Interfaces:**
- `MalbitSevenDayExam.grade(day:Day,answers:Record<string,unknown>,speechStatus:string):ExamResult`
- `ExamResult` 为 `{score:number, passed:boolean, completedTypes:string[], items:{id,type,correct,explanation}[]}`。
- `MalbitSevenDayExam.startRecording():Promise<void>`
- `MalbitSevenDayExam.stopRecording():Promise<Blob>`

- [ ] **Step 1: 写评分门槛失败测试**

```js
import assert from 'node:assert/strict';
import {grade} from '../seven-day-exam-core.mjs';
const quiz=[
 {id:'l',type:'listening',answer:0,explanation:'L'},
 {id:'s',type:'speaking',answer:0,explanation:'S'},
 {id:'r',type:'reading',answer:0,explanation:'R'},
 {id:'w',type:'writing',answer:0,explanation:'W'}
];
assert.equal(grade(quiz,{l:0,s:0,r:0,w:0},'recognized').passed,true);
assert.equal(grade(quiz,{l:0,s:0,r:0,w:1},'recognized').passed,false);
assert.equal(grade(quiz,{l:0,r:0,w:0},'missing').passed,false);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node tests/seven-day-exam.test.mjs`

Expected: FAIL，评分模块不存在。

- [ ] **Step 3: 实现纯函数评分核心**

按题目均分计算；`passed = score >= 80 && completedTypes` 同时包含 listening、speaking、reading。结果必须保留逐题讲解。

- [ ] **Step 4: 实现四类题 UI 与立即讲解**

听力题隐藏文本先播放；阅读与选择式写作使用单选/排序按钮；提交后每题显示正确/错误、正确答案和解释，并将错误写入现有 `malbit-mistakes`。

- [ ] **Step 5: 实现口语录音与诚实状态**

优先 `MediaRecorder` 录音并允许回放；支持 `SpeechRecognition/webkitSpeechRecognition` 时比对标准化韩文。只显示三种状态：`recognized`、`retry`、`self-reviewed`。权限拒绝或 API 不支持时显示自评按钮，不阻断考试。

- [ ] **Step 6: 保存测验并推进实际学习日**

通过时写入 `courseState.sevenDay.exams` 并把 `day` 增加到最多 7；未通过时生成类型薄弱项，不重置已完成阶段。触发 `malbit-progress-changed` 供云同步和首页更新。

- [ ] **Step 7: 运行测试与手动权限降级检查**

Run: `node tests/seven-day-exam.test.mjs && node --check seven-day-exam.js && git diff --check`

浏览器检查：全部正确能推进、79 分不能推进、逐题讲解存在、拒绝麦克风后可以自评完成、错题进入复习。

- [ ] **Step 8: 提交小考系统**

```bash
git add seven-day-exam.js seven-day-exam.css seven-day-exam-core.mjs tests/seven-day-exam.test.mjs seven-day-course.js index.html sw.js
git commit -m "Add multi-skill daily exams"
```

---

### Task 5: 首页总体规划与真实进度联动

**Files:**
- Create: `seven-day-progress.js`
- Create: `seven-day-progress.css`
- Create: `seven-day-progress-core.mjs`
- Create: `tests/seven-day-progress.test.mjs`
- Modify: `index.html`
- Modify: `home-report-v22.js`
- Modify: `sync.js`
- Modify: `sw.js`

**Interfaces:**
- `MalbitSevenDayProgress.calculate(data,state,memory):ProgressModel`
- `ProgressModel` 为 `{day,dayPercent,unitPercent,skills,stageLabel,nextAction,estimatedFinish}`。
- `skills` 固定包含 `vocabulary,grammar,listening,speaking,reading`，未测评值为 `null`。

- [ ] **Step 1: 写真实进度失败测试**

```js
import assert from 'node:assert/strict';
import {calculate} from '../seven-day-progress-core.mjs';
const model=calculate({days:Array(7).fill({})},{day:2,stages:{'1':[true,true,true]},exams:[{day:1,score:85,items:[{type:'reading',correct:true}]}]},{});
assert.equal(model.day,2);
assert.equal(model.dayPercent,Math.round(1/7*100));
assert.equal(model.skills.reading,100);
assert.equal(model.skills.speaking,null);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node tests/seven-day-progress.test.mjs`

Expected: FAIL，进度模块不存在。

- [ ] **Step 3: 实现进度纯函数**

能力值来自测验明细和单词记忆，不从手动阶段按钮计算。预计完成日期按剩余实际学习日、默认每天一日计算，仅作为计划提示。

- [ ] **Step 4: 在首页插入总体学习卡**

在现有今日首页中加入：`延世 1 · 第二课 · 第 N/7 学习日`、三轮 25 分钟、五维掌握度、长期阶段条和唯一主操作按钮。复用现有卡片颜色与响应式断点，不重排已经确认的学习报告。

- [ ] **Step 5: 在课程中心显示 7 天轨道**

已通过、当前、锁定状态由 `ProgressModel` 计算；锁定天不可进入，已通过天可复习。

- [ ] **Step 6: 验证 Supabase 同步字段**

现有 `localState()` 已同步完整 `course` 对象，因此不新增接口；只增加测试/检查，确认 `sevenDay` 嵌套字段经过 `localState()` 和 `applyState()` 不丢失。

- [ ] **Step 7: 运行测试和多尺寸检查**

Run: `node tests/seven-day-progress.test.mjs && node --check seven-day-progress.js && git diff --check`

浏览器检查：390×844、768×1024、1440×900；首页主操作正确进入当前学习日；不存在横向滚动；学习报告仍正常。

- [ ] **Step 8: 提交进度联动**

```bash
git add seven-day-progress.js seven-day-progress.css seven-day-progress-core.mjs tests/seven-day-progress.test.mjs index.html home-report-v22.js sync.js sw.js
git commit -m "Connect seven-day learning progress"
```

---

### Task 6: 全链路验证、文档更新与发布

**Files:**
- Modify: `HANDOFF.md`
- Modify: `sw.js`
- Test: `tests/*.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–5 的全部公开接口。
- Produces: 已部署 GitHub Pages 版本和最新交接说明。

- [ ] **Step 1: 运行全部自动检查**

Run:

```bash
for test in tests/*.test.mjs; do node "$test"; done
for file in seven-day-*.js; do node --check "$file"; done
git diff --check
```

Expected: 所有命令退出码为 0。

- [ ] **Step 2: 本地浏览器验证完整 Day 1**

依次验证：首页进入课程 → B站 iframe → 双语短文逐句播放 → 词卡/语法 → 听说读写测试 → 逐题反馈 → 通过后进入 Day 2 → 首页进度变化。控制台 error 为 0。

- [ ] **Step 3: 验证兼容与降级**

- 使用空 localStorage 启动。
- 使用现有旧状态启动，确认旧学习时长、收藏、错题和课程进度未丢失。
- 模拟音频 404，确认设备朗读接管。
- 拒绝麦克风权限，确认自评路径可完成。
- 模拟视频 iframe 不可用，确认文字与音频课程仍可继续。

- [ ] **Step 4: 更新交接文档**

在 `HANDOFF.md` 记录：7 天内容结构、音频模型和许可证、B站 BV/分P映射、状态字段、测试命令、缓存版本、线上提交和已知限制。

- [ ] **Step 5: 提交最终文档和修正**

```bash
git add HANDOFF.md sw.js tests
git commit -m "Document seven-day learning release"
```

- [ ] **Step 6: 推送并等待 GitHub Pages 部署**

```bash
git push origin main
gh run list --repo CocoGaoo/CocoGaoo.github.io --limit 1
gh run watch <run-id> --repo CocoGaoo/CocoGaoo.github.io --exit-status
```

Expected: `pages-build-deployment` 成功。

- [ ] **Step 7: 验证线上版本**

打开带新版本参数的正式地址，检查首页学习规划、Day 1 全流程、静态音频、B站播放器、控制台错误和手机布局。若 Service Worker 仍返回旧资源，确认缓存名和 HTML 查询版本均为最新后再发布。
