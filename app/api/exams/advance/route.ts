import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export async function POST(request: Request) {
  const { sessionId } = await request.json().catch(() => ({}));
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: s } = await supabase.from('exam_sessions').select('*').eq('id',sessionId).eq('user_id',user.id).single();
  if (!s || s.status !== 'active') return NextResponse.json({ error: 'Session is not active' }, { status: 409 });
  if (s.mode !== 'AB' || s.current_section !== 'A') return NextResponse.json({ advanced: false });
  const now = new Date();
  const sectionExpires = new Date(now.getTime() + 60*60*1000);
  const { error } = await supabase.from('exam_sessions').update({ current_section:'B', section_started_at:now.toISOString(), section_expires_at:sectionExpires.toISOString() }).eq('id',sessionId).eq('user_id',user.id);
  if (error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json({ advanced:true, currentSection:'B', sectionExpiresAt:sectionExpires.toISOString() });
}
