// scripts/reapprove-unreviewed.mjs
// Re-aprueba masivamente los ejercicios que están en 'pending' y nunca tuvieron
// un reviewer humano (pedagogical_reviewer_id IS NULL). Estos son los seeds
// automáticos que quedaron en pending tras un "Reset unreviewed".
//
// Inverso de resetUnreviewedToPendingAction (que pasa approved→pending).
// Acá: pending→approved para los "huérfanos" del seed.
//
// Uso: node scripts/reapprove-unreviewed.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envRaw = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
const env = Object.fromEntries(envRaw.split('\n').filter(l => l.includes('=')).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)];
}));
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data, error } = await svc
  .from('exercises')
  .update({
    pedagogical_review_status: 'approved',
    // No setear reviewer_id: sigue null para que un "Reset unreviewed" futuro los vuelva a agarrar si hace falta.
  })
  .eq('pedagogical_review_status', 'pending')
  .is('pedagogical_reviewer_id', null)
  .is('deleted_at', null)
  .select('id, concept_id');

if (error) { console.error(error); process.exit(1); }
console.log(`✅ Re-aprobados ${data.length} ejercicios pending sin review humano.`);

// Resumen por concepto
const byConcept = {};
for (const r of data) byConcept[r.concept_id] = (byConcept[r.concept_id] ?? 0) + 1;
const ids = Object.keys(byConcept);
if (ids.length) {
  const { data: concepts } = await svc.from('concepts').select('id, code').in('id', ids);
  const nameMap = new Map(concepts.map(c => [c.id, c.code]));
  console.log('\nPor concepto:');
  for (const [id, n] of Object.entries(byConcept).sort((a,b)=>b[1]-a[1])) {
    console.log(`  ${(nameMap.get(id) ?? id).padEnd(20)} +${n}`);
  }
}
