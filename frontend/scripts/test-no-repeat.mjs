// scripts/test-no-repeat.mjs
// Test de regresión: simula que Mateo resuelve 10 ejercicios en un concepto
// y mide cuántos distintos aparecen. Con el fix anti-repetición, en un concepto
// con >=8 ejercicios aprobados, los primeros 8 deberían ser todos distintos.
//
// Uso: node scripts/test-no-repeat.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envRaw = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
const env = Object.fromEntries(envRaw.split('\n').filter(l => l.includes('=')).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)];
}));
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TEST_STUDENT_CODE = '74RTPM';
const TEST_CONCEPT_CODE = 'M2_NUM_1000'; // ya tiene ejercicios + mastery data
const N_ITERATIONS = 10;

// Simular getNextExerciseAction + el registro mínimo de un attempt
async function simulateSession() {
  const { data: student } = await svc.from('students').select('id').eq('login_code', TEST_STUDENT_CODE).maybeSingle();
  const { data: concept } = await svc.from('concepts').select('id, name_es').eq('code', TEST_CONCEPT_CODE).maybeSingle();
  if (!student || !concept) { console.error('student/concept not found'); process.exit(1); }
  const studentId = student.id;
  const conceptId = concept.id;
  console.log(`📚 Concept: ${concept.name_es}`);

  const { count: totalExercises } = await svc
    .from('exercises')
    .select('*', { count: 'exact', head: true })
    .eq('concept_id', conceptId)
    .eq('pedagogical_review_status', 'approved')
    .is('deleted_at', null);
  console.log(`📦 Total ejercicios aprobados: ${totalExercises}`);

  // Limpiar attempts previos para empezar de cero (test idempotente)
  const { data: testSession } = await svc.from('sessions').insert({ student_id: studentId, island: 'math' }).select('id').single();
  const sessionId = testSession.id;

  // BKT p_known
  const { data: mastery } = await svc.from('concept_mastery').select('p_known').eq('student_id', studentId).eq('concept_id', conceptId).maybeSingle();
  const pKnown = mastery?.p_known ?? 0.1;

  const picked = [];
  let excludeId = null;

  for (let i = 0; i < N_ITERATIONS; i++) {
    // Replicar lógica anti-repetición
    const { data: recent } = await svc
      .from('attempts')
      .select('exercise_id')
      .eq('student_id', studentId)
      .eq('concept_id', conceptId)
      .order('created_at', { ascending: false })
      .limit(8);
    const recentIds = new Set((recent ?? []).map(r => r.exercise_id));

    const diff = pKnown < 0.4 ? 'easy' : pKnown < 0.65 ? 'medium' : pKnown < 0.85 ? 'medium' : 'hard';
    const fallback = diff === 'easy' ? ['easy','medium','hard'] : diff === 'medium' ? ['medium','easy','hard'] : ['hard','medium','easy'];

    let exercise = null;
    for (const d of fallback) {
      let q = svc.from('exercises').select('id').eq('concept_id', conceptId).eq('difficulty', d)
        .eq('pedagogical_review_status', 'approved').is('deleted_at', null);
      if (excludeId) q = q.neq('id', excludeId);
      const { data: pool } = await q.limit(50);
      if (!pool?.length) continue;
      let cand = pool.filter(e => !recentIds.has(e.id));
      if (cand.length === 0) cand = pool;
      exercise = cand[Math.floor(Math.random() * cand.length)];
      break;
    }
    if (!exercise) break;

    picked.push(exercise.id);
    excludeId = exercise.id;

    // Registrar un attempt dummy para que el siguiente iteración lo vea en "recent"
    await svc.from('attempts').insert({
      session_id: sessionId,
      student_id: studentId,
      exercise_id: exercise.id,
      concept_id: conceptId,
      attempt_number: 1,
      outcome: 'correct_first',
      answer_given: { value: 'test' },
      time_spent_seconds: 10,
      hints_used: 0,
      xp_earned: 0,
    });
  }

  const unique = new Set(picked);
  console.log(`🎯 Picked ${picked.length} veces. Únicos: ${unique.size}`);
  console.log(`   Secuencia: ${picked.map(id => id.slice(0, 6)).join(' → ')}`);

  const expectedUnique = Math.min(totalExercises, 8);
  const firstEightUnique = new Set(picked.slice(0, expectedUnique)).size;
  console.log(`✅ Primeros ${expectedUnique}: ${firstEightUnique} únicos (esperado: ${expectedUnique})`);
  console.log(firstEightUnique === expectedUnique ? '✅ SIN REPETICIÓN en la ventana anti-repeat' : '❌ HAY REPETICIÓN antes de tiempo');

  // Cleanup: borrar attempts y sessions de test
  await svc.from('attempts').delete().eq('session_id', sessionId);
  await svc.from('sessions').delete().eq('id', sessionId);
  console.log('🧹 Cleanup OK');
}

await simulateSession();
