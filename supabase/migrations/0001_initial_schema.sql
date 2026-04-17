-- =============================================================================
-- Tinkú — 0001 Initial Schema (Ola 1)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
CREATE TYPE user_role              AS ENUM ('parent', 'teacher', 'admin');
CREATE TYPE subscription_status    AS ENUM ('free', 'premium_active', 'premium_cancelled', 'premium_past_due');
CREATE TYPE grade_level            AS ENUM ('grade_1','grade_2','grade_3','grade_4','grade_5','grade_6','grade_7');
CREATE TYPE subject                AS ENUM ('math','language','science','social','tech','arts','ethics');
CREATE TYPE exercise_type          AS ENUM ('multiple_choice','fill_blank','drag_drop','matching','numeric_input','h5p_embedded');
CREATE TYPE exercise_difficulty    AS ENUM ('easy','medium','hard');
CREATE TYPE answer_outcome         AS ENUM ('correct_first','correct_retry','incorrect','skipped');
CREATE TYPE session_close_reason   AS ENUM ('user_exit','timeout','device_switched','parental_limit','error');
CREATE TYPE consent_event_type     AS ENUM ('granted','revoked','reconfirmed');
CREATE TYPE email_verify_purpose   AS ENUM ('signup','consent_reconfirmation','password_reset');

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'parent',
  full_name TEXT NOT NULL CHECK (length(full_name) BETWEEN 2 AND 120),
  email TEXT NOT NULL UNIQUE CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone TEXT,
  whatsapp_opt_in BOOLEAN NOT NULL DEFAULT false,
  preferred_language TEXT NOT NULL DEFAULT 'es-AR',
  timezone TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
  email_double_opt_in_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_profiles_role  ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'free',
  provider TEXT,
  provider_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  price_ars INTEGER CHECK (price_ars IS NULL OR price_ars >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_status      ON subscriptions(status);
CREATE INDEX idx_subscriptions_provider_id ON subscriptions(provider_subscription_id);

-- STUDENTS
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL CHECK (length(first_name) BETWEEN 1 AND 40),
  birth_year INTEGER NOT NULL CHECK (birth_year >= 2010 AND birth_year <= 2025),
  current_grade grade_level NOT NULL,
  avatar_id TEXT NOT NULL DEFAULT 'avatar_01',
  login_code TEXT NOT NULL UNIQUE CHECK (login_code ~ '^[A-Z2-9]{6}$'),
  login_code_expires_at TIMESTAMPTZ,
  streak_current INTEGER NOT NULL DEFAULT 0 CHECK (streak_current >= 0),
  streak_max INTEGER NOT NULL DEFAULT 0 CHECK (streak_max >= 0),
  last_active_at TIMESTAMPTZ,
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  parental_consent_given BOOLEAN NOT NULL DEFAULT false,
  parental_consent_at TIMESTAMPTZ,
  parental_consent_ip INET,
  parental_consent_user_agent TEXT,
  consent_revoked_at TIMESTAMPTZ,
  deletion_requested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_consent_evidence CHECK (
    (parental_consent_given = false)
    OR (parental_consent_at IS NOT NULL AND parental_consent_ip IS NOT NULL)
  ),
  CONSTRAINT chk_streak_max_ge_current CHECK (streak_max >= streak_current)
);
CREATE INDEX idx_students_parent       ON students(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_auth_user    ON students(auth_user_id) WHERE auth_user_id IS NOT NULL;
CREATE INDEX idx_students_login_code   ON students(login_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_grade        ON students(current_grade);

-- PARENTAL_CONSENTS (event log inmutable)
CREATE TABLE parental_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  event_type consent_event_type NOT NULL,
  consent_text_version TEXT NOT NULL,
  ip INET,
  user_agent TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_parental_consents_student ON parental_consents(student_id);
CREATE INDEX idx_parental_consents_parent  ON parental_consents(parent_id);
CREATE INDEX idx_parental_consents_created ON parental_consents(created_at DESC);

-- EMAIL_VERIFICATIONS
CREATE TABLE email_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  purpose email_verify_purpose NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  ip_sent INET,
  ip_verified INET,
  attempts SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_email_verif_profile ON email_verifications(profile_id);
CREATE INDEX idx_email_verif_expires ON email_verifications(expires_at);

-- CONCEPTS
CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9_]{4,40}$'),
  primary_subject subject NOT NULL,
  grade grade_level NOT NULL,
  name_es TEXT NOT NULL,
  description_es TEXT,
  nap_reference TEXT,
  prerequisites UUID[] NOT NULL DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_concepts_subject_grade ON concepts(primary_subject, grade) WHERE deleted_at IS NULL;
CREATE INDEX idx_concepts_code          ON concepts(code);

-- CONCEPT_LINKS
CREATE TABLE concept_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  target_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL,
  strength SMALLINT NOT NULL DEFAULT 1 CHECK (strength BETWEEN 1 AND 5),
  description_es TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_concept_links UNIQUE (source_concept_id, target_concept_id, link_type),
  CONSTRAINT chk_different_concepts CHECK (source_concept_id <> target_concept_id)
);
CREATE INDEX idx_concept_links_source ON concept_links(source_concept_id);
CREATE INDEX idx_concept_links_target ON concept_links(target_concept_id);

-- EXERCISES
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE RESTRICT,
  exercise_type exercise_type NOT NULL,
  difficulty exercise_difficulty NOT NULL,
  title_es TEXT NOT NULL,
  prompt_es TEXT NOT NULL,
  content JSONB NOT NULL,
  h5p_content_id TEXT,
  correct_answer JSONB NOT NULL,
  hints JSONB NOT NULL DEFAULT '[]'::jsonb,
  pedagogical_review_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (pedagogical_review_status IN ('pending','approved','rejected','needs_revision')),
  pedagogical_reviewer_id UUID REFERENCES profiles(id),
  pedagogical_reviewed_at TIMESTAMPTZ,
  pedagogical_notes TEXT,
  estimated_time_seconds INTEGER NOT NULL DEFAULT 60 CHECK (estimated_time_seconds > 0),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_h5p_consistency CHECK (
    (exercise_type = 'h5p_embedded' AND h5p_content_id IS NOT NULL)
    OR (exercise_type <> 'h5p_embedded')
  )
);
CREATE INDEX idx_exercises_concept       ON exercises(concept_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_exercises_difficulty    ON exercises(difficulty);
CREATE INDEX idx_exercises_review_status ON exercises(pedagogical_review_status);

-- EXERCISE_CONCEPTS (N:N)
CREATE TABLE exercise_concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE RESTRICT,
  weight NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (weight > 0 AND weight <= 1),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_exercise_concept UNIQUE (exercise_id, concept_id)
);
CREATE INDEX idx_exercise_concepts_exercise ON exercise_concepts(exercise_id);
CREATE INDEX idx_exercise_concepts_concept  ON exercise_concepts(concept_id);
CREATE UNIQUE INDEX uq_exercise_primary_concept
  ON exercise_concepts(exercise_id) WHERE is_primary = true;

-- XP_RULES
CREATE TABLE xp_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  difficulty exercise_difficulty NOT NULL,
  outcome answer_outcome NOT NULL,
  base_xp INTEGER NOT NULL CHECK (base_xp >= 0),
  hint_penalty INTEGER NOT NULL DEFAULT 1 CHECK (hint_penalty >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_xp_rule UNIQUE (difficulty, outcome)
);

-- SESSIONS
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  island subject NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  exercises_attempted INTEGER NOT NULL DEFAULT 0 CHECK (exercises_attempted >= 0),
  exercises_correct INTEGER NOT NULL DEFAULT 0 CHECK (exercises_correct >= 0),
  xp_earned INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  close_reason session_close_reason,
  device_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_exercises_correct_le_attempted CHECK (exercises_correct <= exercises_attempted)
);
CREATE INDEX idx_sessions_student ON sessions(student_id);
CREATE INDEX idx_sessions_started ON sessions(started_at DESC);

-- ATTEMPTS (inmutable)
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE RESTRICT,
  attempt_number SMALLINT NOT NULL DEFAULT 1 CHECK (attempt_number >= 1),
  outcome answer_outcome NOT NULL,
  answer_given JSONB,
  time_spent_seconds INTEGER NOT NULL CHECK (time_spent_seconds >= 0),
  hints_used SMALLINT NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  xp_earned INTEGER NOT NULL DEFAULT 0 CHECK (xp_earned >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_attempts_student_concept_created
  ON attempts(student_id, concept_id, created_at DESC);
CREATE INDEX idx_attempts_session  ON attempts(session_id);
CREATE INDEX idx_attempts_exercise ON attempts(exercise_id);
CREATE INDEX idx_attempts_created  ON attempts(created_at DESC);

-- Trigger consistencia session-attempt
CREATE OR REPLACE FUNCTION check_attempt_session_consistency()
RETURNS TRIGGER AS $$
DECLARE
  sess_student UUID;
BEGIN
  SELECT student_id INTO sess_student FROM sessions WHERE id = NEW.session_id;
  IF sess_student IS NULL OR sess_student <> NEW.student_id THEN
    RAISE EXCEPTION 'attempt.student_id (%) no coincide con session.student_id (%)',
      NEW.student_id, sess_student;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_attempt_session_consistency
  BEFORE INSERT ON attempts
  FOR EACH ROW EXECUTE FUNCTION check_attempt_session_consistency();

-- CONCEPT_MASTERY
CREATE TABLE concept_mastery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  p_known NUMERIC(4,3) NOT NULL DEFAULT 0.100 CHECK (p_known >= 0 AND p_known <= 1),
  last_p_known_delta NUMERIC(5,3) NOT NULL DEFAULT 0.000,
  total_attempts INTEGER NOT NULL DEFAULT 0 CHECK (total_attempts >= 0),
  correct_attempts INTEGER NOT NULL DEFAULT 0 CHECK (correct_attempts >= 0),
  is_mastered BOOLEAN NOT NULL DEFAULT false,
  mastered_at TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_student_concept UNIQUE (student_id, concept_id),
  CONSTRAINT chk_correct_le_total CHECK (correct_attempts <= total_attempts)
);
CREATE INDEX idx_mastery_student  ON concept_mastery(student_id);
CREATE INDEX idx_mastery_concept  ON concept_mastery(concept_id);
CREATE INDEX idx_mastery_mastered ON concept_mastery(is_mastered) WHERE is_mastered = true;

-- BADGES_CATALOG
CREATE TABLE badges_catalog (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name_es TEXT NOT NULL,
  description_es TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0 CHECK (xp_reward >= 0),
  unlock_criteria JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- STUDENT_BADGES
CREATE TABLE student_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges_catalog(id) ON DELETE RESTRICT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uk_student_badge UNIQUE (student_id, badge_id)
);
CREATE INDEX idx_student_badges_student ON student_badges(student_id);

-- DATA_ACCESS_LOG (inmutable)
CREATE TABLE data_access_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  accessor_id UUID REFERENCES profiles(id),
  accessor_auth_uid UUID,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  access_type TEXT NOT NULL,
  access_target TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_access_log_student  ON data_access_log(student_id);
CREATE INDEX idx_access_log_accessor ON data_access_log(accessor_id);
CREATE INDEX idx_access_log_accessed ON data_access_log(accessed_at DESC);

-- APP_LOGS (observability)
CREATE TABLE app_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level TEXT NOT NULL CHECK (level IN ('debug','info','warn','error','fatal')),
  source TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  user_auth_uid UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_app_logs_level_created ON app_logs(level, created_at DESC);
CREATE INDEX idx_app_logs_source        ON app_logs(source);

-- TRIGGERS updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at      BEFORE UPDATE ON profiles      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_students_updated_at      BEFORE UPDATE ON students      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_concepts_updated_at      BEFORE UPDATE ON concepts      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_exercises_updated_at     BEFORE UPDATE ON exercises     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_mastery_updated_at       BEFORE UPDATE ON concept_mastery FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_xp_rules_updated_at      BEFORE UPDATE ON xp_rules      FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- FUNCIONES
CREATE OR REPLACE FUNCTION generate_login_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

CREATE OR REPLACE FUNCTION is_parent_of(p_student_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM students
    WHERE id = p_student_id AND parent_id = auth.uid() AND deleted_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_student_self(p_student_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM students
    WHERE id = p_student_id
      AND auth_user_id = auth.uid()
      AND deleted_at IS NULL
      AND consent_revoked_at IS NULL
      AND deletion_requested_at IS NULL
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- SEED
INSERT INTO xp_rules (difficulty, outcome, base_xp, hint_penalty) VALUES
  ('easy',   'correct_first', 5,  1),
  ('easy',   'correct_retry', 3,  1),
  ('easy',   'incorrect',     0,  0),
  ('easy',   'skipped',       0,  0),
  ('medium', 'correct_first', 10, 1),
  ('medium', 'correct_retry', 6,  1),
  ('medium', 'incorrect',     0,  0),
  ('medium', 'skipped',       0,  0),
  ('hard',   'correct_first', 20, 2),
  ('hard',   'correct_retry', 12, 2),
  ('hard',   'incorrect',     0,  0),
  ('hard',   'skipped',       0,  0);

INSERT INTO badges_catalog (code, name_es, description_es, icon_url, xp_reward, unlock_criteria) VALUES
  ('first_exercise',   'Primer paso',        'Completaste tu primer ejercicio. ¡Empezó la aventura!', '/badges/first_exercise.svg',   10,  '{"type":"first_attempt"}'),
  ('streak_3',         'Tres días',          'Tres días seguidos practicando. ¡Qué constancia!',      '/badges/streak_3.svg',         30,  '{"type":"streak","days":3}'),
  ('streak_7',         'Una semana',         'Una semana entera de aprendizaje. ¡Increíble!',         '/badges/streak_7.svg',         100, '{"type":"streak","days":7}'),
  ('concept_mastered', 'Dominé un concepto', 'Dominaste un concepto completo. A por el siguiente.',   '/badges/concept_mastered.svg', 25,  '{"type":"mastery"}'),
  ('explorer',         'Explorador',         'Visitaste todas las regiones de una isla.',             '/badges/explorer.svg',         50,  '{"type":"island_complete"}');
