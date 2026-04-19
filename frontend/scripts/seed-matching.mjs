// Seed matching exercises for Math multiplication tables
// Usage: npx supabase functions runtime execute seed-matching --project-ref jdhefmxvnfkegnoqxezg

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const matchingExercises = [
  // Multiplication tables 2-5 (grade 2-3)
  {
    concept_id: 'M2_MULT',
    exercise_type: 'matching',
    difficulty: 'easy',
    title_es: 'Empareja la multiplicación con su resultado',
    prompt_es: 'Empareja cada operación con su resultado',
    content: { leftItems: ['2 × 1', '2 × 2', '2 × 3', '2 × 4', '2 × 5'], rightItems: ['2', '4', '6', '8', '10'] },
    correct_answer: { value: { '2 × 1': '2', '2 × 2': '4', '2 × 3': '6', '2 × 4': '8', '2 × 5': '10' } },
    hints: [{ text: '2 × 3 significa "2 veces 3"' }],
    pedagogical_review_status: 'approved',
    estimated_time_seconds: 90
  },
  {
    concept_id: 'M2_MULT',
    exercise_type: 'matching',
    difficulty: 'medium',
    title_es: 'Empareja la multiplicación con su resultado',
    prompt_es: 'Empareja cada operación con su resultado',
    content: { leftItems: ['2 × 6', '2 × 7', '2 × 8', '2 × 9', '2 × 10'], rightItems: ['12', '14', '16', '18', '20'] },
    correct_answer: { value: { '2 × 6': '12', '2 × 7': '14', '2 × 8': '16', '2 × 9': '18', '2 × 10': '20' } },
    hints: [{ text: '2 × 8 = 8 + 8' }],
    pedagogical_review_status: 'approved',
    estimated_time_seconds: 90
  },
  {
    concept_id: 'M3_MULT',
    exercise_type: 'matching',
    difficulty: 'easy',
    title_es: 'Tabla del 3',
    prompt_es: 'Empareja cada operación con su resultado',
    content: { leftItems: ['3 × 1', '3 × 2', '3 × 3', '3 × 4', '3 × 5'], rightItems: ['3', '6', '9', '12', '15'] },
    correct_answer: { value: { '3 × 1': '3', '3 × 2': '6', '3 × 3': '9', '3 × 4': '12', '3 × 5': '15' } },
    hints: [{ text: '3 × 4 = 4 + 4 + 4' }],
    pedagogical_review_status: 'approved',
    estimated_time_seconds: 90
  },
  {
    concept_id: 'M3_MULT',
    exercise_type: 'matching',
    difficulty: 'medium',
    title_es: 'Tabla del 3 (continuación)',
    prompt_es: 'Empareja cada operación con su resultado',
    content: { leftItems: ['3 × 6', '3 × 7', '3 × 8', '3 × 9', '3 × 10'], rightItems: ['18', '21', '24', '27', '30'] },
    correct_answer: { value: { '3 × 6': '18', '3 × 7': '21', '3 × 8': '24', '3 × 9': '27', '3 × 10': '30' } },
    hints: [{ text: '3 × 8 = 3 × 4 + 3 × 4' }],
    pedagogical_review_status: 'approved',
    estimated_time_seconds: 90
  },
  {
    concept_id: 'M4_MULT',
    exercise_type: 'matching',
    difficulty: 'easy',
    title_es: 'Tabla del 4',
    prompt_es: 'Empareja cada operación con su resultado',
    content: { leftItems: ['4 × 1', '4 × 2', '4 × 3', '4 × 4', '4 × 5'], rightItems: ['4', '8', '12', '16', '20'] },
    correct_answer: { value: { '4 × 1': '4', '4 × 2': '8', '4 × 3': '12', '4 × 4': '16', '4 × 5': '20' } },
    hints: [{ text: '4 × 3 = 3 + 3 + 3 + 3' }],
    pedagogical_review_status: 'approved',
    estimated_time_seconds: 90
  },
  {
    concept_id: 'M5_MULT',
    exercise_type: 'matching',
    difficulty: 'easy',
    title_es: 'Tabla del 5',
    prompt_es: 'Empareja cada operación con su resultado',
    content: { leftItems: ['5 × 1', '5 × 2', '5 × 3', '5 × 4', '5 × 5'], rightItems: ['5', '10', '15', '20', '25'] },
    correct_answer: { value: { '5 × 1': '5', '5 × 2': '10', '5 × 3': '15', '5 × 4': '20', '5 × 5': '25' } },
    hints: [{ text: '5 × 2 = 5 + 5' }],
    pedagogical_review_status: 'approved',
    estimated_time_seconds: 90
  },
  // fraction matching (grade 4+)
  {
    concept_id: 'M4_FRAC',
    exercise_type: 'matching',
    difficulty: 'medium',
    title_es: 'Fracciones equivalentes',
    prompt_es: 'Empareja cada fracción con su equivalente',
    content: { leftItems: ['1/2', '2/4', '3/6', '4/8', '5/10'], rightItems: ['0.5', '1/2', '0.5', '0.5', '1/2'] },
    correct_answer: { value: { '1/2': '0.5', '2/4': '1/2', '3/6': '0.5', '4/8': '1/2', '5/10': '0.5' } },
    hints: [{ text: 'Divide el numerador por el denominador' }],
    pedagogical_review_status: 'approved',
    estimated_time_seconds: 120
  }
];

async function seed() {
  console.log('🎯 Seeding matching exercises...');

  for (const ex of matchingExercises) {
    const { data, error } = await supabase
      .from('exercises')
      .upsert(ex, { onConflict: 'concept_id,exercise_type,difficulty' })
      .select();

    if (error) {
      console.error(`❌ Error seeding ${ex.concept_id}:`, error.message);
    } else {
      console.log(`✅ Seeded ${ex.concept_id} (${ex.exercise_type})`);
    }
  }

  console.log('🎉 Done!');
}

seed().catch(console.error);