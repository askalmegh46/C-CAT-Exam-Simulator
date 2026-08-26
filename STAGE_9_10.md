# C-CAT Exam Simulator v5.9–v5.10 — Security + Testing

## Stage 9 — Security & Exam Integrity
- Same-origin checks on state-changing exam endpoints.
- Lightweight per-instance request throttling on exam start/answer/advance/submit.
- Production security headers in Next.js.
- Explicit authenticated RLS policies for profiles, attempts, answers, sessions, bookmarks and notes.
- Students cannot mutate the question bank.
- Ownership is checked on exam session queries.
- Correct answers remain server-side during an active exam.
- New migration: `supabase/migrations/003_security_hardening.sql`.

### Production note
The in-process limiter protects a single runtime instance. For horizontally scaled Vercel production, replace/augment it with a distributed limiter (for example Upstash Redis) before relying on it as the sole abuse-control mechanism.

## Stage 10 — Testing & QA
- Vitest configured.
- `npm test` runs automated tests.
- Scoring rules tested.
- A/B/AB duration rules tested.
- Same-origin security invariant tested.
- Answer-option validation invariant tested.

Run:
```powershell
npm install
npm test
npm run typecheck
npm run lint
npm run build
```

Apply migration 003 to Supabase before production use.
