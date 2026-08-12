"use client";

import { useEffect, useMemo, useState } from "react";

type Card = { ko: string; zh: string; note: string; example: string; tag: string };

const cards: Card[] = [
  { ko: "안녕하세요", zh: "您好 / 你好", note: "안녕（安宁）+ 하세요（请这样做）→ 祝你安宁", example: "선생님, 안녕하세요?", tag: "问候" },
  { ko: "감사합니다", zh: "谢谢", note: "감사（感谢）+ 합니다（正式陈述）", example: "도와주셔서 감사합니다.", tag: "问候" },
  { ko: "학생", zh: "学生", note: "汉字词：学生，发音和中文含义可成组记", example: "저는 학생이에요.", tag: "身份" },
  { ko: "선생님", zh: "老师", note: "선생（先生）+ 님（尊称）", example: "선생님은 한국 사람이에요.", tag: "身份" },
  { ko: "친구", zh: "朋友", note: "汉字词：亲旧，指亲近的老相识", example: "이 사람은 제 친구예요.", tag: "人物" },
  { ko: "학교", zh: "学校", note: "汉字词：学校；학 常和学习相关", example: "학교에 갑니다.", tag: "地点" },
  { ko: "책", zh: "书", note: "单音节固有词，和 책상（书桌）结对记", example: "이것은 한국어 책이에요.", tag: "物品" },
  { ko: "한국어", zh: "韩语", note: "한국（韩国）+ 어（语言）", example: "한국어를 공부합니다.", tag: "学习" },
  { ko: "이름", zh: "名字", note: "和 이름이 뭐예요? 整句一起记，比孤立记词更牢", example: "이름이 뭐예요?", tag: "介绍" },
  { ko: "나라", zh: "国家", note: "固有词；和 어느 나라（哪个国家）成组记", example: "어느 나라 사람이에요?", tag: "介绍" },
  { ko: "사람", zh: "人", note: "中国人 = 중국 사람；韩国人 = 한국 사람", example: "저는 중국 사람이에요.", tag: "身份" },
  { ko: "회사원", zh: "公司职员", note: "회사（公司）+ 원（人员）", example: "제 친구는 회사원이에요.", tag: "职业" },
  { ko: "의사", zh: "医生", note: "汉字词：医师；无收音，后接 예요", example: "민수 씨는 의사예요.", tag: "职业" },
  { ko: "네", zh: "是 / 好的", note: "应答词；注意口语中常听起来接近 데", example: "네, 맞아요.", tag: "应答" },
  { ko: "아니요", zh: "不 / 不是", note: "与 네 成对记；回答否定问题时注意中文习惯差异", example: "아니요, 학생이 아니에요.", tag: "应答" },
  { ko: "어느", zh: "哪个 / 哪一种", note: "必须放在名词前：어느 나라、어느 학교", example: "어느 학교에 다녀요?", tag: "疑问" },
  { ko: "뭐", zh: "什么", note: "무엇 的口语缩略；뭐예요? 是什么？", example: "이것은 뭐예요?", tag: "疑问" },
  { ko: "저", zh: "我（谦称）", note: "正式场合用 저；熟人之间用 나", example: "저는 고채미예요.", tag: "人物" },
  { ko: "제", zh: "我的（谦称）", note: "저의 的缩略；제 이름、제 친구", example: "제 이름은 코코예요.", tag: "人物" },
  { ko: "맞아요", zh: "对 / 没错", note: "맞다（正确）+ 아요；与 아니에요 对比", example: "네, 맞아요.", tag: "应答" },
  { ko: "공부하다", zh: "学习", note: "공부（学习）+ 하다（做）；大量名词可接 하다 变动词", example: "매일 한국어를 공부해요.", tag: "动作" },
  { ko: "읽다", zh: "读", note: "收音 ㄺ 在此常读作 [익따]，先记声音再记拼写", example: "책을 읽어요.", tag: "动作" },
  { ko: "듣다", zh: "听", note: "和 읽다 成对：듣고 읽기（听和读）", example: "한국 노래를 들어요.", tag: "动作" },
  { ko: "말하다", zh: "说", note: "말（话）+ 하다（做）→ 说话", example: "한국어로 말해요.", tag: "动作" },
];

const patterns = [
  { title: "N은/는 N이에요/예요", meaning: "N 是 N", rule: "有收音用 이에요；无收音用 예요。은/는 标记当前话题。", example: "저는 중국 사람이에요.（我是中国人。）", contrast: "학생 + 이에요 → 학생이에요 / 의사 + 예요 → 의사예요" },
  { title: "N이/가 있어요", meaning: "有 N / N 在", rule: "有收音用 이；无收音用 가。있어요 表示存在。", example: "책이 있어요.（有书。）", contrast: "없어요 是反义：책이 없어요（没有书）" },
  { title: "N을/를 V", meaning: "做某事的对象是 N", rule: "有收音用 을；无收音用 를。把它想成动作箭头指向谁。", example: "한국어를 공부해요.（学习韩语。）", contrast: "책을 읽어요 / 커피를 마셔요" },
  { title: "N이/가 아니에요", meaning: "不是 N", rule: "把 아니에요 作为一个整体记；前面的名词仍按收音选择 이/가。", example: "저는 의사가 아니에요.（我不是医生。）", contrast: "학생이에요 ↔ 학생이 아니에요" },
  { title: "N도", meaning: "N 也……", rule: "도 直接替换 은/는、이/가、을/를，表达相同情况追加。", example: "저도 학생이에요.（我也是学生。）", contrast: "저는 학생이에요 → 민수 씨도 학생이에요" },
  { title: "N의 N", meaning: "N 的 N", rule: "의 表示所属，口语里经常弱读；저의 常缩成 제。", example: "이것은 제 책이에요.（这是我的书。）", contrast: "저의 → 제 / 나의 → 내 / 너의 → 네" },
];

const plans = [
  ["第1课 · 问候与介绍", "身份词、이에요/예요", "12 分钟"],
  ["第2课 · 学校生活", "地点词、이/가 있어요", "15 分钟"],
  ["第3课 · 日常动作", "动词、을/를", "15 分钟"],
];

export default function Home() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<"words" | "patterns">("words");
  const [streak, setStreak] = useState(1);
  const [xp, setXp] = useState(0);
  const [quests, setQuests] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem("hanstep-progress");
    if (saved) setScores(JSON.parse(saved));
    const last = localStorage.getItem("hanstep-last-day");
    const today = new Date().toDateString();
    if (last !== today) localStorage.setItem("hanstep-last-day", today);
    setStreak(Number(localStorage.getItem("hanstep-streak") || 1));
    setXp(Number(localStorage.getItem("hanstep-xp") || 0));
    setQuests(JSON.parse(localStorage.getItem("hanstep-quests") || "{}"));
  }, []);

  const mastered = Object.values(scores).filter((v) => v >= 3).length;
  const progress = Math.round((mastered / cards.length) * 100);
  const card = cards[index];

  const dueText = useMemo(() => {
    const weak = cards.filter((c) => (scores[c.ko] || 0) < 2).length;
    return weak ? `今天优先巩固 ${weak} 个薄弱词` : "今天的基础词已经很稳了";
  }, [scores]);

  function rate(value: number) {
    const next = { ...scores, [card.ko]: value };
    setScores(next);
    localStorage.setItem("hanstep-progress", JSON.stringify(next));
    const nextXp = xp + (value + 1) * 3;
    setXp(nextXp);
    localStorage.setItem("hanstep-xp", String(nextXp));
    setFlipped(false);
    setIndex((index + 1) % cards.length);
  }

  function toggleQuest(id: string) {
    const next = { ...quests, [id]: !quests[id] };
    setQuests(next);
    localStorage.setItem("hanstep-quests", JSON.stringify(next));
    if (!quests[id]) {
      const nextXp = xp + 20;
      setXp(nextXp);
      localStorage.setItem("hanstep-xp", String(nextXp));
    }
  }

  function reset() {
    setScores({});
    localStorage.removeItem("hanstep-progress");
    setIndex(0);
    setFlipped(false);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="韩步首页"><span>한</span> 韩步</a>
        <nav><a href="#learn">今日学习</a><a href="#patterns">句型规律</a><a href="#plan">课程地图</a></nav>
        <div className="streak">Lv.{Math.floor(xp / 200) + 1} · {xp} XP　🔥 {streak} 天</div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">延世韩国语 1 · 陪练版</p>
          <h1>不是死记，<br/><em>找到韩语的规律。</em></h1>
          <p className="lead">从《延世韩国语 1》第一单元起步，用 8 个月冲刺 TOPIK 4。每天 45–70 分钟，把单词、句型、听读和输出练成一条完整链路。</p>
          <a className="primary" href="#learn">开始今天的学习 <span>→</span></a>
          <p className="micro">无需登录 · 进度保存在这台设备</p>
        </div>
        <div className="hero-board" aria-label="学习概览">
          <div className="board-head"><span>오늘의 학습</span><b>{progress}%</b></div>
          <div className="ring" style={{"--progress": `${progress * 3.6}deg`} as React.CSSProperties}><div><strong>{mastered}</strong><small>已掌握</small></div></div>
          <div className="today-note"><span>오늘</span><div><b>{dueText}</b><small>记不住不是失败，是复习时间到了</small></div></div>
          <div className="mini-stats"><div><b>{cards.length}</b><span>起步词卡</span></div><div><b>{patterns.length}</b><span>核心句型</span></div><div><b>60</b><span>分钟/天</span></div></div>
        </div>
      </section>

      <section className="learn-section" id="learn">
        <div className="section-title"><div><p className="eyebrow">MEMORY LAB · 记忆实验室</p><h2>今天先学一点，记得更久。</h2></div><button className="text-button" onClick={reset}>重置进度</button></div>
        <div className="tabs"><button className={tab === "words" ? "active" : ""} onClick={() => setTab("words")}>单词卡</button><button className={tab === "patterns" ? "active" : ""} onClick={() => setTab("patterns")}>句型卡</button></div>

        {tab === "words" ? (
          <div className="study-grid">
            <button className={`flashcard ${flipped ? "flipped" : ""}`} onClick={() => setFlipped(!flipped)} aria-label="翻转单词卡">
              {!flipped ? <><span className="tag">{card.tag}</span><strong lang="ko">{card.ko}</strong><span className="sound">◖ 点击查看记忆线索</span><small>{index + 1} / {cards.length}</small></> : <><span className="tag">拆开记</span><strong>{card.zh}</strong><p>{card.note}</p><blockquote>{card.example}</blockquote><small>再次点击返回韩文</small></>}
            </button>
            <div className="rating-panel">
              <p>看完答案后，你记得怎么样？</p>
              <div className="ratings"><button onClick={() => rate(0)}><i>×</i><span>忘记了</span><small>马上再来</small></button><button onClick={() => rate(1)}><i>~</i><span>有点模糊</span><small>今天再见</small></button><button onClick={() => rate(2)}><i>✓</i><span>想起来了</span><small>明天复习</small></button><button onClick={() => rate(3)}><i>★</i><span>很熟练</span><small>过几天见</small></button></div>
              <div className="memory-tip"><b>记忆规律 01</b><p>先猜，再翻面。努力回忆一次，比重复看五遍更容易留下痕迹。</p></div>
            </div>
          </div>
        ) : (
          <div className="pattern-focus"><span className="pattern-index">01</span><div><h3>{patterns[0].title}</h3><p className="meaning">{patterns[0].meaning}</p><p>{patterns[0].rule}</p><blockquote>{patterns[0].example}</blockquote><p className="contrast">规律对比：{patterns[0].contrast}</p></div></div>
        )}
      </section>

      <section className="mission-section" id="mission">
        <div className="mission-top">
          <div><p className="eyebrow">TODAY'S QUEST · 今日沉浸任务</p><h2>今天不是“学过”，<br/>而是完成一次韩语闭环。</h2></div>
          <div className="level-card"><span>TOPIK 4 远征</span><strong>Lv.{Math.floor(xp / 200) + 1}</strong><div><i style={{width:`${xp % 200 / 2}%`}} /></div><small>{xp % 200} / 200 XP 距离下一级</small></div>
        </div>
        <div className="quest-grid">
          {[
            ["review", "① 唤醒记忆", "复习 20 个到期词，先回忆再翻面", "15 分钟", "+20 XP"],
            ["input", "② 可理解输入", "听一段初级对话 3 遍：盲听、看稿、跟读", "15 分钟", "+20 XP"],
            ["pattern", "③ 句型替换", "用今天的句型替换 5 组人物、地点和动作", "12 分钟", "+20 XP"],
            ["output", "④ 主动输出", "不看答案，说或写 5 句自我介绍", "10 分钟", "+20 XP"],
            ["mistake", "⑤ 错误归档", "记录 3 个错因：没记住、混淆、不会用", "8 分钟", "+20 XP"],
          ].map(q => <button key={q[0]} className={quests[q[0]] ? "done" : ""} onClick={() => toggleQuest(q[0])}><span className="check">{quests[q[0]] ? "✓" : ""}</span><div><h3>{q[1]}</h3><p>{q[2]}</p><small>{q[3]} · {q[4]}</small></div></button>)}
        </div>
        <div className="immersion-rule"><b>沉浸规则</b><p>开始任务后，把手机切到勿扰。每完成一项就打勾；不要追求“看懂”，要追求“不看也能说出来”。完成全部任务获得今日满星。</p><span>{Object.values(quests).filter(Boolean).length} / 5 ★</span></div>
      </section>

      <section className="patterns-section" id="patterns">
        <div className="section-title light"><div><p className="eyebrow">PATTERN MAP · 句型地图</p><h2>把语法变成可复用的积木。</h2></div></div>
        <div className="pattern-grid">{patterns.map((p, i) => <article key={p.title}><span>0{i + 1}</span><h3>{p.title}</h3><b>{p.meaning}</b><p>{p.rule}</p><blockquote>{p.example}</blockquote><small>{p.contrast}</small></article>)}</div>
      </section>

      <section className="plan-section" id="plan">
        <div className="section-title"><div><p className="eyebrow">YONSEI 1 ROADMAP</p><h2>按课走，不再东学一点西学一点。</h2></div></div>
        <div className="exam-banner"><div><p>目标考试</p><strong>2027.04</strong></div><div><p>当前起点</p><strong>延世 1 · 第一单元后</strong></div><div><p>目标等级</p><strong>TOPIK 4</strong></div><div><p>建议投入</p><strong>每周 7–9 小时</strong></div></div>
        <div className="roadmap">
          <article className="now"><span>08–09月</span><h3>地基期</h3><p>完成延世 1；掌握基础助词、敬语体和 800–1,000 词。</p><b>你在这里</b></article>
          <article><span>10–12月</span><h3>扩张期</h3><p>推进延世 2–3；词汇到 2,500，开始短文听读和日记。</p><b>阶段测验</b></article>
          <article><span>01–02月</span><h3>TOPIK 转型期</h3><p>系统训练阅读、听力题型；词汇到 3,500+，每周一套分项。</p><b>题型训练</b></article>
          <article><span>03–04月</span><h3>冲刺期</h3><p>完整模考、错题循环和时间分配，稳定达到 4 级分数线以上。</p><b>每周模考</b></article>
        </div>
        <h3 className="week-title">本周起步计划</h3>
        <div className="plan-list">{plans.map((p, i) => <div className={i === 0 ? "current" : ""} key={p[0]}><span>{String(i + 1).padStart(2, "0")}</span><div><h3>{p[0]}</h3><p>{p[1]}</p></div><small>{p[2]}</small><b>{i === 0 ? "正在学习" : "待解锁"}</b></div>)}</div>
        <div className="copyright-note"><b>关于教材内容</b><p>本站是个人学习辅助工具，不复制教材全文。你可以把自己的课堂笔记、不会的单词和句型交给我，我会整理成更适合你记忆的卡片。</p></div>
      </section>

      <footer><a className="brand" href="#top"><span>한</span> 韩步</a><p>천천히, 하지만 꾸준히 · 慢一点，但别停下。</p></footer>
    </main>
  );
}
