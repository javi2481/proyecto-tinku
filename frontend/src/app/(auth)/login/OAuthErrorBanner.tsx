interface Props {
  code: string;
}

const MESSAGES: Record<string, string> = {
  oauth_no_code: 'No recibimos respuesta de Google. Probá de nuevo.',
  oauth_exchange: 'No pudimos completar el login con Google. Probá otra vez.',
  oauth_access_denied: 'Cancelaste el login con Google.',
  oauth_server_error: 'Hubo un error del lado de Google. Probá en unos segundos.',
};

export function OAuthErrorBanner({ code }: Props) {
  const msg = MESSAGES[code] ?? MESSAGES[`oauth_${code.replace(/^oauth_/, '')}`] ?? 'No pudimos completar el login. Probá de nuevo.';
  return (
    <div
      role="alert"
      data-testid="oauth-error-banner"
      className="rounded-2xl bg-tinku-warn/15 border border-tinku-warn/40 text-tinku-ink px-4 py-3 text-sm"
    >
      {msg}
    </div>
  );
}
