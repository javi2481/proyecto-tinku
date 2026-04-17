import Link from 'next/link';
import { createServerSupabase } from '@/lib/supabase/server';
import { getStudentCapacity } from '@/lib/students/limits';
import { getAvatar } from '@/lib/students/avatars';
import { strings } from '@/content/strings/es-AR';
import type { GradeLevel } from '@/types/database';
import { VerifyBanner } from './VerifyBanner';
import { isAdminEmail } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';

const GRADE_LABEL: Record<GradeLevel, string> = {
  grade_1: '1° grado',
  grade_2: '2° grado',
  grade_3: '3° grado',
  grade_4: '4° grado',
  grade_5: '5° grado',
  grade_6: '6° grado',
  grade_7: '7° grado',
};

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: subscription }, { data: students }, capacity] = await Promise.all([
    supabase.from('profiles')
      .select('full_name, email, email_double_opt_in_completed')
      .eq('id', user!.id)
      .maybeSingle(),
    supabase.from('subscriptions')
      .select('status')
      .eq('parent_id', user!.id)
      .maybeSingle(),
    supabase.from('students')
      .select('id, first_name, current_grade, avatar_id, login_code, total_xp, streak_current, deletion_requested_at')
      .eq('parent_id', user!.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
    getStudentCapacity(user!.id),
  ]);

  const verified = profile?.email_double_opt_in_completed === true;
  const planLabel =
    subscription?.status === 'premium_active'
      ? strings.parent.dashboard.plan.premiumActive
      : strings.parent.dashboard.plan.free;

  const hasStudents = (students?.length ?? 0) > 0;

  return (
    <div data-testid="dashboard" className="space-y-6">
      {!verified && <VerifyBanner />}

      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-tinku-ink">
          {strings.parent.dashboard.welcome.replace('{name}', (profile?.full_name as string) ?? 'padre/madre')}
        </h1>
        <p className="text-sm text-tinku-ink/60">
          <span data-testid="plan-label">{planLabel}</span>
          <span className="mx-2 text-tinku-ink/30">·</span>
          <span data-testid="capacity-label">
            {capacity.current} / {capacity.limit} hijo{capacity.limit === 1 ? '' : 's'}
          </span>
        </p>
        {isAdminEmail(user?.email) && (
          <p className="pt-1">
            <Link
              href="/review-exercises"
              data-testid="admin-review-link"
              className="text-xs font-medium text-tinku-sea hover:underline"
            >
              🧑‍🏫 Revisión pedagógica (admin)
            </Link>
          </p>
        )}
      </header>

      <section className="rounded-2xl border border-tinku-ink/10 bg-white p-6 sm:p-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-tinku-ink">Tus hijos/as</h2>
          {hasStudents && capacity.canAddMore && (
            <Link
              href="/students/new"
              data-testid="add-student-btn"
              className="h-11 px-4 rounded-xl bg-tinku-sea text-white font-medium inline-flex items-center hover:bg-tinku-sea/90 transition-colors"
            >
              {strings.parent.dashboard.addMoreCta}
            </Link>
          )}
        </div>

        {!hasStudents && (
          <div className="py-6 text-center space-y-4">
            <p data-testid="empty-students" className="text-sm text-tinku-ink/60">
              {strings.parent.dashboard.noStudents}
            </p>
            <Link
              href="/students/new"
              data-testid="add-student-btn"
              className="inline-flex items-center justify-center h-11 px-4 rounded-xl bg-tinku-sea text-white font-medium hover:bg-tinku-sea/90 transition-colors"
            >
              {strings.parent.dashboard.noStudentsCta}
            </Link>
          </div>
        )}

        {hasStudents && (
          <ul data-testid="students-list" className="divide-y divide-tinku-ink/10">
            {(students ?? []).map((s) => {
              const avatar = getAvatar(s.avatar_id as string);
              const pendingDel = Boolean(s.deletion_requested_at);
              return (
                <li key={s.id as string} data-testid={`student-row-${s.id}`} className="py-4 first:pt-0 last:pb-0">
                  <Link
                    href={`/students/${s.id}`}
                    className="flex items-center gap-4 hover:bg-tinku-mist/50 -mx-3 px-3 py-2 rounded-xl transition-colors"
                  >
                    <div className={`w-12 h-12 rounded-full ${avatar.bgClass} flex items-center justify-center text-2xl`}>
                      <span aria-hidden>{avatar.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-tinku-ink">{s.first_name as string}</p>
                      <p className="text-xs text-tinku-ink/60">
                        {GRADE_LABEL[s.current_grade as GradeLevel]}
                        <span className="mx-1.5">·</span>
                        código <code className="font-mono text-tinku-sea">{s.login_code as string}</code>
                        {pendingDel && (
                          <>
                            <span className="mx-1.5">·</span>
                            <span className="text-tinku-warn font-medium">baja pendiente</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="text-right text-xs text-tinku-ink/60">
                      <p>{s.total_xp as number} XP</p>
                      {(s.streak_current as number) > 0 && (
                        <p>🔥 {s.streak_current as number} días</p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {hasStudents && !capacity.canAddMore && (
          <p className="text-xs text-tinku-ink/60 text-center pt-2">
            {strings.parent.dashboard.planLimitReached
              .replace('{limit}', String(capacity.limit))
              .replace('{s}', capacity.limit === 1 ? '' : 's')}
          </p>
        )}
      </section>
    </div>
  );
}
