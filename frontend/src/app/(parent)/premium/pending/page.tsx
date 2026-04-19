import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function PendingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-tinku-sea/10 to-white p-6 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center space-y-6">
        <div className="text-6xl">⏳</div>
        
        <h1 className="text-3xl font-bold text-tinku-ink">
          Pago en proceso
        </h1>
        
        <p className="text-tinku-ink/70">
          Tu pago está siendo procesado. Te avisaremos cuando esté confirmado. Puede tomar unos minutos.
        </p>

        <div className="space-y-3 pt-4">
          <Link
            href="/dashboard"
            className="block w-full py-3 bg-tinku-sea text-white font-semibold rounded-xl hover:bg-tinku-sea/90 transition-colors"
          >
            Volver al Dashboard
          </Link>
          
          <Link
            href="/premium"
            className="block w-full py-3 bg-white text-tinku-sea border-2 border-tinku-sea font-semibold rounded-xl hover:bg-tinku-sea/5 transition-colors"
          >
            Ver Plan Premium
          </Link>
        </div>
      </div>
    </div>
  );
}