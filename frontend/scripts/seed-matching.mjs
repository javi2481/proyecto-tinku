// scripts/seed-matching.mjs
// Seed matching exercises for Math multiplication
// Usage: cd frontend && node scripts/seed-matching.mjs

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

const matching = (leftItems, rightItems, pairs, hint, difficulty = 'medium') => ({
  exercise_type: 'matching',
  difficulty,
  title_es: 'Empareja la multiplicación con su resultado',
  prompt_es: 'Empareja cada operación con su resultado',
  content: { leftItems, rightItems },
  correct_answer: { value: pairs },
  hints: [{ text: hint }],
  estimated_time_seconds: 90,
  pedagogical_review_status: 'approved',
});

const CONCEPTS = [
  { code: 'M2_ADD_REGROUP', exercises: [
    matching(['2 × 1', '2 × 2', '2 × 3', '2 × 4', '2 × 5'], ['2', '4', '6', '8', '10'], { '2 × 1': '2', '2 × 2': '4', '2 × 3': '6', '2 × 4': '8', '2 × 5': '10' }, '2 × 3 significa "2 veces 3"', 'easy'),
  ]},
  { code: 'M3_MULT_BASIC', exercises: [
    matching(['3 × 1', '3 × 2', '3 × 3', '3 × 4', '3 × 5'], ['3', '6', '9', '12', '15'], { '3 × 1': '3', '3 × 2': '6', '3 × 3': '9', '3 × 4': '12', '3 × 5': '15' }, '3 × 4 = 4 + 4 + 4', 'easy'),
  ]},
];

async function main() {
  console.log('🎯 Seed matching exercises...\n');

  let totalInserted = 0;
  for (const cfg of CONCEPTS) {
    const { data: concept } = await supabase.from('concepts').select('id').eq('code', cfg.code).single();
    if (!concept) { console.log(`⚠️  No encontrado: ${cfg.code}`); continue; }

    const exercises = cfg.exercises.map((e, i) => ({ 
      ...e, 
      concept_id: concept.id,
      title_es: `${e.title_es} #${i+1}`
    }));

    const { error } = await supabase.from('exercises').insert(exercises);
    if (error) console.log(`❌ ${cfg.code}:`, error.message);
    else { console.log(`✅ ${cfg.code}: ${exercises.length} ejercicios`); totalInserted += exercises.length; }
  }
  console.log(`\n🎉 Total insertados: ${totalInserted}`);
}

main().catch(console.error);