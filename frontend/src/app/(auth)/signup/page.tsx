import Link from 'next/link';
import { strings } from '@/content/strings/es-AR';
import { SignupForm } from './SignupForm';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

export default function SignupPage() {
  return (
    <div data-testid="signup-page" className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-tinku-ink">{strings.auth.signup.title}</h1>
        <p className="text-sm text-tinku-ink/70">{strings.auth.signup.subtitle}</p>
      </header>

      <GoogleAuthButton label={strings.auth.common.signupGoogle} next="/dashboard" />

      <div className="relative flex items-center gap-3 py-1">
        <span className="flex-1 border-t border-tinku-ink/10" />
        <span className="text-xs text-tinku-ink/50 uppercase tracking-wide">{strings.auth.common.or}</span>
        <span className="flex-1 border-t border-tinku-ink/10" />
      </div>

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
