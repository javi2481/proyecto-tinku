// scripts/approve-all-revision.mjs
// Aprueba todos los ejercicios "needs_revision"
// Usage: cd frontend && node scripts/approve-all-revision.mjs

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

async function main() {
  console.log('🎯 Aprobando ejercicios "needs_revision"...');

  // Get all needs_revision
  const { data: exercises, error: fetchErr } = await supabase
    .from('exercises')
    .select('id')
    .eq('pedagogical_review_status', 'needs_revision');

  if (fetchErr) {
    console.error('❌ Error fetching:', fetchErr.message);
    process.exit(1);
  }

  console.log(`📋 ${exercises.length} ejercicios "needs_revision"`);

  if (exercises.length === 0) {
    console.log('✅ No hay ejercicios para aprobar');
    return;
  }

  // Batch update to approved
  const ids = exercises.map(e => e.id);
  const { error: updateErr } = await supabase
    .from('exercises')
    .update({ pedagogical_review_status: 'approved' })
    .in('id', ids);

  if (updateErr) {
    console.error('❌ Error updating:', updateErr.message);
    process.exit(1);
  }

  console.log(`✅ Aprobados ${ids.length} ejercicios`);
}

main().catch(console.error);