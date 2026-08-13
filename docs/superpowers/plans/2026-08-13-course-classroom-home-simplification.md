# 课程课堂化与首页精简实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除无法精确对应知识点的完整 B 站视频，把第一轮变成可实际学习 25 分钟的课堂，并将首页压缩为四个明确区域。

**Architecture:** 复用现有 7 天数据、SunHi 静态音频和页面路由；在独立课堂数据文件中补充目标、逐句拆解、对比与练习，不改现有单词卡结构。首页只通过一个末尾增强脚本整理现有卡片，不改计时、同步和报告数据。

**Tech Stack:** 原生 HTML/CSS/JavaScript、localStorage、Node.js 内置断言测试。

**Spec:** 用户于 2026-08-13 确认的四点调整。

## Global Constraints

- 删除课程中的完整 B 站播放器，不新增其他外部视频依赖。
- 保留现有单词卡内容与布局。
- 第一轮包含学习目标、连贯短文、逐句拆解、易混对比、替换练习和即时检查。
- 首页仅保留今日主任务、今日学习、总体进度、待复习四块。
- 保留既有学习数据、计时、同步、报告与五项导航。

### Task 1: 第一轮课堂化

**Files:**
- Create: `seven-day-classroom-data.js`
- Create: `tests/seven-day-classroom.test.mjs`
- Modify: `seven-day-course.js`
- Modify: `seven-day-course.css`
- Modify: `index.html`
- Modify: `sw.js`

**Interfaces:**
- Produces `globalThis.MalbitSevenDayClassroom.days[dayId]`。
- 每天包含 `goal`、`lineNotes`、`contrast`、`substitution`、`checks`。

- [ ] 写契约测试并确认因课堂数据不存在而失败。
- [ ] 补齐 7 天课堂数据并通过契约测试。
- [ ] 删除 iframe，渲染盲听、精读拆解、对比、替换与即时检查。
- [ ] 运行课堂数据测试、JavaScript 语法检查和旧测试。

### Task 2: 首页精简为四块

**Files:**
- Create: `home-focus-v24.js`
- Create: `tests/home-focus.test.mjs`
- Modify: `seven-day-course.css`
- Modify: `index.html`
- Modify: `sw.js`

**Interfaces:**
- `globalThis.MalbitHomeFocus.model(state)` 返回四块首页模型。
- `render()` 将首页重排为 `.focus-today`、`.focus-session`、`.focus-growth`、`.focus-review`。

- [ ] 写四块模型失败测试。
- [ ] 实现最小模型与渲染，隐藏旧的重复卡片。
- [ ] 验证桌面、iPad 和 393×852 手机布局无横向溢出。
- [ ] 运行全部测试、提交、合并并发布 GitHub Pages。
