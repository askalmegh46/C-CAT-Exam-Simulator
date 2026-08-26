create table if not exists public.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('A','B','AB')),
  status text not null default 'active' check (status in ('active','submitted','expired')),
  current_section text not null check (current_section in ('A','B')),
  started_at timestamptz not null default now(),
  section_started_at timestamptz not null default now(),
  section_expires_at timestamptz not null,
  expires_at timestamptz not null,
  submitted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.exam_session_questions (
  session_id uuid not null references public.exam_sessions(id) on delete cascade,
  question_id text not null references public.questions(id) on delete restrict,
  position int not null check (position >= 0),
  selected_answer int check (selected_answer between 0 and 3),
  marked_for_review boolean not null default false,
  answered_at timestamptz,
  primary key(session_id, question_id),
  unique(session_id, position)
);

alter table public.exam_sessions enable row level security;
alter table public.exam_session_questions enable row level security;

create policy "sessions own all" on public.exam_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "session questions own all" on public.exam_session_questions for all
  using (exists (select 1 from public.exam_sessions s where s.id = session_id and s.user_id = auth.uid()))
  with check (exists (select 1 from public.exam_sessions s where s.id = session_id and s.user_id = auth.uid()));

create index if not exists idx_exam_sessions_user_created on public.exam_sessions(user_id, created_at desc);
create index if not exists idx_exam_session_questions_session_position on public.exam_session_questions(session_id, position);
