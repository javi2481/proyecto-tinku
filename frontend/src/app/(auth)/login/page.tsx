import Link from 'next/link';
import { strings } from '@/content/strings/es-AR';
import { LoginForm } from './LoginForm';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { OAuthErrorBanner } from './OAuthErrorBanner';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div data-testid="login-page" className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-tinku-ink">{strings.auth.login.title}</h1>
        <p className="text-sm text-tinku-ink/70">{strings.auth.login.subtitle}</p>
      </header>

      {sp.error && <OAuthErrorBanner code={sp.error} />}

      <GoogleAuthButton label={strings.auth.common.continueGoogle} next="/dashboard" />

      <div className="relative flex items-center gap-3 py-1">
        <span className="flex-1 border-t border-tinku-ink/10" />
        <span className="text-xs text-tinku-ink/50 uppercase tracking-wide">{strings.auth.common.or}</span>
        <span className="flex-1 border-t border-tinku-ink/10" />
      </div>

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
