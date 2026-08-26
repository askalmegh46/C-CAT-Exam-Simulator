import Nav from '@/components/Nav';
import RevisionClient from '@/components/RevisionClient';
import {createClient} from '@/lib/supabase/server';

export default async function Revision(){
 const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return null;
 const {data:bookmarks}=await s.from('bookmarks').select('question_id').eq('user_id',user.id);
 const {data:attempts}=await s.from('exam_attempts').select('id').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
 const attemptIds=(attempts||[]).map(a=>a.id);
 const {data:wrong}=attemptIds.length?await s.from('attempt_answers').select('question_id').in('attempt_id',attemptIds).eq('is_correct',false):{data:[]};
 const ids=Array.from(new Set([...(bookmarks||[]).map(x=>x.question_id),...(wrong||[]).map(x=>x.question_id)]));
 const {data:questions}=ids.length?await s.from('questions').select('id,question,topic,difficulty,source_label').in('id',ids):{data:[]};
 const {data:notes}=ids.length?await s.from('user_question_notes').select('question_id,note,reviewed_at').eq('user_id',user.id).in('question_id',ids):{data:[]};
 const noteMap=new Map((notes||[]).map(n=>[n.question_id,n]));
 const items=(questions||[]).map(q=>({...q,note:noteMap.get(q.id)?.note||'',reviewed_at:noteMap.get(q.id)?.reviewed_at||null}));
 return <div className="shell"><Nav/><main className="container"><div className="section-title"><div><div className="eyebrow">LEARNING SYSTEM • V5.7</div><h1>Revision Hub</h1><p className="muted">Your mistakes, saved questions and personal notes in one focused queue.</p></div></div><div className="grid3"><div className="card"><span className="muted">Revision queue</span><b className="big-number">{items.length}</b></div><div className="card"><span className="muted">Bookmarked</span><b className="big-number">{bookmarks?.length??0}</b></div><div className="card"><span className="muted">Incorrect history</span><b className="big-number">{new Set((wrong||[]).map(x=>x.question_id)).size}</b></div></div><RevisionClient items={items}/><div className="section-title"><h2>High-yield memory tricks</h2></div><div className="grid2"><div className="card"><div className="list"><div className="row">Stack → <b>LIFO</b></div><div className="row">Queue → <b>FIFO</b></div><div className="row">TCP → <b>Connection-oriented</b></div><div className="row">ETL → <b>Extract → Transform → Load</b></div><div className="row">BST inorder → <b>Sorted keys</b></div></div></div><div className="card"><h2>Important questions</h2><ol><li>Binary search complexity?</li><li>Stack vs queue?</li><li>C pointers?</li><li>Deadlock conditions?</li><li>TCP vs UDP?</li><li>OOP principles?</li><li>Probability, ratio and time-work?</li><li>ETL and Big Data basics?</li></ol></div></div></main></div>
}
