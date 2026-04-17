'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRef } from 'react';
import { studentLoginAction, type StudentAuthResult } from '@/lib/auth/student-actions';
import { strings } from '@/content/strings/es-AR';
import { cn } from '@/lib/utils/cn';

const initial: StudentAuthResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="entrar-submit"
      className={cn(
        'w-full rounded-2xl h-14 text-xl font-semibold transition-all',
        'bg-tinku-sea text-white hover:bg-tinku-sea/90 active:scale-95',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        'exercise-target',
      )}
    >
      {pending ? strings.student.entrar.submitting : strings.student.entrar.submit}
    </button>
  );
}

function errorMessage(result: StudentAuthResult | null): string | null {
  if (!result || result.ok) return null;
  const map: Record<string, string> = {
    invalid_format: strings.student.entrar.errors.invalidFormat,
    invalid_code: strings.student.entrar.errors.invalidCode,
    rate_limited: strings.student.entrar.errors.rateLimited,
    generic: strings.student.entrar.errors.generic,
  };
  return map[result.error] ?? strings.student.entrar.errors.generic;
}

export function LoginCodeForm() {
  const [state, formAction] = useFormState(studentLoginAction, initial);
  const inputRef = useRef<HTMLInputElement>(null);
  const err = errorMessage(state);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <label htmlFor="login_code" className="block text-base font-medium text-tinku-ink">
        {strings.student.entrar.codeLabel}
      </label>
      <input
        ref={inputRef}
        id="login_code"
        name="login_code"
        data-testid="entrar-code-input"
        type="text"
        required
        maxLength={6}
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        pattern="[A-HJ-KM-NP-Z2-9]{6}"
        placeholder={strings.student.entrar.codePlaceholder}
        className={cn(
          'w-full h-20 rounded-2xl border-2 border-tinku-ink/15 bg-white',
          'text-center font-mono text-4xl tracking-[0.3em] uppercase',
          'focus:outline-none focus:border-tinku-sea focus:ring-4 focus:ring-tinku-sea/20',
          'placeholder:text-tinku-ink/20 placeholder:tracking-normal placeholder:text-2xl',
          'exercise-target',
        )}
        onInput={(e) => {
          const el = e.currentTarget;
          el.value = el.value.toUpperCase();
        }}
      />

      {err && (
        <div
          data-testid="entrar-error"
          role="alert"
          className="rounded-xl border-2 border-tinku-warn/40 bg-tinku-warn/10 px-4 py-3 text-base text-tinku-warn"
        >
          {err}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
