# C-CAT Exam Simulator v5.3–v5.5 — LeetCode-Inspired UI + Question Bank

Implemented on top of the uploaded v5.1 Production Exam Engine.

## Stage 4 — LeetCode UI Foundation
- Day/Night theme system with local persistence.
- LeetCode-inspired developer-centric navigation.
- Compact problem-platform cards, badges and controls.
- Responsive desktop/tablet/mobile layouts.
- Skeleton/transition-ready design primitives.
- Inter + JetBrains Mono typography.
- Orange primary accent with success/error/difficulty states.

## Stage 5 — Question Bank
- Search by question/topic/ID.
- Filter by Section, Topic, Difficulty and Status.
- Solved / attempted / todo / bookmarked states.
- Progress counters by difficulty.
- Question table optimized for scanning.
- Source labels remain visible.
- Save/bookmark persistence through Supabase.
- Slide-like focused workspace rendered below the table on selection.
- Practice mode exposes explanations; the secure mock engine remains server-authoritative.

## Important architecture rule
Practice questions may include answers because practice feedback requires them. Active mock exams continue to use the v5.1 secure payload and do not send correct answers to the exam client.

## Setup
```bash
npm install
npm run typecheck
npm run lint
npm run build
npm run dev
```

The database already contains the `bookmarks` table in the v5.1 schema, so no additional migration is required for this UI stage.
