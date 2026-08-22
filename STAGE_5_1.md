# C-CAT Exam Simulator v5.1 — Production Exam Engine

## Implemented
- Server-created exam sessions for A, B and A+B.
- Persistent session state in Supabase.
- Server-side question selection and secure exam payloads that omit `correct_answer`.
- Persistent answer autosave.
- Persistent mark-for-review state.
- Section A/B one-hour timers.
- Two-hour A+B session with server-side section transition.
- Server-side scoring on submission.
- Automatic attempt/result persistence.
- Resume active session after refresh/navigation.
- New Supabase migration: `supabase/migrations/001_exam_engine.sql`.

## Setup
1. Run `supabase/schema.sql` for a fresh database, or run `supabase/migrations/001_exam_engine.sql` on an existing v5 database.
2. Run `supabase/seed.sql` if the question bank is not already loaded.
3. Configure `.env.local` using the Supabase project URL and publishable key.
4. Run `npm install` and `npm run dev`.

## Validation
Dependency installation/build was not completed in this environment because `npm install` timed out. Run locally:

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

## Next stage
v5.2 should harden authorization for admin CRUD, add topic-level analytics, add attempt review, and introduce server-authoritative anti-tamper protections for session mutations.
