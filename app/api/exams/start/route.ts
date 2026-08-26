import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID = new Set(['A','B','AB']);

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickBalanced<T extends { topic: string }>(items: T[], count: number): T[] {
  const byTopic = new Map<string, T[]>();
  for (const item of items) {
    const list = byTopic.get(item.topic) ?? [];
    list.push(item);
    byTopic.set(item.topic, list);
  }
  const topics = [...byTopic.keys()];
  for (const topic of topics) byTopic.set(topic, shuffle(byTopic.get(topic)!));

  const selected: T[] = [];
  let cursor = 0;
  while (selected.length < count) {
    let added = false;
    for (const topic of topics) {
      const list = byTopic.get(topic)!;
      if (cursor < list.length && selected.length < count) {
        selected.push(list[cursor]);
        added = true;
      }
    }
    if (!added) break;
    cursor++;
  }
  return shuffle(selected);
}

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

  const sections = mode === 'A' ? ['A'] : mode === 'B' ? ['B'] : ['A', 'B'];
  const { data: questions, error: qError } = await supabase
    .from('questions')
    .select('id,section,topic')
    .in('section', sections);
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 });

  const all = questions ?? [];
  const aPool = all.filter(q => q.section === 'A');
  const bPool = all.filter(q => q.section === 'B');
  const a = pickBalanced(aPool, 50);
  const b = pickBalanced(bPool, 50);

  if ((mode === 'AB' && (a.length < 50 || b.length < 50)) || (mode === 'A' && a.length < 50) || (mode === 'B' && b.length < 50)) {
    return NextResponse.json({ error: 'Not enough seeded questions for this exam mode.' }, { status: 400 });
  }

  const selected = mode === 'A' ? a : mode === 'B' ? b : [...a, ...b];
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
  return NextResponse.json({ sessionId: session.id, resumed: false, questionCount: selected.length });
}
