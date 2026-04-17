// scripts/apply-migration.mjs
// Aplica una migration SQL específica al Supabase remoto via service role.
// Uso: node scripts/apply-migration.mjs 0005_oauth_support.sql
// Requiere: SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL en .env.local.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envRaw = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
const env = Object.fromEntries(
  envRaw.split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('=');
    return [l.slice(0, i), l.slice(i + 1)];
  })
);

const filename = process.argv[2];
if (!filename) {
  console.error('Uso: node scripts/apply-migration.mjs <filename>');
  process.exit(1);
}

const sqlPath = join(__dirname, '..', '..', 'supabase', 'migrations', filename);
const sql = readFileSync(sqlPath, 'utf8');

// Usamos la API /rest/v1/rpc/exec_sql si existiese; como no hay RPC estándar,
// usamos el endpoint /pg/query del PostgREST admin. Fallback: instrucción manual.
// En la práctica, para migrations definitorias (funciones/triggers) lo más simple
// es usar psql o el SQL editor del dashboard. Acá damos instructions si falla.

const url = env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/rpc/exec_sql';

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ sql }),
}).catch(() => null);

if (!res || !res.ok) {
  console.log(`\n⚠️  No se pudo aplicar via RPC (${res?.status ?? 'network error'}).`);
  console.log('📋 Copiá el SQL y pegalo en el SQL Editor del dashboard de Supabase:\n');
  console.log('   https://supabase.com/dashboard/project/' + env.NEXT_PUBLIC_SUPABASE_URL.match(/https:\/\/([^.]+)\./)[1] + '/sql/new\n');
  console.log('---- BEGIN SQL ----');
  console.log(sql);
  console.log('---- END SQL ----\n');
  process.exit(0);
}

console.log(`✅ Migration ${filename} aplicada.`);
