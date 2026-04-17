'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signupAction, type ActionResult } from '@/lib/auth/actions';
import { strings } from '@/content/strings/es-AR';
import { cn } from '@/lib/utils/cn';

const initial: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="signup-submit"
      className={cn(
        'w-full h-11 rounded-xl font-medium transition-colors',
        'bg-tinku-sea text-white hover:bg-tinku-sea/90',
        'disabled:opacity-60 disabled:cursor-not-allowed',
      )}
    >
      {pending ? strings.auth.signup.submitting : strings.auth.signup.submit}
    </button>
  );
}

function errorMessage(result: ActionResult | null): string | null {
  if (!result || result.ok) return null;
  const map: Record<string, string> = {
    email_taken: strings.auth.signup.errors.emailTaken,
    invalid_email: strings.auth.signup.errors.invalidEmail,
    rate_limited: 'Demasiados intentos. Esperá unos minutos.',
    validation: 'Revisá los campos marcados.',
    generic: strings.auth.signup.errors.generic,
  };
  return map[result.error] ?? strings.auth.signup.errors.generic;
}

export function SignupForm() {
  const [state, formAction] = useFormState(signupAction, initial);
  const fieldErr = !state || state.ok ? undefined : state.fieldErrors;
  const topError = errorMessage(state);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="full_name" className="text-sm font-medium text-tinku-ink">
          {strings.auth.signup.fullNameLabel}
        </label>
        <input
          id="full_name"
          name="full_name"
          data-testid="signup-fullname"
          type="text"
          required
          autoComplete="name"
          placeholder={strings.auth.signup.fullNamePlaceholder}
          className="w-full h-11 px-3 rounded-xl border border-tinku-ink/15 bg-white text-tinku-ink placeholder:text-tinku-ink/30 focus:outline-none focus:ring-2 focus:ring-tinku-sea"
        />
        {fieldErr?.full_name && (
          <p data-testid="err-fullname" className="text-xs text-tinku-warn">{fieldErr.full_name[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-tinku-ink">
          {strings.auth.signup.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          data-testid="signup-email"
          type="email"
          required
          autoComplete="email"
          placeholder={strings.auth.signup.emailPlaceholder}
          className="w-full h-11 px-3 rounded-xl border border-tinku-ink/15 bg-white text-tinku-ink placeholder:text-tinku-ink/30 focus:outline-none focus:ring-2 focus:ring-tinku-sea"
        />
        {fieldErr?.email && (
          <p data-testid="err-email" className="text-xs text-tinku-warn">{fieldErr.email[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-tinku-ink">
          {strings.auth.signup.passwordLabel}
        </label>
        <input
          id="password"
          name="password"
          data-testid="signup-password"
          type="password"
          required
          autoComplete="new-password"
          placeholder={strings.auth.signup.passwordPlaceholder}
          className="w-full h-11 px-3 rounded-xl border border-tinku-ink/15 bg-white text-tinku-ink placeholder:text-tinku-ink/30 focus:outline-none focus:ring-2 focus:ring-tinku-sea"
        />
        <p className="text-xs text-tinku-ink/50">{strings.auth.signup.passwordHelp}</p>
        {fieldErr?.password && (
          <p data-testid="err-password" className="text-xs text-tinku-warn">{fieldErr.password[0]}</p>
        )}
      </div>

      {topError && (
        <div
          data-testid="signup-error"
          role="alert"
          className="rounded-lg border border-tinku-warn/40 bg-tinku-warn/10 px-3 py-2 text-sm text-tinku-warn"
        >
          {topError}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
