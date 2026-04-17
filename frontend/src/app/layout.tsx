import type { Metadata, Viewport } from 'next';
import { Andika, Inter } from 'next/font/google';
import './globals.css';
import { RegisterSW } from '@/components/pwa/RegisterSW';

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
  description:
    'Plataforma educativa para chicos argentinos de 6 a 12 años. Las Islas del Saber.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Tinkú',
  appleWebApp: {
    capable: true,
    title: 'Tinkú',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/tinku-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/tinku-512.png', sizes: '512x512', type: 'image/png' },
      { url: '/icons/tinku.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/tinku-apple-touch.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#2F7A8C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${andika.variable} ${inter.variable}`}>
      <body>
        {children}
        <RegisterSW />
      </body>
    </html>
  );
}
