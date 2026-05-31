import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileTabBar from '@/components/MobileTabBar';

export const metadata: Metadata = {
  title: 'Hostn — Votre logement en Tunisie',
  description:
    'Trouvez et réservez les plus beaux logements en Tunisie. Villas, riads, appartements et chalets authentiques.',
  keywords: 'location vacances tunisie, villa tunisie, riad, djerba, sidi bou said, hammamet',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head />
      <body className="min-h-screen bg-white text-gray-900 flex flex-col">
        <Header />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <div className="hidden md:block"><Footer /></div>
        <MobileTabBar />
      </body>
    </html>
  );
}
