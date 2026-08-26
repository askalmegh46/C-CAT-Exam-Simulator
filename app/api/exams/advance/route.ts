import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse, sameOrigin } from '@/lib/security';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = rateLimit(`exam-advance:${ip}`, 30, 60_000);
  if (!rl.ok) return rateLimitResponse();
  const { sessionId } = await request.json().catch(() => ({}));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: s } = await supabase.from('exam_sessions').select('*').eq('id',sessionId).eq('user_id',user.id).single();
  if (!s || s.status !== 'active') return NextResponse.json({ error: 'Session is not active' }, { status: 409 });
  if (s.mode !== 'AB' || s.current_section !== 'A') return NextResponse.json({ advanced: false });
  const now = new Date();
  const expired = now.getTime() >= new Date(s.section_expires_at).getTime();
  let canAdvance = expired;
  if (!expired) {
    // Manual early transition is allowed only when every Section A question has an answer.
    const { data: aRows } = await supabase.from('exam_session_questions').select('selected_answer,question_id').eq('session_id', sessionId).in('question_id', (await supabase.from('questions').select('id').eq('section','A')).data?.map(x=>x.id) ?? []);
    canAdvance = !!aRows?.length && aRows.every(r => r.selected_answer !== null);
  }
  if (!canAdvance) return NextResponse.json({ error: 'Section A is still active. Finish all Section A questions or wait for the 60-minute timer.' }, { status: 409 });
  const sectionExpires = new Date(now.getTime() + 60*60*1000);
  const { error } = await supabase.from('exam_sessions').update({ current_section:'B', section_started_at:now.toISOString(), section_expires_at:sectionExpires.toISOString() }).eq('id',sessionId).eq('user_id',user.id);
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json({ advanced:true, currentSection:'B', sectionExpiresAt:sectionExpires.toISOString() });
}
