# C-CAT Exam Simulator v6 — Next.js + Supabase

Production-oriented C-CAT practice and mock-exam simulator with a **1,000-question PostgreSQL/Supabase bank**.

## Question bank

The bank is aligned to the current C-DAC C-CAT Sections A and B syllabus. C-DAC lists four Section A topics and five Section B topics; each section of C-CAT contains 50 objective questions and uses +3/-1/0 scoring.

| Section | Topic | Questions |
|---|---|---:|
| A | English | 125 |
| A | Quantitative Aptitude | 125 |
| A | Reasoning | 125 |
| A | Computer Fundamentals & Concepts of Programming | 125 |
| **A subtotal** | | **500** |
| B | C Programming | 100 |
| B | Data Structures | 100 |
| B | OOP Concepts using C++ | 100 |
| B | Operating Systems & Networking | 100 |
| B | Basics of Big Data & Artificial Intelligence | 100 |
| **B subtotal** | | **500** |
| **Total** | | **1,000** |

## Exam generation

- Section A mock: 50 randomly selected questions, balanced across the four Section A topics.
- Section B mock: 50 randomly selected questions, balanced across the five Section B topics.
- Full A+B mock: 50 Section A + 50 Section B.
- Each generated exam is shuffled.
- Scoring: +3 correct, -1 wrong, 0 unanswered.

## Setup

1. Install Node.js 20+.
2. Create a Supabase project.
3. Run `supabase/schema.sql` in Supabase SQL Editor.
4. Run `supabase/seed.sql` in Supabase SQL Editor.
5. Copy `.env.example` to `.env.local` and add the Supabase Project URL and Publishable Key.
6. Run `npm install`.
7. Run `npm run validate:questions`.
8. Run `npm run dev`.

## Important Supabase URL

`NEXT_PUBLIC_SUPABASE_URL` must be the project API URL:

`https://YOUR_PROJECT_REF.supabase.co`

Do not use a Supabase Dashboard URL such as `https://supabase.com/dashboard/project/...`.

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

## Source policy

The original 100 seed questions are preserved with their existing source labels. The additional questions are marked `Original generated practice` and are original simulator practice items; they are not represented as official C-DAC questions.

## Next production stages

- Admin role enforcement using `profiles.role`
- Full CRUD question manager
- Question import/export tools
- Topic-level analytics
- Daily practice and adaptive tests
- More robust question-quality review workflow
- Vercel deployment + Supabase production configuration
