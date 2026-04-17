import { createServerSupabase } from '@/lib/supabase/server';
import { strings } from '@/content/strings/es-AR';
import { VerifyBanner } from './VerifyBanner';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, email_double_opt_in_completed')
    .eq('id', user!.id)
    .maybeSingle();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('parent_id', user!.id)
    .maybeSingle();

  const verified = profile?.email_double_opt_in_completed === true;
  const planLabel =
    subscription?.status === 'premium_active'
      ? strings.parent.dashboard.plan.premiumActive
      : strings.parent.dashboard.plan.free;

  return (
    <div data-testid="dashboard" className="space-y-6">
      {!verified && <VerifyBanner />}

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-tinku-ink">
          {strings.parent.dashboard.welcome.replace('{name}', (profile?.full_name as string) ?? 'padre/madre')}
        </h1>
        <p className="text-sm text-tinku-ink/60">
          <span data-testid="plan-label">{planLabel}</span>
        </p>
      </header>

      <section className="rounded-2xl border border-tinku-ink/10 bg-white p-6 sm:p-8 space-y-4">
        <div>
          <h2 className="text-lg font-medium text-tinku-ink">Tus hijos/as</h2>
          <p className="text-sm text-tinku-ink/60 mt-1">{strings.parent.dashboard.noStudents}</p>
        </div>
        <button
          data-testid="add-student-btn"
          disabled
          className="h-11 px-4 rounded-xl bg-tinku-ink/10 text-tinku-ink/40 font-medium cursor-not-allowed"
          title="Disponible en Fase 3"
        >
          {strings.parent.dashboard.noStudentsCta} (próximo)
        </button>
      </section>
    </div>
  );
}
