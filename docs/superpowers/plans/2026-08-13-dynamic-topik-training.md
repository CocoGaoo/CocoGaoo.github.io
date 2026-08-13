# 动态每日 TOPIK 训练 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 45 天课程提供每日固定 20 题的混合原创题库，并根据当前课程、薄弱项和间隔复习动态组卷与多端同步。

**Architecture:** 题库与课程均为静态资源；纯函数组卷器从当前课程题、薄弱题和间隔复习题按每类 2/2/1 选取。当天试卷和作答状态持久化到独立版本状态，再由现有同步层上传 Supabase。

**Tech Stack:** 原生 JavaScript、Node.js `node:test`、localStorage、现有 Supabase 同步、静态女声 MP3。

**Spec:** `docs/superpowers/specs/2026-08-13-yonsei-level1-dynamic-topik-design.md`

## Global Constraints

- 每日固定听力、阅读、写作训练、综合各 5 题，共 20 题。
- 初级写作标注为课程输出训练，不冒充 TOPIK I 官方题型。
- 每类题按当前课程 2、薄弱项 2、间隔复习 1 组卷；同日题目 ID 不重复。
- 当日刷新保持同一试卷，跨学习日才生成新试卷。
- 不调用付费 AI，不抓取或复制第三方题库。
- 每项非平凡逻辑先写失败测试，再写最小实现。

---

### Task 1: 原创母题契约与基础题库

**Files:**
- Create: `question-bank/schema.js`
- Create: `question-bank/level1-listening.js`
- Create: `question-bank/level1-reading.js`
- Create: `question-bank/level1-writing.js`
- Create: `question-bank/level1-mixed.js`
- Test: `tests/question-bank.test.mjs`

**Interfaces:**
- Produces: `MalbitQuestionSchema.validate(question): string[]`
- Produces: 每类 `questions: Question[]`
- `Question` 字段为 `{id,type,themeIds,tags,difficulty,prompt,options,answer,why,audioId,writing}`；写作题使用 `writing:{keywords,grammar,reference}`，选择题使用 `options` 与整数 `answer`。

- [ ] **Step 1: 写题库失败测试**

```js
for(const type of ['listening','reading','writing','mixed']){
  assert.ok(bank[type].length>=60,`${type} seed bank too small`);
  assert.equal(new Set(bank[type].map(x=>x.id)).size,bank[type].length);
  assert.ok(bank[type].every(x=>validate(x).length===0));
}
assert.ok(bank.writing.every(x=>x.writing?.keywords.length&&x.writing.reference));
```

- [ ] **Step 2: 运行测试确认题库模块缺失失败**

Run: `node --test tests/question-bank.test.mjs`
Expected: FAIL with missing question-bank modules.

- [ ] **Step 3: 编写每类至少 60 道原创母题**

所有题必须标注一个或多个课程主题和知识点标签。听力题包含静态音频 ID；阅读题覆盖词汇语法、填空、排序、主旨和一致判断；写作覆盖补全、重组、情景句和短答；综合题跨两个以上知识点。

- [ ] **Step 4: 运行题库测试**

Run: `node --test tests/question-bank.test.mjs`
Expected: PASS，每类不少于 60 题且无重复 ID、缺失答案或缺失讲解。

- [ ] **Step 5: 提交**

```bash
git add question-bank tests/question-bank.test.mjs
git commit -m "Add level one training question bank"
```

### Task 2: 每日 2/2/1 动态组卷器

**Files:**
- Create: `daily-paper-engine.js`
- Test: `tests/daily-paper-engine.test.mjs`

**Interfaces:**
- Produces: `MalbitDailyPaper.build({date,currentThemeId,weakTags,history,bank}): DailyPaper`
- `DailyPaper` 为 `{date,sections:{listening,reading,writing,mixed},selectionLog}`，每个 section 正好 5 题。

- [ ] **Step 1: 写比例、去重和降级失败测试**

```js
const paper=build({date:'2026-08-13',currentThemeId:'u03',weakTags:['에/에서'],history,bank});
for(const section of Object.values(paper.sections))assert.equal(section.length,5);
assert.equal(new Set(Object.values(paper.sections).flat().map(x=>x.id)).size,20);
assert.ok(paper.selectionLog.every(x=>x.current===2&&x.weak===2&&x.review===1));
assert.deepEqual(build(sameInput),paper);
```

- [ ] **Step 2: 运行测试确认组卷器缺失失败**

Run: `node --test tests/daily-paper-engine.test.mjs`
Expected: FAIL with missing `daily-paper-engine.js`.

- [ ] **Step 3: 实现稳定种子选择和明确降级顺序**

使用 `date + currentThemeId + type` 生成稳定整数种子，对候选题排序后选择。候选不足时按当前课程、已学内容、通用基础题顺序补足；每次选择把题目 ID 加入当天全局 `used` 集合。

- [ ] **Step 4: 运行组卷测试**

Run: `node --test tests/daily-paper-engine.test.mjs`
Expected: PASS，比例正确、同日稳定、跨日变化、题量不足仍补满且不重复。

- [ ] **Step 5: 提交**

```bash
git add daily-paper-engine.js tests/daily-paper-engine.test.mjs
git commit -m "Add adaptive daily paper engine"
```

### Task 3: 作答记录、薄弱标签和间隔复查

**Files:**
- Create: `training-state-v27.js`
- Test: `tests/training-state.test.mjs`

**Interfaces:**
- Produces: `MalbitTrainingState.load(root): TrainingState`
- Produces: `recordAnswer(state,{question,correct,writingResult,answeredAt}): TrainingState`
- Produces: `dueTags(state,now): string[]`
- `TrainingState` 包含 `{version:27,papers,answers,tagStats,recentQuestionIds}`。

- [ ] **Step 1: 写错题返场失败测试**

```js
let state=recordAnswer(empty,{question:{id:'q1',tags:['에/에서']},correct:false,answeredAt:day0});
assert.ok(dueTags(state,day0+86400000).includes('에/에서'));
state=recordAnswer(state,{question:{id:'q2',tags:['에/에서']},correct:true,answeredAt:day0+86400000});
assert.ok(state.tagStats['에/에서'].attempts===2);
assert.ok(state.recentQuestionIds.includes('q2'));
```

- [ ] **Step 2: 运行测试确认状态模块缺失失败**

Run: `node --test tests/training-state.test.mjs`
Expected: FAIL with missing training state module.

- [ ] **Step 3: 实现错误权重与 1/3/7 日返场**

答错将标签加入次日复查，并在约第 3 日和第 7 日保持较高权重；连续正确逐步降低权重。只保留最近 200 个题目 ID 用于短期去重，完整作答记录保留在 `answers`。

- [ ] **Step 4: 运行状态测试**

Run: `node --test tests/training-state.test.mjs`
Expected: PASS，错误返场、连续正确降权和历史记录正确。

- [ ] **Step 5: 提交**

```bash
git add training-state-v27.js tests/training-state.test.mjs
git commit -m "Track adaptive training state"
```

### Task 4: 听力题静态音频

**Files:**
- Create: `scripts/generate-training-audio.py`
- Create: `audio/training/manifest.json`
- Create: `audio/training/*.mp3`
- Test: `tests/training-audio.test.mjs`

**Interfaces:**
- Consumes: `question-bank/level1-listening.js`
- Produces: manifest `{audioId:{src,text,voice:'ko-KR-SunHiNeural'}}`

- [ ] **Step 1: 写听力音频失败测试**

```js
for(const question of listeningQuestions){
  assert.ok(manifest[question.audioId],`${question.audioId} missing`);
  assert.ok(fs.statSync(manifest[question.audioId].src).size>1000);
}
```

- [ ] **Step 2: 运行测试确认音频缺失失败**

Run: `node --test tests/training-audio.test.mjs`
Expected: FAIL with first missing listening audio.

- [ ] **Step 3: 使用 `ko-KR-SunHiNeural` 批量生成并写清单**

脚本读取题库音频文本，跳过已存在且大于 1000 字节的文件，失败重试 3 次，最终原子写清单。

- [ ] **Step 4: 生成并验证**

Run: `python3 scripts/generate-training-audio.py --all`

Run: `node --test tests/training-audio.test.mjs`
Expected: PASS，全部听力母题均有静态音频。

- [ ] **Step 5: 提交**

```bash
git add scripts/generate-training-audio.py audio/training tests/training-audio.test.mjs
git commit -m "Generate daily training audio"
```

### Task 5: 每日 20 题界面与即时反馈

**Files:**
- Create: `daily-training-v27.js`
- Create: `daily-training-v27.css`
- Modify: `index.html`
- Modify: `sw.js`
- Test: `tests/daily-training-model.test.mjs`

**Interfaces:**
- Consumes: `MalbitDailyPaper`、`MalbitTrainingState`
- Produces: `MalbitDailyTraining.mount(container)`、`renderPaper(paper,state)`、`evaluateWriting(text,question)`

- [ ] **Step 1: 写写作反馈与进度失败测试**

```js
const result=evaluateWriting('세 시에 도서관 앞에서 만나요.',question);
assert.deepEqual(result.missing,[]);
assert.equal(result.complete,true);
assert.deepEqual(sectionProgress({answered:3,total:5}),{answered:3,total:5,pct:60});
```

- [ ] **Step 2: 运行测试确认 UI 模型缺失失败**

Run: `node --test tests/daily-training-model.test.mjs`
Expected: FAIL with missing daily training model.

- [ ] **Step 3: 实现四类标签、20 题作答与即时讲解**

听力使用静态音频；阅读和综合选择后立即显示正误与讲解；写作显示命中关键词、缺失关键词、关键语法和参考答案。未作答不得标记完成。页面显示每类 `已答/5` 和总进度 `已答/20`。

- [ ] **Step 4: 接入缓存并运行测试**

Run: `node --test tests/daily-*.test.mjs tests/training-*.test.mjs`
Expected: PASS。

手动检查刷新保持同一试卷；手机一屏内题目按钮可点且底栏不遮挡提交区。

- [ ] **Step 5: 提交**

```bash
git add daily-training-v27.js daily-training-v27.css index.html sw.js tests/daily-training-model.test.mjs
git commit -m "Render adaptive daily training"
```

### Task 6: Supabase 同步、集成回归与发布

**Files:**
- Modify: `sync.js`
- Modify: `home-focus-v24.js`
- Test: `tests/sync-v27.test.mjs`
- Test: `tests/level1-integration.test.mjs`

**Interfaces:**
- Consumes: `Level1State`、`TrainingState`
- Extends sync payload with `level1` and `training` keys without removing existing `course`、`mistakes`、`studyTime`、`favorites`。

- [ ] **Step 1: 写同步保留和端到端失败测试**

```js
const merged=mergeState(local,remote);
assert.deepEqual(merged.level1.completedDays,[1,2]);
assert.ok(merged.training.answers.q1);
assert.deepEqual(merged.favorites,local.favorites);
assert.equal(buildDailyExperience(fixture).paperSize,20);
```

- [ ] **Step 2: 运行测试确认新状态未同步失败**

Run: `node --test tests/sync-v27.test.mjs tests/level1-integration.test.mjs`
Expected: FAIL because payload lacks `level1` and `training`.

- [ ] **Step 3: 扩展同步载荷并更新首页摘要**

远端与本地按 `updatedAt` 合并每日试卷和课程进度；不同题目的答案按 ID 合并。同步失败继续保留本地状态。首页显示当前主题、课程完成度、今日训练 `x/20` 和最高权重薄弱标签。

- [ ] **Step 4: 完整验证与线上部署**

Run: `for t in tests/*.test.mjs; do node --test "$t" || exit 1; done`

Run: `git diff --check`

浏览器检查桌面、iPad、393×852 手机；验证离线缓存、刷新不换题、跨端状态结构和控制台无错误。推送 `main` 后等待 GitHub Pages workflow 成功，并在线验证课程目录和每日 20 题。

- [ ] **Step 5: 提交**

```bash
git add sync.js home-focus-v24.js tests/sync-v27.test.mjs tests/level1-integration.test.mjs
git commit -m "Integrate level one adaptive training"
```

