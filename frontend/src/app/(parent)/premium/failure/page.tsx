import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function FailurePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-tinku-warn/10 to-white p-6 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="text-6xl">😔</div>
        
        <h1 className="text-3xl font-bold text-tinku-ink">
          No se pudo completar el pago
        </h1>
        
        <p className="text-tinku-ink/70">
          El pago fue rechazado. Podés intentar nuevamente con otra tarjeta o medio de pago.
        </p>

        <div className="space-y-3 pt-4">
          <Link
            href="/premium"
            className="block w-full py-3 bg-tinku-sea text-white font-semibold rounded-xl hover:bg-tinku-sea/90 transition-colors"
          >
            Intentar nuevamente
          </Link>
          
          <Link
            href="/dashboard"
            className="block w-full py-3 bg-white text-tinku-sea border-2 border-tinku-sea font-semibold rounded-xl hover:bg-tinku-sea/5 transition-colors"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}