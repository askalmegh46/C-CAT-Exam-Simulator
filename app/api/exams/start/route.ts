import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit, rateLimitResponse, sameOrigin } from '@/lib/security';

const VALID = new Set(['A','B','AB']);
const DIFFICULTIES = new Set(['Easy','Medium','Hard']);

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = rateLimit(`exam-start:${ip}`, 10, 60_000);
  if (!rl.ok) return rateLimitResponse();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const mode = String(body.mode ?? 'A');
  if (!VALID.has(mode)) return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  const config = body.config && typeof body.config === 'object' ? body.config : {};
  const topic = typeof config.topic === 'string' && config.topic.trim() ? config.topic.trim() : null;
  const difficulty = typeof config.difficulty === 'string' && DIFFICULTIES.has(config.difficulty) ? config.difficulty : null;
  const requestedCount = Number.isInteger(config.count) ? Number(config.count) : 50;
  const count = Math.min(50, Math.max(5, requestedCount));

  const { data: existing } = await supabase.from('exam_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  if (existing) return NextResponse.json({ sessionId: existing.id, resumed: true });

  let query = supabase
    .from('questions')
    .select('id,section,topic,difficulty')
    .in('section', mode === 'A' ? ['A'] : mode === 'B' ? ['B'] : ['A','B']);
  if (topic) query = query.eq('topic', topic);
  if (difficulty) query = query.eq('difficulty', difficulty);
  const { data: questions, error: qError } = await query.order('id');
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });

  const shuffle = <T,>(items: T[]) => items.map(value => ({ value, key: Math.random() })).sort((x, y) => x.key - y.key).map(x => x.value);
  const a = shuffle((questions ?? []).filter(q => q.section === 'A')).slice(0, mode === 'AB' ? count : count);
  const b = shuffle((questions ?? []).filter(q => q.section === 'B')).slice(0, mode === 'AB' ? count : count);
  const selected = mode === 'A' ? a : mode === 'B' ? b : [...a, ...b];
  if ((mode === 'AB' && (a.length < count || b.length < count)) || (mode !== 'AB' && selected.length < count)) {
    return NextResponse.json({ error: 'Not enough seeded questions for this exam mode.' }, { status: 400 });
  }

  const now = new Date();
  const sectionExpires = new Date(now.getTime() + 60 * 60 * 1000);
  const expires = new Date(now.getTime() + (mode === 'AB' ? 120 : 60) * 60 * 1000);
  const { data: session, error: sError } = await supabase.from('exam_sessions').insert({
    user_id: user.id, mode, current_section: mode === 'B' ? 'B' : 'A',
    started_at: now.toISOString(), section_started_at: now.toISOString(),
    section_expires_at: sectionExpires.toISOString(), expires_at: expires.toISOString(),
    configuration: { count, topic, difficulty }
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
