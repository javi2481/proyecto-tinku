import { renderIslaPage } from '../_shared/renderIslaPage';
export const dynamic = 'force-dynamic';
export default function IslaPalabrasPage() {
  return renderIslaPage({
    subject: 'language',
    title: 'Isla de las Palabras',
    subtitle: 'Jugamos con la lengua: ortografía, sinónimos y lectura.',
    emoji: '📚',
    bgGradient: 'bg-gradient-to-br from-pink-50 via-tinku-mist to-tinku-sand/30',
    basePath: '/isla/palabras',
  });
}
