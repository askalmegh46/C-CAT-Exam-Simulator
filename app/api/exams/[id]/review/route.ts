import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sameOrigin } from '@/lib/security';
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const position = Number(body.position);
  const marked = Boolean(body.marked);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: session } = await supabase.from('exam_sessions').select('id,status').eq('id',id).eq('user_id',user.id).single();
  if (!session || session.status !== 'active') return NextResponse.json({ error: 'Session is not active' }, { status: 409 });
  const { error } = await supabase.from('exam_session_questions').update({ marked_for_review: marked }).eq('session_id',id).eq('position',position);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
