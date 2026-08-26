import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { sameOrigin, rateLimit, rateLimitResponse } from '@/lib/security';

function clean(body: any) {
  const id = String(body.id ?? '').trim();
  const section = String(body.section ?? '');
  const topic = String(body.topic ?? '').trim();
  const difficulty = String(body.difficulty ?? '');
  const question = String(body.question ?? '').trim();
  const options = Array.isArray(body.options) ? body.options.map((x: unknown) => String(x).trim()) : [];
  const correct_answer = Number(body.correct_answer);
  const explanation = String(body.explanation ?? '').trim();
  const source_type = String(body.source_type ?? 'Original').trim();
  const source_label = String(body.source_label ?? 'Original practice').trim();
  if (!id || !['A','B'].includes(section) || !topic || !['Easy','Medium','Hard'].includes(difficulty) || !question || options.length !== 4 || options.some((x: string) => !x) || ![0,1,2,3].includes(correct_answer)) return null;
  return { id, section, topic, difficulty, question, options, correct_answer, explanation, source_type, source_label };
}

export async function GET(request: Request) {
  const { supabase, user, isAdmin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.trim() || '';
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)));
  let query = supabase.from('questions').select('id,section,topic,difficulty,question,options,correct_answer,explanation,source_type,source_label').order('id').limit(limit);
  if (q) query = query.or(`id.ilike.%${q}%,topic.ilike.%${q}%,question.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data ?? [] });
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!rateLimit(`admin-question:${ip}`, 60, 60_000).ok) return rateLimitResponse();
  const { supabase, user, isAdmin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const payload = clean(await request.json().catch(() => ({})));
  if (!payload) return NextResponse.json({ error: 'Invalid question payload' }, { status: 400 });
  const { data, error } = await supabase.from('questions').insert(payload).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase.from('audit_logs').insert({ actor_id: user.id, action: 'question.create', entity_type: 'question', entity_id: payload.id, metadata: { section: payload.section, topic: payload.topic } });
  return NextResponse.json({ question: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const { supabase, user, isAdmin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const id = String(body.id ?? '').trim();
  if (!id) return NextResponse.json({ error: 'Question id is required' }, { status: 400 });
  const payload = clean({ ...body, id });
  if (!payload) return NextResponse.json({ error: 'Invalid question payload' }, { status: 400 });
  const { data, error } = await supabase.from('questions').update(payload).eq('id', id).select('*').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase.from('audit_logs').insert({ actor_id: user.id, action: 'question.update', entity_type: 'question', entity_id: id, metadata: { section: payload.section, topic: payload.topic } });
  return NextResponse.json({ question: data });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const { supabase, user, isAdmin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Question id is required' }, { status: 400 });
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase.from('audit_logs').insert({ actor_id: user.id, action: 'question.delete', entity_type: 'question', entity_id: id });
  return NextResponse.json({ ok: true });
}
