-- v5.8 Advanced Mock Engine
alter table public.exam_sessions add column if not exists configuration jsonb not null default '{}'::jsonb;
create index if not exists idx_exam_sessions_user_mode on public.exam_sessions(user_id,mode,created_at desc);
