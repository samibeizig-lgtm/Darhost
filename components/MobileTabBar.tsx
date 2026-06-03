'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, Home, Calendar, MessageSquare, Menu, Search,
  BookOpen, User, LogOut, ArrowLeftRight, X, Info, ChevronDown, ChevronUp,
  FileText, Shield, Mail, HelpCircle,
} from 'lucide-react';
import { getUser, clearUser, setUser as persistUser, StoredUser } from '@/lib/store';
import { useLanguage } from '@/lib/i18n';

export default function MobileTabBar() {
  const [user, setUserState] = useState<StoredUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => { setUserState(getUser()); }, [pathname]);

  if (!user) return null;

  const HOST_TABS = [
    { href: '/host/dashboard', icon: LayoutDashboard, label: t('tab.home') },
    { href: '/host/listings', icon: Building2, label: t('tab.listings') },
    { href: '/host/reservations', icon: BookOpen, label: t('tab.bookings') },
    { href: '/host/calendar', icon: Calendar, label: t('tab.calendar') },
    { href: '/messages', icon: MessageSquare, label: t('tab.messages') },
  ];

  const GUEST_TABS = [
    { href: '/reservations', icon: BookOpen, label: t('tab.bookings') },
    { href: '/properties', icon: Search, label: t('tab.search') },
    { href: '/messages', icon: MessageSquare, label: t('tab.messages') },
  ];

  const tabs = user.role === 'host' ? HOST_TABS : GUEST_TABS;

  function handleSwitchRole() {
    const updated = { ...user!, role: user!.role === 'host' ? 'guest' as const : 'host' as const };
    persistUser(updated);
    setUserState(updated);
    setMenuOpen(false);
    router.push(updated.role === 'host' ? '/host/listings' : '/properties');
  }

  function handleLogout() {
    clearUser();
    setUserState(null);
    setMenuOpen(false);
    router.push('/');
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <>
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className="flex items-stretch h-16">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-[#0F4C8A]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <tab.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-semibold">{tab.label}</span>
                {active && <span className="absolute bottom-0 w-8 h-0.5 bg-[#0F4C8A] rounded-full" />}
              </Link>
            );
          })}

          <button
            onClick={() => setMenuOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              menuOpen ? 'text-[#0F4C8A]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Menu size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-semibold">{t('tab.menu')}</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 bg-black/40 z-50 transition-opacity"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed bottom-0 inset-x-0 bg-white rounded-t-2xl z-50 shadow-2xl overflow-hidden">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-[#E8F0FB]" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#0F4C8A] flex items-center justify-center ring-2 ring-[#E8F0FB] text-white font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    user.role === 'host' ? 'bg-[#E8F0FB] text-[#0F4C8A]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {user.role === 'host' ? t('nav.role_host') : t('nav.role_guest')}
                  </span>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="px-3 py-3 space-y-1">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <User size={20} className="text-[#0F4C8A] shrink-0" />
                <span className="font-medium">{t('nav.profile')}</span>
              </Link>
              <button
                onClick={handleSwitchRole}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors w-full"
              >
                <ArrowLeftRight size={20} className="text-[#0F4C8A] shrink-0" />
                <span className="font-medium">
                  {user.role === 'host' ? t('nav.switch_guest') : t('nav.switch_host')}
                </span>
              </button>

              <button
                onClick={() => setAboutOpen(o => !o)}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors w-full"
              >
                <Info size={20} className="text-[#0F4C8A] shrink-0" />
                <span className="font-medium flex-1 text-left">{t('menu.about')}</span>
                {aboutOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>

              {aboutOpen && (
                <div className="ml-10 space-y-0.5">
                  <Link href="/conditions" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 text-sm transition-colors">
                    <FileText size={16} className="text-gray-400 shrink-0" />
                    {t('footer.terms')}
                  </Link>
                  <Link href="/confidentialite" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 text-sm transition-colors">
                    <Shield size={16} className="text-gray-400 shrink-0" />
                    {t('footer.privacy')}
                  </Link>
                  <Link href="mailto:support@hostn.tn" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 text-sm transition-colors">
                    <Mail size={16} className="text-gray-400 shrink-0" />
                    {t('footer.contact')} · support@hostn.tn
                  </Link>
                  <Link href="#" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-50 text-sm transition-colors">
                    <HelpCircle size={16} className="text-gray-400 shrink-0" />
                    {t('footer.help')}
                  </Link>
                  <p className="px-4 py-2 text-xs text-gray-400">© 2025 Hostn · +216 70 000 000</p>
                </div>
              )}

              <div className="h-px bg-gray-100 mx-2 my-1" />

              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors w-full"
              >
                <LogOut size={20} className="shrink-0" />
                <span className="font-medium">{t('nav.logout')}</span>
              </button>
            </div>

            <div className="h-6" />
          </div>
        </div>
      )}
    </>
  );
}
