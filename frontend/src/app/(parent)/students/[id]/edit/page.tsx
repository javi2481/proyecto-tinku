import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { strings } from '@/content/strings/es-AR';
import { EditStudentForm } from './EditStudentForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditStudentPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: student } = await supabase
    .from('students')
    .select('id, first_name, current_grade, avatar_id')
    .eq('id', id)
    .eq('parent_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (!student) notFound();

  return (
    <div data-testid="edit-student-page" className="max-w-xl mx-auto space-y-6">
      <Link href={`/students/${id}`} className="text-sm text-tinku-ink/60 hover:text-tinku-ink inline-block">
        ← Volver
      </Link>
      <header>
        <h1 className="text-2xl font-semibold text-tinku-ink">
          {strings.parent.students.editTitle.replace('{name}', student.first_name as string)}
        </h1>
      </header>
      <EditStudentForm
        studentId={id}
        initialFirstName={student.first_name as string}
        initialGrade={student.current_grade as 'grade_1' | 'grade_2' | 'grade_3'}
        initialAvatar={student.avatar_id as 'avatar_01' | 'avatar_02' | 'avatar_03' | 'avatar_04' | 'avatar_05' | 'avatar_06'}
      />
    </div>
  );
}
