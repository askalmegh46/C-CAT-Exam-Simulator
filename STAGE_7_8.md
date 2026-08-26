# C-CAT Exam Simulator v5.6–v5.7 — Stages 7–8

## Stage 7 — Dashboard + Analytics 2.0
- Activity heatmap based on correct answers from the user's attempts.
- Topic proficiency bars calculated from attempt answers.
- Skill-map visualization using a CSS radar-style presentation.
- Attempts, average score, accuracy and best score cards.
- Recent mock activity.
- Dashboard now surfaces analytics, quick revision and weak-area workflow.

## Stage 8 — Revision + Learning
- Revision queue built from bookmarks and incorrect historical answers.
- Bookmarked / incorrect / unreviewed filters.
- Persistent personal notes per question.
- Mark-as-reviewed action.
- High-yield memory-trick section.
- Important-question checklist.
- Revision statistics.

## Data model
`supabase/migrations/002_learning_analytics.sql` adds `user_question_notes` and supporting indexes/RLS. `supabase/schema.sql` is updated for fresh databases.

## Security
- All notes are scoped by `auth.uid()` through RLS.
- Analytics only query attempts belonging to the authenticated user.
- Active exam scoring remains server-authoritative from v5.1.

## Validation
Run on Windows:

```powershell
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```
