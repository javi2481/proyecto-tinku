import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { startDailyReviewAction } from '@/lib/review/daily';
import { DailyReviewClient } from './DailyReviewClient';

export const dynamic = 'force-dynamic';

export default async function RepasoDiarioPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  // Trae el student con su grado
  const { data: student } = await supabase
    .from('students').select('id, first_name, current_grade')
    .eq('auth_user_id', user.id).maybeSingle();
  if (!student) redirect('/entrar');

  let payload;
  try {
    payload = await startDailyReviewAction();
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div
          data-testid="review-no-content"
          className="max-w-md w-full rounded-3xl bg-white p-8 text-center space-y-4 border-2 border-tinku-ink/10"
        >
          <div className="text-5xl" aria-hidden>🌱</div>
          <h1 className="text-2xl font-bold text-tinku-ink">Todavía no tenemos repaso para vos</h1>
          <p className="text-tinku-ink/70">
            Volvé después de jugar un rato en alguna isla — así te preparamos un repaso a tu medida.
          </p>
          <a
            href="/isla/numeros"
            data-testid="review-back"
            className="inline-flex items-center justify-center h-12 px-5 rounded-2xl bg-tinku-sea text-white font-medium hover:bg-tinku-sea/90 exercise-target"
          >
            Ir a la Isla de los Números
          </a>
          <p className="text-xs text-tinku-ink/40">({msg})</p>
        </div>
      </div>
    );
  }

  return (
    <DailyReviewClient
      sessionId={payload.sessionId}
      exercises={payload.exercises}
      studentName={student.first_name as string}
    />
  );
}
