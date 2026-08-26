import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.questionId || typeof body.note !== 'string') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const { data, error } = await supabase.from('user_question_notes').upsert({
    user_id: user.id, question_id: body.questionId, note: body.note.slice(0, 4000), updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,question_id' }).select('question_id,note,reviewed_at,updated_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.questionId) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  const { data, error } = await supabase.from('user_question_notes').update({ reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('user_id', user.id).eq('question_id', body.questionId).select('question_id,reviewed_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
