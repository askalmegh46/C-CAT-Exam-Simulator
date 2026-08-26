-- v6.1 AI, gamification, time analytics, benchmarking and content moderation
create table if not exists public.achievements (key text primary key, name text not null, description text not null, icon text not null);
create table if not exists public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null references public.achievements(key) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key(user_id, achievement_key)
);
create table if not exists public.daily_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  login_count int not null default 0,
  practice_count int not null default 0,
  questions_solved int not null default 0,
  questions_attempted int not null default 0,
  primary key(user_id, activity_date)
);
create table if not exists public.question_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(id) on delete cascade,
  reason text not null check(reason in ('incorrect','confusing','ambiguous','broken','other')),
  details text not null default '',
  status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create table if not exists public.ai_generated_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_topic text not null,
  source_question_id text,
  difficulty text not null check(difficulty in ('Easy','Medium','Hard')),
  question text not null,
  options jsonb not null,
  correct_answer int not null check(correct_answer between 0 and 3),
  explanation text not null default '',
  status text not null default 'generated' check(status in ('generated','approved','rejected')),
  model text,
  created_at timestamptz not null default now()
);

alter table public.exam_session_questions add column if not exists time_spent_seconds int not null default 0;
alter table public.attempt_answers add column if not exists time_spent_seconds int not null default 0;

alter table public.achievements enable row level security;
drop policy if exists "achievements authenticated read" on public.achievements;
create policy "achievements authenticated read" on public.achievements for select to authenticated using(true);
alter table public.user_achievements enable row level security;
alter table public.daily_activity enable row level security;
alter table public.question_flags enable row level security;
alter table public.ai_generated_questions enable row level security;

drop policy if exists "achievements own read" on public.user_achievements;
create policy "achievements own read" on public.user_achievements for select using(auth.uid()=user_id);
drop policy if exists "achievements own insert" on public.user_achievements;
create policy "achievements own insert" on public.user_achievements for insert with check(auth.uid()=user_id);
drop policy if exists "activity own all" on public.daily_activity;
create policy "activity own all" on public.daily_activity for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
drop policy if exists "flags own read" on public.question_flags;
create policy "flags own read" on public.question_flags for select using(auth.uid()=user_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "flags own insert" on public.question_flags;
create policy "flags own insert" on public.question_flags for insert with check(auth.uid()=user_id);
drop policy if exists "flags admin update" on public.question_flags;
create policy "flags admin update" on public.question_flags for update using(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin')) with check(exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "ai questions own" on public.ai_generated_questions;
create policy "ai questions own" on public.ai_generated_questions for select using(auth.uid()=user_id or exists(select 1 from public.profiles p where p.id=auth.uid() and p.role='admin'));
drop policy if exists "ai questions insert own" on public.ai_generated_questions;
create policy "ai questions insert own" on public.ai_generated_questions for insert with check(auth.uid()=user_id);

create index if not exists idx_daily_activity_user_date on public.daily_activity(user_id,activity_date desc);
create index if not exists idx_flags_status_created on public.question_flags(status,created_at desc);
create index if not exists idx_flags_question on public.question_flags(question_id,status);
create index if not exists idx_ai_generated_user_created on public.ai_generated_questions(user_id,created_at desc);
create index if not exists idx_session_questions_time on public.exam_session_questions(session_id,time_spent_seconds);
create index if not exists idx_attempt_answers_time on public.attempt_answers(attempt_id,time_spent_seconds);

create or replace function public.get_leaderboard(limit_count int default 20)
returns table(rank bigint, display_name text, score int, mode text, created_at timestamptz)
language sql security definer set search_path=public stable as $$
  select row_number() over(order by a.score desc, a.created_at asc),
         coalesce(nullif(p.display_name,''),'C-CAT Student')::text,
         a.score, a.mode, a.created_at
  from public.exam_attempts a
  left join public.profiles p on p.id=a.user_id
  where a.mode in ('A','B','AB')
  order by a.score desc, a.created_at asc
  limit greatest(1, least(limit_count,100));
$$;
revoke all on function public.get_leaderboard(int) from public;
grant execute on function public.get_leaderboard(int) to authenticated;

create or replace function public.get_global_average()
returns numeric
language sql security definer set search_path=public stable as $$
  select coalesce(round(avg(score)::numeric,2),0) from public.exam_attempts where mode in ('A','B','AB');
$$;
revoke all on function public.get_global_average() from public;
grant execute on function public.get_global_average() to authenticated;

insert into public.achievements(key,name,description,icon) values
 ('first_mock','First Mock','Complete your first mock exam','🎯'),
 ('perfect_score','Perfect Score','Finish a mock with no wrong answers','🏆'),
 ('seven_day_streak','7-Day Streak','Practice on seven consecutive days','🔥'),
 ('hundred_questions','100 Questions','Attempt 100 practice/exam questions','💯')
on conflict (key) do nothing;
