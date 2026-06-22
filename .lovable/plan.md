## What I'll build (one round)

### 1. Personal Dashboard (`/`)
Replace current index with:
- Daily study goal (minutes today vs target) + edit
- Streak counter (consecutive days with a logged study session)
- Upcoming assignments/exams (next 5)
- Progress strip: weekly study minutes, quizzes taken, avg score
- Quick-launch cards to every module

### 2. Study Planner (`/planner`)
- Month calendar with color-coded subjects
- Create/edit events: title, subject, date/time, type (study / assignment / exam), notes
- Today's list view + upcoming list
- Toast reminders for events due in the next hour (in-tab; real push needs native — out of scope)

### 3. AI Study Assistant (`/tutor`)
- Streaming chat using Lovable AI Gateway (`google/gemini-3-flash-preview`)
- Three quick actions in composer: "Explain simply", "Summarize my notes", "Make me a quiz"
- "Summarize my notes" pulls the user's notes from `/notes` and feeds them in
- Conversation history persisted per user (single thread for v1)

### 4. AI Quiz Generator (`/quiz-generator`)
- Paste text OR pick an existing note OR pick a Lifepac lesson
- Choose count (5/10/15), types (MC / true-false / short answer), difficulty
- Server fn calls Lovable AI with a strict JSON schema → renders an interactive quiz with instant feedback + saves score to `quiz_scores`

### 5. Lifepac-style Lessons (integrated into `/games/$subject`)
- New "Learn" tab next to the existing topic picker on each subject page
- Pick grade (9-12) + topic → AI generates a Lifepac-style lesson: objectives, reading, worked examples, vocabulary, self-check questions
- Lessons cached in `generated_lessons` table so repeat opens are instant and free
- Clear disclaimer: "AI-generated lessons in the style of mastery-based curricula. Not official Alpha Omega LIFEPAC® content."

### 6. Performance Analytics (`/analytics`)
- Total study minutes (week/month), quizzes taken, average score
- Per-subject bar chart (recharts) of accuracy
- Strengths/weaknesses: top 2 and bottom 2 subjects by avg score
- Last 14 days study-minute line chart
- AI-generated improvement suggestion (1 paragraph) based on the above

### 7. Light polish on existing modules
- Notes/flashcards/pomodoro stay; pomodoro sessions over 5 min auto-log to `study_sessions` so streak + analytics work
- Sidebar updated with new routes

## Database (one migration)

```text
study_goals(user_id, daily_minutes_target)              -- 1 row per user
study_sessions(user_id, started_at, minutes, source)    -- pomodoro + manual logs
planner_events(user_id, title, subject, type, starts_at, ends_at, notes, color)
tutor_messages(user_id, role, content, created_at)      -- single thread per user
generated_lessons(user_id, subject, topic, grade, content_json, created_at)
```
All RLS-scoped to `auth.uid()`, with proper GRANTs.

## Tech notes (for the technical reader)

- AI: TanStack `createServerFn` for one-shot calls (quiz gen, lesson gen, suggestions); server route `/api/chat` with `streamText` + `useChat` for the tutor. All via Lovable AI Gateway, model `google/gemini-3-flash-preview`. Server reads `LOVABLE_API_KEY`.
- Structured output via AI SDK `Output.object` + Zod for quiz and lesson schemas.
- Charts via existing `recharts`.
- Calendar: lightweight custom month grid (no new heavy dep) using existing shadcn `Calendar` for date picking.
- Streak = count of distinct days with a `study_sessions` row, walking back from today.
- "Reminders" = in-app toast poller every 60s while tab open. True push notifications need a native shell, called out as future work.
- Offline mode (notes/flashcards): notes & flashcards already use localStorage, so they work offline today. I'll add an "offline-ready" badge and leave full PWA/service-worker out of v1 (mention as future work).

## Scope I'm explicitly NOT doing this round
- Real OS push notifications (needs native app shell)
- Full PWA / service worker offline sync for DB-backed data
- Rich-text WYSIWYG note editor with PDF/image upload (current notes editor stays; can do next round)
- Spaced-repetition algorithm for flashcards (current flashcards stay basic; can do next round)

If any of those are deal-breakers, tell me and I'll fold them in or swap something out. Otherwise approve and I'll build.