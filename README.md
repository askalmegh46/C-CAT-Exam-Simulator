# C-CAT Exam Simulator v5 — Next.js + Supabase

This version replaces the FastAPI backend with a Next.js App Router + Supabase architecture. It keeps the existing 100-question source-labelled practice bank and moves questions/attempts into PostgreSQL through Supabase.

## Stack
- Next.js App Router + TypeScript
- Supabase Auth (cookie-based SSR)
- Supabase Postgres + Row Level Security
- Native Next.js server components and client components

## Setup
1. Install Node.js 20+.
2. Create a Supabase project.
3. In Supabase SQL Editor, run `supabase/schema.sql`, then `supabase/seed.sql`.
4. Copy `.env.example` to `.env.local` and add your Supabase Project URL and Publishable Key.
5. Run `npm install`.
6. Run `npm run dev`.
7. Open http://localhost:3000.

## Routes
- `/login` and `/signup`
- `/dashboard`
- `/practice`
- `/mock`
- `/exam?mode=A`, `/exam?mode=B`, `/exam?mode=AB`
- `/results?id=...`
- `/analytics`
- `/revision`
- `/sources`
- `/admin/questions`

## Security
The schema enables Row Level Security. Questions are readable by authenticated users. Attempts, answers, bookmarks and profiles are scoped to the signed-in user.

## Source policy
The included 100 questions are the original source-aware practice bank from v4. Third-party material is labelled as memory-based, sample-pattern or practice-style and is not represented as an official C-DAC paper. The source links are kept in the Sources page.

## Next production stages
- Admin role enforcement using profiles.role
- Full CRUD question manager
- Server-side exam session/timer persistence
- Bookmark UI persistence
- Topic-level analytics
- Daily practice and adaptive tests
- Email/OAuth login options
- Vercel deployment + Supabase production configuration


## v5.3-v5.5 UI upgrade
The current build adds the LeetCode-inspired Problems interface, Day/Night theme, searchable/filterable question bank, difficulty progress, bookmark persistence, and focused practice workspace. See `STAGE_4_5.md`.


## v5.9–v5.10
See `STAGE_9_10.md` for security hardening, exam-integrity controls, RLS tightening and automated QA tests.

## v5.8-v6.0 integrated production release
- Advanced configurable mock builder and A/B/A+B simulations.
- Server-authoritative timers, answers and scoring.
- Admin-only question CRUD at `/admin/questions`.
- Production indexes and `audit_logs` migration.
- `/api/health` deployment smoke check.
- Loading/error/not-found boundaries.
- See `STAGES_11_13_6_0.md` for the complete release checklist.

## v6.1 Feature Integrations

New routes: `/ai-study`, `/leaderboard`, `/api/ai/explain`, `/api/ai/generate`, `/api/activity`, `/api/flags`, `/api/admin/flags`, `/api/admin/questions/import`.

Configure `OPENAI_API_KEY` and optionally `OPENAI_MODEL` for AI features. AI keys are server-side only.
