import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: session, error: sError } = await supabase.from('exam_sessions')
    .select('*').eq('id', id).eq('user_id', user.id).single();
  if (sError || !session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const { data: rows, error } = await supabase.from('exam_session_questions')
    .select('position,selected_answer,marked_for_review,question_id,questions(id,section,topic,difficulty,question,options,explanation,source_type,source_label)')
    .eq('session_id', id).order('position');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const questions = (rows ?? []).map((r: any) => ({
    ...r.questions,
    position: r.position,
    selected_answer: r.selected_answer,
    marked_for_review: r.marked_for_review,
  }));
  return NextResponse.json({ session, questions });
}
