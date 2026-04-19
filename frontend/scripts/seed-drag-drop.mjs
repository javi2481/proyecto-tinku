// scripts/seed-drag-drop.mjs
// Seed drag_drop exercises for existing concepts
// Usage: cd frontend && node scripts/seed-drag-drop.mjs

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

const dragDrop = (items, zones, correctMapping, hint, explanation, difficulty = 'medium') => ({
  exercise_type: 'drag_drop',
  difficulty,
  title_es: `Clasifica: ${zones[0]} vs ${zones[1]}`,
  prompt_es: 'Arrastrá cada item a la zona correcta',
  content: { items, zones, explanation },
  correct_answer: { value: correctMapping },
  hints: [{ text: hint }],
  estimated_time_seconds: 60,
  pedagogical_review_status: 'approved',
});

const CONCEPTS = [
  // Math: even/odd (using M1 or M2 concepts)
  { code: 'M1_NUM_100', exercises: [
    dragDrop(['2', '5', '8', '3', '9'], ['Pares', 'Impares'], { '2': 'Pares', '5': 'Impares', '8': 'Pares', '3': 'Impares', '9': 'Impares' }, 'Los pares terminan en 0, 2, 4, 6, 8', 'Números pares terminan en 0,2,4,6,8. Impares en 1,3,5,7,9.', 'easy'),
  ]},
  // Ciencias: animals
  { code: 'C_ANIMALES_AR', exercises: [
    dragDrop(['León', 'Vaca', 'Conejo', 'Aguila', 'Pez'], ['Carnívoros', 'Herbívoros'], { 'León': 'Carnívoros', 'Vaca': 'Herbívoros', 'Conejo': 'Herbívoros', 'Aguila': 'Carnívoros', 'Pez': 'Herbívoros' }, 'Los carnívoros come carne', 'Carnívoros = comen carne. Herbívoros = comen plantas.', 'easy'),
  ]},
  // Ciencias: plantas
  { code: 'C_PLANTAS', exercises: [
    dragDrop(['Rosa', 'Musgo', 'Cactus', 'Helecho', 'Alga'], ['Con flor', 'Sin flor'], { 'Rosa': 'Con flor', 'Musgo': 'Sin flor', 'Cactus': 'Con flor', 'Helecho': 'Sin flor', 'Alga': 'Sin flor' }, 'Las plantas con flor dan semillas', 'Algunas plantas tienen flor, otras no.', 'medium'),
  ]},
];

async function main() {
  console.log('🎯 Seed drag_drop exercises...\n');

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