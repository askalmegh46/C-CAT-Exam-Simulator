# Production Deployment — GitHub + Vercel + Supabase

## Supabase
1. Create a production Supabase project.
2. Run `supabase/schema.sql` for a fresh database, or apply migrations `001` through `005` to an existing project.
3. Seed the question bank using `supabase/seed.sql` only after reviewing source labels/provenance.
4. Configure Auth redirect URLs for local and production origins.
5. Verify RLS policies.

## Local
```powershell
copy .env.example .env.local
npm install
npm run typecheck
npm test
npm run lint
npm run build
npm run dev
```

## GitHub
```powershell
git init
git add .
git commit -m "C-CAT simulator v6 production release"
git branch -M main
git remote add origin <YOUR_REPOSITORY_URL>
git push -u origin main
```
Do not commit `.env.local`.

## Vercel
1. Import the GitHub repository.
2. Framework preset: Next.js.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Production/Preview/Development as appropriate.
4. Deploy.
5. Open `/api/health` and confirm `{ "ok": true, "database": "ok" }`.
6. Test login, mock creation, exam submission and admin authorization.

## Production security
Do not expose Supabase service-role keys in browser/client code. The included rate limiter is per instance; use a distributed rate limiter for high-scale multi-instance deployments.

## v6.1 Feature configuration

1. Apply `supabase/migrations/006_ai_gamification_analytics_admin.sql` after the existing migrations.
2. Add `OPENAI_API_KEY` as a server-side environment variable in local `.env.local` and Vercel. Do not expose it with `NEXT_PUBLIC_`.
3. Optional: set `OPENAI_MODEL` (default `gpt-5.6-luna`).
4. Test `/api/health`, `/leaderboard`, `/ai-study`, practice AI explanations, CSV import, and the admin flag queue.

AI-generated questions are stored separately in `ai_generated_questions` and are not automatically promoted to the official question bank.
