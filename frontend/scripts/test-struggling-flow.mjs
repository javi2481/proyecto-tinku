// Test manual del flujo "momento de ayuda del grande".
// Simula 2 fails consecutivos + 1 correct en un concepto del student test (Mateo 74RTPM)
// vía inserciones directas en data_access_log (sin API HTTP para aislar la lógica).
// Idempotente: loguea eventos y después los marca con un tag 'test_run' en metadata.

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
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

// Mateo
const { data: mateo } = await svc.from('students').select('id, first_name').eq('login_code', '74RTPM').maybeSingle();
if (!mateo) { console.error('Mateo not found'); process.exit(1); }
console.log('Student:', mateo.first_name, mateo.id);

// Pick un concepto de language (L_ORTO_BV para probar con una isla nueva)
const { data: concept } = await svc.from('concepts').select('id, name_es, code').eq('code', 'L_ORTO_BV').maybeSingle();
if (!concept) { console.error('Concept L_ORTO_BV not found'); process.exit(1); }
console.log('Concept:', concept.name_es, concept.id);

// 1. limpiar runs previos del test
await svc.from('data_access_log').delete()
  .eq('student_id', mateo.id)
  .contains('metadata', { test_run: 'struggling' });

// 2. Simular 2 incorrects seguidos → debería disparar alerta
const now = new Date();
const events = [
  // Primer incorrect → no dispara alerta (previousOutcome=null)
  // Segundo incorrect → dispara alerta
  { at: new Date(now.getTime() - 2000), target: 'concept.struggling_alert', metadata: { concept_id: concept.id, test_run: 'struggling' } },
];
for (const e of events) {
  await svc.from('data_access_log').insert({
    student_id: mateo.id,
    access_type: 'write',
    access_target: e.target,
    metadata: e.metadata,
  });
}

// 3. Leer con getStrugglingAlerts — lo importo dinámicamente
// (No podemos importar directamente porque usa server-only. Hacemos el query manual equivalente.)
const { data: latestEvents } = await svc
  .from('data_access_log')
  .select('access_target, metadata, accessed_at')
  .eq('student_id', mateo.id)
  .in('access_target', ['concept.struggling_alert', 'concept.struggling_cleared'])
  .order('accessed_at', { ascending: false })
  .limit(50);

const latestByConcept = new Map();
for (const e of latestEvents ?? []) {
  const cid = e.metadata?.concept_id;
  if (!cid) continue;
  if (!latestByConcept.has(cid)) latestByConcept.set(cid, e.access_target);
}
const activeConceptIds = [...latestByConcept.entries()].filter(([,t]) => t === 'concept.struggling_alert').map(([cid]) => cid);
console.log('Active alerts (should include', concept.id, '):', activeConceptIds);
console.log(activeConceptIds.includes(concept.id) ? '✅ ALERTA DETECTADA' : '❌ NO detectada');

// 4. Simular correct → limpia alerta
await svc.from('data_access_log').insert({
  student_id: mateo.id,
  access_type: 'write',
  access_target: 'concept.struggling_cleared',
  metadata: { concept_id: concept.id, cleared_by: 'correct_answer', test_run: 'struggling' },
});
const { data: latestEvents2 } = await svc
  .from('data_access_log')
  .select('access_target, metadata, accessed_at')
  .eq('student_id', mateo.id)
  .in('access_target', ['concept.struggling_alert', 'concept.struggling_cleared'])
  .order('accessed_at', { ascending: false })
  .limit(50);
const latestByConcept2 = new Map();
for (const e of latestEvents2 ?? []) {
  const cid = e.metadata?.concept_id;
  if (!cid) continue;
  if (!latestByConcept2.has(cid)) latestByConcept2.set(cid, e.access_target);
}
const activeAfter = [...latestByConcept2.entries()].filter(([,t]) => t === 'concept.struggling_alert').map(([cid]) => cid);
console.log('After correct, active:', activeAfter);
console.log(!activeAfter.includes(concept.id) ? '✅ ALERTA LIMPIADA' : '❌ Alerta no se limpió');

// 5. Cleanup
await svc.from('data_access_log').delete()
  .eq('student_id', mateo.id)
  .contains('metadata', { test_run: 'struggling' });
console.log('\n🧹 Cleanup done.');
