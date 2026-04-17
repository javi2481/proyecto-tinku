import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { getStudentCapacity } from '@/lib/students/limits';
import { strings } from '@/content/strings/es-AR';
import { NewStudentForm } from './NewStudentForm';

export const dynamic = 'force-dynamic';

export default async function NewStudentPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const capacity = await getStudentCapacity(user.id);

  if (!capacity.canAddMore) {
    return (
      <div data-testid="limit-reached" className="max-w-xl mx-auto space-y-4 text-center py-8">
        <div className="text-4xl">🌱</div>
        <h1 className="text-2xl font-semibold text-tinku-ink">{strings.parent.students.limitReachedTitle}</h1>
        <p className="text-sm text-tinku-ink/70">
          {strings.parent.students.limitReachedBody.replace('{limit}', String(capacity.limit)).replace('{s}', capacity.limit === 1 ? '' : 's')}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Link
            href="/dashboard"
            className="h-11 px-4 rounded-xl border border-tinku-ink/15 text-tinku-ink font-medium inline-flex items-center hover:bg-tinku-ink/5"
          >
            Volver al panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="new-student-page" className="max-w-2xl mx-auto space-y-6">
      <header className="space-y-1">
        <Link href="/dashboard" className="text-sm text-tinku-ink/60 hover:text-tinku-ink">
          ← Volver al panel
        </Link>
        <h1 className="text-2xl font-semibold text-tinku-ink pt-2">{strings.parent.students.newTitle}</h1>
        <p className="text-sm text-tinku-ink/70">{strings.parent.students.newSubtitle}</p>
      </header>
      <NewStudentForm />
    </div>
  );
}
