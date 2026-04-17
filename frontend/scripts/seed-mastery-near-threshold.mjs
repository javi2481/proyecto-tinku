// Helper one-off para dev/test: sube mastery del alumno Mateo al borde del umbral
// para que 1 ejercicio correcto dispare la celebración "mastered" + badge.
// Uso: node scripts/seed-mastery-near-threshold.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envRaw = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
const env = Object.fromEntries(
  envRaw.split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  })
);

const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const LOGIN_CODE = process.argv[2] ?? '74RTPM';
const CONCEPT_CODE = process.argv[3] ?? 'M2_NUM_1000';
const TARGET_P = Number(process.argv[4] ?? '0.83');

const { data: student, error: se } = await svc
  .from('students')
  .select('id, first_name')
  .eq('login_code', LOGIN_CODE)
  .maybeSingle();
if (se || !student) { console.error('student not found', se); process.exit(1); }

const { data: concept, error: ce } = await svc
  .from('concepts')
  .select('id, code, name_es')
  .eq('code', CONCEPT_CODE)
  .maybeSingle();
if (ce || !concept) { console.error('concept not found', ce); process.exit(1); }

const { error: ue } = await svc
  .from('concept_mastery')
  .upsert({
    student_id: student.id,
    concept_id: concept.id,
    p_known: TARGET_P,
    last_p_known_delta: 0,
    total_attempts: 10,
    correct_attempts: 9,
    is_mastered: false,
    last_attempt_at: new Date().toISOString(),
  }, { onConflict: 'student_id,concept_id' });

if (ue) { console.error('upsert failed', ue); process.exit(1); }

console.log(`✅ Mastery seeded: student=${student.first_name} (${LOGIN_CODE}) concept=${concept.name_es} p_known=${TARGET_P}`);
console.log('   Next correct_first answer should trigger mastery + celebration.');
