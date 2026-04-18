import { renderIslaPage } from '../_shared/renderIslaPage';
export const dynamic = 'force-dynamic';
export default function IslaArgentinaPage() {
  return renderIslaPage({
    subject: 'social',
    title: 'Isla Argentina',
    subtitle: 'Conocé tu país, sus símbolos y cómo vivimos juntos.',
    emoji: '🇦🇷',
    bgGradient: 'bg-gradient-to-br from-sky-50 via-tinku-mist to-amber-50',
    basePath: '/isla/argentina',
  });
}
