import Link from 'next/link';
import { strings } from '@/content/strings/es-AR';
import { SignupForm } from './SignupForm';

export default function SignupPage() {
  return (
    <div data-testid="signup-page" className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-tinku-ink">{strings.auth.signup.title}</h1>
        <p className="text-sm text-tinku-ink/70">{strings.auth.signup.subtitle}</p>
      </header>

      <SignupForm />

      <p className="text-sm text-tinku-ink/70 text-center">
        {strings.auth.signup.loginHint}{' '}
        <Link data-testid="login-link" href="/login" className="text-tinku-sea font-medium hover:underline">
          {strings.auth.signup.loginLink}
        </Link>
      </p>

      <p className="text-xs text-tinku-ink/50 text-center leading-relaxed">
        {strings.auth.signup.termsHint}
      </p>
    </div>
  );
}
