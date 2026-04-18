import { renderIslaPage } from '../_shared/renderIslaPage';
export const dynamic = 'force-dynamic';
export default function IslaCienciasPage() {
  return renderIslaPage({
    subject: 'science',
    title: 'Isla de las Ciencias',
    subtitle: 'El cuerpo, los animales y las plantas, como si fuera una aventura.',
    emoji: '🌿',
    bgGradient: 'bg-gradient-to-br from-green-50 via-tinku-mist to-tinku-sea/10',
    basePath: '/isla/ciencias',
  });
}
