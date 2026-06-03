import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileTabBar from '@/components/MobileTabBar';
import NavigationLoader from '@/components/NavigationLoader';
import { LanguageProvider } from '@/lib/i18n';
import LanguageSync from '@/components/LanguageSync';

export const metadata: Metadata = {
  title: 'Hostn — Votre logement en Tunisie',
  description:
    'Trouvez et réservez les plus beaux logements en Tunisie. Villas, riads, appartements et chalets authentiques.',
  keywords: 'location vacances tunisie, villa tunisie, riad, djerba, sidi bou said, hammamet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F4C8A" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}` }} />
      </head>
      <body className="min-h-screen bg-white text-gray-900 flex flex-col">
        <LanguageProvider>
          <LanguageSync />
          <Header />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
          <Footer />
          <MobileTabBar />
          <NavigationLoader />
        </LanguageProvider>
      </body>
    </html>
  );
}
