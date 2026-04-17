'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { updateStudentAction, type StudentActionResult } from '@/lib/students/actions';
import { AVATARS, type AvatarId } from '@/lib/students/avatars';
import { strings } from '@/content/strings/es-AR';
import { cn } from '@/lib/utils/cn';

const initial: StudentActionResult | null = null;

type Grade = 'grade_1' | 'grade_2' | 'grade_3';

interface Props {
  studentId: string;
  initialFirstName: string;
  initialGrade: Grade;
  initialAvatar: AvatarId;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="edit-student-submit"
      className={cn(
        'w-full h-11 rounded-xl font-medium transition-colors',
        'bg-tinku-sea text-white hover:bg-tinku-sea/90 disabled:opacity-60',
      )}
    >
      {pending ? 'Guardando…' : strings.common.save}
    </button>
  );
}

export function EditStudentForm({ studentId, initialFirstName, initialGrade, initialAvatar }: Props) {
  const actionBound = updateStudentAction.bind(null, studentId);
  const [state, formAction] = useFormState(actionBound, initial);
  const [avatar, setAvatar] = useState<AvatarId>(initialAvatar);
  const fieldErr = !state || state.ok ? undefined : state.fieldErrors;
  const topErr = state && !state.ok && state.error === 'generic'
    ? strings.parent.students.errors.generic
    : null;

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="avatar_id" value={avatar} />

      <div className="space-y-1.5">
        <label htmlFor="first_name" className="text-sm font-medium text-tinku-ink">
          {strings.parent.students.firstNameLabel}
        </label>
        <input
          id="first_name"
          name="first_name"
          data-testid="edit-firstname"
          type="text"
          required
          maxLength={40}
          defaultValue={initialFirstName}
          className="w-full h-11 px-3 rounded-xl border border-tinku-ink/15 bg-white focus:outline-none focus:ring-2 focus:ring-tinku-sea"
        />
        {fieldErr?.first_name && <p className="text-xs text-tinku-warn">{fieldErr.first_name[0]}</p>}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="current_grade" className="text-sm font-medium text-tinku-ink">
          {strings.parent.students.gradeLabel}
        </label>
        <select
          id="current_grade"
          name="current_grade"
          data-testid="edit-grade"
          required
          defaultValue={initialGrade}
          className="w-full h-11 px-3 rounded-xl border border-tinku-ink/15 bg-white focus:outline-none focus:ring-2 focus:ring-tinku-sea"
        >
          <option value="grade_1">{strings.parent.students.gradeOption.grade_1}</option>
          <option value="grade_2">{strings.parent.students.gradeOption.grade_2}</option>
          <option value="grade_3">{strings.parent.students.gradeOption.grade_3}</option>
        </select>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-tinku-ink">{strings.parent.students.avatarLabel}</legend>
        <div className="grid grid-cols-6 gap-2">
          {AVATARS.map((a) => {
            const selected = avatar === a.id;
            return (
              <button
                type="button"
                key={a.id}
                data-testid={`edit-avatar-${a.id}`}
                onClick={() => setAvatar(a.id)}
                className={cn(
                  'aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all',
                  a.bgClass,
                  selected ? 'ring-4 ring-tinku-sea scale-105' : 'hover:ring-2 hover:ring-tinku-ink/20',
                )}
                aria-pressed={selected}
                aria-label={a.label}
              >
                <span aria-hidden>{a.emoji}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {topErr && (
        <div role="alert" className="rounded-lg border border-tinku-warn/40 bg-tinku-warn/10 px-3 py-2 text-sm text-tinku-warn">
          {topErr}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
