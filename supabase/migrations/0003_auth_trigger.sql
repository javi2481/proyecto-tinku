-- =============================================================================
-- Tinkú — 0003 Auth trigger: crear profile + subscription al crear auth.users
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.users.raw_user_meta_data lleva { full_name, timezone } si la Server Action
  -- las envía; si no, usamos defaults seguros.
  INSERT INTO public.profiles (id, email, full_name, timezone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Argentina/Buenos_Aires'),
    'parent'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (parent_id, status)
  VALUES (NEW.id, 'free')
  ON CONFLICT (parent_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user IS
  'Crea profile + subscription(free) al crear un auth.users. Atómico con el signup. Ola 1: asume rol parent. Alumnos anónimos omiten este trigger porque raw_user_meta_data->>''role'' = ''student''.';

-- Skip trigger para alumnos (anonymous sign-ins marcados con role=student en metadata)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'parent') = 'student' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, timezone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Argentina/Buenos_Aires'),
    'parent'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (parent_id, status)
  VALUES (NEW.id, 'free')
  ON CONFLICT (parent_id) DO NOTHING;

  RETURN NEW;
END;
$$;
