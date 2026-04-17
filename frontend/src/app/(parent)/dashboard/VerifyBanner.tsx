'use client';

import { useFormState } from 'react-dom';
import { resendVerifyAction, type ActionResult } from '@/lib/auth/actions';
import { strings } from '@/content/strings/es-AR';

const initial: ActionResult | null = null;

export function VerifyBanner() {
  const [state, action] = useFormState(resendVerifyAction, initial);

  return (
    <div
      data-testid="verify-banner"
      role="status"
      className="rounded-2xl border border-tinku-warn/40 bg-tinku-warn/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <p className="text-sm text-tinku-ink">{strings.parent.dashboard.verifyBanner}</p>
      <form action={action}>
        <button
          type="submit"
          data-testid="verify-resend-btn"
          className="h-9 px-3 rounded-lg bg-tinku-warn text-white text-sm font-medium hover:bg-tinku-warn/90"
        >
          {strings.parent.dashboard.verifyBannerAction}
        </button>
      </form>
      {state?.ok && (
        <p data-testid="verify-resend-ok" className="text-xs text-tinku-leaf">
          {strings.auth.verify.resent}
        </p>
      )}
    </div>
  );
}
