// scripts/seed-fill-blank.mjs
// Seed fill_blank exercises for existing concepts
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

const CONCEPTS = [
  { code: 'L_SINON', exercises: [
    fillBlank('El día es claro, pero la noche es {blank}.', 'oscura', 'Lo contrario de claro...', 'Oscuridad es lo opuesto a claridad.', 'easy'),
    fillBlank('El libro nuevo está {blank} del antiguo.', 'entre', 'Una palabra que significa "en el medio"...', 'Preposición de lugar.', 'medium'),
  ]},
  { code: 'L3_ORACIONES', exercises: [
    fillBlank('¡Corre rápido! Es una oración {blank}.', 'exclamativa', 'Las que expresan emoción...', 'Termina en signo de exclamación.', 'easy'),
    fillBlank('¿Vendrás mañana? Es una oración {blank}.', 'interrogativa', 'Las que terminan en signo de...', 'Son preguntas que terminan en ¿?', 'easy'),
  ]},
  { code: 'C_CUERPO', exercises: [
    fillBlank('El {blank} bombea la sangre por todo el cuerpo.', 'corazón', 'Es un músculo que late...', 'El corazón es el motor del sistema circulatorio.', 'easy'),
    fillBlank('Los pulmones están en el {blank}.', 'tórax', 'Parte del cuerpo entre el cuello y la cintura...', 'El tórax protects los órganos vitales.', 'medium'),
  ]},
  { code: 'C3_AGUA', exercises: [
    fillBlank('El agua se evapora por el calor y forma {blank}.', 'vapor', 'Estado invisible del agua...', 'El vapor son gotitas infinites.', 'easy'),
    fillBlank('Cuando hace frío, el agua se transforma en {blank}.', 'hielo', 'Estado sólido del agua...', 'El hielo es agua solidificada.', 'easy'),
  ]},
  { code: 'U_SIMB_AR', exercises: [
    fillBlank('La bandera argentina tiene el sol de {blank}.', 'oro', 'Color del sol argentino...', 'El Sol de Mayo es dorado.', 'easy'),
  ]},
  { code: 'U_GEO_AR', exercises: [
    fillBlank('La {blank} es la región más extensa de Argentina.', 'llanura', 'Gran extensión plana...', 'La llanura pampeana es la más fertile.', 'easy'),
    fillBlank('En el sur está la región {blank}.', 'patagónica', 'Nombre de la región southern...', 'La Patagonia es la región más austral.', 'easy'),
  ]},
];

async function main() {
  console.log('🎯 Seed fill_blank exercises...\n');

  let totalInserted = 0;
  for (const cfg of CONCEPTS) {
    const { data: concept } = await supabase.from('concepts').select('id').eq('code', cfg.code).single();
    if (!concept) { console.log(`⚠️  No encontrado: ${cfg.code}`); continue; }

    const exercises = cfg.exercises.map((e, i) => ({ 
      ...e, 
      concept_id: concept.id,
      title_es: `${e.title_es} #${i+1}` // unique title
    }));

    const { error } = await supabase.from('exercises').insert(exercises);
    if (error) console.log(`❌ ${cfg.code}:`, error.message);
    else { console.log(`✅ ${cfg.code}: ${exercises.length} ejercicios`); totalInserted += exercises.length; }
  }
  console.log(`\n🎉 Total insertados: ${totalInserted}`);
}

main().catch(console.error);