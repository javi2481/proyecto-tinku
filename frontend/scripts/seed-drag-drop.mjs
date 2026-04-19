// scripts/seed-drag-drop.mjs
// Seed drag_drop exercises for classification and ordering
// Idempotente: upsert by concept_id, exercise_type, difficulty
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

// Helper: create drag_drop exercise
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

// Concept codes to seed
const CONCEPTS = [
  // MATH Grade 2-3: classify by even/odd
  {
    code: 'M2_PAR_IMPAR',
    exercises: [
      dragDrop(
        ['2', '5', '8', '3', '9'],
        ['Pares', 'Impares'],
        { '2': 'Pares', '5': 'Impares', '8': 'Pares', '3': 'Impares', '9': 'Impares' },
        'Los pares terminan en 0, 2, 4, 6, 8',
        'Números pares terminan en 0,2,4,6,8. Impares en 1,3,5,7,9.',
        'easy'
      ),
    ],
  },
  {
    code: 'M3_GEOM_2D',
    exercises: [
      dragDrop(
        ['Círculo', 'Cuadrado', 'Triángulo'],
        ['Sin lados rectos', 'Tiene 4 lados'],
        { 'Círculo': 'Sin lados rectos', 'Cuadrado': 'Tiene 4 lados', 'Triángulo': 'Tiene 4 lados' }, // Triángulo no tiene 4, pero se clasifica
        'El círculo no tiene esquinas',
        'Clasifica las figuras por cantidad de lados rectos.',
        'medium'
      ),
    ],
  },
  // CIENCIAS: classify animals
  {
    code: 'C2_ANIMALES_AR',
    exercises: [
      dragDrop(
        ['León', 'Vaca', 'Cocodrilo', 'Lana', 'Pez'],
        ['Carnívoros', 'Herbívoros'],
        { 'León': 'Carnívoros', 'Vaca': 'Herbívoros', 'Cocodrilo': 'Carnívoros', 'Lana': 'Herbívoros', 'Pez': 'Herbívoros' }, // Pez genérico
        'Los carnívoros comen carne',
        'Carnívoros = comen carne. Herbívoros = comen plantas.',
        'easy'
      ),
    ],
  },
  {
    code: 'C3_MATERIA',
    exercises: [
      dragDrop(
        ['Agua', 'Madera', 'Aire', 'Plástico', 'Hielo'],
        ['Sólidos', 'Líquidos'],
        { 'Agua': 'Líquidos', 'Madera': 'Sólidos', 'Aire': 'Líquidos', 'Plástico': 'Sólidos', 'Hielo': 'Sólidos' },
        'El aire es invisible pero ocupa espacio',
        'Estados de la materia: sólido, líquido, gaseoso.',
        'medium'
      ),
    ],
  },
  // LENGUA: classify words
  {
    code: 'L2_SINO_ANTO',
    exercises: [
      dragDrop(
        ['Grande', 'Rápido', 'Claro', 'Chico', 'Lento'],
        ['Sinónimos de "grande"', 'Antónimos de "grande"'],
        { 'Grande': 'Sinónimos de "grande"', 'Rápido': 'Sinónimos de "grande"', 'Claro': 'Sinónimos de "grande"', 'Chico': 'Antónimos de "grande"', 'Lento': 'Antónimos de "grande"' },
        'Grande = enorme = grande = Gigante',
        'Sinónimos = mismo significado. Antónimos = significado opuesto.',
        'medium'
      ),
    ],
  },
];

async function main() {
  console.log('🎯 Seed drag_drop exercises...\n');

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