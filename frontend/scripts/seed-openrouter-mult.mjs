// scripts/seed-openrouter-mult.mjs
// Seed 40 multiplicación exercises from OpenRouter
// Usage: cd frontend && node scripts/seed-openrouter-mult.mjs

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

// Find M3_MULT or M2_MULT concept
async function getConcept() {
  const { data } = await supabase
    .from('concepts')
    .select('id')
    .like('code', '%MULT%')
    .limit(1)
    .single();
  return data?.id;
}

const exercises = [
  // Easy (tablas 2-5)
  {"exercise_type":"numeric_input","difficulty":"easy","title_es":"¿Cuánto es 2 × 4?","prompt_es":"¿Cuánto es 2 × 4?","content":{"placeholder":"?"},"correct_answer":{"value":"8"},"hints":[{"text":"2 + 2 + 2 + 2"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"easy","title_es":"¿Cuánto es 3 × 5?","prompt_es":"¿Cuánto es 3 × 5?","content":{"placeholder":"?"},"correct_answer":{"value":"15"},"hints":[{"text":"3 + 3 + 3 + 3 + 3"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"easy","title_es":"¿Cuánto es 4 × 2?","prompt_es":"¿Cuánto es 4 × 2?","content":{"placeholder":"?"},"correct_answer":{"value":"8"},"hints":[{"text":"4 + 4"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"easy","title_es":"¿Cuánto es 5 × 3?","prompt_es":"¿Cuánto es 5 × 3?","content":{"placeholder":"?"},"correct_answer":{"value":"15"},"hints":[{"text":"5 + 5 + 5"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"easy","title_es":"¿Cuánto es 2 × 2?","prompt_es":"¿Cuánto es 2 × 2?","content":{"placeholder":"?"},"correct_answer":{"value":"4"},"hints":[{"text":"2 + 2"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  // Medium (tablas 6-8)
  {"exercise_type":"numeric_input","difficulty":"medium","title_es":"¿Cuánto es 6 × 3?","prompt_es":"¿Cuánto es 6 × 3?","content":{"placeholder":"?"},"correct_answer":{"value":"18"},"hints":[{"text":"6 + 6 + 6"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"medium","title_es":"¿Cuánto es 7 × 4?","prompt_es":"¿Cuánto es 7 × 4?","content":{"placeholder":"?"},"correct_answer":{"value":"28"},"hints":[{"text":"7 + 7 + 7 + 7"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"medium","title_es":"¿Cuánto es 8 × 2?","prompt_es":"¿Cuánto es 8 × 2?","content":{"placeholder":"?"},"correct_answer":{"value":"16"},"hints":[{"text":"8 + 8"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"medium","title_es":"¿Cuánto es 6 × 6?","prompt_es":"¿Cuánto es 6 × 6?","content":{"placeholder":"?"},"correct_answer":{"value":"36"},"hints":[{"text":"6 × 6 = 6 + 6 + 6 + 6 + 6 + 6"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"medium","title_es":"¿Cuánto es 7 × 7?","prompt_es":"¿Cuánto es 7 × 7?","content":{"placeholder":"?"},"correct_answer":{"value":"49"},"hints":[{"text":"7 × 7 = 7 + 7 + 7 + 7 + 7 + 7 + 7"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"medium","title_es":"¿Cuánto es 8 × 8?","prompt_es":"¿Cuánto es 8 × 8?","content":{"placeholder":"?"},"correct_answer":{"value":"64"},"hints":[{"text":"8 × 8 = 8 + 8 + 8 + 8 + 8 + 8 + 8 + 8"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"medium","title_es":"¿Cuánto es 9 × 6?","prompt_es":"¿Cuánto es 9 × 6?","content":{"placeholder":"?"},"correct_answer":{"value":"54"},"hints":[{"text":"9 + 9 + 9 + 9 + 9 + 9"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"medium","title_es":"¿Cuánto es 10 × 6?","prompt_es":"¿Cuánto es 10 × 6?","content":{"placeholder":"?"},"correct_answer":{"value":"60"},"hints":[{"text":"10 × 6 = 60"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"medium","title_es":"¿Cuánto es 6 × 7?","prompt_es":"¿Cuánto es 6 × 7?","content":{"placeholder":"?"},"correct_answer":{"value":"42"},"hints":[{"text":"6 × 7 = 42"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"medium","title_es":"¿Cuánto es 7 × 9?","prompt_es":"¿Cuánto es 7 × 9?","content":{"placeholder":"?"},"correct_answer":{"value":"63"},"hints":[{"text":"7 × 9 = 63"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  // Hard (tablas 9-10)
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 9 × 5?","prompt_es":"¿Cuánto es 9 × 5?","content":{"placeholder":"?"},"correct_answer":{"value":"45"},"hints":[{"text":"9 + 9 + 9 + 9 + 9"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 10 × 4?","prompt_es":"¿Cuánto es 10 × 4?","content":{"placeholder":"?"},"correct_answer":{"value":"40"},"hints":[{"text":"10 × 4 = 40"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 6 × 8?","prompt_es":"¿Cuánto es 6 × 8?","content":{"placeholder":"?"},"correct_answer":{"value":"48"},"hints":[{"text":"6 × 8 = 48"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 7 × 8?","prompt_es":"¿Cuánto es 7 × 8?","content":{"placeholder":"?"},"correct_answer":{"value":"56"},"hints":[{"text":"7 × 8 = 56"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 8 × 9?","prompt_es":"¿Cuánto es 8 × 9?","content":{"placeholder":"?"},"correct_answer":{"value":"72"},"hints":[{"text":"8 × 9 = 72"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 9 × 9?","prompt_es":"¿Cuánto es 9 × 9?","content":{"placeholder":"?"},"correct_answer":{"value":"81"},"hints":[{"text":"9 × 9 = 81"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 10 × 8?","prompt_es":"¿Cuánto es 10 × 8?","content":{"placeholder":"?"},"correct_answer":{"value":"80"},"hints":[{"text":"10 × 8 = 80"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 6 × 9?","prompt_es":"¿Cuánto es 6 × 9?","content":{"placeholder":"?"},"correct_answer":{"value":"54"},"hints":[{"text":"6 × 9 = 54"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 7 × 10?","prompt_es":"¿Cuánto es 7 × 10?","content":{"placeholder":"?"},"correct_answer":{"value":"70"},"hints":[{"text":"7 × 10 = 70"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 8 × 10?","prompt_es":"¿Cuánto es 8 × 10?","content":{"placeholder":"?"},"correct_answer":{"value":"80"},"hints":[{"text":"8 × 10 = 80"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 9 × 10?","prompt_es":"¿Cuánto es 9 × 10?","content":{"placeholder":"?"},"correct_answer":{"value":"90"},"hints":[{"text":"9 × 10 = 90"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 10 × 10?","prompt_es":"¿Cuánto es 10 × 10?","content":{"placeholder":"?"},"correct_answer":{"value":"100"},"hints":[{"text":"10 × 10 = 100"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 6 × 10?","prompt_es":"¿Cuánto es 6 × 10?","content":{"placeholder":"?"},"correct_answer":{"value":"60"},"hints":[{"text":"6 × 10 = 60"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 7 × 6?","prompt_es":"¿Cuánto es 7 × 6?","content":{"placeholder":"?"},"correct_answer":{"value":"42"},"hints":[{"text":"7 × 6 = 42"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 8 × 7?","prompt_es":"¿Cuánto es 8 × 7?","content":{"placeholder":"?"},"correct_answer":{"value":"56"},"hints":[{"text":"8 × 7 = 56"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 9 × 8?","prompt_es":"¿Cuánto es 9 × 8?","content":{"placeholder":"?"},"correct_answer":{"value":"72"},"hints":[{"text":"9 × 8 = 72"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 10 × 9?","prompt_es":"¿Cuánto es 10 × 9?","content":{"placeholder":"?"},"correct_answer":{"value":"90"},"hints":[{"text":"10 × 9 = 90"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 8 × 6?","prompt_es":"¿Cuánto es 8 × 6?","content":{"placeholder":"?"},"correct_answer":{"value":"48"},"hints":[{"text":"8 × 6 = 48"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 9 × 7?","prompt_es":"¿Cuánto es 9 × 7?","content":{"placeholder":"?"},"correct_answer":{"value":"63"},"hints":[{"text":"9 × 7 = 63"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
  {"exercise_type":"numeric_input","difficulty":"hard","title_es":"¿Cuánto es 10 × 7?","prompt_es":"¿Cuánto es 10 × 7?","content":{"placeholder":"?"},"correct_answer":{"value":"70"},"hints":[{"text":"10 × 7 = 70"}],"estimated_time_seconds":30,"pedagogical_review_status":"approved"},
];

async function main() {
  console.log('🎯 Seed 40 multiplicación exercises...');

  const conceptId = await getConcept();
  if (!conceptId) {
    console.error('❌ No se encontró concepto de multiplicación');
    process.exit(1);
  }

  console.log(`✅ Concepto: ${conceptId}`);

  const toInsert = exercises.map(e => ({ ...e, concept_id: conceptId }));
  const { error } = await supabase.from('exercises').insert(toInsert);

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`✅ Insertados ${toInsert.length} ejercicios`);
}

main().catch(console.error);