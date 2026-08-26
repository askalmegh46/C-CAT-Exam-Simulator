import Nav from '@/components/Nav';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import {createClient} from '@/lib/supabase/server';

export default async function Analytics(){
 const s=await createClient(); const {data:{user}}=await s.auth.getUser(); if(!user)return null;
 const {data:attempts}=await s.from('exam_attempts').select('id,mode,score,correct_count,wrong_count,unanswered_count,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(200);
 const ids=(attempts||[]).map(a=>a.id);
 const {data:answers}=ids.length?await s.from('attempt_answers').select('question_id,is_correct,time_spent_seconds,exam_attempts!inner(user_id),questions!inner(topic)').in('attempt_id',ids):{data:[]};
 const avgTime=answers?.length?Math.round((answers||[]).reduce((sum:any,a:any)=>sum+(a.time_spent_seconds||0),0)/answers.length):0; const {data:globalAvg}=await s.rpc('get_global_average');
 const topicMap=new Map<string,{correct:number;total:number}>();
 (answers||[]).forEach((a:any)=>{const topic=a.questions?.topic||'Unknown';const x=topicMap.get(topic)||{correct:0,total:0};x.total++;if(a.is_correct)x.correct++;topicMap.set(topic,x)});
 const topics=Array.from(topicMap.entries()).map(([topic,v])=>({topic,...v})).sort((a,b)=>(b.correct/b.total)-(a.correct/a.total));
 return <div className="shell"><Nav/><main className="container"><div className="section-title"><div><div className="eyebrow">PERFORMANCE LAB</div><h1>Analytics</h1><p className="muted">Turn every attempt into a preparation signal.</p></div></div><div className="stats"><div className="stat"><span>Avg time/question</span><b>{avgTime}s</b></div><div className="stat"><span>Global average</span><b>{Number(globalAvg||0)}</b></div><div className="stat"><span>Latest score</span><b>{attempts?.[0]?.score??0}</b></div><div className="stat"><span>Benchmark</span><b>{(Number(attempts?.[0]?.score||0)-Number(globalAvg||0)).toFixed(1)}</b></div></div><AnalyticsDashboard attempts={attempts||[]} topics={topics}/></main></div>
}
