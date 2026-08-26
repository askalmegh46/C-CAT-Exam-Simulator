import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse, sameOrigin } from '@/lib/security';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = rateLimit(`exam-answer:${ip}`, 120, 60_000);
  if (!rl.ok) return rateLimitResponse();
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const position = Number(body.position);
  const selectedAnswer = body.selectedAnswer === null ? null : Number(body.selectedAnswer);
  const timeSpentSeconds = Number.isInteger(body.timeSpentSeconds) ? Math.min(7200, Math.max(0, Number(body.timeSpentSeconds))) : 0;
  if (!Number.isInteger(position) || position < 0 || (selectedAnswer !== null && ![0,1,2,3].includes(selectedAnswer)) || !Number.isInteger(timeSpentSeconds)) {
    return NextResponse.json({ error: 'Invalid answer payload' }, { status: 400 });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: session } = await supabase.from('exam_sessions').select('id,status,expires_at,current_section,section_expires_at').eq('id',id).eq('user_id',user.id).single();
  if (!session || session.status !== 'active') return NextResponse.json({ error: 'Session is not active' }, { status: 409 });
  if (new Date(session.expires_at).getTime() <= Date.now()) return NextResponse.json({ error: 'Session expired' }, { status: 409 });
  if (new Date(session.section_expires_at).getTime() <= Date.now()) return NextResponse.json({ error: 'Section time has expired' }, { status: 409 });
  const { data: row } = await supabase.from('exam_session_questions').select('position,questions!inner(section)').eq('session_id', id).eq('position', position).single();
  if (!row || (session.current_section === 'A' && (row as any).questions.section !== 'A') || (session.current_section === 'B' && (row as any).questions.section !== 'B')) return NextResponse.json({ error: 'Question is not available in the active section' }, { status: 409 });
  const { error } = await supabase.from('exam_session_questions').update({ selected_answer: selectedAnswer, time_spent_seconds: timeSpentSeconds, answered_at: selectedAnswer === null ? null : new Date().toISOString() }).eq('session_id',id).eq('position',position);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
