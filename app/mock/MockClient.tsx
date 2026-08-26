'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const TOPICS = ['All topics','Quantitative Aptitude','Reasoning','English','C Programming','Data Structures','Operating Systems','Networking','OOP','Big Data & AI','Computer Architecture'];

export default function MockClient(){
  const router=useRouter();
  const [mode,setMode]=useState<'A'|'B'|'AB'>('AB');
  const [count,setCount]=useState(50);
  const [topic,setTopic]=useState('All topics');
  const [difficulty,setDifficulty]=useState('All difficulties');
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const total=mode==='AB'?count*2:count;
  const minutes=mode==='AB'?120:60;
  const start=async()=>{
    setLoading(true);setError('');
    try{
      const r=await fetch('/api/exams/start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,config:{count,topic:topic==='All topics'?null:topic,difficulty:difficulty==='All difficulties'?null:difficulty}})});
      const d=await r.json(); if(!r.ok) throw new Error(d.error||'Unable to start mock');
      router.push(`/exam?mode=${mode}&session=${d.sessionId}`);
    }catch(e:any){setError(e.message)}finally{setLoading(false)}
  };
  const description=useMemo(()=>mode==='AB'?'Section A → 60 minutes → Section B → 60 minutes':'One section with a fixed 60-minute timer',[mode]);
  return <div className="mock-builder">
    <div className="section-title"><div><div className="eyebrow">V5.8 ADVANCED MOCK ENGINE</div><h1>Build your simulation</h1><p className="muted">Create a timed C-CAT mock with server-backed questions, autosave and secure scoring.</p></div></div>
    <div className="grid2 mock-config-grid">
      <div className="card">
        <h2>1. Choose exam</h2>
        <div className="mode-cards">
          {([['A','Section A','Aptitude + core fundamentals'],['B','Section B','Technical subjects'],['AB','Full C-CAT Simulation','60 + 60 minute sections']] as const).map(([v,t,d])=><button key={v} className={`mode-card ${mode===v?'selected':''}`} onClick={()=>setMode(v)}><span className="pill">{v}</span><b>{t}</b><small>{d}</small></button>)}
        </div>
        <div className="mock-summary"><span>{total} questions</span><span>{minutes} minutes</span><span>{total*3} max marks</span><span>+3 / −1 / 0</span></div>
      </div>
      <div className="card">
        <h2>2. Customize</h2>
        <label>Questions per section<select className="input" value={count} onChange={e=>setCount(Number(e.target.value))}><option value={50}>50 — full section</option><option value={40}>40</option><option value={30}>30</option><option value={20}>20</option><option value={10}>10</option></select></label>
        <label>Topic<select className="input" value={topic} onChange={e=>setTopic(e.target.value)}>{TOPICS.map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Difficulty<select className="input" value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option>All difficulties</option><option>Easy</option><option>Medium</option><option>Hard</option></select></label>
        <p className="notice">{description}. Custom filters are applied server-side before the question set is created.</p>
      </div>
    </div>
    {error&&<div className="notice error" style={{marginTop:14}}>{error}</div>}
    <div className="card mock-launch" style={{marginTop:16}}><div><div className="eyebrow">READY CHECK</div><h2>Exam integrity mode</h2><p className="muted">Hints, explanations and correct answers stay hidden during the mock. Answers are autosaved and final scoring happens on the server.</p></div><button className="btn primary" disabled={loading} onClick={start}>{loading?'Creating session…':`Start ${mode==='AB'?'full mock':`Section ${mode}`} →`}</button></div>
  </div>
}
