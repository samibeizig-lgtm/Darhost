'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Building2, Home, Calendar, MessageSquare, Menu, Search,
  BookOpen, User, LogOut, ArrowLeftRight, X,
} from 'lucide-react';
import { getUser, clearUser, setUser as persistUser, StoredUser } from '@/lib/store';

const HOST_TABS = [
  { href: '/host/dashboard', icon: LayoutDashboard, label: 'Accueil' },
  { href: '/host/listings', icon: Building2, label: 'Annonces' },
  { href: '/host/calendar', icon: Calendar, label: 'Calendrier' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
];

const GUEST_TABS = [
  { href: '/reservations', icon: BookOpen, label: 'Réservations' },
  { href: '/properties', icon: Search, label: 'Recherche' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
];

export default function MobileTabBar() {
  const [user, setUserState] = useState<StoredUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { setUserState(getUser()); }, [pathname]);

  if (!user) return null;

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
      {/* Fixed bottom tab bar — mobile only */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className="flex items-stretch h-16">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-[#0F4C8A]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <tab.icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                <span className="text-[10px] font-semibold">{tab.label}</span>
                {active && <span className="absolute bottom-0 w-8 h-0.5 bg-[#0F4C8A] rounded-full" />}
              </Link>
            );
          })}

          {/* Burger tab */}
          <button
            onClick={() => setMenuOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
              menuOpen ? 'text-[#0F4C8A]' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Menu size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-semibold">Menu</span>
          </button>
        </div>
      </div>

      {/* Bottom sheet overlay */}
      {menuOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 bg-black/40 z-50 transition-opacity"
            onClick={() => setMenuOpen(false)}
          />
          <div className="fixed bottom-0 inset-x-0 bg-white rounded-t-2xl z-50 shadow-2xl overflow-hidden">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* User info */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <img src={user.avatar} alt={user.name} className="w-11 h-11 rounded-full object-cover ring-2 ring-[#E8F0FB]" />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{user.name}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    user.role === 'host' ? 'bg-[#E8F0FB] text-[#0F4C8A]' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {user.role === 'host' ? 'Hôte' : 'Voyageur'}
                  </span>
                </div>
              </div>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Menu items */}
            <div className="px-3 py-3 space-y-1">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <User size={20} className="text-[#0F4C8A] shrink-0" />
                <span className="font-medium">Mon profil</span>
              </Link>
              <button
                onClick={handleSwitchRole}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors w-full"
              >
                <ArrowLeftRight size={20} className="text-[#0F4C8A] shrink-0" />
                <span className="font-medium">
                  Passer en mode {user.role === 'host' ? 'Voyageur' : 'Hôte'}
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors w-full"
              >
                <LogOut size={20} className="shrink-0" />
                <span className="font-medium">Se déconnecter</span>
              </button>
            </div>

            {/* Safe area spacer */}
            <div className="h-6" />
          </div>
        </div>
      )}
    </>
  );
}
