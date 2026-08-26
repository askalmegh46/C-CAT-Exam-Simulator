-- v5.9 security hardening
-- Apply after 002_learning_analytics.sql.

-- Private attempts/answers remain user-owned. Explicitly deny public/anon access.
drop policy if exists "attempts own read" on public.exam_attempts;
create policy "attempts own read" on public.exam_attempts
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "attempts own insert" on public.exam_attempts;
create policy "attempts own insert" on public.exam_attempts
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "answers own read" on public.attempt_answers;
create policy "answers own read" on public.attempt_answers
  for select to authenticated
  using (exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id and a.user_id = auth.uid()
  ));
drop policy if exists "answers own insert" on public.attempt_answers;
create policy "answers own insert" on public.attempt_answers
  for insert to authenticated
  with check (exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id and a.user_id = auth.uid()
  ));

-- Students must never be able to mutate the question bank.
drop policy if exists "questions authenticated read" on public.questions;
create policy "questions authenticated read" on public.questions
  for select to authenticated using (true);

-- Tighten profile access to authenticated users only.
drop policy if exists "profiles own" on public.profiles;
create policy "profiles own" on public.profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert to authenticated with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Helpful indexes for ownership and expiry checks.
create index if not exists idx_exam_sessions_user_status
  on public.exam_sessions(user_id, status, created_at desc);
create index if not exists idx_exam_sessions_expiry
  on public.exam_sessions(status, expires_at);
