-- =============================================================================
-- Tinkú — 0004 Seed contenido mínimo Ola 1
-- Grade 2 · Matemática · 3 conceptos × 3 ejercicios (multiple_choice)
-- Todos marcados pedagogical_review_status='approved' para MVP.
-- =============================================================================

-- CONCEPTOS
INSERT INTO concepts (code, primary_subject, grade, name_es, description_es, nap_reference, display_order) VALUES
  ('M2_NUM_1000',   'math', 'grade_2', 'Números hasta 1000',      'Leer, escribir y comparar números hasta el 1000.', 'NAP 2° - Eje Números', 1),
  ('M2_ADD_REGROUP','math', 'grade_2', 'Suma con reagrupamiento', 'Sumar dos números de 2 dígitos llevándose.',        'NAP 2° - Eje Operaciones', 2),
  ('M2_SUB_REGROUP','math', 'grade_2', 'Resta con reagrupamiento','Restar números de 2 dígitos pidiendo prestado.',    'NAP 2° - Eje Operaciones', 3);

-- EJERCICIOS — 3 por concepto (easy, medium, hard)

-- Concepto 1: Números hasta 1000
WITH c AS (SELECT id FROM concepts WHERE code='M2_NUM_1000')
INSERT INTO exercises (concept_id, exercise_type, difficulty, title_es, prompt_es, content, correct_answer, hints, pedagogical_review_status, estimated_time_seconds)
SELECT c.id, 'multiple_choice', 'easy',   'Orden 1',
  '¿Qué número va después del 249?',
  '{"options":["248","250","259","240"]}'::jsonb,
  '{"value":"250"}'::jsonb,
  '[{"text":"Al 249 le sumamos 1."}]'::jsonb,
  'approved', 30 FROM c
UNION ALL
SELECT c.id, 'multiple_choice', 'medium', 'Comparar',
  '¿Cuál es el número más grande?',
  '{"options":["472","427","742","724"]}'::jsonb,
  '{"value":"742"}'::jsonb,
  '[{"text":"Fijate primero en la cifra de las centenas (el primer número)."}]'::jsonb,
  'approved', 45 FROM c
UNION ALL
SELECT c.id, 'multiple_choice', 'hard',   'Valor posicional',
  'En el número 538, ¿qué valor tiene el 3?',
  '{"options":["3","30","300","3000"]}'::jsonb,
  '{"value":"30"}'::jsonb,
  '[{"text":"El 3 está en la posición de las decenas. Decenas = de a 10."}]'::jsonb,
  'approved', 60 FROM c;

-- Concepto 2: Suma con reagrupamiento
WITH c AS (SELECT id FROM concepts WHERE code='M2_ADD_REGROUP')
INSERT INTO exercises (concept_id, exercise_type, difficulty, title_es, prompt_es, content, correct_answer, hints, pedagogical_review_status, estimated_time_seconds)
SELECT c.id, 'multiple_choice', 'easy',   'Suma sin llevar',
  '¿Cuánto es 23 + 14?',
  '{"options":["37","47","36","38"]}'::jsonb,
  '{"value":"37"}'::jsonb,
  '[{"text":"Sumá primero las unidades, después las decenas."}]'::jsonb,
  'approved', 30 FROM c
UNION ALL
SELECT c.id, 'multiple_choice', 'medium', 'Suma llevando',
  '¿Cuánto es 28 + 15?',
  '{"options":["33","43","53","44"]}'::jsonb,
  '{"value":"43"}'::jsonb,
  '[{"text":"8 + 5 = 13. Escribís el 3 y te llevás 1."}]'::jsonb,
  'approved', 45 FROM c
UNION ALL
SELECT c.id, 'multiple_choice', 'hard',   'Dos reagrupamientos',
  '¿Cuánto es 47 + 36?',
  '{"options":["73","83","93","84"]}'::jsonb,
  '{"value":"83"}'::jsonb,
  '[{"text":"7 + 6 = 13 → 3 y te llevás 1. Después 4 + 3 + 1 = 8."}]'::jsonb,
  'approved', 60 FROM c;

-- Concepto 3: Resta con reagrupamiento
WITH c AS (SELECT id FROM concepts WHERE code='M2_SUB_REGROUP')
INSERT INTO exercises (concept_id, exercise_type, difficulty, title_es, prompt_es, content, correct_answer, hints, pedagogical_review_status, estimated_time_seconds)
SELECT c.id, 'multiple_choice', 'easy',   'Resta sencilla',
  '¿Cuánto es 48 - 23?',
  '{"options":["25","35","15","26"]}'::jsonb,
  '{"value":"25"}'::jsonb,
  '[{"text":"Restá las unidades por un lado y las decenas por otro."}]'::jsonb,
  'approved', 30 FROM c
UNION ALL
SELECT c.id, 'multiple_choice', 'medium', 'Pidiendo prestado',
  '¿Cuánto es 52 - 28?',
  '{"options":["24","34","26","30"]}'::jsonb,
  '{"value":"24"}'::jsonb,
  '[{"text":"Como al 2 no le podés restar 8, le pedís 1 decena al 5."}]'::jsonb,
  'approved', 45 FROM c
UNION ALL
SELECT c.id, 'multiple_choice', 'hard',   'Reagrupar 1',
  '¿Cuánto es 70 - 34?',
  '{"options":["36","46","26","44"]}'::jsonb,
  '{"value":"36"}'::jsonb,
  '[{"text":"Al 0 no le podés restar 4. Transformá el 70 en 6 decenas y 10 unidades."}]'::jsonb,
  'approved', 60 FROM c;

-- EXERCISE_CONCEPTS: poblar con concepto primario (Ola 1)
INSERT INTO exercise_concepts (exercise_id, concept_id, weight, is_primary)
SELECT id, concept_id, 1.00, true FROM exercises WHERE pedagogical_review_status='approved';
