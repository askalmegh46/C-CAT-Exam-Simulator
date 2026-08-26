import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { sameOrigin, rateLimit, rateLimitResponse } from '@/lib/security';

interface QuestionImportRow {
  id: string;
  section: string;
  topic: string;
  difficulty: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  source_type: string;
  source_label: string;
}

function clean(b: Record<string, any>): QuestionImportRow | null {
  const options = Array.isArray(b.options)
    ? b.options.map((x: unknown) => String(x).trim())
    : [];

  const row: QuestionImportRow = {
    id: String(b.id || '').trim(),
    section: String(b.section || ''),
    topic: String(b.topic || '').trim(),
    difficulty: String(b.difficulty || ''),
    question: String(b.question || '').trim(),
    options,
    correct_answer: Number(b.correct_answer),
    explanation: String(b.explanation || ''),
    source_type: String(b.source_type || 'Original'),
    source_label: String(b.source_label || 'AI/Imported practice'),
  };

  if (
    !row.id ||
    !['A', 'B'].includes(row.section) ||
    !row.topic ||
    !['Easy', 'Medium', 'Hard'].includes(row.difficulty) ||
    !row.question ||
    options.length !== 4 ||
    options.some((x: string) => !x) || // Added explicit string type here
    ![0, 1, 2, 3].includes(row.correct_answer)
  ) {
    return null;
  }

  return row;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(`admin-import:${ip}`, 10, 60_000).ok) {
    return rateLimitResponse();
  }

  const { supabase, user, isAdmin } = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const b = await request.json().catch(() => ({}));
  if (!Array.isArray(b.questions) || b.questions.length < 1 || b.questions.length > 1000) {
    return NextResponse.json({ error: 'questions must contain 1-1000 rows' }, { status: 400 });
  }

  const cleaned = b.questions.map(clean);
  const invalid = cleaned.findIndex((x: QuestionImportRow | null) => !x); // Added explicit parameter type here

  if (invalid >= 0) {
    return NextResponse.json({ error: `Invalid row at index ${invalid}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('questions')
    .upsert(cleaned, { onConflict: 'id' })
    .select('id');

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from('audit_logs').insert({
    actor_id: user.id,
    action: 'question.bulk_import',
    entity_type: 'question',
    metadata: { count: data?.length || 0 },
  });

  return NextResponse.json({ imported: data?.length || 0 });
}
