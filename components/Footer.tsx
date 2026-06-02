'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <svg width="28" height="34" viewBox="0 0 34 42" fill="none" aria-hidden="true">
                <path d="M1 42V17C1 7.611 8.163 1 17 1C25.837 1 33 7.611 33 17V42H1Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.5" />
                <path d="M9 42V22C9 16.477 12.686 13 17 13C21.314 13 25 16.477 25 22V42H9Z" fill="white" />
                <circle cx="21" cy="32" r="1.8" fill="rgba(59,130,246,0.8)" />
              </svg>
              <span className="text-xl font-bold text-white">Hostn</span>
            </div>
            <p className="text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
            <p className="text-xs mt-4 text-gray-500">
              {t('footer.free_call')} : <span className="text-gray-300">+216 70 000 000</span>
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('footer.assistance')}</h4>
            <ul className="space-y-2 text-sm">
              {[
                t('footer.help'),
                t('footer.cancellation_policy'),
                t('footer.security_protocol'),
                t('footer.report'),
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
            <h4 className="font-semibold text-white mb-4">{t('footer.community')}</h4>
            <ul className="space-y-2 text-sm">
              {[
                { label: t('footer.become_host'), href: '/host/submit' },
                { label: t('footer.host_forum'), href: '#' },
                { label: t('footer.blog'), href: '#' },
                { label: t('footer.partners'), href: '#' },
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
            <h4 className="font-semibold text-white mb-4">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm">
              {[
                t('footer.about'),
                t('footer.news'),
                t('footer.investors'),
                t('footer.jobs'),
                t('footer.press'),
              ].map((item) => (
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
          <p>{t('footer.copyright')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/confidentialite" className="hover:text-white transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link href="/conditions" className="hover:text-white transition-colors">
              {t('footer.terms')}
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              {t('footer.sitemap')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
