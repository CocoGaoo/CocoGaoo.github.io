# Level 1 第 8–14 天与学习数据联动实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 接通新版课程收藏、错题、每日复习和 TOPIK 数据流，并把第 8–14 天按可随时停止的独立发布点逐日上线。

**Architecture:** 继续使用纯静态脚本与 `malbit-level1-v26` 本地状态。共享状态函数保持纯函数、先写测试；课程渲染层只负责读写状态和绑定现有页面。普通课程复用现有 45 天数据，阶段复习由已开放课程的客观题组合；每一天只有在音频与全量测试通过后才提高 `usableDays`。

**Tech Stack:** 原生 JavaScript、HTML/CSS、Node.js `node:test`、Python `edge-tts` 生成器、GitHub Pages。

**Spec:** `docs/superpowers/specs/2026-08-19-level1-days-8-14-data-flow-design.md`

## Global Constraints

- 不新增服务器、数据库、运行时 AI 或 npm 依赖。
- 不修改学习页面布局和模块顺序。
- 课程考核与新增 TOPIK 训练只使用选择题。
- 每个开放日必须是独立、可测试、可部署的提交。
- 音频缺失或测试失败时不得提高 `usableDays`。
- 每个发布点推送后验证 GitHub Pages 构建和线上资源版本。

---

## 文件职责

- `curriculum/level1-state.js`：Level 1 状态归一化、收藏、错题与阶段分数纯函数。
- `level1-course-v26.js`：课程、阶段复习、每日复习和课程同步 TOPIK 的数据模型与页面绑定。
- `course.js`：旧错题与 Level 1 错题的合并展示、修复写回。
- `app.js`：旧收藏与 Level 1 词汇收藏的合并展示、取消收藏写回。
- `topik-practice-v25.js`：展示课程同步 TOPIK 选择题并记录错题。
- `scripts/extract-level1-audio.mjs`：按开放天数列出需要的静态音频。
- `scripts/generate-level1-audio.py`：只生成缺失音频并原子更新清单。
- `tests/level1-state.test.mjs`：共享状态行为。
- `tests/level1-render-model.test.mjs`：课程、阶段复习、复习池与 TOPIK 模型。
- `tests/level1-integration.test.mjs`：收藏/错题展示模型与存储边界。
- `tests/level1-audio.test.mjs`：当前开放天数的全部音频。
- `index.html`、`sw.js`：资源版本和 Service Worker 缓存版本。

---

### Task 1: 扩展 Level 1 状态模型

**Files:**
- Modify: `curriculum/level1-state.js`
- Modify: `tests/level1-state.test.mjs`

**Interfaces:**
- Produces: `normalize(state): Level1State`
- Produces: `toggleFavorite(wordId, state): Level1State`
- Produces: `recordMistakes(items, state): Level1State`
- Produces: `resolveMistake(id, state): Level1State`
- Produces: `completeCheckpoint(dayId, result, state): Level1State`

- [ ] **Step 1: 写收藏、错题与阶段分数的失败测试**

```js
const base=normalize({version:26,currentDay:8,completedDays:[1,2,3,4,5,6,7],themeScores:{},weakTags:[]});
assert.deepEqual(plain(base.favoriteWordIds),[]);
assert.deepEqual(plain(base.mistakes),[]);
assert.deepEqual(plain(base.checkpointScores),{});

const favorited=toggleFavorite('l1-u04-w11',base);
assert.deepEqual(plain(favorited.favoriteWordIds),['l1-u04-w11']);
assert.deepEqual(plain(toggleFavorite('l1-u04-w11',favorited).favoriteWordIds),[]);

const wrong={id:'lesson:l1-u04-b02',dayId:8,source:'lesson',type:'reading',prompt:'문제',selected:'오답',answer:'정답',explanation:'해설',reviewed:false,updatedAt:'2026-08-19T00:00:00.000Z'};
const recorded=recordMistakes([wrong],base);
assert.equal(recorded.mistakes.length,1);
assert.equal(recordMistakes([{...wrong,selected:'다른 오답'}],recorded).mistakes.length,1);
assert.equal(resolveMistake(wrong.id,recorded).mistakes[0].reviewed,true);

const failedCheckpoint=completeCheckpoint(10,{score:79,weakTags:['reading']},normalize({...base,currentDay:10,completedDays:[1,2,3,4,5,6,7,8,9]}));
assert.equal(failedCheckpoint.currentDay,10);
const passedCheckpoint=completeCheckpoint(10,{score:80},failedCheckpoint);
assert.equal(passedCheckpoint.currentDay,11);
assert.equal(passedCheckpoint.checkpointScores[10],80);
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run: `node --test tests/level1-state.test.mjs`

Expected: FAIL，缺少 `toggleFavorite`、`recordMistakes`、`resolveMistake` 或 `completeCheckpoint`。

- [ ] **Step 3: 写最小状态实现**

```js
function toggleFavorite(wordId,state){
  const next=normalize(state),ids=new Set(next.favoriteWordIds);
  ids.has(wordId)?ids.delete(wordId):ids.add(wordId);
  return{...next,favoriteWordIds:[...ids]};
}

function recordMistakes(items,state){
  const next=normalize(state),byId=new Map(next.mistakes.map(item=>[item.id,item]));
  for(const item of items)byId.set(item.id,{...byId.get(item.id),...item,reviewed:false});
  return{...next,mistakes:[...byId.values()]};
}

function resolveMistake(id,state){
  const next=normalize(state);
  return{...next,mistakes:next.mistakes.map(item=>item.id===id?{...item,reviewed:true}:item)};
}
```

扩展 `normalize()`，保证 `favoriteWordIds`、`mistakes`、`checkpointScores` 缺失时分别为 `[]`、`[]`、`{}`，且不改变既有进度。

- [ ] **Step 4: 运行状态测试**

Run: `node --test tests/level1-state.test.mjs`

Expected: PASS。

- [ ] **Step 5: 提交状态模型**

```bash
git add curriculum/level1-state.js tests/level1-state.test.mjs
git commit -m "feat: add level one learning state flows"
```

---

### Task 2: 接通词汇收藏和新版错题页

**Files:**
- Modify: `level1-course-v26.js`
- Modify: `app.js`
- Modify: `course.js`
- Create: `tests/level1-integration.test.mjs`

**Interfaces:**
- Consumes: `MalbitLevel1State.toggleFavorite()`、`resolveMistake()`
- Produces: `favoriteWords(state): Word[]`
- Produces: `mistakeView(legacyMistakes, level1State): MistakeViewItem[]`

- [ ] **Step 1: 写合并展示模型的失败测试**

```js
const favorites=api.favoriteWords({favoriteWordIds:['l1-u04-w11']});
assert.equal(favorites.length,1);
assert.equal(favorites[0].id,'l1-u04-w11');

const mixed=api.mistakeView(
  [{id:'u1-0',type:'词汇',q:'旧题',your:'A',answer:'B',why:'旧解析',reviewed:false}],
  {mistakes:[{id:'lesson:q1',dayId:8,source:'lesson',type:'reading',prompt:'新题',selected:'A',answer:'B',explanation:'新解析',reviewed:false}]}
);
assert.deepEqual(mixed.map(item=>item.id),['legacy:u1-0','level1:lesson:q1']);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/level1-integration.test.mjs`

Expected: FAIL，缺少 `favoriteWords` 和 `mistakeView`。

- [ ] **Step 3: 在词汇卡加入收藏按钮**

在每张 `l1-words > article` 中加入：

```html
<button type="button" data-l1-favorite="WORD_ID">♡ 收藏</button>
```

按钮点击后调用 `toggleFavorite(wordId, loadState())`、`saveState(next)`，只局部更新按钮文字为 `♥ 已收藏` 或 `♡ 收藏`。

- [ ] **Step 4: 合并收藏页与错题页**

`app.js` 的 `renderFavorites()` 在旧 `favorites` 后追加 `favoriteWords(level1State)`；Level 1 收藏的移除按钮调用状态 API。

`course.js` 的 `renderMistakes()` 使用统一视图模型渲染两种来源。修复旧题继续修改 `malbit-mistakes`；修复 Level 1 题调用 `resolveMistake()` 并写回 `malbit-level1-v26`。

- [ ] **Step 5: 课程评分记录具体错题**

把 `gradeAssessment()` 的反馈扩展为：

```js
{id,itemId,ok,answer,reference,type,prompt,explanation}
```

提交失败题后转换为设计文档定义的 `Mistake`，使用 `recordMistakes()` 写回。未全部作答时保持提前返回，不写错题。

- [ ] **Step 6: 运行集成与全量测试**

Run: `node --test tests/level1-integration.test.mjs tests/level1-state.test.mjs tests/level1-render-model.test.mjs`

Expected: PASS。

- [ ] **Step 7: 提交并发布共享联动**

```bash
git add level1-course-v26.js app.js course.js tests/level1-integration.test.mjs
git commit -m "feat: connect level one favorites and mistakes"
node --test tests/*.test.mjs
git push origin main
```

验证 GitHub Pages 构建成功，并确认线上资源版本已更新。

---

### Task 3: 增加课程同步 TOPIK 选择题

**Files:**
- Modify: `level1-course-v26.js`
- Modify: `topik-practice-v25.js`
- Modify: `tests/level1-render-model.test.mjs`
- Modify: `tests/level1-integration.test.mjs`

**Interfaces:**
- Produces: `topikQuestions(state, audioManifest): TopikQuestion[]`
- `TopikQuestion`: `{id,dayId,themeId,type,prompt,options,answer,why,audio}`

- [ ] **Step 1: 写按完成主题取题的失败测试**

```js
const questions=api.topikQuestions({completedDays:[1,2]},manifest);
assert.ok(questions.length>=2);
assert.ok(questions.every(item=>item.themeId==='l1-u01'));
assert.ok(questions.every(item=>Array.isArray(item.options)&&item.options.length>=2));
assert.ok(questions.every(item=>item.type!=='writing'));
assert.deepEqual(api.topikQuestions({completedDays:[]},manifest),[]);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test tests/level1-render-model.test.mjs`

Expected: FAIL，缺少 `topikQuestions`。

- [ ] **Step 3: 复用课程客观题生成 TOPIK 模型**

对每个已完成 `themeId`，从输入日和输出日经过 `choiceAssessment()` 的题目中取听力、阅读、语法和词汇题；去重后按 ID 稳定排序。不要复制题库正文。

- [ ] **Step 4: 在 TOPIK 页面追加“课程同步训练”**

`topik-practice-v25.js` 调用 `MalbitLevel1Course.topikQuestions()`；答错时通过 `recordMistakes()` 写入来源为 `topik` 的错题。Level 1 API 加载后由课程 `mount()` 再调用一次 `MalbitTopikPracticeV25.render()`。

- [ ] **Step 5: 运行测试并提交**

Run: `node --test tests/level1-render-model.test.mjs tests/level1-integration.test.mjs`

Expected: PASS。

```bash
git add level1-course-v26.js topik-practice-v25.js tests/level1-render-model.test.mjs tests/level1-integration.test.mjs
git commit -m "feat: add course-synced topik practice"
```

---

### Task 4: 建立逐日音频与开放测试

**Files:**
- Modify: `tests/level1-audio.test.mjs`
- Modify: `tests/level1-render-model.test.mjs`
- Modify: `level1-course-v26.js`

**Interfaces:**
- Produces: `usableDays`（导出为 `MalbitLevel1Course.usableDays`）
- Audio generator: `python3 scripts/generate-level1-audio.py --days N`

- [ ] **Step 1: 把音频测试改为读取开放天数**

测试加载课程 API，读取 `usableDays`，再对 `schedule.slice(0, usableDays)` 中的普通课程验证全部音频。阶段复习日不要求课程音频。

- [ ] **Step 2: 写未开放日仍为预览的测试**

```js
assert.equal(api.usableDays,7);
assert.equal(api.lessonSummary(8,manifest),null);
assert.equal(api.directorySummary(state,new Date()).days[7].status,'preview');
```

- [ ] **Step 3: 运行测试**

Run: `node --test tests/level1-audio.test.mjs tests/level1-render-model.test.mjs`

Expected: PASS，建立后续逐日发布门禁。

- [ ] **Step 4: 提交门禁**

```bash
git add tests/level1-audio.test.mjs tests/level1-render-model.test.mjs level1-course-v26.js
git commit -m "test: gate level one days on complete audio"
```

---

### Task 5: 发布第 8 天

**Files:**
- Modify: `audio/level1/manifest.json`
- Create: `audio/level1/l1-u04-output-*.mp3`（由生成器产生）
- Modify: `level1-course-v26.js`
- Modify: `tests/level1-audio.test.mjs`
- Modify: `index.html`
- Modify: `sw.js`

- [ ] **Step 1: 先把预期开放天数改为 8，确认音频测试失败**

Run: `node --test tests/level1-audio.test.mjs tests/level1-render-model.test.mjs`

Expected: FAIL，报告第 8 天音频缺失。

- [ ] **Step 2: 生成前 8 天缺失音频**

Run: `NODE=$(command -v node) python3 scripts/generate-level1-audio.py --days 8`

Expected: 生成第 8 天缺失文件，保留前 7 天清单项。

- [ ] **Step 3: 验证第 8 天、复习池和 TOPIK 联动**

```js
assert.equal(api.usableDays,8);
assert.equal(api.lessonSummary(8,manifest).id,8);
assert.ok(api.dailyReview({completedDays:[8]},'2026-08-19').length===5);
assert.ok(api.topikQuestions({completedDays:[8]},manifest).every(item=>item.themeId==='l1-u04'));
```

- [ ] **Step 4: 更新缓存版本并运行全量测试**

Run: `git diff --check && node --test tests/*.test.mjs`

Expected: 全部 PASS。

- [ ] **Step 5: 提交、推送并验证线上第 8 天**

```bash
git add audio/level1 level1-course-v26.js tests index.html sw.js
git commit -m "feat: publish level one day eight"
git push origin main
```

等待 GitHub Pages 成功后，确认线上 `usableDays === 8`。这是第一个可安全停止点。

---

### Task 6: 发布第 9 天

**Files:** 与 Task 5 相同，新增 `l1-u05-input-*` 音频。

- [ ] **Step 1: 把开放天数改为 9，运行测试确认第 9 天音频缺失**
- [ ] **Step 2: 运行 `NODE=$(command -v node) python3 scripts/generate-level1-audio.py --days 9`**
- [ ] **Step 3: 断言 `lessonSummary(9)`、每日复习和 `l1-u05` TOPIK 题可用**
- [ ] **Step 4: 更新资源版本，运行 `git diff --check && node --test tests/*.test.mjs`**
- [ ] **Step 5: 提交 `feat: publish level one day nine`，推送并验证线上**

这是第二个可安全停止点。

---

### Task 7: 实现并发布第 10 天阶段复习

**Files:**
- Modify: `level1-course-v26.js`
- Modify: `curriculum/level1-state.js`
- Modify: `tests/level1-render-model.test.mjs`
- Modify: `tests/level1-state.test.mjs`
- Modify: `index.html`
- Modify: `sw.js`

**Interfaces:**
- Produces: `checkpointSummary(10, manifest): {id,title,questions}`
- Consumes: `completeCheckpoint(10, result, state)`

- [ ] **Step 1: 写阶段复习失败测试**

```js
const checkpoint=api.checkpointSummary(10,manifest);
assert.equal(checkpoint.id,10);
assert.ok(checkpoint.questions.length>=5);
assert.ok(checkpoint.questions.every(item=>item.options?.length>=2));
assert.equal(new Set(checkpoint.questions.map(item=>item.id)).size,checkpoint.questions.length);
```

- [ ] **Step 2: 运行测试并确认失败**
- [ ] **Step 3: 从第 1–9 天客观题稳定抽取阶段题，不复制新题库**
- [ ] **Step 4: `openDay(10)` 渲染阶段说明、选择题和 80 分门槛**
- [ ] **Step 5: 失败记录错题；通过保存 `checkpointScores[10]` 并进入第 11 天**
- [ ] **Step 6: 运行全量测试，提交 `feat: publish level one checkpoint day ten`，推送并验证线上**

这是第三个可安全停止点。

---

### Task 8: 逐日发布第 11–14 天

每一天重复 Task 5 的同一门禁，不合并成一个提交。

#### 第 11 天：故乡输出

- [ ] 将 `usableDays` 改为 11，先确认音频测试失败。
- [ ] 运行 `NODE=$(command -v node) python3 scripts/generate-level1-audio.py --days 11`。
- [ ] 验证 `lessonSummary(11)`、复习池、`l1-u05` TOPIK 联动。
- [ ] 全量测试通过后提交 `feat: publish level one day eleven`、推送、验证线上。

#### 第 12 天：学校生活输入

- [ ] 将 `usableDays` 改为 12，先确认音频测试失败。
- [ ] 运行 `NODE=$(command -v node) python3 scripts/generate-level1-audio.py --days 12`。
- [ ] 验证 `lessonSummary(12)`、复习池、`l1-u06` TOPIK 联动。
- [ ] 全量测试通过后提交 `feat: publish level one day twelve`、推送、验证线上。

#### 第 13 天：学校生活输出

- [ ] 将 `usableDays` 改为 13，先确认音频测试失败。
- [ ] 运行 `NODE=$(command -v node) python3 scripts/generate-level1-audio.py --days 13`。
- [ ] 验证 `lessonSummary(13)`、复习池、`l1-u06` TOPIK 联动。
- [ ] 全量测试通过后提交 `feat: publish level one day thirteen`、推送、验证线上。

#### 第 14 天：饮食输入

- [ ] 将 `usableDays` 改为 14，先确认音频测试失败。
- [ ] 运行 `NODE=$(command -v node) python3 scripts/generate-level1-audio.py --days 14`。
- [ ] 验证 `lessonSummary(14)`、复习池、`l1-u07` TOPIK 联动。
- [ ] 全量测试通过后提交 `feat: publish level one day fourteen`、推送、验证线上。

---

### Task 9: 最终兼容性与线上验收

**Files:**
- Modify only if verification exposes a defect.

- [ ] **Step 1: 从旧 v26 状态夹具启动，确认进度未重置**
- [ ] **Step 2: 验证收藏一次添加、一次移除，刷新模型后状态保持**
- [ ] **Step 3: 故意答错课程题和 TOPIK 题，确认错题页出现两条不同来源记录**
- [ ] **Step 4: 修复错题，确认只改变目标记录的 `reviewed`**
- [ ] **Step 5: 验证第 10 天门槛和第 14 天后的下一天仍为预览**
- [ ] **Step 6: 运行最终命令**

Run: `git diff --check && node --check level1-course-v26.js && node --check curriculum/level1-state.js && node --check topik-practice-v25.js && node --test tests/*.test.mjs`

Expected: 0 failures、0 syntax errors、0 whitespace errors。

- [ ] **Step 7: 检查 GitHub Pages 最新构建成功，线上资源版本与最后提交一致**

