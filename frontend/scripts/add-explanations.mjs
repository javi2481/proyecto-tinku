// Script one-off: agrega explanations a todos los exercises existentes
// basándose en un match de patrón sobre el prompt_es.
//
// Uso: node scripts/add-explanations.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(
  readFileSync('/app/frontend/.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)];
  })
);
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

function explanationFor(ex) {
  const p = ex.prompt_es;
  const correct = ex.correct_answer?.value;

  // Suma: "¿Cuánto es A + B?" o "Sumá A + B", etc.
  const sumM = p.match(/(\d+)\s*\+\s*(\d+)(?:\s*\+\s*(\d+))?/);
  if (sumM && correct) {
    const a = Number(sumM[1]), b = Number(sumM[2]);
    const c = sumM[3] ? Number(sumM[3]) : null;
    if (c !== null) {
      return `${a} + ${b} = ${a + b}, y ${a + b} + ${c} = ${correct}. Podés ir sumando de a 2.`;
    }
    // Si involucra reagrupamiento (unidades pasan de 10), mencionarlo
    const aOnes = a % 10, bOnes = b % 10;
    if (aOnes + bOnes >= 10) {
      return `${a} + ${b} = ${correct}. Las unidades ${aOnes} + ${bOnes} pasan de 10, así que "te llevás" una decena.`;
    }
    return `${a} + ${b} = ${correct}. Primero sumás las unidades y después las decenas.`;
  }

  // Resta: "¿Cuánto es A - B?"
  const subM = p.match(/(\d+)\s*-\s*(\d+)/);
  if (subM && correct) {
    const a = Number(subM[1]), b = Number(subM[2]);
    const aOnes = a % 10, bOnes = b % 10;
    if (bOnes > aOnes) {
      return `${a} - ${b} = ${correct}. Como las unidades de abajo son más grandes, tenés que pedir prestada una decena.`;
    }
    return `${a} - ${b} = ${correct}. Restás primero las unidades y después las decenas.`;
  }

  // "Qué número va después del N"
  const afterM = p.match(/después del (\d+)/i);
  if (afterM && correct) {
    return `El número que sigue a ${afterM[1]} es ${correct}. Sumás 1.`;
  }

  // "Qué número va antes del N"
  const beforeM = p.match(/antes del (\d+)/i);
  if (beforeM && correct) {
    return `Antes de ${beforeM[1]} viene ${correct}. Restás 1.`;
  }

  // "Cuál es el más grande/chico"
  if (/más grande/i.test(p) && correct) {
    return `El más grande es ${correct}. Fijate primero en las centenas, después las decenas.`;
  }
  if (/más chico/i.test(p) && correct) {
    return `El más chico es ${correct}. Un número con menos centenas siempre va primero.`;
  }

  // "Cuántas decenas"
  if (/cuántas decenas/i.test(p) && correct) {
    return `Las decenas son la segunda cifra de derecha a izquierda. Da ${correct}.`;
  }
  // "Qué valor representa la cifra de las..."
  if (/valor (representa|tiene)/i.test(p) && correct) {
    return `Esa cifra vale ${correct} porque está en esa posición.`;
  }
  // Descomposición "¿Cómo se descompone N?"
  if (/se descompone/i.test(p) && correct) {
    return `${correct}. Cada cifra vale según su posición: centenas × 100, decenas × 10, unidades × 1.`;
  }
  // Historias "Si al N le sumás 10"
  const plus10 = p.match(/sumás? 10/);
  if (plus10 && correct) {
    return `Sumar 10 hace que la decena aumente en 1. Da ${correct}.`;
  }
  // Lectura
  if (/cómo se escribe/i.test(p) && correct) {
    return `Se escribe ${correct}.`;
  }
  if (/cuántas|cuántos/i.test(p) && correct) {
    return `La respuesta es ${correct}.`;
  }

  // Fallback genérico
  return correct ? `La respuesta correcta es ${correct}.` : null;
}

const { data: exs } = await svc
  .from('exercises')
  .select('id, prompt_es, correct_answer, content')
  .is('deleted_at', null);

let updated = 0;
for (const ex of exs ?? []) {
  if (ex.content?.explanation) continue;
  const expl = explanationFor(ex);
  if (!expl) continue;
  const newContent = { ...ex.content, explanation: expl };
  const { error } = await svc.from('exercises').update({ content: newContent }).eq('id', ex.id);
  if (error) {
    console.error(`❌ ${ex.id}: ${error.message}`);
    continue;
  }
  updated++;
}
console.log(`✅ ${updated} ejercicios con explicación agregada.`);
