# C-CAT Mock Test Center UI Fix — v6.1

## What changed
- Redesigned `/mock` as a responsive Mock Test Center with three clear modes.
- Added 1,000-question-bank, scoring, exam-mode and review indicators.
- Added responsive cards for Section A, Section B and Full C-CAT Mock.
- Added pre-exam rules and clearer full-mock explanation.
- Redesigned the live exam screen for desktop, tablet and phone widths.
- Added sticky exam header and timer, progress bar, responsive question palette and live answered/open/review counts.
- Added accessible answer states and palette labels.
- Added mobile bottom action bar and compact 8/10-column question palettes.
- Added reduced-motion support.
- Kept the existing exam engine/API/database behavior intact.

## Supported layouts
- Desktop: 1050px+
- Tablet: 701–1049px
- Mobile: 431–700px
- Small phones: <=430px

## Validation
- Question-bank validator passes: 1,000 questions.
- Full dependency install/build was attempted, but `npm install` timed out in the execution environment. No application source dependency was changed for the UI work.
