
-- study_goals
CREATE TABLE public.study_goals (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_minutes_target integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_goals TO authenticated;
GRANT ALL ON public.study_goals TO service_role;
ALTER TABLE public.study_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own goal select" ON public.study_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own goal upsert" ON public.study_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own goal update" ON public.study_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- study_sessions
CREATE TABLE public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  minutes integer NOT NULL CHECK (minutes > 0),
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX study_sessions_user_started_idx ON public.study_sessions(user_id, started_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated;
GRANT ALL ON public.study_sessions TO service_role;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own session select" ON public.study_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own session insert" ON public.study_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own session delete" ON public.study_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- planner_events
CREATE TABLE public.planner_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text,
  type text NOT NULL DEFAULT 'study',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  notes text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX planner_events_user_start_idx ON public.planner_events(user_id, starts_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_events TO authenticated;
GRANT ALL ON public.planner_events TO service_role;
ALTER TABLE public.planner_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own event all" ON public.planner_events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- tutor_messages
CREATE TABLE public.tutor_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX tutor_messages_user_idx ON public.tutor_messages(user_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tutor_messages TO authenticated;
GRANT ALL ON public.tutor_messages TO service_role;
ALTER TABLE public.tutor_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tutor select" ON public.tutor_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own tutor insert" ON public.tutor_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tutor delete" ON public.tutor_messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- generated_lessons (cache; one row per user/subject/topic/grade)
CREATE TABLE public.generated_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text NOT NULL,
  grade smallint NOT NULL,
  content_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject, topic, grade)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.generated_lessons TO authenticated;
GRANT ALL ON public.generated_lessons TO service_role;
ALTER TABLE public.generated_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own lesson all" ON public.generated_lessons FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
