'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Q={id:string;section:string;topic:string;difficulty:string;question:string;options:string[];position:number;selected_answer:number|null;marked_for_review:boolean};
type Session={id:string;mode:'A'|'B'|'AB';status:string;current_section:'A'|'B';section_expires_at:string;expires_at:string};

export default function ExamClient({mode}:{mode:'A'|'B'|'AB'}){
 const router=useRouter();
 const [session,setSession]=useState<Session|null>(null),[pool,setPool]=useState<Q[]>([]),[idx,setIdx]=useState(0),[seconds,setSeconds]=useState(0),[busy,setBusy]=useState(true),[error,setError]=useState('');
 const q=pool[idx];
 const currentSectionStart=mode==='AB'?(session?.current_section==='B'?50:0):0;
 const visiblePool=useMemo(()=>mode==='AB'?pool.filter(x=>x.section===session?.current_section):pool,[pool,mode,session?.current_section]);
 const visibleIdx=Math.max(0, visiblePool.findIndex(x=>x.position===q?.position));
 async function api(path:string, options?:RequestInit){const r=await fetch(path,{...options,headers:{'Content-Type':'application/json',...(options?.headers||{})}});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Request failed');return data;}
 useEffect(()=>{(async()=>{try{const started=await api('/api/exams/start',{method:'POST',body:JSON.stringify({mode})});const data=await api(`/api/exams/${started.sessionId}`);setSession(data.session);setPool(data.questions);setIdx(data.questions.findIndex((x:Q)=>x.selected_answer===null) >=0 ? data.questions.findIndex((x:Q)=>x.selected_answer===null) : 0);}catch(e:any){setError(e.message)}finally{setBusy(false)}})()},[mode]);
 useEffect(()=>{if(!session)return;const tick=()=>{const end=new Date(session.section_expires_at).getTime();setSeconds(Math.max(0,Math.floor((end-Date.now())/1000)))};tick();const t=setInterval(tick,1000);return()=>clearInterval(t)},[session?.section_expires_at]);
 useEffect(()=>{if(!session||seconds!==0)return;(async()=>{try{if(mode==='AB'&&session.current_section==='A'){const d=await api('/api/exams/advance',{method:'POST',body:JSON.stringify({sessionId:session.id})});if(d.advanced){const fresh=await api(`/api/exams/${session.id}`);setSession(fresh.session);setPool(fresh.questions);setIdx(0);}}else{await submit()}}catch(e:any){setError(e.message)}})()},[seconds]);
 async function saveAnswer(position:number,value:number|null){setPool(p=>p.map(x=>x.position===position?{...x,selected_answer:value}:x));try{await api(`/api/exams/${session?.id}/answer`,{method:'POST',body:JSON.stringify({position,selectedAnswer:value})})}catch(e:any){setError(e.message)}}
 async function toggleReview(){if(!q||!session)return;const marked=!q.marked_for_review;setPool(p=>p.map(x=>x.position===q.position?{...x,marked_for_review:marked}:x));try{await api(`/api/exams/${session.id}/review`,{method:'POST',body:JSON.stringify({position:q.position,marked})})}catch(e:any){setError(e.message)}}
 async function advance(){if(!session)return;setBusy(true);try{const d=await api('/api/exams/advance',{method:'POST',body:JSON.stringify({sessionId:session.id})});if(d.advanced){const fresh=await api(`/api/exams/${session.id}`);setSession(fresh.session);setPool(fresh.questions);setIdx(fresh.questions.findIndex((x:Q)=>x.section==='B'));}}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 async function submit(){if(!session)return;setBusy(true);try{const d=await api(`/api/exams/${session.id}/submit`,{method:'POST'});router.push(`/results?id=${d.attemptId}`)}catch(e:any){setError(e.message)}finally{setBusy(false)}}
 if(busy&&!session)return <div className="card">Preparing your secure exam session…</div>;
 if(error&&!session)return <div className="card"><div className="notice error">{error}</div></div>;
 if(!q||!session)return <div className="card">No questions available. Seed the Supabase database first.</div>;
 const mins=Math.floor(seconds/60),secs=seconds%60;const answered=visiblePool.filter(x=>x.selected_answer!==null).length;const sectionName=session.current_section==='A'?'Section A':'Section B';
 return <>
  <div className="section-title"><div><div className="eyebrow">SECURE EXAM SESSION</div><h1>{mode==='AB'?'Full C-CAT Mock':sectionName}</h1><p className="muted">{mode==='AB'?`Section ${session.current_section} • ${answered}/${visiblePool.length} answered`: `${answered}/${visiblePool.length} answered`}</p></div><div className="timer">{String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}</div></div>
  {error&&<div className="notice error" style={{marginBottom:18}}>{error}</div>}
  <div className="card"><div className="palette">{visiblePool.map((x,i)=><button key={x.id} className={(x.selected_answer!==null?'answered ':'')+(x.marked_for_review?'review':'')+(x.position===q.position?' active':'')} onClick={()=>setIdx(pool.findIndex(y=>y.position===x.position))}>{i+1}</button>)}</div></div>
  <div className="card question" style={{marginTop:18}}><div className="section-title"><span className="pill">Question {visibleIdx+1}/{visiblePool.length} • {q.topic}</span><span className="pill">+3 / −1 / 0</span></div><h2>{q.question}</h2><div className="options">{q.options.map((o,n)=><button key={o} className={'option '+(q.selected_answer===n?'selected':'')} onClick={()=>saveAnswer(q.position,n)}>{String.fromCharCode(65+n)}. {o}</button>)}</div><div className="actions"><button className="btn ghost" onClick={toggleReview}>{q.marked_for_review?'★ Marked for review':'☆ Mark for review'}</button><div style={{display:'flex',gap:10}}><button className="btn ghost" disabled={visibleIdx===0} onClick={()=>setIdx(pool.findIndex(x=>x.position===visiblePool[Math.max(0,visibleIdx-1)].position))}>← Previous</button>{visibleIdx===visiblePool.length-1?<button className="btn primary" onClick={mode==='AB'&&session.current_section==='A'?advance:submit}>{busy?'Saving…':(mode==='AB'&&session.current_section==='A'?'Continue to Section B':'Submit Exam')}</button>:<button className="btn primary" onClick={()=>setIdx(pool.findIndex(x=>x.position===visiblePool[visibleIdx+1].position))}>Next →</button>}</div></div></div>
 </>;
}
