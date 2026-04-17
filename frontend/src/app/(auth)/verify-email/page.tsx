import Link from 'next/link';
import { verifyEmailToken } from '@/lib/auth/actions';
import { strings } from '@/content/strings/es-AR';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ token?: string; sent?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token;
  const sent = params.sent === 'true';

  if (sent && !token) {
    return (
      <div data-testid="verify-sent" className="space-y-4">
        <h1 className="text-2xl font-semibold text-tinku-ink">{strings.auth.verify.sentTitle}</h1>
        <p className="text-sm text-tinku-ink/70">
          Te mandamos un link para confirmar tu cuenta. Hacé click ahí y volvemos.
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-xl bg-tinku-sea text-white h-11 px-5 leading-[2.75rem] font-medium hover:bg-tinku-sea/90"
        >
          Ir al panel
        </Link>
      </div>
    );
  }

  if (!token) {
    return (
      <div data-testid="verify-missing" className="space-y-4">
        <h1 className="text-2xl font-semibold text-tinku-ink">{strings.auth.verify.invalidTitle}</h1>
        <p className="text-sm text-tinku-ink/70">{strings.auth.verify.invalidBody}</p>
        <Link href="/login" className="text-tinku-sea font-medium hover:underline">
          Ir a login
        </Link>
      </div>
    );
  }

  const result = await verifyEmailToken(token);

  if (result.status === 'ok') {
    return (
      <div data-testid="verify-ok" className="space-y-4">
        <div className="text-4xl">✨</div>
        <h1 className="text-2xl font-semibold text-tinku-ink">{strings.auth.verify.successTitle}</h1>
        <p className="text-sm text-tinku-ink/70">{strings.auth.verify.successBody}</p>
        <Link
          href="/dashboard"
          data-testid="verify-ok-cta"
          className="inline-block rounded-xl bg-tinku-sea text-white h-11 px-5 leading-[2.75rem] font-medium hover:bg-tinku-sea/90"
        >
          {strings.auth.verify.successCta}
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="verify-invalid" className="space-y-4">
      <h1 className="text-2xl font-semibold text-tinku-ink">{strings.auth.verify.invalidTitle}</h1>
      <p className="text-sm text-tinku-ink/70">{strings.auth.verify.invalidBody}</p>
      <Link
        href="/dashboard"
        className="inline-block rounded-xl bg-tinku-sea text-white h-11 px-5 leading-[2.75rem] font-medium hover:bg-tinku-sea/90"
      >
        {strings.auth.verify.invalidCta}
      </Link>
    </div>
  );
}
