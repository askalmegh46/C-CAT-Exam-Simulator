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
