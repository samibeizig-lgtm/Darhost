'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu, X, MessageSquare, User, Home, Search,
  LogOut, ChevronDown, Calendar, BookOpen, Plus, ArrowLeftRight,
} from 'lucide-react';
import { getUser, clearUser, setUser as persistUser, StoredUser } from '@/lib/store';
import { localitesTunisie } from '@/lib/data';

const TEAL = 'rgb(10, 186, 181)';

function HouseIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="28" height="28" viewBox="0 0 24 24"
      fill="none" stroke="white" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      <path d="M4 12C4 7.582 7.582 4 12 4C16.418 4 20 7.582 20 12" />
      <rect x="4" y="11.5" width="16" height="9.5" rx="2.5" />
      <circle cx="12" cy="16.5" r="2" />
    </svg>
  );
}

function HostnLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <HouseIcon />
      <span className="text-white font-extrabold text-xl tracking-tight">Hostn</span>
    </Link>
  );
}

const hostLinks = [
  { href: '/host/dashboard', label: 'Accueil', icon: Home },
  { href: '/host/listings', label: 'Mes annonces', icon: MessageSquare },
  { href: '/host/calendar', label: 'Calendrier', icon: Calendar },
  { href: '/host/reservations', label: 'Réservations', icon: BookOpen },
  { href: '/messages', label: 'Messagerie', icon: MessageSquare },
  { href: '/profile', label: 'Profil', icon: User },
];

const guestLinks = [
  { href: '/reservations', label: 'Mes réservations', icon: BookOpen },
  { href: '/properties', label: 'Rechercher', icon: Search },
  { href: '/messages', label: 'Messagerie', icon: MessageSquare },
  { href: '/profile', label: 'Profil', icon: User },
];

const publicLinks = [
  { href: '/properties', label: 'Logements', icon: Search },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<StoredUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { setUser(getUser()); }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/properties?location=${encodeURIComponent(q)}` : '/properties');
    setMenuOpen(false);
  }

  function handleLogout() {
    clearUser();
    setUser(null);
    setDropdownOpen(false);
    setMenuOpen(false);
    router.push('/');
  }

  function handleSwitchRole() {
    if (!user) return;
    const updated = { ...user, role: user.role === 'host' ? 'guest' as const : 'host' as const };
    persistUser(updated);
    setUser(updated);
    setDropdownOpen(false);
    setMenuOpen(false);
    router.push('/');
  }

  const navLinks = user
    ? user.role === 'host' ? hostLinks : guestLinks
    : publicLinks;

  function navClass(href: string) {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    return `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
      active ? 'bg-white/25 text-white' : 'text-white/85 hover:bg-white/15'
    }`;
  }

  function mobileNavClass(href: string) {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    return `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      active ? 'bg-[#E8F0FB] text-[#0F4C8A]' : 'text-gray-700 hover:bg-gray-50'
    }`;
  }

  return (
    <header className="sticky top-0 z-50 shadow-md" style={{ background: TEAL }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <HostnLogo />

          <form
            onSubmit={handleSearch}
            className="hidden lg:flex items-center gap-3 rounded-full px-4 py-2 flex-1 max-w-md transition-shadow"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.35)' }}
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Où allez-vous ?"
              list="localities-desktop"
              className="flex-1 text-sm outline-none bg-transparent min-w-0 text-white placeholder-white/60"
            />
            <datalist id="localities-desktop">
              {localitesTunisie.map((l) => <option key={l} value={l} />)}
            </datalist>
            <span className="w-px h-4 shrink-0" style={{ background: 'rgba(255,255,255,0.35)' }} />
            <span className="text-sm shrink-0 hidden xl:block text-white/70">Tunisie</span>
            <button
              type="submit"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0"
              style={{ background: 'white' }}
            >
              <Search size={14} style={{ color: TEAL }} />
            </button>
          </form>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={`${link.href}-${link.label}`} href={link.href} className={navClass(link.href)}>
                <link.icon size={15} />
                {link.label}
              </Link>
            ))}

            {user?.role === 'host' && (
              <Link
                href="/host/submit"
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pathname === '/host/submit'
                    ? 'bg-white/40 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                <Plus size={15} />
                Publier
              </Link>
            )}

            <div className="w-px h-6 mx-1" style={{ background: 'rgba(255,255,255,0.3)' }} />

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-white/15 transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.4)' }}
                >
                  <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                  <div className="hidden xl:flex flex-col items-start leading-none">
                    <span className="text-xs font-semibold text-white max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                    <span className="text-[10px] font-medium mt-0.5 text-white/70">
                      {user.role === 'host' ? 'Hôte' : 'Voyageur'}
                    </span>
                  </div>
                  <ChevronDown size={14} className="text-white/70 shrink-0" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-2xl shadow-xl w-56 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        user.role === 'host' ? 'bg-[#E8F0FB] text-[#0F4C8A]' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {user.role === 'host' ? 'Hôte' : 'Voyageur'}
                      </span>
                    </div>
                    <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                      <User size={15} className="text-[#0F4C8A]" /> Mon profil
                    </Link>
                    {user.role === 'host' && (
                      <Link href="/host/submit" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                        <Plus size={15} className="text-[#0F4C8A]" /> Publier un logement
                      </Link>
                    )}
                    <button onClick={handleSwitchRole} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 w-full transition-colors">
                      <ArrowLeftRight size={15} className="text-[#0F4C8A]" />
                      Passer en mode {user.role === 'host' ? 'Voyageur' : 'Hôte'}
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-sm text-red-600 w-full border-t border-gray-100 transition-colors">
                      <LogOut size={15} /> Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 rounded-full text-sm font-medium text-white/90 hover:bg-white/15 transition-colors">
                  Connexion
                </Link>
                <Link href="/register" className="px-4 py-2 bg-white text-sm font-semibold rounded-full hover:bg-white/90 transition-colors" style={{ color: TEAL }}>
                  S&apos;inscrire
                </Link>
              </>
            )}
          </nav>

          {!user && (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-full text-white hover:bg-white/15 transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {!user && menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
          <form
            onSubmit={handleSearch}
            className="flex items-center gap-3 border border-gray-300 rounded-full px-4 py-3 mb-4 shadow-sm"
          >
            <Search size={18} className="text-[#0F4C8A] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un logement..."
              list="localities-mobile"
              className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
            />
            <datalist id="localities-mobile">
              {localitesTunisie.map((l) => <option key={l} value={l} />)}
            </datalist>
          </form>

          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link key={`${link.href}-${link.label}`} href={link.href} onClick={() => setMenuOpen(false)} className={mobileNavClass(link.href)}>
                <link.icon size={18} className="text-[#0F4C8A]" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
            <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Connexion
            </Link>
            <Link href="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2.5 text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: TEAL }}>
              S&apos;inscrire
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
