# Stage 6 / v5.5 — LeetCode-Inspired Exam Workspace

Implemented on top of the Stage 4–5 Question Bank project.

## Implemented
- Secure exam top bar with section, question progress, and timer.
- Split-pane question + workspace layout on desktop.
- Responsive stacked layout on mobile/tablet.
- Multiple-choice workspace with selected-state feedback.
- Persistent answer autosave through existing server API.
- Mark-for-review persistence and palette state.
- Question palette with answered/review/current states.
- Scratchpad for private working.
- Optional arithmetic calculator with safe character validation.
- Hint panel that explicitly preserves exam-mode restrictions.
- Source label display when supplied by the server.
- Practice-style feedback is intentionally not exposed in the secure mock screen.
- Removed `explanation` from the active exam GET payload so the exam client does not receive post-answer explanation data.
- Previous/Next navigation and section transition preserved.
- Existing server-side scoring/submission flow preserved.

## Run
npm install
npm run typecheck
npm run lint
npm run build
npm run dev

## Notes
The current exam API remains authoritative for answers, review state, session state, scoring and submission. The UI does not calculate the exam score.
