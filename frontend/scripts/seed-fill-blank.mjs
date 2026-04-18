import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan credenciales de Supabase en el .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🌱 Empezando seed de fill_blank para Isla de las Palabras...');

  // Buscar concepto "Sinónimos y antónimos" (L2_SINO_ANTO)
  const { data: concept, error: conceptErr } = await supabase
    .from('concepts')
    .select('id')
    .eq('code', 'L2_SINO_ANTO')
    .single();

  if (conceptErr || !concept) {
    console.error('❌ No se encontró el concepto L2_SINO_ANTO. Asegurate de correr seed-content-olas.mjs primero.');
    process.exit(1);
  }

  const exercises = [
    {
      concept_id: concept.id,
      exercise_type: 'fill_blank',
      difficulty: 'easy',
      title_es: 'Antónimo de Grande',
      prompt_es: 'El elefante es enorme, pero el ratón es muy {blank}.',
      content: { explanation: 'Lo contrario de enorme o grande es chico.' },
      correct_answer: { value: 'chico' }, // validación ignora mayúsculas en el cliente
      hints: [{ text: 'Empieza con ch...' }],
      pedagogical_review_status: 'approved',
      estimated_time_seconds: 30
    }
  ];

  const { data, error } = await supabase
    .from('exercises')
    .insert(exercises)
    .select();

  if (error) {
    console.error('❌ Error insertando ejercicios:', error);
    process.exit(1);
  }

  console.log(`✅ Se insertaron ${data.length} ejercicios fill_blank con éxito.`);
}

main();