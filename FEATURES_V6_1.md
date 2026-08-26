# C-CAT Simulator v6.1 — Integrated Feature Upgrade

Implemented on top of v6.0:

- AI Study Assistant using a server-side OpenAI Responses API integration.
- AI-generated adaptive practice sets based on topic and recent weak signals. Generated content is stored separately and clearly labeled as non-official.
- Global leaderboard and global-average peer benchmark through security-definer Supabase functions.
- Achievement badges and daily activity/streak tracking.
- Per-question time tracking in exam sessions and attempt answers.
- Analytics cards for average time/question and peer benchmark.
- Student question flagging with reasons and details.
- Admin flag review queue with resolve/dismiss/reviewing states.
- Admin CSV bulk question import with validation and audit logging.

Environment:
- OPENAI_API_KEY must be configured server-side for AI features.
- OPENAI_MODEL defaults to gpt-5.6-luna.

CSV columns:
id,section,topic,difficulty,question,option_a,option_b,option_c,option_d,correct_answer,explanation,source_type,source_label

AI-generated questions are intentionally kept outside the official question bank until an administrator reviews/imports them.
