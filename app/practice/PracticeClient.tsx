'use client';
import {useEffect,useMemo,useState} from 'react';
type Q={id:string;section:string;topic:string;difficulty:string;question:string;options:string[];correct_answer:number;explanation:string;source_type:string;source_label:string};
type Props={questions:Q[];bookmarkedIds:string[];solvedIds:string[];attemptedIds:string[]};
export default function PracticeClient({questions,bookmarkedIds,solvedIds,attemptedIds}:Props){
 const [search,setSearch]=useState(''),[sec,setSec]=useState('all'),[topic,setTopic]=useState('all'),[diff,setDiff]=useState('all'),[status,setStatus]=useState('all'),[selected,setSelected]=useState<Q|null>(null),[bookmarks,setBookmarks]=useState(new Set(bookmarkedIds)),[feedback,setFeedback]=useState<number|null>(null),[activityLogged,setActivityLogged]=useState(false),[ai,setAi]=useState(''),[aiBusy,setAiBusy]=useState(false),[flag,setFlag]=useState(false),[flagReason,setFlagReason]=useState('confusing'),[flagDetails,setFlagDetails]=useState('');
 const topics=useMemo(()=>Array.from(new Set(questions.map(q=>q.topic))).sort(),[questions]);
 const filtered=useMemo(()=>questions.filter(q=>{
  const hay=(q.id+' '+q.question+' '+q.topic).toLowerCase();
  const matchesSearch=!search||hay.includes(search.toLowerCase());
  const solved=solvedIds.includes(q.id), attempted=attemptedIds.includes(q.id);
  const matchesStatus=status==='all'||(status==='solved'&&solved)||(status==='attempted'&&attempted&&!solved)||(status==='todo'&&!attempted)||(status==='bookmarked'&&bookmarks.has(q.id));
  return matchesSearch&&(sec==='all'||q.section===sec)&&(topic==='all'||q.topic===topic)&&(diff==='all'||q.difficulty===diff)&&matchesStatus;
 }),[questions,search,sec,topic,diff,status,solvedIds,attemptedIds,bookmarks]);
 const solvedCount=solvedIds.filter(id=>questions.some(q=>q.id===id)).length;
 async function toggleBookmark(id:string){const next=new Set(bookmarks);const exists=next.has(id);exists?next.delete(id):next.add(id);setBookmarks(next);try{await fetch('/api/bookmarks',{method:exists?'DELETE':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:id})})}catch{setBookmarks(bookmarks)}}
 function open(q:Q){setSelected(q);setFeedback(null);setActivityLogged(false);setAi('');setFlag(false)}
 useEffect(()=>{if(feedback===null||activityLogged||!selected)return;setActivityLogged(true);fetch('/api/activity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'practice',attempted:1,solved:feedback===selected.correct_answer?1:0})}).catch(()=>{})},[feedback,activityLogged,selected]);
 async function explain(){if(!selected||feedback===null)return;setAiBusy(true);try{const r=await fetch('/api/ai/explain',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:selected.id,selectedAnswer:feedback})});const d=await r.json();setAi(r.ok?d.explanation:(d.error||'AI unavailable'))}catch{setAi('AI service unavailable')}finally{setAiBusy(false)}}
 async function submitFlag(){if(!selected)return;const r=await fetch('/api/flags',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({questionId:selected.id,reason:flagReason,details:flagDetails})});if(r.ok){setFlag(false);setFlagDetails('')}else{const d=await r.json();setAi(d.error||'Could not flag question')}}
 return <div className="grid" style={{gap:14}}>
  <div className="stats">
   <div className="stat"><span>Questions solved</span><b>{solvedCount} / {questions.length}</b></div>
   <div className="stat"><span>Easy</span><b className="easy">{questions.filter(q=>q.difficulty==='Easy'&&solvedIds.includes(q.id)).length}</b></div>
   <div className="stat"><span>Medium</span><b className="medium">{questions.filter(q=>q.difficulty==='Medium'&&solvedIds.includes(q.id)).length}</b></div>
   <div className="stat"><span>Hard</span><b className="hard">{questions.filter(q=>q.difficulty==='Hard'&&solvedIds.includes(q.id)).length}</b></div>
  </div>
  <div className="card">
   <div className="searchbar">
    <input className="input" placeholder="Search problems, topics, IDs..." value={search} onChange={e=>setSearch(e.target.value)}/>
    <select className="input" value={sec} onChange={e=>setSec(e.target.value)}><option value="all">All Sections</option><option value="A">Section A</option><option value="B">Section B</option></select>
    <select className="input" value={topic} onChange={e=>setTopic(e.target.value)}><option value="all">All Topics</option>{topics.map(t=><option key={t}>{t}</option>)}</select>
    <select className="input" value={diff} onChange={e=>setDiff(e.target.value)}><option value="all">All Difficulty</option><option>Easy</option><option>Medium</option><option>Hard</option></select>
    <select className="input" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All Status</option><option value="todo">Todo</option><option value="attempted">Attempted</option><option value="solved">Solved</option><option value="bookmarked">Bookmarked</option></select>
   </div>
  </div>
  <div className="card" style={{padding:0,overflow:'hidden'}}>
   <div className="problem-row" style={{fontSize:12,color:'var(--muted)',fontWeight:700}}>
    <span>Status</span><span>Question</span><span className="topic">Topic</span><span>Difficulty</span><span className="accuracy">Action</span>
   </div>
   {filtered.length?filtered.map(q=>{const solved=solvedIds.includes(q.id),attempted=attemptedIds.includes(q.id);return <div className="problem-row" key={q.id}>
    <span className={'status-dot '+(solved?'solved':attempted?'attempted':'')}>{solved?'✓':attempted?'◐':'○'}</span>
    <button className="problem-title" style={{textAlign:'left',background:'none',border:0,color:'inherit'}} onClick={()=>open(q)}>{q.question.length>88?q.question.slice(0,88)+'…':q.question}</button>
    <span className="muted topic">{q.topic}</span><span className={'difficulty '+q.difficulty.toLowerCase()}>{q.difficulty}</span>
    <button className="btn ghost accuracy" onClick={()=>toggleBookmark(q.id)}>{bookmarks.has(q.id)?'★ Saved':'☆ Save'}</button>
   </div>}) : <div style={{padding:28,textAlign:'center'}} className="muted">No questions match these filters.</div>}
  </div>
  {selected&&<div className="card split">
   <div className="split-pane"><div className="toolbar"><span className="pill">{selected.section}</span><span className="pill">{selected.topic}</span><span className={'difficulty '+selected.difficulty.toLowerCase()}>{selected.difficulty}</span><span className="pill">{selected.source_label}</span></div>
    <h2 style={{lineHeight:1.5}}>{selected.question}</h2>
    <div className="options">{selected.options.map((o,n)=><button key={o} className={'option '+(feedback===n?'selected':'')} onClick={()=>setFeedback(n)}>{String.fromCharCode(65+n)}. {o}</button>)}</div>
   </div>
   <aside className="split-pane sticky-workspace"><div className="section-title" style={{marginTop:0}}><h2>Workspace</h2><button className="btn ghost" onClick={()=>toggleBookmark(selected.id)}>{bookmarks.has(selected.id)?'★ Saved':'☆ Save'}</button></div>
    <div className="notice">Practice mode lets you check your answer immediately. Full mock exams use the secure server-side exam engine.</div>
    {feedback!==null&&<div className={feedback===selected.correct_answer?'notice success':'notice error'} style={{marginTop:12}}>{feedback===selected.correct_answer?'Correct ✓':'Incorrect ✗'}<p>{selected.explanation}</p></div>}
    {feedback!==null&&<div className="toolbar" style={{marginTop:10}}><button className="btn secondary" disabled={aiBusy} onClick={explain}>{aiBusy?'Thinking…':'🤖 Explain with AI'}</button><button className="btn ghost" onClick={()=>setFlag(v=>!v)}>⚑ Flag question</button></div>}
    {ai&&<div className="notice" style={{marginTop:10}}><b>AI Study Assistant</b><p style={{whiteSpace:'pre-wrap'}}>{ai}</p></div>}
    {flag&&<div className="tool-card" style={{marginTop:10}}><select className="input" value={flagReason} onChange={e=>setFlagReason(e.target.value)}><option value="incorrect">Incorrect answer/key</option><option value="confusing">Confusing</option><option value="ambiguous">Ambiguous</option><option value="broken">Broken</option><option value="other">Other</option></select><textarea className="input" placeholder="Describe the issue" value={flagDetails} onChange={e=>setFlagDetails(e.target.value)}/><button className="btn primary" onClick={submitFlag}>Submit flag</button></div>}
    <div className="actions" style={{marginTop:18}}><button className="btn ghost" onClick={()=>setSelected(null)}>Close</button><button className="btn primary" disabled={feedback===null} onClick={()=>setFeedback(null)}>Reset Answer</button></div>
   </aside>
  </div>}
 </div>
}
