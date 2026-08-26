import Nav from '@/components/Nav';
import {createClient} from '@/lib/supabase/server';
import PracticeClient from './PracticeClient';

export default async function Practice(){
 const s=await createClient(); const {data:{user}}=await s.auth.getUser(); if(!user)return null;
 const [{data:questions},{data:bookmarks},{data:answers}]=await Promise.all([
  s.from('questions').select('id,section,topic,difficulty,question,options,correct_answer,explanation,source_type,source_label').order('section').order('id').limit(500),
  s.from('bookmarks').select('question_id').eq('user_id',user.id),
  s.from('attempt_answers').select('question_id,is_correct')
 ]);
 const solved=new Set((answers??[]).filter(x=>x.is_correct).map(x=>x.question_id));
 const attempted=new Set((answers??[]).map(x=>x.question_id));
 return <div className="shell"><Nav/><main className="container">
  <div className="section-title"><div><div className="eyebrow">PROBLEMS • PRACTICE</div><h1>Question Bank</h1><p className="muted">Solve C-CAT questions in a focused, developer-style workspace.</p></div><span className="pill">{questions?.length??0} questions</span></div>
  <PracticeClient questions={questions??[]} bookmarkedIds={(bookmarks??[]).map(x=>x.question_id)} solvedIds={[...solved]} attemptedIds={[...attempted]}/>
 </main></div>
}
