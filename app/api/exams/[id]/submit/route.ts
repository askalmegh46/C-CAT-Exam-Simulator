import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    return { attempt_placeholder:true, question_id:r.question_id, selected_answer:selected, is_correct:answerCorrect };
  });
  const score = correct*3 - wrong;
  const { data: attempt, error: aError } = await supabase.from('exam_attempts').insert({ user_id:user.id, mode:session.mode, score, correct_count:correct, wrong_count:wrong, unanswered_count:unanswered }).select('id').single();
  if (aError) return NextResponse.json({ error:aError.message }, { status:500 });
  const { error: aaError } = await supabase.from('attempt_answers').insert(answers.map(a=>({ attempt_id:attempt.id, question_id:a.question_id, selected_answer:a.selected_answer, is_correct:a.is_correct })));
  if (aaError) return NextResponse.json({ error:aaError.message }, { status:500 });
  await supabase.from('exam_sessions').update({ status:'submitted', submitted_at:now.toISOString() }).eq('id',id).eq('user_id',user.id);
  return NextResponse.json({ attemptId:attempt.id, score, correct, wrong, unanswered });
}
