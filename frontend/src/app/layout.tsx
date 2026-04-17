import type { Metadata } from 'next';
import { Andika, Inter } from 'next/font/google';
import './globals.css';

const andika = Andika({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-andika',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-parent',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tinkú — Aprender jugando',
  description: 'Plataforma educativa para chicos argentinos de 6 a 12 años. Las Islas del Saber.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${andika.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
