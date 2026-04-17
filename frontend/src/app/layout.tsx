import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tinkú — Aprender jugando',
  description: 'Plataforma educativa para chicos argentinos de 6 a 12 años. Las Islas del Saber.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
