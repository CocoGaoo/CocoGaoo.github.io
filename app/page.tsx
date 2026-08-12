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
];

const patterns = [
  { title: "N은/는 N이에요/예요", meaning: "N 是 N", rule: "有收音用 이에요；无收音用 예요。은/는 标记当前话题。", example: "저는 중국 사람이에요.（我是中国人。）", contrast: "학생 + 이에요 → 학생이에요 / 의사 + 예요 → 의사예요" },
  { title: "N이/가 있어요", meaning: "有 N / N 在", rule: "有收音用 이；无收音用 가。있어요 表示存在。", example: "책이 있어요.（有书。）", contrast: "없어요 是反义：책이 없어요（没有书）" },
  { title: "N을/를 V", meaning: "做某事的对象是 N", rule: "有收音用 을；无收音用 를。把它想成动作箭头指向谁。", example: "한국어를 공부해요.（学习韩语。）", contrast: "책을 읽어요 / 커피를 마셔요" },
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

  useEffect(() => {
    const saved = localStorage.getItem("hanstep-progress");
    if (saved) setScores(JSON.parse(saved));
    const last = localStorage.getItem("hanstep-last-day");
    const today = new Date().toDateString();
    if (last !== today) localStorage.setItem("hanstep-last-day", today);
    setStreak(Number(localStorage.getItem("hanstep-streak") || 1));
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
    setFlipped(false);
    setIndex((index + 1) % cards.length);
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
        <div className="streak">🔥 连续 {streak} 天</div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">延世韩国语 1 · 陪练版</p>
          <h1>不是死记，<br/><em>找到韩语的规律。</em></h1>
          <p className="lead">把单词拆开记，把句型放进场景里。每天 15 分钟，系统会把你容易忘的内容重新送回来。</p>
          <a className="primary" href="#learn">开始今天的学习 <span>→</span></a>
          <p className="micro">无需登录 · 进度保存在这台设备</p>
        </div>
        <div className="hero-board" aria-label="学习概览">
          <div className="board-head"><span>오늘의 학습</span><b>{progress}%</b></div>
          <div className="ring" style={{"--progress": `${progress * 3.6}deg`} as React.CSSProperties}><div><strong>{mastered}</strong><small>已掌握</small></div></div>
          <div className="today-note"><span>오늘</span><div><b>{dueText}</b><small>记不住不是失败，是复习时间到了</small></div></div>
          <div className="mini-stats"><div><b>{cards.length}</b><span>基础词</span></div><div><b>{patterns.length}</b><span>核心句型</span></div><div><b>15</b><span>分钟/天</span></div></div>
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

      <section className="patterns-section" id="patterns">
        <div className="section-title light"><div><p className="eyebrow">PATTERN MAP · 句型地图</p><h2>把语法变成可复用的积木。</h2></div></div>
        <div className="pattern-grid">{patterns.map((p, i) => <article key={p.title}><span>0{i + 1}</span><h3>{p.title}</h3><b>{p.meaning}</b><p>{p.rule}</p><blockquote>{p.example}</blockquote><small>{p.contrast}</small></article>)}</div>
      </section>

      <section className="plan-section" id="plan">
        <div className="section-title"><div><p className="eyebrow">YONSEI 1 ROADMAP</p><h2>按课走，不再东学一点西学一点。</h2></div></div>
        <div className="plan-list">{plans.map((p, i) => <div className={i === 0 ? "current" : ""} key={p[0]}><span>{String(i + 1).padStart(2, "0")}</span><div><h3>{p[0]}</h3><p>{p[1]}</p></div><small>{p[2]}</small><b>{i === 0 ? "正在学习" : "待解锁"}</b></div>)}</div>
        <div className="copyright-note"><b>关于教材内容</b><p>本站是个人学习辅助工具，不复制教材全文。你可以把自己的课堂笔记、不会的单词和句型交给我，我会整理成更适合你记忆的卡片。</p></div>
      </section>

      <footer><a className="brand" href="#top"><span>한</span> 韩步</a><p>천천히, 하지만 꾸준히 · 慢一点，但别停下。</p></footer>
    </main>
  );
}
