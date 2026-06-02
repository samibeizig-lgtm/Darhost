import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path d="M16 3L3 13v16h26V13L16 3z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.8" strokeLinejoin="round" />
                <circle cx="16" cy="14" r="3" fill="white" />
                <path d="M9 24c0-3.866 3.134-7 7-7s7 3.134 7 7" fill="white" />
              </svg>
              <span className="text-xl font-bold text-white">Hostn</span>
            </div>
            <p className="text-sm leading-relaxed">
              La plateforme de location de logements incontournable en Tunisie. Villas, riads,
              appartements et chalets authentiques.
            </p>
            <p className="text-xs mt-4 text-gray-500">
              Appel gratuit : <span className="text-gray-300">+216 70 000 000</span>
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Assistance</h4>
            <ul className="space-y-2 text-sm">
              {[
                "Centre d'aide",
                "Options d'annulation",
                'Protocole de sécurité',
                'Signaler un problème',
                'Accessibilité',
              ].map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Communauté</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Devenir hôte', href: '/host/submit' },
                { label: 'Forum des hôtes', href: '#' },
                { label: 'Blog Hostn', href: '#' },
                { label: 'Partenaires', href: '#' },
                { label: 'Voyageurs responsables', href: '#' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Hostn</h4>
            <ul className="space-y-2 text-sm">
              {['À propos', 'Actualités', 'Investisseurs', 'Emplois', 'Presse'].map((item) => (
                <li key={item}>
                  <Link href="#" className="hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p>© 2024 Hostn, Inc. Tous droits réservés. 🇹🇳 Tunisie</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/confidentialite" className="hover:text-white transition-colors">
              Confidentialité
            </Link>
            <Link href="/conditions" className="hover:text-white transition-colors">
              Conditions d&apos;utilisation
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Plan du site
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
