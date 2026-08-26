import Link from 'next/link'
import Nav from '@/components/Nav'

const modes = [
  { mode: 'A', label: 'Section A', kicker: 'Foundation', questions: '50 questions', time: '60 minutes', marks: '150 marks', topics: 'English • Quantitative Aptitude • Reasoning • Computer Fundamentals', accent: 'mint', action: 'Start Section A' },
  { mode: 'B', label: 'Section B', kicker: 'Technical', questions: '50 questions', time: '60 minutes', marks: '150 marks', topics: 'C • Data Structures • C++ OOP • OS & Networking • Big Data & AI', accent: 'blue', action: 'Start Section B' },
  { mode: 'AB', label: 'Full C-CAT Mock', kicker: 'Complete simulation', questions: '100 questions', time: '120 minutes', marks: '300 marks', topics: '50 questions from Section A + 50 questions from Section B', accent: 'gold', action: 'Start Full Mock' },
]

export default function Mock() {
  return (
    <div className="shell mock-center">
      <Nav />
      <main className="container">
        <section className="mock-hero">
          <div>
            <div className="eyebrow">C-CAT • MOCK TEST CENTER</div>
            <h1>Train like exam day.</h1>
            <p className="mock-lead">Choose a timed simulation, answer with the same +3 / −1 / 0 scoring model, and review your performance after submission.</p>
            <div className="mock-hero-actions">
              <a className="btn primary" href="#mock-modes">Choose a mock</a>
              <Link className="btn ghost" href="/practice">Practice by topic</Link>
            </div>
          </div>
          <div className="mock-hero-panel">
            <span className="live-dot" />
            <span>1,000-question bank</span>
            <strong>Randomized attempts</strong>
            <small>Fresh questions are selected for every new mock.</small>
          </div>
        </section>

        <section className="mock-stats" aria-label="Mock test features">
          <div><span>Question bank</span><b>1,000</b><small>Curated practice questions</small></div>
          <div><span>Scoring</span><b>+3 / −1</b><small>Correct / incorrect</small></div>
          <div><span>Exam modes</span><b>3</b><small>A, B and Full Mock</small></div>
          <div><span>Review</span><b>Live</b><small>Palette + marked questions</small></div>
        </section>

        <div className="mock-section-heading" id="mock-modes">
          <div><div className="eyebrow">SELECT SIMULATION</div><h2>Pick your test</h2></div>
          <span className="pill">Timed • randomized • autosaved</span>
        </div>

        <section className="mock-mode-grid">
          {modes.map((item, index) => (
            <Link key={item.mode} href={`/exam?mode=${item.mode}`} className={`mock-mode-card ${item.accent}`}>
              <div className="mock-card-top"><span className="mock-number">0{index + 1}</span><span className="mock-kicker">{item.kicker}</span></div>
              <h3>{item.label}</h3>
              <p className="muted">{item.topics}</p>
              <div className="mock-metrics">
                <span><b>{item.questions.split(' ')[0]}</b><small>questions</small></span>
                <span><b>{item.time.split(' ')[0]}</b><small>{item.time.split(' ')[1]}</small></span>
                <span><b>{item.marks.split(' ')[0]}</b><small>marks</small></span>
              </div>
              <div className="mock-card-footer"><span>{item.action}</span><span aria-hidden="true">→</span></div>
            </Link>
          ))}
        </section>

        <section className="mock-rules card">
          <div><div className="eyebrow">BEFORE YOU START</div><h2>Mock test rules</h2></div>
          <div className="rules-grid">
            <div><span>01</span><p><b>Timer is strict.</b><br />Section A and Section B each use a 60-minute timer.</p></div>
            <div><span>02</span><p><b>Answers are saved.</b><br />Selections and review flags are persisted during the session.</p></div>
            <div><span>03</span><p><b>Review freely.</b><br />Use the question palette to jump between answered, unanswered and marked questions.</p></div>
            <div><span>04</span><p><b>Score after submit.</b><br />Your results page shows marks, accuracy and section performance.</p></div>
          </div>
        </section>

        <div className="notice mock-notice"><b>Full mock:</b> the combined simulation runs Section A first and then Section B continuously. This is a preparation simulation; follow your official C-DAC instructions on exam day.</div>
      </main>
    </div>
  )
}
