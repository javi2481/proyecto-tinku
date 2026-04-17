'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { loginAction, type ActionResult } from '@/lib/auth/actions';
import { strings } from '@/content/strings/es-AR';
import { cn } from '@/lib/utils/cn';

const initial: ActionResult | null = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      data-testid="login-submit"
      className={cn(
        'w-full h-11 rounded-xl font-medium transition-colors',
        'bg-tinku-sea text-white hover:bg-tinku-sea/90',
        'disabled:opacity-60 disabled:cursor-not-allowed',
      )}
    >
      {pending ? strings.auth.login.submitting : strings.auth.login.submit}
    </button>
  );
}

function errorMessage(result: ActionResult | null): string | null {
  if (!result || result.ok) return null;
  const map: Record<string, string> = {
    invalid_credentials: strings.auth.login.errors.invalidCredentials,
    rate_limited: strings.auth.login.errors.rateLimited,
    validation: 'Revisá los campos marcados.',
    generic: strings.auth.login.errors.generic,
  };
  return map[result.error] ?? strings.auth.login.errors.generic;
}

export function LoginForm() {
  const [state, formAction] = useFormState(loginAction, initial);
  const fieldErr = !state || state.ok ? undefined : state.fieldErrors;
  const topError = errorMessage(state);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium text-tinku-ink">
          {strings.auth.login.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          data-testid="login-email"
          type="email"
          required
          autoComplete="email"
          className="w-full h-11 px-3 rounded-xl border border-tinku-ink/15 bg-white text-tinku-ink focus:outline-none focus:ring-2 focus:ring-tinku-sea"
        />
        {fieldErr?.email && (
          <p data-testid="err-email" className="text-xs text-tinku-warn">{fieldErr.email[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium text-tinku-ink">
          {strings.auth.login.passwordLabel}
        </label>
        <input
          id="password"
          name="password"
          data-testid="login-password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full h-11 px-3 rounded-xl border border-tinku-ink/15 bg-white text-tinku-ink focus:outline-none focus:ring-2 focus:ring-tinku-sea"
        />
        {fieldErr?.password && (
          <p data-testid="err-password" className="text-xs text-tinku-warn">{fieldErr.password[0]}</p>
        )}
      </div>

      {topError && (
        <div
          data-testid="login-error"
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
