-- =============================================================================
-- Tinkú — 0002 RLS Policies (Ola 1)
-- =============================================================================

ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE students            ENABLE ROW LEVEL SECURITY;
ALTER TABLE parental_consents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_links       ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises           ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_concepts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_rules            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_mastery     ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges_catalog      ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_badges      ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_logs            ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY profiles_select_own ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_insert_own ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- SUBSCRIPTIONS
CREATE POLICY subscriptions_select_own ON subscriptions FOR SELECT TO authenticated USING (parent_id = auth.uid());

-- STUDENTS
CREATE POLICY students_parent_select ON students FOR SELECT TO authenticated
  USING (parent_id = auth.uid() AND deleted_at IS NULL);
CREATE POLICY students_parent_insert ON students FOR INSERT TO authenticated
  WITH CHECK (parent_id = auth.uid());
CREATE POLICY students_parent_update ON students FOR UPDATE TO authenticated
  USING (parent_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (parent_id = auth.uid());
CREATE POLICY students_self_select ON students FOR SELECT TO authenticated
  USING (
    auth_user_id = auth.uid()
    AND deleted_at IS NULL
    AND consent_revoked_at IS NULL
    AND deletion_requested_at IS NULL
  );

-- PARENTAL_CONSENTS (inmutable)
CREATE POLICY parental_consents_parent_select ON parental_consents FOR SELECT TO authenticated
  USING (parent_id = auth.uid());

-- EMAIL_VERIFICATIONS
CREATE POLICY email_verif_select_own ON email_verifications FOR SELECT TO authenticated
  USING (profile_id = auth.uid());

-- CONTENT TABLES
CREATE POLICY concepts_read ON concepts FOR SELECT TO authenticated USING (deleted_at IS NULL);
CREATE POLICY concept_links_read ON concept_links FOR SELECT TO authenticated USING (true);
CREATE POLICY xp_rules_read ON xp_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY badges_catalog_read ON badges_catalog FOR SELECT TO authenticated USING (is_active = true);

-- EXERCISES (solo approved)
CREATE POLICY exercises_read_approved ON exercises FOR SELECT TO authenticated
  USING (deleted_at IS NULL AND pedagogical_review_status = 'approved');

-- EXERCISE_CONCEPTS
CREATE POLICY exercise_concepts_read ON exercise_concepts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM exercises e
      WHERE e.id = exercise_concepts.exercise_id
        AND e.deleted_at IS NULL
        AND e.pedagogical_review_status = 'approved'
    )
  );

-- SESSIONS
CREATE POLICY sessions_parent_select  ON sessions FOR SELECT TO authenticated USING (is_parent_of(student_id));
CREATE POLICY sessions_student_select ON sessions FOR SELECT TO authenticated USING (is_student_self(student_id));
CREATE POLICY sessions_student_insert ON sessions FOR INSERT TO authenticated WITH CHECK (is_student_self(student_id));
CREATE POLICY sessions_student_update ON sessions FOR UPDATE TO authenticated
  USING (is_student_self(student_id)) WITH CHECK (is_student_self(student_id));

-- ATTEMPTS (inmutable)
CREATE POLICY attempts_parent_select  ON attempts FOR SELECT TO authenticated USING (is_parent_of(student_id));
CREATE POLICY attempts_student_select ON attempts FOR SELECT TO authenticated USING (is_student_self(student_id));
CREATE POLICY attempts_student_insert ON attempts FOR INSERT TO authenticated WITH CHECK (is_student_self(student_id));

-- CONCEPT_MASTERY
CREATE POLICY mastery_parent_select  ON concept_mastery FOR SELECT TO authenticated USING (is_parent_of(student_id));
CREATE POLICY mastery_student_select ON concept_mastery FOR SELECT TO authenticated USING (is_student_self(student_id));
CREATE POLICY mastery_student_insert ON concept_mastery FOR INSERT TO authenticated WITH CHECK (is_student_self(student_id));
CREATE POLICY mastery_student_update ON concept_mastery FOR UPDATE TO authenticated
  USING (is_student_self(student_id)) WITH CHECK (is_student_self(student_id));

-- STUDENT_BADGES
CREATE POLICY student_badges_parent_select  ON student_badges FOR SELECT TO authenticated USING (is_parent_of(student_id));
CREATE POLICY student_badges_student_select ON student_badges FOR SELECT TO authenticated USING (is_student_self(student_id));
CREATE POLICY student_badges_student_insert ON student_badges FOR INSERT TO authenticated WITH CHECK (is_student_self(student_id));

-- DATA_ACCESS_LOG (inmutable, service_role para INSERT)
CREATE POLICY data_access_log_parent_select ON data_access_log FOR SELECT TO authenticated
  USING (is_parent_of(student_id));

-- APP_LOGS: sin policies → sólo service_role.
