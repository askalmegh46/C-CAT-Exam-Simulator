# Stage 11 / v5.8 — Advanced Mock Engine

Implemented on top of v5.10 security/testing base.

## Features
- Advanced mock builder for Section A, Section B, and full A+B.
- Configurable question count per section (10/20/30/40/50).
- Topic and difficulty filters applied server-side.
- Randomized question selection.
- Server-persisted session configuration.
- 60-minute per-section timing and 120-minute A+B overall timing.
- Section A -> Section B transition after timer expiry or when every Section A question is answered.
- Section timer enforced by answer API.
- Secure mock mode keeps answers/explanations out of the active exam response.
- Existing autosave, review, palette, server scoring and result flow retained.

## Validation
Run `npm install`, then `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build`.
