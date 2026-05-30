'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, MessageSquare, User, Home, Search, LogOut, ChevronDown } from 'lucide-react';
import { getUser, clearUser, StoredUser } from '@/lib/store';
import { localitesTunisie } from '@/lib/data';

function DarHostLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 42V17C1 7.611 8.163 1 17 1C25.837 1 33 7.611 33 17V42H1Z" fill="#0F4C8A" />
        <path d="M9 42V22C9 16.477 12.686 13 17 13C21.314 13 25 16.477 25 22V42H9Z" fill="white" />
        <circle cx="21" cy="32" r="1.8" fill="#0F4C8A" />
        <circle cx="17" cy="6" r="2" fill="white" opacity="0.5" />
      </svg>
      <span className="text-2xl font-bold text-[#0F4C8A] tracking-tight">
        DarHost
      </span>
    </Link>
  );
}

const navLinks = [
  { href: '/properties', label: 'Logements' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<StoredUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setUser(getUser());
  }, [pathname]);

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
  }

  function handleLogout() {
    clearUser();
    setUser(null);
    setDropdownOpen(false);
    setMenuOpen(false);
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <DarHostLogo />

          {/* Desktop search pill */}
          <form
            onSubmit={handleSearch}
            className="hidden lg:flex items-center gap-3 border border-gray-300 rounded-full px-4 py-2 shadow-sm hover:shadow-md transition-shadow flex-1 max-w-md"
          >
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Où allez-vous ?"
              list="localities-desktop"
            className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent min-w-0"
            />
            <datalist id="localities-desktop">
              {localitesTunisie.map((l) => <option key={l} value={l} />)}
            </datalist>
            <span className="w-px h-4 bg-gray-300 shrink-0" />
            <span className="text-sm text-gray-400 shrink-0 hidden xl:block">Tunisie</span>
            <button
              type="submit"
              className="w-8 h-8 bg-[#0F4C8A] rounded-full flex items-center justify-center hover:bg-[#0A3566] transition-colors shrink-0"
            >
              <Search size={14} className="text-white" />
            </button>
          </form>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-[#E8F0FB] text-[#0F4C8A]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <Link
                href="/host/submit"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pathname === '/host/submit'
                    ? 'bg-[#E8F0FB] text-[#0F4C8A]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Publier un logement
              </Link>
            ) : (
              <Link
                href="/register"
                className="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Devenir hôte
              </Link>
            )}

            {user && (
              <Link
                href="/messages"
                className={`p-2 rounded-full transition-colors ${
                  pathname === '/messages'
                    ? 'bg-[#E8F0FB] text-[#0F4C8A]'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <MessageSquare size={20} />
              </Link>
            )}

            <div className="w-px h-6 bg-gray-200 mx-1" />

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 border border-gray-200 rounded-full hover:shadow-md transition-shadow"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                  />
                  <span className="text-sm font-medium text-gray-700 hidden xl:inline max-w-[120px] truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className="text-gray-500 shrink-0" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-2xl shadow-xl w-56 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                    >
                      <User size={15} className="text-[#0F4C8A]" />
                      Mon profil
                    </Link>
                    <Link
                      href="/host/submit"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 transition-colors"
                    >
                      <Home size={15} className="text-[#0F4C8A]" />
                      Publier un logement
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-sm text-red-600 w-full border-t border-gray-100 transition-colors"
                    >
                      <LogOut size={15} />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-[#0F4C8A] text-white text-sm font-medium rounded-full hover:bg-[#0A3566] transition-colors"
                >
                  S&apos;inscrire
                </Link>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 shadow-lg">
          {/* Mobile search */}
          <form
            onSubmit={(e) => { handleSearch(e); setMenuOpen(false); }}
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
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-[#E8F0FB] text-[#0F4C8A]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <Link
                href="/host/submit"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  pathname === '/host/submit'
                    ? 'bg-[#E8F0FB] text-[#0F4C8A]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Publier un logement
              </Link>
            ) : (
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Devenir hôte
              </Link>
            )}

            {user && (
              <Link
                href="/messages"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                <MessageSquare size={18} className="text-[#0F4C8A]" />
                Messages
              </Link>
            )}
          </nav>

          {user ? (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-1">
              <div className="flex items-center gap-3 px-4 py-2 mb-2">
                <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                <User size={18} className="text-[#0F4C8A]" />
                Mon profil
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 font-medium hover:bg-red-50 transition-colors w-full"
              >
                <LogOut size={18} />
                Se déconnecter
              </button>
            </div>
          ) : (
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-2.5 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center py-2.5 bg-[#0F4C8A] text-white rounded-full text-sm font-medium hover:bg-[#0A3566] transition-colors"
              >
                S&apos;inscrire
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
