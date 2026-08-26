-- v5.11-v6.0 production integration
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_logs enable row level security;
drop policy if exists "admins read audit logs" on public.audit_logs;
create policy "admins read audit logs" on public.audit_logs for select using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "admins insert audit logs" on public.audit_logs;
create policy "admins insert audit logs" on public.audit_logs for insert with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

-- Admin-only question mutations. Students retain read-only access.
drop policy if exists "questions admin insert" on public.questions;
create policy "questions admin insert" on public.questions for insert to authenticated with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "questions admin update" on public.questions;
create policy "questions admin update" on public.questions for update to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "questions admin delete" on public.questions;
create policy "questions admin delete" on public.questions for delete to authenticated using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));

create index if not exists idx_questions_section_topic_difficulty on public.questions(section,topic,difficulty);
create index if not exists idx_questions_source on public.questions(source_type,source_label);
create index if not exists idx_attempts_user_created on public.exam_attempts(user_id,created_at desc);
create index if not exists idx_attempt_answers_question_correct on public.attempt_answers(question_id,is_correct);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);

-- Prevent a session from containing the same question twice.
create unique index if not exists idx_session_question_unique_question on public.exam_session_questions(session_id,question_id);
