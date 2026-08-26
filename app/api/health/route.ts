import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export async function GET() {
  const started = Date.now();
  const supabase = await createClient();
  const { error } = await supabase.from('questions').select('id', { head: true, count: 'exact' });
  return NextResponse.json({ ok: !error, database: error ? 'error' : 'ok', latencyMs: Date.now() - started, version: '6.0.0' }, { status: error ? 503 : 200 });
}
