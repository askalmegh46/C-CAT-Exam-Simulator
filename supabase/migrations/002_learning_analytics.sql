-- v5.6/v5.7: analytics + revision persistence
create table if not exists public.user_question_notes (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  note text not null default '',
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(user_id, question_id)
);

alter table public.user_question_notes enable row level security;
drop policy if exists "question notes own all" on public.user_question_notes;
create policy "question notes own all" on public.user_question_notes
  for all using(auth.uid()=user_id) with check(auth.uid()=user_id);

create index if not exists idx_notes_user_updated on public.user_question_notes(user_id, updated_at desc);
create index if not exists idx_attempt_answers_attempt_question on public.attempt_answers(attempt_id, question_id);
create index if not exists idx_attempt_answers_question on public.attempt_answers(question_id);

-- Fresh installs should include the same objects.
