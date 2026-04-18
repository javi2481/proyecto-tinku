import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { startSessionAction, getNextExerciseAction } from '@/lib/sessions/actions';
import { PracticeClient } from '@/components/practice/PracticeClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ConceptoPracticePage({ params }: PageProps) {
  const { id: conceptId } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/entrar');

  // Trae el concepto para mostrar header + validar existencia
  const { data: concept } = await supabase
    .from('concepts')
    .select('id, code, name_es, description_es')
    .eq('id', conceptId)
    .is('deleted_at', null)
    .maybeSingle();
  if (!concept) notFound();

  // Inicia / reutiliza sesión
  const { sessionId } = await startSessionAction('social');

  // Primer ejercicio
  const next = await getNextExerciseAction(conceptId);

  if (next.kind === 'mastered') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center space-y-4 border-2 border-tinku-leaf/40">
          <div className="text-6xl" aria-hidden>🌟</div>
          <h1 className="text-2xl font-bold text-tinku-ink">¡Ya dominaste este concepto!</h1>
          <p className="text-tinku-ink/70">
            Fuiste hasta el final de <strong>{concept.name_es as string}</strong>. ¡Genial!
          </p>
          <Link
            href="/isla/numeros"
            data-testid="mastered-back"
            className="inline-flex items-center justify-center h-12 px-5 rounded-2xl bg-tinku-sea text-white font-medium hover:bg-tinku-sea/90 exercise-target"
          >
            Elegir otra actividad
          </Link>
        </div>
      </div>
    );
  }

  if (next.kind === 'no_content') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-white p-8 text-center space-y-4 border-2 border-tinku-sea/20">
          <div className="text-6xl" aria-hidden>🛠️</div>
          <h1 className="text-2xl font-bold text-tinku-ink">¡Muy pronto!</h1>
          <p className="text-tinku-ink/70">Estamos preparando ejercicios de esta región.</p>
          <Link
            href="/isla/numeros"
            data-testid="nocontent-back"
            className="inline-flex items-center justify-center h-12 px-5 rounded-2xl bg-tinku-sea text-white font-medium hover:bg-tinku-sea/90 exercise-target"
          >
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PracticeClient
      conceptId={conceptId}
      conceptName={concept.name_es as string}
      sessionId={sessionId}
      initialExercise={next.exercise}
      initialPKnown={next.pKnown}
    />
  );
}
