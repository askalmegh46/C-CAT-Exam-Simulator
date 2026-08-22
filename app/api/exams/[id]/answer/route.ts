import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const position = Number(body.position);
  const selectedAnswer = body.selectedAnswer === null ? null : Number(body.selectedAnswer);
  if (!Number.isInteger(position) || position < 0 || (selectedAnswer !== null && ![0,1,2,3].includes(selectedAnswer))) {
    return NextResponse.json({ error: 'Invalid answer payload' }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: session } = await supabase.from('exam_sessions').select('id,status,expires_at').eq('id',id).eq('user_id',user.id).single();
  if (!session || session.status !== 'active') return NextResponse.json({ error: 'Session is not active' }, { status: 409 });
  if (new Date(session.expires_at).getTime() <= Date.now()) return NextResponse.json({ error: 'Session expired' }, { status: 409 });
  const { error } = await supabase.from('exam_session_questions').update({ selected_answer: selectedAnswer, answered_at: selectedAnswer === null ? null : new Date().toISOString() }).eq('session_id',id).eq('position',position);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
