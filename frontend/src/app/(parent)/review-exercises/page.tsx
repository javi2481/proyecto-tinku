import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { createServiceSupabase } from '@/lib/supabase/service';
import { isAdminEmail } from '@/lib/auth/admin';
import { ReviewClient } from './ReviewClient';
import type { ReviewStatus } from '@/lib/review/actions';

export const dynamic = 'force-dynamic';

interface ExerciseRow {
  id: string;
  concept_id: string;
  difficulty: string;
  exercise_type: string;
  prompt_es: string;
  correct_answer: { value: string };
  content: { options?: string[]; placeholder?: string; quality_score?: number };
  pedagogical_review_status: ReviewStatus;
  pedagogical_notes: string | null;
  pedagogical_reviewed_at: string | null;
  created_at: string;
}

interface ConceptRow {
  id: string;
  code: string;
  name_es: string;
  display_order: number;
}

const DIFF_ORDER: Record<string, number> = { easy: 1, medium: 2, hard: 3 };

export default async function ReviewExercisesPage() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  // Allow rjavierst@gmail.com for review
  const allowedEmails = ['rjavierst@gmail.com', 'tinku-test-1776447878@example.com'];
  if (!allowedEmails.includes(user.email?.toLowerCase() ?? '')) redirect('/dashboard');

  // Traemos todo via service_role para incluir rejected (soft-deleted) en el dashboard
  const svc = createServiceSupabase();

  const [{ data: concepts }, { data: exercises }] = await Promise.all([
    svc.from('concepts')
      .select('id, code, name_es, display_order')
      .is('deleted_at', null)
      .order('display_order', { ascending: true }),
    svc.from('exercises')
      .select('id, concept_id, difficulty, exercise_type, prompt_es, correct_answer, content, pedagogical_review_status, pedagogical_notes, pedagogical_reviewed_at, created_at, deleted_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
  ]);

  const conceptList = (concepts ?? []) as unknown as ConceptRow[];
  const exerciseList = (exercises ?? []) as unknown as (ExerciseRow & { deleted_at: string | null })[];

  // Contar por status. Para 'rejected' contamos todos los que tienen ese status
  // aunque estén soft-deleted (es el estado final de un rechazo).
  const counts: Record<ReviewStatus, number> = {
    pending: 0,
    approved: 0,
    needs_revision: 0,
    rejected: 0,
  };
  for (const e of exerciseList) {
    const s = (e.pedagogical_review_status ?? 'pending') as ReviewStatus;
    counts[s] = (counts[s] ?? 0) + 1;
  }
  const totalAll = exerciseList.length;
  const totalReviewed = totalAll - counts.pending;

  // Agrupar por concepto, ordenando por difficulty dentro de cada concepto
  const byConcept = new Map<string, ExerciseRow[]>();
  for (const e of exerciseList) {
    const arr = byConcept.get(e.concept_id) ?? [];
    arr.push(e);
    byConcept.set(e.concept_id, arr);
  }
  for (const arr of byConcept.values()) {
    arr.sort((a, b) => {
      const d = (DIFF_ORDER[a.difficulty] ?? 99) - (DIFF_ORDER[b.difficulty] ?? 99);
      if (d !== 0) return d;
      return a.created_at.localeCompare(b.created_at);
    });
  }

  const sections = conceptList.map((c) => ({
    concept_id: c.id,
    concept_code: c.code,
    concept_name: c.name_es,
    exercises: byConcept.get(c.id) ?? [],
  })).filter((s) => s.exercises.length > 0);

  return (
    <div data-testid="review-page" className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-tinku-ink">Revisión pedagógica</h1>
            <p className="text-sm text-tinku-ink/60">
              Aprobá, marcá para revisar o rechazá cada ejercicio. Solo los aprobados aparecen en la isla.
            </p>
          </div>
          <Link
            href="/dashboard"
            data-testid="review-back"
            className="h-10 px-4 rounded-xl bg-white border-2 border-tinku-ink/10 text-tinku-ink/80 font-medium hover:bg-tinku-mist/50 inline-flex items-center"
          >
            ← Panel
          </Link>
        </div>
      </header>

      {totalAll === 0 ? (
        <p data-testid="review-empty" className="rounded-2xl bg-white border border-tinku-ink/10 p-8 text-center text-tinku-ink/60">
          No hay ejercicios cargados todavía.
        </p>
      ) : (
        <ReviewClient
          sections={sections}
          counts={counts}
          totalReviewed={totalReviewed}
          totalAll={totalAll}
        />
      )}
    </div>
  );
}
