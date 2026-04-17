// scripts/seed-grade1.mjs
// Seed de contenido de grade_1 (1° grado):
//   - M1_NUM_100: Números hasta 100 (lectura, siguiente/anterior, mayor/menor)
//   - M1_ADD_SIMPLE: Sumas hasta 20 sin reagrupar
//   - M1_SUB_SIMPLE: Restas hasta 20 sin reagrupar
//
// Idempotente: upsertea conceptos por code; soft-delete + re-insert de ejercicios.
// Uso: node scripts/seed-grade1.mjs

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

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const uniqDistractors = (correct, candidateFn, count = 3) => {
  const set = new Set([String(correct)]);
  let guard = 50;
  while (set.size < count + 1 && guard-- > 0) set.add(String(candidateFn()));
  set.delete(String(correct));
  return [...set].slice(0, count);
};
const mcq = (prompt, correct, distractors) => ({
  exercise_type: 'multiple_choice',
  title_es: prompt.slice(0, 60),
  prompt_es: prompt,
  content: { options: shuffle([String(correct), ...distractors.map(String)]) },
  correct_answer: { value: String(correct) },
  hints: [],
});
const numInput = (prompt, correct, hint) => ({
  exercise_type: 'numeric_input',
  title_es: prompt.slice(0, 60),
  prompt_es: prompt,
  content: { placeholder: '0', unit: null },
  correct_answer: { value: String(correct) },
  hints: hint ? [{ text: hint }] : [],
});

// ---------- Concepts metadata ----------
const CONCEPTS = [
  {
    code: 'M1_NUM_100',
    name_es: 'Números hasta 100',
    description_es: 'Contar, leer y ordenar números del 1 al 100.',
    display_order: 10,
    grade: 'grade_1',
    gen: genNum100,
  },
  {
    code: 'M1_ADD_SIMPLE',
    name_es: 'Sumas fáciles',
    description_es: 'Sumar números hasta 20 sin llevarse.',
    display_order: 20,
    grade: 'grade_1',
    gen: genAddSimple,
  },
  {
    code: 'M1_SUB_SIMPLE',
    name_es: 'Restas fáciles',
    description_es: 'Restar números hasta 20 sin pedir prestado.',
    display_order: 30,
    grade: 'grade_1',
    gen: genSubSimple,
  },
];

// ---------- Generators ----------
function genNum100() {
  const easy = [], medium = [], hard = [];
  // Easy: siguiente / anterior / contar
  for (let i = 0; i < 4; i++) {
    const n = rand(5, 30);
    easy.push(mcq(`¿Qué número va después del ${n}?`, n + 1, uniqDistractors(n + 1, () => n + rand(-3, 3))));
  }
  for (let i = 0; i < 2; i++) {
    const n = rand(10, 60);
    easy.push(numInput(`Escribí el número que va justo después del ${n}.`, n + 1, 'Sumá 1 al número que ves.'));
  }
  easy.push(mcq('¿Qué número es éste: diez?', 10, [1, 100, 20]));
  easy.push(mcq('¿Cómo se escribe con número el "cinco"?', 5, [50, 15, 6]));

  // Medium: mayor/menor entre 2-3 números
  for (let i = 0; i < 4; i++) {
    const a = rand(10, 80), b = a + rand(1, 15), c = a - rand(1, 9);
    const nums = shuffle([a, b, c]);
    medium.push(mcq(`¿Cuál es el más grande? (${nums.join(', ')})`, b, nums.filter(x => x !== b)));
  }
  for (let i = 0; i < 2; i++) {
    const a = rand(10, 70), b = a + rand(1, 20), c = a - rand(1, 9);
    const nums = shuffle([a, b, c]);
    medium.push(mcq(`¿Cuál es el más chico? (${nums.join(', ')})`, c, nums.filter(x => x !== c)));
  }
  for (let i = 0; i < 2; i++) {
    const n = rand(15, 80);
    medium.push(numInput(`¿Qué número va antes del ${n}?`, n - 1, 'Restale 1 al número.'));
  }

  // Hard: decenas / centenas simples
  for (let i = 0; i < 3; i++) {
    const tens = rand(2, 9);
    const n = tens * 10;
    hard.push(mcq(`En el número ${n}, ¿cuántas decenas tiene?`, tens,
      uniqDistractors(tens, () => rand(0, 9))));
  }
  hard.push(mcq(`¿Cuánto vale el 3 en el número 34?`, 30, [3, 4, 13]));
  hard.push(numInput('Si al 47 le sumás 10, ¿qué número obtenés?', 57, 'Sumá una decena completa.'));

  return { easy, medium, hard };
}

function genAddSimple() {
  const easy = [], medium = [], hard = [];
  // Easy: sumas hasta 10
  for (let i = 0; i < 4; i++) {
    const a = rand(1, 5), b = rand(1, 5);
    const r = a + b;
    easy.push(mcq(`¿Cuánto es ${a} + ${b}?`, r, uniqDistractors(r, () => r + rand(-3, 3))));
  }
  for (let i = 0; i < 2; i++) {
    const a = rand(2, 6), b = rand(1, 4);
    easy.push(numInput(`Sumá ${a} + ${b}.`, a + b, 'Contá con los dedos si te ayuda.'));
  }
  easy.push(mcq('Tenés 3 manzanas y te dan 2 más. ¿Cuántas tenés?', 5, [4, 6, 32]));

  // Medium: sumas 10-20, sin pasar de 20
  for (let i = 0; i < 4; i++) {
    const a = rand(5, 12), b = rand(2, Math.min(8, 20 - a));
    const r = a + b;
    medium.push(mcq(`¿Cuánto es ${a} + ${b}?`, r, uniqDistractors(r, () => r + rand(-4, 4))));
  }
  for (let i = 0; i < 2; i++) {
    const a = rand(6, 14), b = rand(2, Math.min(6, 20 - a));
    medium.push(numInput(`${a} + ${b} = ?`, a + b, 'Primero contá hasta el primer número, después sumale el segundo.'));
  }
  medium.push(mcq('En un árbol hay 8 pájaros. Llegan 5 más. ¿Cuántos hay?', 13, [12, 14, 3]));

  // Hard: sumas de 3 sumandos hasta 20, o bien +10
  for (let i = 0; i < 3; i++) {
    const a = rand(2, 6), b = rand(2, 6), c = rand(1, 5);
    const r = a + b + c;
    if (r > 20) continue;
    hard.push(mcq(`¿Cuánto es ${a} + ${b} + ${c}?`, r, uniqDistractors(r, () => r + rand(-3, 3))));
  }
  while (hard.length < 3) {
    const a = rand(3, 9); const r = a + 10;
    hard.push(mcq(`¿Cuánto es ${a} + 10?`, r, uniqDistractors(r, () => r + rand(-5, 5))));
  }
  hard.push(numInput('Si juntás 6 y 7, ¿cuánto te da?', 13, 'Podés pensar 6 + 4 + 3.'));
  hard.push(mcq('En tu caja hay 4 autitos. Encontrás 5 más en el cajón y 3 abajo de la cama. ¿Cuántos tenés?', 12, [11, 13, 9]));

  return { easy, medium, hard };
}

function genSubSimple() {
  const easy = [], medium = [], hard = [];
  // Easy: restas de 1 dígito
  for (let i = 0; i < 4; i++) {
    const a = rand(5, 9);
    const b = rand(1, a - 1);
    const r = a - b;
    easy.push(mcq(`¿Cuánto es ${a} - ${b}?`, r, uniqDistractors(r, () => r + rand(-3, 3))));
  }
  for (let i = 0; i < 2; i++) {
    const a = rand(6, 10), b = rand(1, 4);
    easy.push(numInput(`${a} - ${b} = ?`, a - b, 'Sacale al primer número la cantidad del segundo.'));
  }
  easy.push(mcq('Tenés 9 caramelos y regalás 3. ¿Cuántos te quedan?', 6, [5, 7, 12]));

  // Medium: restas hasta 20 sin pedir prestado
  for (let i = 0; i < 4; i++) {
    const a = rand(11, 19);
    const b = rand(1, a - 10);
    const r = a - b;
    medium.push(mcq(`¿Cuánto es ${a} - ${b}?`, r, uniqDistractors(r, () => r + rand(-4, 4))));
  }
  for (let i = 0; i < 2; i++) {
    const a = rand(13, 19), b = rand(1, 5);
    medium.push(numInput(`Restá ${a} - ${b}.`, a - b, 'Pensá cuántos hay que sacar y qué queda.'));
  }
  medium.push(mcq('En un estuche hay 15 lápices. Sacás 4. ¿Cuántos quedan?', 11, [10, 12, 19]));

  // Hard: restas hasta 20 con "pedir prestado" conceptual simple
  for (let i = 0; i < 3; i++) {
    const a = rand(14, 20);
    const b = rand(5, 9);
    const r = a - b;
    hard.push(mcq(`¿Cuánto es ${a} - ${b}?`, r, uniqDistractors(r, () => r + rand(-3, 3))));
  }
  hard.push(numInput('De 18 manzanas, 9 están podridas. ¿Cuántas están buenas?', 9, 'Pensá cuánto le falta al 9 para llegar al 18.'));
  hard.push(mcq('En tu alcancía tenías 20 monedas. Gastaste 7. ¿Cuántas te quedan?', 13, [12, 14, 27]));

  return { easy, medium, hard };
}

// ---------- Run ----------
let totalExercises = 0;
for (const cfg of CONCEPTS) {
  // Upsert concept
  const conceptPayload = {
    code: cfg.code,
    name_es: cfg.name_es,
    description_es: cfg.description_es,
    grade: cfg.grade,
    primary_subject: 'math',
    display_order: cfg.display_order,
  };

  // Busco primero (el schema no tiene unique constraint explícita en code probablemente)
  const { data: existing } = await svc
    .from('concepts').select('id').eq('code', cfg.code).maybeSingle();

  let conceptId;
  if (existing) {
    const { data: updated, error: ue } = await svc
      .from('concepts').update(conceptPayload).eq('id', existing.id).select('id').single();
    if (ue) { console.error(`update concept ${cfg.code}`, ue); continue; }
    conceptId = updated.id;
  } else {
    const { data: inserted, error: ie } = await svc
      .from('concepts').insert(conceptPayload).select('id').single();
    if (ie) { console.error(`insert concept ${cfg.code}`, ie); continue; }
    conceptId = inserted.id;
  }

  // Soft-delete ejercicios previos del concepto
  await svc.from('exercises')
    .update({ deleted_at: new Date().toISOString() })
    .eq('concept_id', conceptId)
    .is('deleted_at', null);

  const bucket = cfg.gen();
  const rows = [];
  for (const [difficulty, exs] of Object.entries(bucket)) {
    for (const e of exs) {
      rows.push({
        concept_id: conceptId,
        difficulty,
        pedagogical_review_status: 'approved',
        estimated_time_seconds: 45,
        ...e,
      });
    }
  }
  const { data: inserted, error: ex } = await svc
    .from('exercises').insert(rows).select('id');
  if (ex) { console.error(`insert exercises ${cfg.code}`, ex); continue; }

  // Pivot exercise_concepts (primary)
  const pivot = inserted.map(r => ({
    exercise_id: r.id, concept_id: conceptId, weight: 1.0, is_primary: true,
  }));
  await svc.from('exercise_concepts').insert(pivot);

  console.log(`✅ ${cfg.code}: ${inserted.length} ejercicios seedeados (easy:${bucket.easy.length} medium:${bucket.medium.length} hard:${bucket.hard.length})`);
  totalExercises += inserted.length;
}
console.log(`\n🎉 Grade_1 seed completo. ${totalExercises} ejercicios.`);
