import Link from 'next/link';
import { strings } from '@/content/strings/es-AR';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <aside className="hidden lg:flex flex-col justify-between bg-tinku-ink text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, #2AB6C7 0%, transparent 60%), radial-gradient(circle at 80% 80%, #F5E6C8 0%, transparent 50%)' }}
             aria-hidden
        />
        <Link href="/" className="relative text-lg font-semibold tracking-wide">
          <span className="text-tinku-sand">{strings.common.appName}</span>
        </Link>
        <div className="relative space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">
            {strings.marketing.heroTitle}
          </h2>
          <p className="text-white/70 max-w-md">
            {strings.marketing.heroSub}
          </p>
        </div>
        <p className="relative text-xs text-white/40">
          Tinkú acompaña el aprendizaje, no lo reemplaza.
        </p>
      </aside>

      <main className="flex items-center justify-center p-6 sm:p-12 bg-tinku-mist">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
