import { createServerSupabase } from '@/lib/supabase/server';

/**
 * Smoke test de Fase 0 — valida conexión a Supabase desde Server Component.
 * Consulta xp_rules (tabla pública legible por authenticated; acá vamos como anon
 * pero xp_rules_read es TO authenticated — así que el count puede ser 0 para anon
 * y eso está bien, lo importante es que no haya error de conexión).
 */
export default async function HomePage() {
  let connection: 'ok' | 'error' = 'ok';
  let errorMessage: string | null = null;
  let xpRulesCount = 0;

  try {
    const supabase = await createServerSupabase();
    const { count, error } = await supabase
      .from('xp_rules')
      .select('*', { count: 'exact', head: true });
    if (error) {
      connection = 'error';
      errorMessage = error.message;
    } else {
      xpRulesCount = count ?? 0;
    }
  } catch (e) {
    connection = 'error';
    errorMessage = e instanceof Error ? e.message : String(e);
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div
        data-testid="smoke-test-card"
        className="max-w-lg w-full rounded-2xl border border-tinku-sea/20 bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-semibold text-tinku-ink mb-2">Tinkú — Ola 1</h1>
        <p className="text-sm text-tinku-ink/70 mb-6">
          Setup de Fase 0. Validación de stack.
        </p>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-tinku-ink/60">Next.js</dt>
            <dd data-testid="status-nextjs" className="font-medium text-tinku-leaf">OK</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-tinku-ink/60">Tailwind</dt>
            <dd data-testid="status-tailwind" className="font-medium text-tinku-leaf">OK</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-tinku-ink/60">Supabase</dt>
            <dd
              data-testid="status-supabase"
              className={connection === 'ok' ? 'font-medium text-tinku-leaf' : 'font-medium text-tinku-warn'}
            >
              {connection === 'ok' ? `OK (xp_rules visible: ${xpRulesCount})` : 'ERROR'}
            </dd>
          </div>
        </dl>

        {errorMessage && (
          <p
            data-testid="supabase-error"
            className="mt-4 text-xs text-tinku-warn bg-tinku-warn/10 p-3 rounded-lg break-words"
          >
            {errorMessage}
          </p>
        )}
      </div>
    </main>
  );
}
