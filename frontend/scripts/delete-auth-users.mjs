// scripts/delete-auth-users.mjs
// Borra usuarios de auth.users por email. Requiere service role.
// Uso: node scripts/delete-auth-users.mjs email1@x.com email2@y.com
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

const emails = process.argv.slice(2);
if (emails.length === 0) {
  console.error('Uso: node scripts/delete-auth-users.mjs email1 [email2 ...]');
  process.exit(1);
}

// Paginar users para encontrar por email
const toDelete = [];
let page = 1;
const perPage = 1000;
while (true) {
  const { data, error } = await svc.auth.admin.listUsers({ page, perPage });
  if (error) { console.error('listUsers error', error); process.exit(1); }
  for (const u of data.users) {
    if (emails.includes((u.email ?? '').toLowerCase())) {
      toDelete.push({ id: u.id, email: u.email, provider: u.app_metadata?.provider });
    }
  }
  if (data.users.length < perPage) break;
  page++;
}

if (toDelete.length === 0) {
  console.log('⚠️  Ningún user matcheado con esos emails.');
  process.exit(0);
}

console.log(`\n🔎 Encontrados ${toDelete.length} user(s):`);
for (const u of toDelete) console.log(`  - ${u.email} (${u.provider ?? '?'}) → ${u.id}`);

for (const u of toDelete) {
  // Antes de borrar, limpiar data_access_log que tiene FK NO ACTION al user
  await svc.from('data_access_log').delete().eq('accessor_auth_uid', u.id);
  // Limpiar email_verifications (FK CASCADE, debería ir solo pero por si acaso)
  await svc.from('email_verifications').delete().eq('profile_id', u.id);
  // Delete auth user (cascades a profiles, subscriptions, parental_consents, etc.)
  const { error } = await svc.auth.admin.deleteUser(u.id);
  if (error) {
    console.error(`❌ ${u.email}: ${error.message}`);
  } else {
    console.log(`✅ ${u.email} borrado`);
  }
}
