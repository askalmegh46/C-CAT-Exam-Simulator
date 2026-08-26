'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Q = {
  id: string;
  section: string;
  topic: string;
  difficulty: string;
  question: string;
  options: string[];
  position: number;
  selected_answer: number | null;
  marked_for_review: boolean;
  time_spent_seconds: number;
  source_label?: string | null;
};

type Session = {
  id: string;
  mode: 'A' | 'B' | 'AB';
  status: string;
  current_section: 'A' | 'B';
  section_expires_at: string;
  expires_at: string;
};

function formatTime(total: number) {
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function ExamClient({ mode }: { mode: 'A' | 'B' | 'AB' }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [pool, setPool] = useState<Q[]>([]);
  const [idx, setIdx] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [hintOpen, setHintOpen] = useState(false);
  const [scratchpad, setScratchpad] = useState('');
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [calc, setCalc] = useState('');
  const [leftWidth, setLeftWidth] = useState(55);
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now());

  const q = pool[idx];
  const visiblePool = useMemo(
    () => (mode === 'AB' ? pool.filter((x) => x.section === session?.current_section) : pool),
    [pool, mode, session?.current_section]
  );
  const visibleIdx = Math.max(0, visiblePool.findIndex((x) => x.position === q?.position));

  async function api(path: string, options?: RequestInit) {
    const r = await fetch(path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  useEffect(() => {
    (async () => {
      try {
        const started = await api('/api/exams/start', {
          method: 'POST',
          body: JSON.stringify({ mode }),
        });
        const data = await api(`/api/exams/${started.sessionId}`);
        setSession(data.session);
        setPool(data.questions);
        const firstUnanswered = data.questions.findIndex((x: Q) => x.selected_answer === null);
        setIdx(firstUnanswered >= 0 ? firstUnanswered : 0);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setBusy(false);
      }
    })();
  }, [mode]);

  useEffect(() => {
    if (q) setQuestionStartedAt(Date.now());
  }, [q?.position]);

  useEffect(() => {
    if (!session) return;
    const tick = () => {
      const end = new Date(session.section_expires_at).getTime();
      setSeconds(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [session?.section_expires_at]);

  useEffect(() => {
    if (!session || seconds !== 0) return;
    (async () => {
      try {
        if (mode === 'AB' && session.current_section === 'A') {
          const d = await api('/api/exams/advance', {
            method: 'POST',
            body: JSON.stringify({ sessionId: session.id }),
          });
          if (d.advanced) {
            const fresh = await api(`/api/exams/${session.id}`);
            setSession(fresh.session);
            setPool(fresh.questions);
            setIdx(fresh.questions.findIndex((x: Q) => x.section === 'B'));
          }
        } else {
          await submit();
        }
      } catch (e: any) {
        setError(e.message);
      }
    })();
    // Timer expiry is intentionally a one-shot server-backed action.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  async function persistTime(position:number){
    if(!session) return;
    const current=pool.find(x=>x.position===position);
    if(!current)return;
    const cumulative=Math.max(current.time_spent_seconds||0, (current.time_spent_seconds||0)+Math.floor((Date.now()-questionStartedAt)/1000));
    setPool(p=>p.map(x=>x.position===position?{...x,time_spent_seconds:cumulative}:x));
    try{await api(`/api/exams/${session.id}/answer`,{method:'POST',body:JSON.stringify({position,selectedAnswer:current.selected_answer,timeSpentSeconds:cumulative})});}catch(e:any){setError(e.message)}
  }

  async function saveAnswer(position: number, value: number | null) {
    if (!session) return;
    setPool((p) => p.map((x) => (x.position === position ? { ...x, selected_answer: value } : x)));
    try {
      await api(`/api/exams/${session.id}/answer`, {
        method: 'POST',
        body: JSON.stringify({ position, selectedAnswer: value, timeSpentSeconds: Math.max(q?.time_spent_seconds||0, (q?.time_spent_seconds||0)+Math.floor((Date.now()-questionStartedAt)/1000)) }),
      });
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function toggleReview() {
    if (!q || !session) return;
    const marked = !q.marked_for_review;
    setPool((p) => p.map((x) => (x.position === q.position ? { ...x, marked_for_review: marked } : x)));
    try {
      await api(`/api/exams/${session.id}/review`, {
        method: 'POST',
        body: JSON.stringify({ position: q.position, marked }),
      });
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function advanceSection() {
    if (!session) return;
    if(q) await persistTime(q.position);
    setBusy(true);
    try {
      const d = await api('/api/exams/advance', {
        method: 'POST',
        body: JSON.stringify({ sessionId: session.id }),
      });
      if (d.advanced) {
        const fresh = await api(`/api/exams/${session.id}`);
        setSession(fresh.session);
        setPool(fresh.questions);
        setIdx(fresh.questions.findIndex((x: Q) => x.section === 'B'));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!session) return;
    if(q) await persistTime(q.position);
    setBusy(true);
    try {
      const d = await api(`/api/exams/${session.id}/submit`, { method: 'POST' });
      router.push(`/results?id=${d.attemptId}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function navigateTo(position: number) {
    if(q) await persistTime(q.position);
    const next = pool.findIndex((x) => x.position === position);
    if (next >= 0) { setIdx(next); setQuestionStartedAt(Date.now()); }
  }

  function calculate() {
    try {
      if (!/^[0-9+\-*/().%\s]+$/.test(calc)) return;
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${calc})`)();
      setCalc(String(result));
    } catch {
      setCalc('Error');
    }
  }

  if (busy && !session) return <div className="card">Preparing your secure exam workspace…</div>;
  if (error && !session) return <div className="card"><div className="notice error">{error}</div></div>;
  if (!q || !session) return <div className="card">No questions available. Seed the Supabase database first.</div>;

  const answered = visiblePool.filter((x) => x.selected_answer !== null).length;
  const marked = visiblePool.filter((x) => x.marked_for_review).length;
  const sectionName = session.current_section === 'A' ? 'Section A' : 'Section B';
  const timerWarning = seconds <= 300;

  return (
    <div className="exam-shell">
      <header className="exam-topbar">
        <div className="exam-brand"><span>CCAT</span> / {mode === 'AB' ? 'FULL MOCK' : sectionName}</div>
        <div className="exam-progress">Q {visibleIdx + 1} / {visiblePool.length} · {answered} answered</div>
        <div className={timerWarning ? 'timer timer-danger' : 'timer'}>{formatTime(seconds)}</div>
      </header>

      {error && <div className="notice error exam-notice">{error}</div>}

      <div className="exam-toolbar">
        <div className="exam-meta">
          <span className="pill">{mode === 'AB' ? `Section ${session.current_section}` : sectionName}</span>
          <span className="pill">+3 / −1 / 0</span>
          <span className="pill">{marked} marked</span>
        </div>
        <div className="toolbar">
          <button className="btn ghost" onClick={() => setCalculatorOpen((v) => !v)}>⌗ Calculator</button>
          <button className="btn ghost" onClick={() => setHintOpen((v) => !v)}>?</button>
        </div>
      </div>

      <main className="exam-workspace" style={{ gridTemplateColumns: `${leftWidth}% ${100 - leftWidth}%` }}>
        <section className="exam-pane question-pane">
          <div className="pane-label">QUESTION <span style={{float:'right'}}>TIME {Math.floor((q.time_spent_seconds||0)+((Date.now()-questionStartedAt)/1000))}s</span></div>
          <div className="question-meta">
            <span className="pill">{q.topic}</span>
            <span className={`difficulty ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
          </div>
          <h1>{q.question}</h1>
          {q.source_label && <div className="source-line">Source: {q.source_label}</div>}

          {hintOpen && (
            <div className="hint-box">
              <b>Hint</b>
              <p>Use the core concept tested by this question. In the real mock, hints and explanations remain unavailable until submission.</p>
            </div>
          )}

          <div className="question-attachments">
            <div className="attachment-placeholder">Question media / table area</div>
          </div>

          <div className="pane-footer-note">Secure exam mode · Answers are saved to the server.</div>
        </section>

        <section className="exam-pane workspace-pane">
          <div className="pane-label">WORKSPACE</div>
          <div className="options">
            {q.options.map((o, n) => (
              <button key={o} className={`option ${q.selected_answer === n ? 'selected' : ''}`} onClick={() => saveAnswer(q.position, n)}>
                <span className="option-letter">{String.fromCharCode(65 + n)}</span>
                <span>{o}</span>
              </button>
            ))}
          </div>

          <div className="workspace-tools">
            <div className="tool-card">
              <div className="tool-card-head"><b>Scratchpad</b><span className="mono">private</span></div>
              <textarea className="scratchpad" value={scratchpad} onChange={(e) => setScratchpad(e.target.value)} placeholder="Work through calculations here…" />
            </div>

            {calculatorOpen && (
              <div className="tool-card calculator">
                <div className="tool-card-head"><b>Calculator</b><span className="mono">safe arithmetic</span></div>
                <div className="calc-row"><input className="input mono" value={calc} onChange={(e) => setCalc(e.target.value)} placeholder="e.g. 25*4+10" /><button className="btn primary" onClick={calculate}>=</button></div>
              </div>
            )}
          </div>
        </section>
      </main>

      <section className="exam-palette-bar">
        <div className="palette-label">QUESTION PALETTE</div>
        <div className="palette">
          {visiblePool.map((x, i) => (
            <button key={x.id} title={`Question ${i + 1}`} className={`${x.selected_answer !== null ? 'answered ' : ''}${x.marked_for_review ? 'review ' : ''}${x.position === q.position ? 'active' : ''}`} onClick={() => navigateTo(x.position)}>{i + 1}</button>
          ))}
        </div>
      </section>

      <footer className="exam-actions">
        <div className="toolbar">
          <button className="btn ghost" onClick={toggleReview}>{q.marked_for_review ? '★ Marked' : '☆ Mark for review'}</button>
          <button className="btn ghost" disabled={visibleIdx === 0} onClick={() => navigateTo(visiblePool[Math.max(0, visibleIdx - 1)].position)}>← Previous</button>
        </div>
        <div className="toolbar">
          <button className="btn ghost" onClick={() => navigateTo(visiblePool[Math.min(visiblePool.length - 1, visibleIdx + 1)].position)}>Next →</button>
          {visibleIdx === visiblePool.length - 1 && (
            <button className="btn primary" onClick={mode === 'AB' && session.current_section === 'A' ? advanceSection : submit}>{busy ? 'Saving…' : mode === 'AB' && session.current_section === 'A' ? 'Continue to Section B' : 'Submit Exam'}</button>
          )}
        </div>
      </footer>

      <div className="split-handle" role="separator" aria-label="Resize exam panes" onMouseDown={(e) => {
        const startX = e.clientX;
        const startWidth = leftWidth;
        const onMove = (move: MouseEvent) => {
          const delta = ((move.clientX - startX) / window.innerWidth) * 100;
          setLeftWidth(Math.min(70, Math.max(35, startWidth + delta)));
        };
        const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
      }} />
    </div>
  );
}
