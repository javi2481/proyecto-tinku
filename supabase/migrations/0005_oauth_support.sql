-- 0005_oauth_support.sql
-- Habilita Google (y otros OAuth providers) como método de signup.
-- Actualiza el trigger handle_new_user para:
--   1. Detectar el provider (raw_app_meta_data->>'provider'): 'email' vs 'google'/'apple'/etc
--   2. Marcar email_double_opt_in_completed=true automáticamente para usuarios OAuth
--      (Google/Apple/etc. ya verificaron el email, no hace falta nuestro doble opt-in).
--   3. Resolver full_name priorizando 'full_name' > 'name' (Google usa 'name') > prefix del email.
--   4. Si ya existe un profile para este id (ej: auto-link entre password y OAuth del mismo email),
--      solo "upgrade" email_double_opt_in_completed a true, nunca downgrade a false.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider TEXT;
  v_is_oauth BOOLEAN;
  v_full_name TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Skip para alumnos (anonymous sign-ins con role=student en user_metadata)
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'parent') = 'student' THEN
    RETURN NEW;
  END IF;

  v_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  v_is_oauth := v_provider NOT IN ('email', '');

  v_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'name', ''),          -- Google usa 'name'
    NULLIF(NEW.raw_user_meta_data->>'given_name', ''),
    split_part(NEW.email, '@', 1)
  );

  v_avatar_url := NULLIF(NEW.raw_user_meta_data->>'avatar_url', '');

  INSERT INTO public.profiles (
    id, email, full_name, timezone, role, email_double_opt_in_completed
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'timezone', ''), 'America/Argentina/Buenos_Aires'),
    'parent',
    v_is_oauth
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    -- Solo upgrade a true, nunca downgrade: si ya estaba true, queda true
    email_double_opt_in_completed = public.profiles.email_double_opt_in_completed
      OR EXCLUDED.email_double_opt_in_completed;

  INSERT INTO public.subscriptions (parent_id, status)
  VALUES (NEW.id, 'free')
  ON CONFLICT (parent_id) DO NOTHING;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS
  'Crea profile + subscription al crear auth.users. Detecta OAuth vs email; para OAuth marca email_double_opt_in_completed=true automáticamente (email ya verificado por el provider). Skippea role=student (alumnos anónimos).';

-- Back-fill: usuarios OAuth ya existentes que quedaron con email_double_opt_in_completed=false.
-- (Si Javier ya hizo un Google login antes de esta migration, dejarlo verificado.)
UPDATE public.profiles p
SET email_double_opt_in_completed = true
FROM auth.users u
WHERE p.id = u.id
  AND p.email_double_opt_in_completed = false
  AND COALESCE(u.raw_app_meta_data->>'provider', 'email') NOT IN ('email', '');
