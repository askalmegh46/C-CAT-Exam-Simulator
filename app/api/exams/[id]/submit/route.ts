import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse, sameOrigin } from '@/lib/security';
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(_request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const ip = _request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = rateLimit(`exam-submit:${ip}`, 20, 60_000);
  if (!rl.ok) return rateLimitResponse();
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error:'Unauthorized' }, { status:401 });
  const { data: session } = await supabase.from('exam_sessions').select('*').eq('id',id).eq('user_id',user.id).single();
  if (!session) return NextResponse.json({ error:'Session not found' }, { status:404 });
  if (session.status !== 'active') return NextResponse.json({ error:'Session already submitted' }, { status:409 });
  const { data: rows, error } = await supabase.from('exam_session_questions').select('position,selected_answer,question_id,questions(correct_answer)').eq('session_id',id).order('position');
  if (error) return NextResponse.json({ error:error.message }, { status:500 });
  const now = new Date();
  if (now.getTime() > new Date(session.expires_at).getTime()) {
    if (session.mode === 'AB' && session.current_section === 'A') return NextResponse.json({ error:'Section A expired. Advance to Section B.', needsAdvance:true }, { status:409 });
  }
  let correct=0, wrong=0, unanswered=0;
  const answers = (rows ?? []).map((r:any) => {
    const selected = r.selected_answer;
    const answerCorrect = selected !== null && selected === r.questions.correct_answer;
    if (selected === null || selected === undefined) unanswered++; else if (answerCorrect) correct++; else wrong++;
    return { attempt_placeholder:true, question_id:r.question_id, selected_answer:selected, is_correct:answerCorrect, time_spent_seconds:r.time_spent_seconds||0 };
  });
  const score = correct*3 - wrong;
  const { data: attempt, error: aError } = await supabase.from('exam_attempts').insert({ user_id:user.id, mode:session.mode, score, correct_count:correct, wrong_count:wrong, unanswered_count:unanswered }).select('id').single();
  if (aError) return NextResponse.json({ error:aError.message }, { status:500 });
  const { error: aaError } = await supabase.from('attempt_answers').insert(answers.map(a=>({ attempt_id:attempt.id, question_id:a.question_id, selected_answer:a.selected_answer, is_correct:a.is_correct, time_spent_seconds:a.time_spent_seconds })));
  if (aaError) return NextResponse.json({ error:aaError.message }, { status:500 });
  await supabase.from('exam_sessions').update({ status:'submitted', submitted_at:now.toISOString() }).eq('id',id).eq('user_id',user.id);
  const today=now.toISOString().slice(0,10);
  const {data:daily}=await supabase.from('daily_activity').select('*').eq('user_id',user.id).eq('activity_date',today).maybeSingle();
  await supabase.from('daily_activity').upsert({user_id:user.id,activity_date:today,login_count:daily?.login_count||0,practice_count:(daily?.practice_count||0)+1,questions_solved:(daily?.questions_solved||0)+correct,questions_attempted:(daily?.questions_attempted||0)+(rows?.length||0)});
  const {count:attemptCount}=await supabase.from('exam_attempts').select('*',{count:'exact',head:true}).eq('user_id',user.id);
  if((attemptCount||0)===1) await supabase.from('user_achievements').upsert({user_id:user.id,achievement_key:'first_mock'},{onConflict:'user_id,achievement_key'});
  if(wrong===0 && unanswered===0) await supabase.from('user_achievements').upsert({user_id:user.id,achievement_key:'perfect_score'},{onConflict:'user_id,achievement_key'});
  const {data:activityRows}=await supabase.from('daily_activity').select('activity_date').eq('user_id',user.id).order('activity_date',{ascending:false}).limit(10);let streak=0;let cursor=new Date(today+'T00:00:00Z');for(const row of activityRows||[]){const d=new Date(row.activity_date+'T00:00:00Z');if(d.getTime()===cursor.getTime()){streak++;cursor.setUTCDate(cursor.getUTCDate()-1)}else break;}if(streak>=7)await supabase.from('user_achievements').upsert({user_id:user.id,achievement_key:'seven_day_streak'},{onConflict:'user_id,achievement_key'});
  const {data:allAttemptIds}=await supabase.from('exam_attempts').select('id').eq('user_id',user.id);const ids=(allAttemptIds||[]).map(x=>x.id);const {count:totalAnswered}=ids.length?await supabase.from('attempt_answers').select('*',{count:'exact',head:true}).in('attempt_id',ids):{count:0};if((totalAnswered||0)>=100) await supabase.from('user_achievements').upsert({user_id:user.id,achievement_key:'hundred_questions'},{onConflict:'user_id,achievement_key'});
  return NextResponse.json({ attemptId:attempt.id, score, correct, wrong, unanswered });
}
