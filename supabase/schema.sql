create extension if not exists pgcrypto;
create table if not exists public.profiles (id uuid primary key references auth.users(id) on delete cascade, display_name text, role text not null default 'student' check (role in ('student','admin')), created_at timestamptz not null default now());
create table if not exists public.questions (id text primary key, section text not null check(section in ('A','B')), topic text not null, difficulty text not null check(difficulty in ('Easy','Medium','Hard')), question text not null, options jsonb not null, correct_answer int not null check(correct_answer between 0 and 3), explanation text not null default '', source_type text not null, source_label text not null, created_at timestamptz not null default now());
create table if not exists public.exam_attempts (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, mode text not null, score int not null, correct_count int not null, wrong_count int not null, unanswered_count int not null, created_at timestamptz not null default now());
create table if not exists public.attempt_answers (id uuid primary key default gen_random_uuid(), attempt_id uuid not null references public.exam_attempts(id) on delete cascade, question_id text not null references public.questions(id), selected_answer int, is_correct boolean not null default false, created_at timestamptz not null default now());
create table if not exists public.bookmarks (user_id uuid not null references auth.users(id) on delete cascade, question_id text not null references public.questions(id) on delete cascade, created_at timestamptz not null default now(), primary key(user_id,question_id));
create table if not exists public.exam_sessions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, mode text not null check (mode in ('A','B','AB')), status text not null default 'active' check (status in ('active','submitted','expired')), current_section text not null check (current_section in ('A','B')), started_at timestamptz not null default now(), section_started_at timestamptz not null default now(), section_expires_at timestamptz not null, expires_at timestamptz not null, submitted_at timestamptz, created_at timestamptz not null default now(), configuration jsonb not null default '{}'::jsonb);
create table if not exists public.exam_session_questions (session_id uuid not null references public.exam_sessions(id) on delete cascade, question_id text not null references public.questions(id) on delete restrict, position int not null check(position >= 0), selected_answer int check(selected_answer between 0 and 3), marked_for_review boolean not null default false, answered_at timestamptz, primary key(session_id,question_id), unique(session_id,position));
alter table public.profiles enable row level security;alter table public.questions enable row level security;alter table public.exam_attempts enable row level security;alter table public.attempt_answers enable row level security;alter table public.bookmarks enable row level security;alter table public.exam_sessions enable row level security;alter table public.exam_session_questions enable row level security;
create policy "profiles own" on public.profiles for select using(auth.uid()=id);create policy "profiles insert own" on public.profiles for insert with check(auth.uid()=id);create policy "profiles update own" on public.profiles for update using(auth.uid()=id);
create policy "questions authenticated read" on public.questions for select to authenticated using(true);
create policy "attempts own read" on public.exam_attempts for select using(auth.uid()=user_id);create policy "attempts own insert" on public.exam_attempts for insert with check(auth.uid()=user_id);
create policy "answers own read" on public.attempt_answers for select using(exists(select 1 from public.exam_attempts a where a.id=attempt_id and a.user_id=auth.uid()));create policy "answers own insert" on public.attempt_answers for insert with check(exists(select 1 from public.exam_attempts a where a.id=attempt_id and a.user_id=auth.uid()));
create policy "bookmarks own all" on public.bookmarks for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "sessions own all" on public.exam_sessions for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "session questions own all" on public.exam_session_questions for all using(exists(select 1 from public.exam_sessions s where s.id=session_id and s.user_id=auth.uid())) with check(exists(select 1 from public.exam_sessions s where s.id=session_id and s.user_id=auth.uid()));
create index if not exists idx_exam_sessions_user_created on public.exam_sessions(user_id,created_at desc);create index if not exists idx_exam_session_questions_session_position on public.exam_session_questions(session_id,position);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1))); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- v5.6/v5.7 learning persistence
create table if not exists public.user_question_notes (user_id uuid not null references auth.users(id) on delete cascade, question_id text not null references public.questions(id) on delete cascade, note text not null default '', reviewed_at timestamptz, updated_at timestamptz not null default now(), primary key(user_id,question_id));
alter table public.user_question_notes enable row level security;
drop policy if exists "question notes own all" on public.user_question_notes;
create policy "question notes own all" on public.user_question_notes for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create index if not exists idx_notes_user_updated on public.user_question_notes(user_id,updated_at desc);
create index if not exists idx_attempt_answers_attempt_question on public.attempt_answers(attempt_id,question_id);
create index if not exists idx_attempt_answers_question on public.attempt_answers(question_id);


-- v5.9 security hardening (fresh installs)
create index if not exists idx_exam_sessions_user_status on public.exam_sessions(user_id,status,created_at desc);
create index if not exists idx_exam_sessions_expiry on public.exam_sessions(status,expires_at);

-- v5.11-v6.0 production integration
create table if not exists public.audit_logs (id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id) on delete set null, action text not null, entity_type text not null, entity_id text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());
alter table public.audit_logs enable row level security;
drop policy if exists "admins read audit logs" on public.audit_logs;
create policy "admins read audit logs" on public.audit_logs for select using (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "admins insert audit logs" on public.audit_logs;
create policy "admins insert audit logs" on public.audit_logs for insert with check (exists (select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
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

-- v6.1 AI, gamification, analytics and content moderation
create table if not exists public.achievements (key text primary key, name text not null, description text not null, icon text not null);
create table if not exists public.user_achievements (user_id uuid not null references auth.users(id) on delete cascade, achievement_key text not null references public.achievements(key) on delete cascade, awarded_at timestamptz not null default now(), primary key(user_id,achievement_key));
create table if not exists public.daily_activity (user_id uuid not null references auth.users(id) on delete cascade, activity_date date not null, login_count int not null default 0, practice_count int not null default 0, questions_solved int not null default 0, questions_attempted int not null default 0, primary key(user_id,activity_date));
create table if not exists public.question_flags (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, question_id text not null references public.questions(id) on delete cascade, reason text not null check(reason in ('incorrect','confusing','ambiguous','broken','other')), details text not null default '', status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')), admin_note text not null default '', created_at timestamptz not null default now(), resolved_at timestamptz);
create table if not exists public.ai_generated_questions (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, source_topic text not null, source_question_id text, difficulty text not null check(difficulty in ('Easy','Medium','Hard')), question text not null, options jsonb not null, correct_answer int not null check(correct_answer between 0 and 3), explanation text not null default '', status text not null default 'generated' check(status in ('generated','approved','rejected')), model text, created_at timestamptz not null default now());
alter table public.exam_session_questions add column if not exists time_spent_seconds int not null default 0;
alter table public.attempt_answers add column if not exists time_spent_seconds int not null default 0;
alter table public.achievements enable row level security;
create policy "achievements authenticated read" on public.achievements for select to authenticated using(true);
alter table public.user_achievements enable row level security;
create policy "achievements own read" on public.user_achievements for select using(auth.uid()=user_id);
create policy "achievements own insert" on public.user_achievements for insert with check(auth.uid()=user_id);
alter table public.daily_activity enable row level security;
create policy "activity own all" on public.daily_activity for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
alter table public.question_flags enable row level security;
create policy "flags own read" on public.question_flags for select using(auth.uid()=user_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "flags own insert" on public.question_flags for insert with check(auth.uid()=user_id);
create policy "flags admin update" on public.question_flags for update using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
alter table public.ai_generated_questions enable row level security;
create policy "ai questions own" on public.ai_generated_questions for select using(auth.uid()=user_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
create policy "ai questions insert own" on public.ai_generated_questions for insert with check(auth.uid()=user_id);
