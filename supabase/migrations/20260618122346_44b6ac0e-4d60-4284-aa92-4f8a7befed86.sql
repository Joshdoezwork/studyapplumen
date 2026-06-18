ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
UPDATE public.profiles SET username = 'user_' || substr(id::text, 1, 8) WHERE username IS NULL;
ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_key ON public.profiles (lower(username));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format CHECK (username ~ '^[A-Za-z0-9_]{3,20}$');