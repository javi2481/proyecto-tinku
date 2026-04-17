// scripts/seed-badges.mjs
// Agrega el badge `daily_review` al catálogo si no existe.
// Uso: node scripts/seed-badges.mjs
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(
  readFileSync('/app/frontend/.env.local', 'utf8').split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)];
  })
);
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const BADGES = [
  {
    code: 'daily_review',
    name_es: 'Repaso del día',
    description_es: 'Completaste tu repaso diario por primera vez.',
    icon_url: '/badges/daily-review.svg',
    xp_reward: 15,
    unlock_criteria: { type: 'daily_review_complete' },
  },
];

for (const b of BADGES) {
  const { data: existing } = await svc.from('badges_catalog').select('id').eq('code', b.code).maybeSingle();
  if (existing) {
    await svc.from('badges_catalog').update({
      name_es: b.name_es, description_es: b.description_es, icon_url: b.icon_url,
      xp_reward: b.xp_reward, unlock_criteria: b.unlock_criteria, is_active: true,
    }).eq('id', existing.id);
    console.log(`✅ Updated badge ${b.code}`);
  } else {
    const { error } = await svc.from('badges_catalog').insert(b);
    if (error) console.error(`❌ ${b.code}:`, error.message);
    else console.log(`✅ Inserted badge ${b.code}`);
  }
}
