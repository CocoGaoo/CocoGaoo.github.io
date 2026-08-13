# 新版延世韩国语 1 级课程 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 7 天样板升级为完整、可解锁、可考核的 45 天延世 1 级原创课程，并补齐韩英女声静态音频。

**Architecture:** 使用独立课程数据文件描述 20 个主题与 5 个复习日，纯函数负责日程、解锁、状态迁移和验证，现有课程页只负责渲染。静态音频通过稳定 ID 和清单关联，缺失时显示明确提示而不回退系统语音。

**Tech Stack:** 原生 HTML/CSS/JavaScript、Node.js `node:test`、edge-tts 静态 MP3、localStorage、现有 Supabase 同步层。

**Spec:** `docs/superpowers/specs/2026-08-13-yonsei-level1-dynamic-topik-design.md`

## Global Constraints

- 每日总计划固定 75 分钟，其中课程 55 分钟、训练 20 分钟。
- 前 10 个主题按延世官网公开 1-1 顺序；后 10 个主题明确标注为依据延世 1 级能力目标原创编排。
- 不复制教材正文、商业音频或第三方题库。
- 保留当前配色、底部导航、课文精学、单词卡和首页结构。
- 韩语与英语均使用预生成女声静态音频；缺失时不回退系统语音。
- 每项非平凡逻辑先写失败测试，再写最小实现。

---

### Task 1: 45 天课程日程与数据契约

**Files:**
- Create: `curriculum/level1-schema.js`
- Create: `curriculum/level1-schedule.js`
- Test: `tests/level1-schedule.test.mjs`

**Interfaces:**
- Produces: `MalbitLevel1Schema.validateTheme(theme): string[]`
- Produces: `MalbitLevel1Schedule.build(themes): LearningDay[]`
- `LearningDay` fields: `{id, kind, themeId, phase, minutes, title}`；`kind` 为 `lesson` 或 `checkpoint`，`phase` 为 `input`、`output`、`review` 或 `final`。

- [ ] **Step 1: 写日程失败测试**

```js
assert.equal(days.length,45);
assert.equal(days.filter(x=>x.kind==='lesson').length,40);
assert.equal(days.filter(x=>x.kind==='checkpoint').length,5);
assert.deepEqual(days.filter(x=>x.kind==='checkpoint').map(x=>x.id),[10,20,30,40,45]);
assert.ok(days.every(x=>x.minutes.course===55&&x.minutes.training===20));
```

- [ ] **Step 2: 运行测试并确认因接口不存在而失败**

Run: `node --test tests/level1-schedule.test.mjs`
Expected: FAIL with missing `curriculum/level1-schedule.js` or `MalbitLevel1Schedule`.

- [ ] **Step 3: 实现最小日程构建和主题验证**

```js
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
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test tests/level1-schedule.test.mjs`
Expected: PASS，45 天、40 个课程日和 5 个复习日全部正确。

- [ ] **Step 5: 提交**

```bash
git add curriculum/level1-schema.js curriculum/level1-schedule.js tests/level1-schedule.test.mjs
git commit -m "Add level one course schedule"
```

### Task 2: 1-1 十主题原创课程数据

**Files:**
- Create: `curriculum/level1-1.js`
- Test: `tests/level1-content.test.mjs`

**Interfaces:**
- Consumes: `MalbitLevel1Schema.validateTheme(theme)`
- Produces: `MalbitLevel1PartOne.themes: Theme[]`
- `Theme` 包含 `{id,title,sourceLabel,goals,inputDay,outputDay}`；两个学习日均包含 `article.lines[6]`、`words[10..14]`、`grammar[2..3]`、`culture`、`assessment`。

- [ ] **Step 1: 写 1-1 数据失败测试**

```js
assert.deepEqual(themes.map(x=>x.title),['问候与介绍','物品','学校','朋友','故乡','学校生活','饮食','一天生活','周末','过去的事']);
for(const theme of themes){
  assert.equal(validateTheme(theme).length,0);
  assert.equal(theme.inputDay.article.lines.length,6);
  assert.ok(theme.inputDay.words.length>=10);
  assert.ok(theme.inputDay.grammar.length>=2);
  assert.ok(theme.outputDay.assessment.length>=6);
}
```

- [ ] **Step 2: 运行测试确认因数据文件缺失而失败**

Run: `node --test tests/level1-content.test.mjs`
Expected: FAIL with missing `curriculum/level1-1.js`.

- [ ] **Step 3: 按固定主题顺序编写原创内容**

每个词条使用完整结构：

```js
{id:'l1-u01-w01',ko:'안녕하세요',pron:'안녕하세요',zh:'你好',en:'hello',ipa:'/həˈloʊ/',origin:'固定问候语',memory:'안녕表示安宁，하세요是礼貌表达',soundRule:'按音节连贯朗读',example:{ko:'안녕하세요? 저는 코코예요.',zh:'你好，我是Coco。'},audio:{ko:'l1-u01-w01-ko',en:'l1-u01-w01-en'}}
```

课文、语法、文化和考核必须使用本主题词汇，且 B 日至少包含听力、口语、阅读和真实输入写作各一项。

- [ ] **Step 4: 运行内容验证测试**

Run: `node --test tests/level1-content.test.mjs`
Expected: PASS，10 个主题均无字段缺失或 ID 重复。

- [ ] **Step 5: 提交**

```bash
git add curriculum/level1-1.js tests/level1-content.test.mjs
git commit -m "Add level one part one curriculum"
```

### Task 3: 1-2 能力目标原创课程数据

**Files:**
- Create: `curriculum/level1-2.js`
- Modify: `tests/level1-content.test.mjs`

**Interfaces:**
- Consumes: `MalbitLevel1Schema.validateTheme(theme)`
- Produces: `MalbitLevel1PartTwo.themes: Theme[]`

- [ ] **Step 1: 扩展失败测试锁定后半主题与来源标签**

```js
assert.deepEqual(partTwo.map(x=>x.title),['购物与价格','衣物与尺寸','问路','公共交通','打电话','约会与计划','天气与季节','爱好与能力','身体状况','初级生活综合']);
assert.ok(partTwo.every(x=>x.sourceLabel==='依据延世1级能力目标原创'));
assert.equal([...partOne,...partTwo].length,20);
```

- [ ] **Step 2: 运行测试确认因 `MalbitLevel1PartTwo` 不存在而失败**

Run: `node --test tests/level1-content.test.mjs`
Expected: FAIL with missing part-two data.

- [ ] **Step 3: 编写后半 10 主题完整内容**

使用 Task 2 的同一 `Theme` 契约；购物、问路、交通和电话主题必须覆盖延世官网公开的 1 级生活能力。每主题至少 10 个词、2 个语法、6 句短课文、3 段双语文化阅读和 6 道主题考核。

- [ ] **Step 4: 运行内容测试确认 20 主题全部通过**

Run: `node --test tests/level1-content.test.mjs`
Expected: PASS，20 个主题、40 个学习日内容完整。

- [ ] **Step 5: 提交**

```bash
git add curriculum/level1-2.js tests/level1-content.test.mjs
git commit -m "Add level one part two curriculum"
```

### Task 4: 旧状态迁移、解锁与第一课快速验收

**Files:**
- Create: `curriculum/level1-state.js`
- Test: `tests/level1-state.test.mjs`

**Interfaces:**
- Produces: `MalbitLevel1State.migrate(root): Level1State`
- Produces: `MalbitLevel1State.canOpen(dayId,state): boolean`
- Produces: `MalbitLevel1State.completeDay(dayId,result,state): Level1State`
- `Level1State` 包含 `{version:26,currentDay,completedDays,themeScores,weakTags,legacySnapshot}`。

- [ ] **Step 1: 写迁移与解锁失败测试**

```js
const migrated=migrate({sevenDay:{day:3,stages:{d1:[true,true,true]},exams:[{day:1,score:90}]}});
assert.equal(migrated.version,26);
assert.ok(migrated.legacySnapshot);
assert.equal(canOpen(1,migrated),true);
assert.equal(canOpen(2,migrated),false);
const passed=completeDay(1,{score:82},migrated);
assert.equal(canOpen(2,passed),true);
```

- [ ] **Step 2: 运行测试确认接口缺失失败**

Run: `node --test tests/level1-state.test.mjs`
Expected: FAIL with missing state module.

- [ ] **Step 3: 实现版本迁移与不可变状态更新**

迁移只读取旧 `sevenDay` 状态，复制到 `legacySnapshot`，不删除旧字段。第一课初始为可打开且带 `quickCheck:true`；达到 80 分后解锁第二课，未达标时只写入 `weakTags`。

- [ ] **Step 4: 运行状态测试**

Run: `node --test tests/level1-state.test.mjs`
Expected: PASS，旧快照保留、解锁门槛正确、未达标不丢数据。

- [ ] **Step 5: 提交**

```bash
git add curriculum/level1-state.js tests/level1-state.test.mjs
git commit -m "Add level one state migration"
```

### Task 5: 韩英音频清单与静态生成

**Files:**
- Create: `scripts/extract-level1-audio.mjs`
- Create: `scripts/generate-level1-audio.py`
- Create: `audio/level1/manifest.json`
- Create: `audio/level1/*.mp3`
- Test: `tests/level1-audio.test.mjs`

**Interfaces:**
- Produces: `extract-level1-audio.mjs` JSON `{audioId:{text,lang,voice}}`
- Produces: manifest `{audioId:{src,text,lang,voice}}`
- Korean voice: `ko-KR-SunHiNeural`
- English voice: `en-US-JennyNeural`

- [ ] **Step 1: 写音频清单失败测试**

```js
for(const item of requiredAudio){
  assert.ok(manifest[item.id],`${item.id} missing`);
  assert.equal(manifest[item.id].lang,item.lang);
  assert.ok(fs.statSync(manifest[item.id].src).size>1000);
}
```

- [ ] **Step 2: 运行测试确认大量音频 ID 缺失**

Run: `node --test tests/level1-audio.test.mjs`
Expected: FAIL with first missing Korean or English audio ID.

- [ ] **Step 3: 实现提取器和批量生成脚本**

生成器按 `lang` 选择女声，只为缺失或小于 1000 字节的文件重新生成；每个文件失败最多重试 3 次。生成完成后原子写入 `audio/level1/manifest.json`。

- [ ] **Step 4: 生成全部音频并运行测试**

Run: `NODE=$(command -v node) python3 scripts/generate-level1-audio.py --all`

Run: `node --test tests/level1-audio.test.mjs`
Expected: PASS，所有韩语课文、例句、单词及英文单词音频存在。

- [ ] **Step 5: 提交**

```bash
git add scripts/extract-level1-audio.mjs scripts/generate-level1-audio.py audio/level1 tests/level1-audio.test.mjs
git commit -m "Generate Korean and English level one audio"
```

### Task 6: 45 天课程界面与首页衔接

**Files:**
- Create: `level1-course-v26.js`
- Create: `level1-course-v26.css`
- Modify: `index.html`
- Modify: `sw.js`
- Test: `tests/level1-render-model.test.mjs`

**Interfaces:**
- Consumes: `MalbitLevel1Schedule.build`, `MalbitLevel1PartOne.themes`, `MalbitLevel1PartTwo.themes`, `MalbitLevel1State`
- Produces: `MalbitLevel1Course.mount(container)`、`openDay(dayId)`、`homeSummary(state)`

- [ ] **Step 1: 写渲染模型失败测试**

```js
const view=homeSummary({currentDay:11,completedDays:[1,2,3,4,5,6,7,8,9,10]});
assert.equal(view.day,11);
assert.equal(view.totalDays,45);
assert.equal(view.courseMinutes,55);
assert.equal(view.trainingMinutes,20);
```

- [ ] **Step 2: 运行测试确认渲染模型缺失失败**

Run: `node --test tests/level1-render-model.test.mjs`
Expected: FAIL with missing `level1-course-v26.js` export.

- [ ] **Step 3: 实现目录、日课、复习日和首页摘要**

课程目录分为 1-1、1-2 两段，显示 45 天路线、主题来源标签、锁定状态和预计完成日期。日课沿用现有五段课文精学交互，并在单词卡增加独立的“韩语发音”和“英语发音”按钮。音频缺失时按钮显示“音频准备中”并禁用。

- [ ] **Step 4: 接入页面与离线缓存并运行测试**

Run: `node --test tests/level1-*.test.mjs`
Expected: PASS。

手动检查：桌面、iPad 和 393×852 手机宽度均无横向滚动；底部导航不遮挡课程末尾按钮。

- [ ] **Step 5: 提交**

```bash
git add level1-course-v26.js level1-course-v26.css index.html sw.js tests/level1-render-model.test.mjs
git commit -m "Render complete level one course"
```

