// Seed expandido: ~20 ejercicios por concepto (15 MCQ + 5 numeric_input).
// Genera programáticamente con variedad de números pero formato consistente.
// Status: 'approved' (Javier revisa pedagógicamente después).
//
// Uso: node scripts/seed-exercises-expanded.mjs
// Idempotente: borra ejercicios previos de los 3 conceptos objetivo y los re-inserta.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envRaw = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
const env = Object.fromEntries(
  envRaw.split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)];
  })
);
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const uniqueDistractors = (correct, candidateFn, count = 3) => {
  const set = new Set();
  set.add(String(correct));
  let guard = 50;
  while (set.size < count + 1 && guard-- > 0) set.add(String(candidateFn()));
  set.delete(String(correct));
  return [...set].slice(0, count);
};

function mcq(prompt, correct, distractors) {
  const options = shuffle([String(correct), ...distractors.map(String)]);
  return {
    exercise_type: 'multiple_choice',
    title_es: prompt.slice(0, 60),
    prompt_es: prompt,
    content: { options },
    correct_answer: { value: String(correct) },
    hints: [],
  };
}

function numInput(prompt, correct, hint) {
  return {
    exercise_type: 'numeric_input',
    title_es: prompt.slice(0, 60),
    prompt_es: prompt,
    content: { placeholder: '0', unit: null },
    correct_answer: { value: String(correct) },
    hints: hint ? [{ text: hint }] : [],
  };
}

// -----------------------------------------------------------------------------
// Concept generators
// -----------------------------------------------------------------------------

// M2_NUM_1000 — Números hasta 1000
function genNum1000() {
  const easy = [];
  const medium = [];
  const hard = [];

  // Easy: siguiente número / anterior número / leer numero
  for (let i = 0; i < 3; i++) {
    const n = rand(20, 300);
    easy.push(mcq(`¿Qué número va después del ${n}?`, n + 1, uniqueDistractors(n + 1, () => n + rand(-5, 5))));
  }
  for (let i = 0; i < 2; i++) {
    const n = rand(50, 500);
    easy.push(mcq(`¿Qué número va antes del ${n}?`, n - 1, uniqueDistractors(n - 1, () => n + rand(-5, 5))));
  }
  // Easy numeric_input
  for (let i = 0; i < 2; i++) {
    const n = rand(100, 700);
    easy.push(numInput(`Escribí el número que va justo después del ${n}.`, n + 1, 'Sumá 1 al número que ves.'));
  }

  // Medium: mayor/menor entre 3-4, valor posicional simple
  for (let i = 0; i < 3; i++) {
    const a = rand(100, 900), b = a + rand(5, 80), c = a - rand(5, 70), d = a + rand(100, 200);
    const nums = shuffle([a, b, c, d]);
    const max = Math.max(...nums);
    easy.push(mcq(`¿Cuál es el número más grande? (${nums.join(', ')})`, max, nums.filter(x => x !== max)));
  }
  for (let i = 0; i < 3; i++) {
    const a = rand(100, 900), b = a + rand(1, 50), c = a + rand(51, 150), d = a + rand(151, 300);
    const nums = shuffle([a, b, c, d]);
    const min = Math.min(...nums);
    medium.push(mcq(`¿Cuál es el número más chico? (${nums.join(', ')})`, min, nums.filter(x => x !== min)));
  }
  for (let i = 0; i < 2; i++) {
    const hundreds = rand(1, 9), tens = rand(0, 9), ones = rand(0, 9);
    const n = hundreds * 100 + tens * 10 + ones;
    medium.push(mcq(`En el número ${n}, ¿cuántas decenas tiene?`, tens,
      uniqueDistractors(tens, () => rand(0, 9))));
  }
  for (let i = 0; i < 2; i++) {
    const n = rand(100, 999);
    medium.push(numInput(`Si al número ${n} le sumás 10, ¿qué número obtenés?`, n + 10, 'Mové la decena una posición.'));
  }

  // Hard: valor posicional (decenas, centenas), descomposición
  for (let i = 0; i < 3; i++) {
    const hundreds = rand(1, 9), tens = rand(1, 9), ones = rand(0, 9);
    const n = hundreds * 100 + tens * 10 + ones;
    const place = ['unidades', 'decenas', 'centenas'][i % 3];
    const correctVal = place === 'unidades' ? ones : place === 'decenas' ? tens * 10 : hundreds * 100;
    hard.push(mcq(`En el número ${n}, ¿qué valor representa la cifra de las ${place}?`, correctVal,
      uniqueDistractors(correctVal, () => [ones, tens * 10, hundreds * 100, tens, hundreds][rand(0, 4)])));
  }
  for (let i = 0; i < 2; i++) {
    const h = rand(2, 9), t = rand(1, 9), o = rand(1, 9);
    const n = h * 100 + t * 10 + o;
    hard.push(mcq(`¿Cómo se descompone el número ${n}?`,
      `${h * 100} + ${t * 10} + ${o}`,
      [`${h * 100} + ${t} + ${o}`, `${h} + ${t * 10} + ${o * 100}`, `${h * 10} + ${t * 100} + ${o}`],
    ));
  }
  hard.push(numInput('¿Cuántas centenas hay en 640?', 6, 'Mirá la primera cifra de izquierda a derecha.'));

  return { easy, medium, hard };
}

// M2_ADD_REGROUP — Suma con reagrupamiento
function genAddRegroup() {
  const easy = [], medium = [], hard = [];

  // Easy: sumas 2 dígitos sin/con reagrupamiento simple
  for (let i = 0; i < 4; i++) {
    const a = rand(10, 40), b = rand(5, 30);
    const r = a + b;
    easy.push(mcq(`¿Cuánto es ${a} + ${b}?`, r, uniqueDistractors(r, () => r + rand(-12, 12))));
  }
  for (let i = 0; i < 2; i++) {
    const a = rand(20, 60), b = rand(10, 35);
    easy.push(numInput(`Sumá ${a} + ${b}.`, a + b, 'Primero sumá las unidades, después las decenas.'));
  }
  easy.push(mcq(`Si tenías 25 figuritas y te regalan 13, ¿cuántas tenés?`, 38, [37, 39, 28]));

  // Medium: sumas con reagrupamiento más claro
  for (let i = 0; i < 4; i++) {
    const a = rand(20, 60), b = rand(15, 45);
    const r = a + b;
    medium.push(mcq(`¿Cuánto es ${a} + ${b}?`, r, uniqueDistractors(r, () => r + rand(-15, 15))));
  }
  for (let i = 0; i < 2; i++) {
    const a = rand(30, 70), b = rand(20, 40);
    medium.push(numInput(`${a} + ${b} = ?`, a + b, 'Pensá cuántas decenas y cuántas unidades suman.'));
  }
  medium.push(mcq(`En una caja hay 47 manzanas y en otra 35. ¿Cuántas hay en total?`, 82, [72, 83, 812]));

  // Hard: sumas de 3 dígitos con reagrupamiento
  for (let i = 0; i < 3; i++) {
    const a = rand(100, 500), b = rand(40, 250);
    const r = a + b;
    hard.push(mcq(`¿Cuánto es ${a} + ${b}?`, r, uniqueDistractors(r, () => r + rand(-40, 40))));
  }
  for (let i = 0; i < 2; i++) {
    const a = rand(200, 600), b = rand(100, 300);
    hard.push(numInput(`Sumá ${a} + ${b}.`, a + b, 'Primero unidades, después decenas, después centenas.'));
  }
  hard.push(mcq(`Un camión lleva 248 cajas y llega otro con 167. ¿Cuántas cajas hay en total?`, 415, [405, 425, 315]));

  return { easy, medium, hard };
}

// M2_SUB_REGROUP — Resta con reagrupamiento
function genSubRegroup() {
  const easy = [], medium = [], hard = [];

  // Easy: restas 2 dígitos sin prestado
  for (let i = 0; i < 4; i++) {
    const a = rand(30, 60);
    const b = rand(5, Math.max(6, a - 20));
    const r = a - b;
    easy.push(mcq(`¿Cuánto es ${a} - ${b}?`, r, uniqueDistractors(r, () => r + rand(-8, 8))));
  }
  for (let i = 0; i < 2; i++) {
    const a = rand(40, 70), b = rand(5, 20);
    easy.push(numInput(`Restá ${a} - ${b}.`, a - b, 'Sacale al primer número la cantidad del segundo.'));
  }
  easy.push(mcq(`Tenías 48 caramelos y regalaste 23. ¿Cuántos te quedan?`, 25, [24, 26, 71]));

  // Medium: restas con prestado en unidades
  for (let i = 0; i < 4; i++) {
    const a = rand(40, 80);
    const b = rand(15, Math.min(40, a - 5));
    // Forzar prestado: unidades de b mayores a unidades de a
    const aOnes = a % 10;
    const bOnes = b % 10;
    if (bOnes <= aOnes) continue;
    const r = a - b;
    medium.push(mcq(`¿Cuánto es ${a} - ${b}?`, r, uniqueDistractors(r, () => r + rand(-10, 10))));
  }
  while (medium.length < 4) {
    const a = rand(50, 90), b = rand(13, 38);
    const r = a - b;
    medium.push(mcq(`¿Cuánto es ${a} - ${b}?`, r, uniqueDistractors(r, () => r + rand(-10, 10))));
  }
  for (let i = 0; i < 2; i++) {
    const a = rand(60, 90), b = rand(22, 48);
    medium.push(numInput(`${a} - ${b} = ?`, a - b, 'Si las unidades de abajo son más grandes, pedí prestada una decena.'));
  }
  medium.push(mcq(`Un libro tiene 85 páginas y leíste 38. ¿Cuántas te faltan?`, 47, [43, 57, 46]));

  // Hard: restas con 3 dígitos
  for (let i = 0; i < 3; i++) {
    const a = rand(200, 700);
    const b = rand(80, Math.min(350, a - 40));
    const r = a - b;
    hard.push(mcq(`¿Cuánto es ${a} - ${b}?`, r, uniqueDistractors(r, () => r + rand(-30, 30))));
  }
  for (let i = 0; i < 2; i++) {
    const a = rand(300, 800), b = rand(100, 400);
    hard.push(numInput(`Restá ${a} - ${b}.`, a - b, 'Primero unidades, después decenas, después centenas. Pedí prestado si hace falta.'));
  }
  hard.push(mcq(`En un ahorro hay 536 pesos. Gastás 189. ¿Cuánto queda?`, 347, [357, 337, 358]));

  return { easy, medium, hard };
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

const CONCEPTS = {
  M2_NUM_1000:   genNum1000,
  M2_ADD_REGROUP: genAddRegroup,
  M2_SUB_REGROUP: genSubRegroup,
};

const { data: existing, error: qe } = await svc
  .from('concepts')
  .select('id, code')
  .in('code', Object.keys(CONCEPTS));
if (qe) { console.error('concepts query failed', qe); process.exit(1); }

let total = 0;
for (const row of existing) {
  const code = row.code;
  const conceptId = row.id;
  const gen = CONCEPTS[code];
  if (!gen) continue;

  // Soft-delete ejercicios previos para este concepto (hard delete falla por FK attempts)
  const { error: de } = await svc
    .from('exercises')
    .update({ deleted_at: new Date().toISOString() })
    .eq('concept_id', conceptId)
    .is('deleted_at', null);
  if (de) { console.error(`soft-delete failed ${code}`, de); continue; }

  const bucket = gen();
  const rows = [];
  for (const [difficulty, exs] of Object.entries(bucket)) {
    for (const e of exs) {
      rows.push({
        concept_id: conceptId,
        difficulty,
        pedagogical_review_status: 'approved',
        estimated_time_seconds: 60,
        ...e,
      });
    }
  }

  const { data: inserted, error: ie } = await svc
    .from('exercises')
    .insert(rows)
    .select('id');
  if (ie) { console.error(`insert failed ${code}`, ie); continue; }

  // Pivot exercise_concepts (primary = true, weight = 1.0)
  const pivot = inserted.map(r => ({
    exercise_id: r.id,
    concept_id: conceptId,
    weight: 1.0,
    is_primary: true,
  }));
  const { error: pe } = await svc.from('exercise_concepts').insert(pivot);
  if (pe) console.warn(`exercise_concepts insert warning ${code}`, pe.message);

  console.log(`✅ ${code}: ${inserted.length} ejercicios seedeados (easy:${bucket.easy.length} medium:${bucket.medium.length} hard:${bucket.hard.length})`);
  total += inserted.length;
}

console.log(`\n🎉 Seed completo. ${total} ejercicios nuevos.`);
