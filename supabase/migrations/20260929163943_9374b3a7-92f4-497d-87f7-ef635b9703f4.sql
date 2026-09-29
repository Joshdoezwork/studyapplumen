CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled note',
  body text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT 'general',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notes TO authenticated;
GRANT ALL ON public.notes TO service_role;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own notes" ON public.notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX notes_user_idx ON public.notes(user_id, updated_at DESC);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER notes_touch BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE POLICY "Own note files read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'note-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own note files insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'note-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Own note files delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'note-files' AND (storage.foldername(name))[1] = auth.uid()::text);