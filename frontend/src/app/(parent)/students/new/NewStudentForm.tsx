'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState } from 'react';
import { createStudentAction, type StudentActionResult } from '@/lib/students/actions';
import { AVATARS, DEFAULT_AVATAR, type AvatarId } from '@/lib/students/avatars';
import { strings } from '@/content/strings/es-AR';
import { ConsentTextV1 } from '@/lib/legal/ConsentTextV1';
import { cn } from '@/lib/utils/cn';

const currentYear = new Date().getFullYear();
const initial: StudentActionResult | null = null;

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      data-testid="new-student-submit"
      className={cn(
        'w-full h-12 rounded-xl font-medium transition-colors',
        'bg-tinku-sea text-white hover:bg-tinku-sea/90',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      )}
    >
      {pending ? strings.parent.students.submitting : strings.parent.students.submit}
    </button>
  );
}

function topErrorMessage(result: StudentActionResult | null): string | null {
  if (!result || result.ok) return null;
  const map: Record<string, string> = {
    plan_limit_reached: strings.parent.students.errors.planLimit,
    validation: strings.parent.students.errors.validation,
    generic: strings.parent.students.errors.generic,
  };
  return map[result.error] ?? strings.parent.students.errors.generic;
}

export function NewStudentForm() {
  const [state, formAction] = useFormState(createStudentAction, initial);
  const [avatar, setAvatar] = useState<AvatarId>(DEFAULT_AVATAR);
  const [consent, setConsent] = useState(false);
  const fieldErr = !state || state.ok ? undefined : state.fieldErrors;
  const topError = topErrorMessage(state);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <input type="hidden" name="avatar_id" value={avatar} />
      <input type="hidden" name="consent_accepted" value={consent ? 'true' : 'false'} />

      {/* First name */}
      <div className="space-y-1.5">
        <label htmlFor="first_name" className="text-sm font-medium text-tinku-ink">
          {strings.parent.students.firstNameLabel}
        </label>
        <input
          id="first_name"
          name="first_name"
          data-testid="new-student-firstname"
          type="text"
          required
          maxLength={40}
          placeholder={strings.parent.students.firstNamePlaceholder}
          className="w-full h-11 px-3 rounded-xl border border-tinku-ink/15 bg-white focus:outline-none focus:ring-2 focus:ring-tinku-sea"
        />
        {fieldErr?.first_name && (
          <p data-testid="err-firstname" className="text-xs text-tinku-warn">{fieldErr.first_name[0]}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label htmlFor="birth_year" className="text-sm font-medium text-tinku-ink">
            {strings.parent.students.birthYearLabel}
          </label>
          <input
            id="birth_year"
            name="birth_year"
            data-testid="new-student-birthyear"
            type="number"
            required
            min={2010}
            max={currentYear}
            defaultValue={currentYear - 8}
            className="w-full h-11 px-3 rounded-xl border border-tinku-ink/15 bg-white focus:outline-none focus:ring-2 focus:ring-tinku-sea"
          />
          {fieldErr?.birth_year && (
            <p data-testid="err-birthyear" className="text-xs text-tinku-warn">{fieldErr.birth_year[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="current_grade" className="text-sm font-medium text-tinku-ink">
            {strings.parent.students.gradeLabel}
          </label>
          <select
            id="current_grade"
            name="current_grade"
            data-testid="new-student-grade"
            required
            defaultValue="grade_2"
            className="w-full h-11 px-3 rounded-xl border border-tinku-ink/15 bg-white focus:outline-none focus:ring-2 focus:ring-tinku-sea"
          >
            <option value="grade_1">{strings.parent.students.gradeOption.grade_1}</option>
            <option value="grade_2">{strings.parent.students.gradeOption.grade_2}</option>
            <option value="grade_3">{strings.parent.students.gradeOption.grade_3}</option>
          </select>
          {fieldErr?.current_grade && (
            <p className="text-xs text-tinku-warn">{fieldErr.current_grade[0]}</p>
          )}
        </div>
      </div>

      {/* Avatar */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-tinku-ink">{strings.parent.students.avatarLabel}</legend>
        <div data-testid="avatar-picker" className="grid grid-cols-6 gap-2">
          {AVATARS.map((a) => {
            const selected = avatar === a.id;
            return (
              <button
                type="button"
                key={a.id}
                data-testid={`avatar-${a.id}`}
                onClick={() => setAvatar(a.id)}
                className={cn(
                  'aspect-square rounded-2xl flex items-center justify-center text-2xl transition-all',
                  a.bgClass,
                  selected
                    ? 'ring-4 ring-tinku-sea scale-105'
                    : 'hover:ring-2 hover:ring-tinku-ink/20',
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

      {/* Consent */}
      <section className="rounded-2xl border border-tinku-ink/10 bg-white p-5 space-y-3">
        <h2 className="text-sm font-semibold text-tinku-ink">{strings.parent.students.consentTitle}</h2>
        <div
          data-testid="consent-text"
          className="max-h-72 overflow-y-auto rounded-xl border border-tinku-ink/10 p-4 bg-tinku-mist/40"
        >
          <ConsentTextV1 />
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            data-testid="consent-checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 w-5 h-5 accent-tinku-sea"
          />
          <span className="text-sm text-tinku-ink">
            {strings.parent.students.consentAcceptLabel}
          </span>
        </label>
        {fieldErr?.consent_accepted && (
          <p data-testid="err-consent" className="text-xs text-tinku-warn">{fieldErr.consent_accepted[0]}</p>
        )}
      </section>

      {topError && (
        <div
          data-testid="new-student-error"
          role="alert"
          className="rounded-lg border border-tinku-warn/40 bg-tinku-warn/10 px-3 py-2 text-sm text-tinku-warn"
        >
          {topError}
        </div>
      )}

      <SubmitButton disabled={!consent} />
    </form>
  );
}
