import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID = new Set(['A','B','AB']);

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const mode = String(body.mode ?? 'A');
  if (!VALID.has(mode)) return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });

  const { data: existing } = await supabase.from('exam_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  if (existing) return NextResponse.json({ sessionId: existing.id, resumed: true });

  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id,section')
    .in('section', mode === 'A' ? ['A'] : mode === 'B' ? ['B'] : ['A','B'])
    .order('id');
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });

  const a = (questions ?? []).filter(q => q.section === 'A').slice(0, 50);
  const b = (questions ?? []).filter(q => q.section === 'B').slice(0, 50);
  const selected = mode === 'A' ? a : mode === 'B' ? b : [...a, ...b];
  if ((mode === 'AB' && (a.length < 50 || b.length < 50)) || (mode !== 'AB' && selected.length < 50)) {
    return NextResponse.json({ error: 'Not enough seeded questions for this exam mode.' }, { status: 400 });
  }

  const now = new Date();
  const sectionExpires = new Date(now.getTime() + 60 * 60 * 1000);
  const expires = new Date(now.getTime() + (mode === 'AB' ? 120 : 60) * 60 * 1000);
  const { data: session, error: sError } = await supabase.from('exam_sessions').insert({
    user_id: user.id, mode, current_section: mode === 'B' ? 'B' : 'A',
    started_at: now.toISOString(), section_started_at: now.toISOString(),
    section_expires_at: sectionExpires.toISOString(), expires_at: expires.toISOString()
  }).select('id').single();
  if (sError) return NextResponse.json({ error: sError.message }, { status: 500 });

  const rows = selected.map((q, i) => ({ session_id: session.id, question_id: q.id, position: i }));
  const { error: iqError } = await supabase.from('exam_session_questions').insert(rows);
  if (iqError) {
    await supabase.from('exam_sessions').delete().eq('id', session.id);
    return NextResponse.json({ error: iqError.message }, { status: 500 });
  }
  return NextResponse.json({ sessionId: session.id, resumed: false });
}
