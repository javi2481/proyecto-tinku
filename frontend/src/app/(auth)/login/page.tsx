import Link from 'next/link';
import { strings } from '@/content/strings/es-AR';
import { LoginForm } from './LoginForm';

export default function LoginPage() {
  return (
    <div data-testid="login-page" className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-tinku-ink">{strings.auth.login.title}</h1>
        <p className="text-sm text-tinku-ink/70">{strings.auth.login.subtitle}</p>
      </header>

      <LoginForm />

      <p className="text-sm text-tinku-ink/70 text-center">
        {strings.auth.login.signupHint}{' '}
        <Link data-testid="signup-link" href="/signup" className="text-tinku-sea font-medium hover:underline">
          {strings.auth.login.signupLink}
        </Link>
      </p>
    </div>
  );
}
