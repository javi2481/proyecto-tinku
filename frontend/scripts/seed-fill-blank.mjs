// scripts/seed-fill-blank.mjs
// Seed fill_blank exercises for multiple concepts (Lengua, Ciencias, Argentina)
// Idempotente: upsert by concept_id, exercise_type, difficulty
// Usage: cd frontend && node scripts/seed-fill-blank.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const envRaw = readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envRaw.split('\n').filter(l => l.includes('=')).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)];
}));
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Helper: create fill_blank exercise
const fillBlank = (prompt, answer, hint, explanation, difficulty = 'medium') => ({
  exercise_type: 'fill_blank',
  difficulty,
  title_es: prompt.slice(0, 60),
  prompt_es: prompt,
  content: { explanation },
  correct_answer: { value: answer },
  hints: [{ text: hint }],
  estimated_time_seconds: 45,
  pedagogical_review_status: 'approved',
});

// Concept codes to seed
const CONCEPTS = [
  // LENGUA Grade 2-3
  {
    code: 'L2_SINO_ANTO',
    exercises: [
      fillBlank('El día es claro, pero la noche es {blank}.', 'oscura', 'Lo contrario de claro...', 'Oscuridad es lo opuesto a claridad.', 'easy'),
      fillBlank('El libro nuevo está {blank} del antiguo.', 'entre', 'Una palabra que significa "en el medio"...', 'Preposición de lugar.', 'medium'),
    ],
  },
  {
    code: 'L3_ORAC_TIPO',
    exercises: [
      fillBlank('¡Corre rápido! Es una oración {blank}.', 'exclamativa', 'Las que expresan emoción...', 'Termina en signo de exclamación.', 'easy'),
      fillBlank('¿Vendrás mañana? Es una oración {blank}.', 'interrogativa', 'Las que terminan en signo de...', 'Son preguntas que terminan en ¿?', 'easy'),
    ],
  },
  // CIENCIAS Grade 2-3
  {
    code: 'C2_CUERPO',
    exercises: [
      fillBlank('El {blank} bombea la sangre por todo el cuerpo.', 'corazón', 'Es un músculo que late...', 'El corazón es el motor del sistema circulatorio.', 'easy'),
      fillBlank('Los pulmones están en el {blank}.', 'tórax', 'Parte del cuerpo entre el cuello y la cintura...', 'El tórax protects los órganos vitales.', 'medium'),
    ],
  },
  {
    code: 'C3_AGUA',
    exercises: [
      fillBlank('El agua se evapora por el calor y forma {blank}.', 'vapor', 'Estado invisible del agua...', 'El vapor son gotitas infinites.', 'easy'),
      fillBlank('Cuando hace frío, el agua se transforma en {blank}.', 'hielo', 'Estado sólido del agua...', 'El hielo es agua solidificada.', 'easy'),
    ],
  },
  // ARGENTINA Grade 2-3
  {
    code: 'A2_SIMBOLOS',
    exercises: [
      fillBlank('La bandera argentina tiene el sol de {blank}.', 'oro', 'Color del sol argentino...', 'El Sol de Mayo es dorado.', 'easy'),
      fillBlank('El himno nacional argentino dice "Sean eternos los {blank}.', 'clarines', 'Instrumento musical...', 'Los clarines son trompetas.', 'hard'),
    ],
  },
  {
    code: 'A3_REGIONES',
    exercises: [
      fillBlank('La {blank} es la región más extensa de Argentina.', 'llanura', 'Gran extensión plana...', 'La llanura pampeana es la más fertile.', 'easy'),
      fillBlank('En el sur está la región {blank}.', 'patagónica', 'Nombre de la región southern...', 'La Patagonia es la región más austral.', 'easy'),
    ],
  },
];

async function main() {
  console.log('🎯 Seed fill_blank exercises...\n');

  for (const cfg of CONCEPTS) {
    // Find concept by code
    const { data: concept, error: err } = await supabase
      .from('concepts')
      .select('id')
      .eq('code', cfg.code)
      .single();

    if (err || !concept) {
      console.log(`⚠️  Concepto no encontrado: ${cfg.code} — saltando`);
      continue;
    }

    // Insert exercises
    const exercises = cfg.exercises.map(e => ({ ...e, concept_id: concept.id }));
    const { error: insertErr } = await supabase
      .from('exercises')
      .upsert(exercises, { onConflict: 'concept_id,exercise_type,difficulty' });

    if (insertErr) {
      console.log(`❌ ${cfg.code}:`, insertErr.message);
    } else {
      console.log(`✅ ${cfg.code}: ${exercises.length} ejercicios`);
    }
  }

  console.log('\n🎉 Listo!');
}

main().catch(console.error);