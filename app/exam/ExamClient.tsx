'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Q={id:string;section:string;topic:string;difficulty:string;question:string;options:string[];position:number;selected_answer:number|null;marked_for_review:boolean}
type Session={id:string;mode:'A'|'B'|'AB';status:string;current_section:'A'|'B';section_expires_at:string;expires_at:string}

export default function ExamClient({mode}:{mode:'A'|'B'|'AB'}){
  const router=useRouter()
  const [session,setSession]=useState<Session|null>(null)
  const [pool,setPool]=useState<Q[]>([])
  const [idx,setIdx]=useState(0)
  const [seconds,setSeconds]=useState(0)
  const [busy,setBusy]=useState(true)
  const [error,setError]=useState('')
  const q=pool[idx]
  const visiblePool=useMemo(()=>mode==='AB'?pool.filter(x=>x.section===session?.current_section):pool,[pool,mode,session?.current_section])
  const visibleIdx=Math.max(0,visiblePool.findIndex(x=>x.position===q?.position))

  async function api(path:string, options?:RequestInit){
    const r=await fetch(path,{...options,headers:{'Content-Type':'application/json',...(options?.headers||{})}})
    const data=await r.json().catch(()=>({}))
    if(!r.ok) throw new Error(data.error||'Request failed')
    return data
  }

  useEffect(()=>{
    ;(async()=>{
      try{
        const started=await api('/api/exams/start',{method:'POST',body:JSON.stringify({mode})})
        const data=await api(`/api/exams/${started.sessionId}`)
        setSession(data.session);setPool(data.questions)
        const first=data.questions.findIndex((x:Q)=>x.selected_answer===null)
        setIdx(first>=0?first:0)
      }catch(e:any){setError(e.message)}finally{setBusy(false)}
    })()
  },[mode])

  useEffect(()=>{
    if(!session)return
    const tick=()=>{const end=new Date(session.section_expires_at).getTime();setSeconds(Math.max(0,Math.floor((end-Date.now())/1000)))}
    tick();const t=setInterval(tick,1000);return()=>clearInterval(t)
  },[session?.section_expires_at])

  useEffect(()=>{
    if(!session||seconds!==0)return
    ;(async()=>{
      try{
        if(mode==='AB'&&session.current_section==='A'){
          const d=await api('/api/exams/advance',{method:'POST',body:JSON.stringify({sessionId:session.id})})
          if(d.advanced){const fresh=await api(`/api/exams/${session.id}`);setSession(fresh.session);setPool(fresh.questions);setIdx(fresh.questions.findIndex((x:Q)=>x.section==='B'))}
        }else await submit()
      }catch(e:any){setError(e.message)}
    })()
  },[seconds])

  async function saveAnswer(position:number,value:number|null){
    setPool(p=>p.map(x=>x.position===position?{...x,selected_answer:value}:x))
    try{await api(`/api/exams/${session?.id}/answer`,{method:'POST',body:JSON.stringify({position,selectedAnswer:value})})}
    catch(e:any){setError(e.message)}
  }

  async function toggleReview(){
    if(!q||!session)return
    const marked=!q.marked_for_review
    setPool(p=>p.map(x=>x.position===q.position?{...x,marked_for_review:marked}:x))
    try{await api(`/api/exams/${session.id}/review`,{method:'POST',body:JSON.stringify({position:q.position,marked})})}
    catch(e:any){setError(e.message)}
  }

  async function advance(){
    if(!session)return
    setBusy(true)
    try{
      const d=await api('/api/exams/advance',{method:'POST',body:JSON.stringify({sessionId:session.id})})
      if(d.advanced){const fresh=await api(`/api/exams/${session.id}`);setSession(fresh.session);setPool(fresh.questions);setIdx(fresh.questions.findIndex((x:Q)=>x.section==='B'))}
    }catch(e:any){setError(e.message)}finally{setBusy(false)}
  }

  async function submit(){
    if(!session)return
    setBusy(true)
    try{const d=await api(`/api/exams/${session.id}/submit`,{method:'POST'});router.push(`/results?id=${d.attemptId}`)}
    catch(e:any){setError(e.message)}finally{setBusy(false)}
  }

  if(busy&&!session)return <main className="exam-page"><div className="card"><div className="eyebrow">SECURE EXAM SESSION</div><h2>Preparing your mock test…</h2><p className="muted">Creating your randomized question set and secure session.</p></div></main>
  if(error&&!session)return <main className="exam-page"><div className="card"><div className="notice error">{error}</div></div></main>
  if(!q||!session)return <main className="exam-page"><div className="card"><div className="notice">No questions available. Seed the Supabase database first.</div></div></main>

  const mins=Math.floor(seconds/60),secs=seconds%60
  const answered=visiblePool.filter(x=>x.selected_answer!==null).length
  const marked=visiblePool.filter(x=>x.marked_for_review).length
  const unanswered=visiblePool.length-answered
  const sectionName=session.current_section==='A'?'Section A':'Section B'
  const progress=visiblePool.length?((visibleIdx+1)/visiblePool.length)*100:0
  const timerUrgent=seconds<=300

  return <main className="exam-page">
    <div className="exam-topbar">
      <div className="exam-topbar-inner">
        <div className="exam-heading">
          <span className="pill">{mode==='AB'?'FULL MOCK':sectionName.toUpperCase()}</span>
          <div><h1>{mode==='AB'?'C-CAT Full Mock':`${sectionName} Mock Test`}</h1><div className="exam-meta">Question {visibleIdx+1} of {visiblePool.length} • +3 correct • −1 incorrect • 0 unattempted</div></div>
        </div>
        <div className="exam-timer" aria-live="polite" style={timerUrgent?{color:'var(--danger)',borderColor:'rgba(255,112,130,.35)',background:'rgba(255,112,130,.07)'}:undefined}>{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</div>
      </div>
      <div className="exam-progress" aria-label="Question progress"><span style={{width:`${progress}%`}} /></div>
    </div>

    {error&&<div className="notice error" style={{marginTop:14}}>{error}</div>}

    <div className="exam-layout">
      <section className="card exam-question-card" aria-label="Current question">
        <div className="exam-qhead">
          <span className="pill">Q{visibleIdx+1} • {q.topic}</span>
          <span className="pill">{q.difficulty}</span>
        </div>
        <h2 className="exam-question">{q.question}</h2>
        <div className="exam-options">
          {q.options.map((o,n)=><button key={`${q.id}-${n}`} className={`exam-option ${q.selected_answer===n?'selected':''}`} onClick={()=>saveAnswer(q.position,n)} aria-pressed={q.selected_answer===n}>
            <span className="exam-option-letter">{String.fromCharCode(65+n)}</span><span className="exam-option-text">{o}</span>
          </button>)}
        </div>
        <div className="exam-actions">
          <button className="btn ghost exam-review" onClick={toggleReview}>{q.marked_for_review?'★ Marked for review':'☆ Mark for review'}</button>
          <div className="exam-actions-right">
            <button className="btn ghost" disabled={visibleIdx===0} onClick={()=>setIdx(pool.findIndex(x=>x.position===visiblePool[Math.max(0,visibleIdx-1)].position))}>← Previous</button>
            {visibleIdx===visiblePool.length-1
              ?<button className="btn primary" onClick={mode==='AB'&&session.current_section==='A'?advance:submit}>{busy?'Saving…':(mode==='AB'&&session.current_section==='A'?'Continue to Section B':'Submit Exam')}</button>
              :<button className="btn primary" onClick={()=>setIdx(pool.findIndex(x=>x.position===visiblePool[visibleIdx+1].position))}>Next →</button>}
          </div>
        </div>
      </section>

      <aside className="exam-sidebar">
        <div className="card exam-side-card">
          <div className="exam-side-title"><h2>Question palette</h2><span className="pill">{answered}/{visiblePool.length}</span></div>
          <div className="exam-side-stats"><div><b>{answered}</b><small>Answered</small></div><div><b>{unanswered}</b><small>Open</small></div><div><b>{marked}</b><small>Review</small></div></div>
          <div className="exam-palette">
            {visiblePool.map((x,i)=><button key={x.id} className={`${x.selected_answer!==null?'answered ':''}${x.marked_for_review?'review ':''}${x.position===q.position?'active':''}`} onClick={()=>setIdx(pool.findIndex(y=>y.position===x.position))} aria-label={`Question ${i+1}${x.selected_answer!==null?' answered':''}${x.marked_for_review?' marked for review':''}`}>{i+1}</button>)}
          </div>
          <div className="exam-legend"><span><i className="a"/>Answered</span><span><i className="r"/>Review</span><span><i/>Unanswered</span><span><i style={{outline:'2px solid var(--accent)',outlineOffset:'1px'}}/>Current</span></div>
        </div>
      </aside>
    </div>
  </main>
}
