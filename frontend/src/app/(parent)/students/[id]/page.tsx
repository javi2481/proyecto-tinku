import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getAvatar } from '@/lib/students/avatars';
import { strings } from '@/content/strings/es-AR';
import type { GradeLevel } from '@/types/database';
import { StudentActions } from './StudentActions';

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, current_grade, avatar_id, login_code, total_xp, streak_current, streak_max, birth_year, deletion_requested_at, parental_consent_at')
    .eq('id', id)
    .eq('parent_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!student) notFound();

  const avatar = getAvatar(student.avatar_id as string);
  const pendingDeletion = Boolean(student.deletion_requested_at);

  return (
    <div data-testid="student-detail" className="max-w-2xl mx-auto space-y-6">
      <Link href="/dashboard" className="text-sm text-tinku-ink/60 hover:text-tinku-ink inline-block">
        ← Volver al panel
      </Link>

      {pendingDeletion && (
        <section
          data-testid="pending-deletion-banner"
          className="rounded-2xl border border-tinku-warn/40 bg-tinku-warn/10 p-5 space-y-3"
        >
          <h2 className="text-base font-semibold text-tinku-ink">{strings.parent.students.detail.pendingDeletionTitle}</h2>
          <p className="text-sm text-tinku-ink/80">{strings.parent.students.detail.pendingDeletionBody}</p>
          <StudentActions
            studentId={id}
            mode="cancel-deletion"
          />
        </section>
      )}

      <section className="rounded-2xl border border-tinku-ink/10 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6">
        <div className={`w-24 h-24 rounded-2xl ${avatar.bgClass} flex items-center justify-center text-5xl`}>
          <span aria-hidden>{avatar.emoji}</span>
        </div>
        <div className="flex-1 space-y-1">
          <h1 data-testid="student-name" className="text-2xl font-semibold text-tinku-ink">
            {student.first_name as string}
          </h1>
          <p className="text-sm text-tinku-ink/60">
            {GRADE_LABEL[student.current_grade as GradeLevel]} · {(student.birth_year as number)}
          </p>
          <div className="flex gap-4 pt-2 text-sm">
            <div>
              <span className="font-semibold text-tinku-ink">{student.total_xp as number}</span>
              <span className="text-tinku-ink/60 ml-1">XP</span>
            </div>
            <div>
              <span className="font-semibold text-tinku-ink">🔥 {student.streak_current as number}</span>
              <span className="text-tinku-ink/60 ml-1">
                día{(student.streak_current as number) === 1 ? '' : 's'} seguido{(student.streak_current as number) === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-tinku-ink/10 bg-white p-6 sm:p-8 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-tinku-ink/70">
            {strings.parent.dashboard.studentLoginCodeLabel}
          </h2>
        </div>
        <p
          data-testid="login-code"
          className="font-mono tracking-[0.35em] text-3xl sm:text-4xl text-tinku-sea font-semibold select-all"
        >
          {student.login_code as string}
        </p>
        <p className="text-xs text-tinku-ink/60">
          {strings.parent.students.detail.loginCodeHint}
        </p>
        <StudentActions studentId={id} loginCode={student.login_code as string} mode="actions" />
      </section>
    </div>
  );
}
