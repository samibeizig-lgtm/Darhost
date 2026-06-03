'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu, X, MessageSquare, User, Home, Search,
  LogOut, ChevronDown, Calendar, BookOpen, Plus, ArrowLeftRight, Building2, MapPin, Package,
} from 'lucide-react';
import { getUser, clearUser, setUser as persistUser, StoredUser, getUserListings, getUserServices } from '@/lib/store';
import { localitesTunisie } from '@/lib/data';
import { useLanguage, Locale } from '@/lib/i18n';

const TEAL = 'rgb(10, 186, 181)';

const LANG_OPTIONS: { locale: Locale; label: string }[] = [
  { locale: 'fr', label: 'Fr' },
  { locale: 'en', label: 'Eng' },
];

function HostnLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <svg width="28" height="34" viewBox="0 0 34 42" fill="none" aria-hidden="true">
        <path d="M1 42V17C1 7.611 8.163 1 17 1C25.837 1 33 7.611 33 17V42H1Z" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.5" />
        <path d="M9 42V22C9 16.477 12.686 13 17 13C21.314 13 25 16.477 25 22V42H9Z" fill="white" />
        <circle cx="21" cy="32" r="1.8" fill="rgba(10,186,181,0.9)" />
      </svg>
      <span className="text-white font-extrabold text-xl tracking-tight">Hostn</span>
    </Link>
  );
}

export default function Header() {
  const { t, locale, setLocale } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<StoredUser | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [hasListings, setHasListings] = useState(false);
  const [hasServices, setHasServices] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const hostLinks = [
    { href: '/host/dashboard', label: t('nav.home'), icon: Home },
    { href: '/host/listings', label: t('nav.listings'), icon: Building2 },
    { href: '/host/calendar', label: t('nav.calendar'), icon: Calendar },
    { href: '/host/reservations', label: t('nav.reservations'), icon: BookOpen },
    { href: '/messages', label: t('nav.messages'), icon: MessageSquare },
  ];

  const guestLinks = [
    { href: '/reservations', label: t('nav.reservations'), icon: BookOpen },
    { href: '/properties', label: t('nav.explore'), icon: Search },
    { href: '/services', label: t('nav.explore_services'), icon: Package },
    { href: '/messages', label: t('nav.messages'), icon: MessageSquare },
  ];

  const prestataireLinks = [
    { href: '/prestataire/dashboard', label: t('nav.home'), icon: Home },
    { href: '/prestataire/services', label: t('prestataire.my_services'), icon: Package },
    { href: '/prestataire/reservations', label: t('nav.reservations'), icon: BookOpen },
    { href: '/messages', label: t('nav.messages'), icon: MessageSquare },
  ];

  const publicLinks = [
    { href: '/properties', label: t('nav.listings'), icon: Search },
  ];

  useEffect(() => {
    const u = getUser();
    setUser(u);
    if (u) {
      setHasListings(getUserListings(u.id).length > 0);
      setHasServices(getUserServices(u.id).length > 0);
    }
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLocationChange(val: string) {
    setSearchQuery(val);
    if (val.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const q = val.toLowerCase();
    const matches = localitesTunisie.filter(l => l.toLowerCase().includes(q)).slice(0, 8);
    setSuggestions(matches);
    setShowSuggestions(matches.length > 0);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(q ? `/properties?location=${encodeURIComponent(q)}` : '/properties');
    setMenuOpen(false);
    setShowSuggestions(false);
  }

  function selectLocation(location: string) {
    setSearchQuery(location);
    setShowSuggestions(false);
  }

  function handleLogout() {
    clearUser();
    setUser(null);
    setDropdownOpen(false);
    setMenuOpen(false);
    router.push('/');
  }

  function switchTo(role: 'guest' | 'host' | 'prestataire') {
    if (!user) return;
    const updated = { ...user, role };
    persistUser(updated);
    setUser(updated);
    setDropdownOpen(false);
    setMenuOpen(false);
    router.push(role === 'host' ? '/host/dashboard' : role === 'prestataire' ? '/prestataire/dashboard' : '/properties');
  }

  const navLinks = user
    ? user.role === 'host' ? hostLinks : user.role === 'prestataire' ? prestataireLinks : guestLinks
    : publicLinks;

  function navClass(href: string) {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    return `flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
      active ? 'bg-white/25 text-white' : 'text-white/85 hover:bg-white/15'
    }`;
  }

  function mobileNavClass(href: string) {
    const active = pathname === href || (href !== '/' && pathname.startsWith(href));
    return `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
      active ? 'bg-[#E8F0FB] text-[#0F4C8A]' : 'text-gray-700 hover:bg-gray-50'
    }`;
  }

  const currentLang = LANG_OPTIONS.find(l => l.locale === locale) ?? LANG_OPTIONS[0];

  return (
    <header className="sticky top-0 z-50 shadow-md" style={{ background: TEAL }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <HostnLogo />

          <form
            onSubmit={handleSearch}
            className="hidden lg:flex items-center gap-3 rounded-full px-4 py-2 flex-1 max-w-md transition-shadow relative"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.35)' }}
            ref={searchRef}
          >
            <Search size={14} style={{ color: 'rgba(255,255,255,0.7)' }} className="shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleLocationChange(e.target.value)}
              placeholder={t('search.where')}
              autoComplete="off"
              className="flex-1 text-sm outline-none bg-transparent min-w-0 text-white placeholder-white/60"
            />
            <span className="w-px h-4 shrink-0" style={{ background: 'rgba(255,255,255,0.35)' }} />
            <span className="text-sm shrink-0 hidden xl:block text-white/70">{t('search.tunisia')}</span>
            <button
              type="submit"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0"
              style={{ background: 'white' }}
            >
              <Search size={14} style={{ color: TEAL }} />
            </button>
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onMouseDown={() => selectLocation(s)}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-400 hover:bg-gray-50 hover:text-gray-600 text-left transition-colors"
                  >
                    <MapPin size={14} className="text-gray-300 shrink-0" />
                    {s}
                  </button>
                ))}
              </div>
            )}
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
                {t('nav.publish')}
              </Link>
            )}

            <div className="w-px h-6 mx-1" style={{ background: 'rgba(255,255,255,0.3)' }} />

            {/* Language switcher */}
            <div className="relative" ref={langDropdownRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-white/90 hover:bg-white/15 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.3)' }}
                aria-label="Change language"
              >
                {currentLang.label}
                <ChevronDown size={11} className="text-white/70" />
              </button>
              {langDropdownOpen && (
                <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-xl w-32 z-50 overflow-hidden">
                  {LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.locale}
                      onClick={() => { setLocale(opt.locale); setLangDropdownOpen(false); }}
                      className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors ${
                        locale === opt.locale
                          ? 'bg-[#E8F0FB] text-[#0F4C8A] font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-white/15 transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.4)' }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center shrink-0 text-white text-xs font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden xl:flex flex-col items-start leading-none">
                    <span className="text-xs font-semibold text-white max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
                    <span className="text-[10px] font-medium mt-0.5 text-white/70">
                      {user.role === 'host' ? t('nav.role_host') : user.role === 'prestataire' ? t('nav.role_prestataire') : t('nav.role_guest')}
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
                        user.role === 'host' ? 'bg-[#E8F0FB] text-[#0F4C8A]' : user.role === 'prestataire' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {user.role === 'host' ? t('nav.role_host') : user.role === 'prestataire' ? t('nav.role_prestataire') : t('nav.role_guest')}
                      </span>
                    </div>
                    <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                      <User size={15} className="text-[#0F4C8A]" /> {t('nav.profile')}
                    </Link>
                    {user.role === 'host' && (
                      <Link href="/host/submit" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                        <Plus size={15} className="text-[#0F4C8A]" /> {t('nav.publish_listing')}
                      </Link>
                    )}
                    {user.role === 'host' ? (
                      <>
                        <button onClick={() => switchTo('guest')} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 w-full transition-colors">
                          <ArrowLeftRight size={15} className="text-[#0F4C8A]" />
                          {t('nav.switch_guest')}
                        </button>
                        {hasServices ? (
                          <button onClick={() => switchTo('prestataire')} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 w-full transition-colors">
                            <Package size={15} className="text-[#0F4C8A]" />
                            {t('nav.switch_prestataire')}
                          </button>
                        ) : (
                          <Link href="/prestataire/submit" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                            <Plus size={15} className="text-[#0F4C8A]" /> {t('nav.propose_service')}
                          </Link>
                        )}
                      </>
                    ) : user.role === 'prestataire' ? (
                      <>
                        <button onClick={() => switchTo('guest')} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 w-full transition-colors">
                          <ArrowLeftRight size={15} className="text-[#0F4C8A]" />
                          {t('nav.switch_guest')}
                        </button>
                        {hasListings && (
                          <button onClick={() => switchTo('host')} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 w-full transition-colors">
                            <Building2 size={15} className="text-[#0F4C8A]" />
                            {t('nav.switch_host')}
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {hasListings ? (
                          <button onClick={() => switchTo('host')} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 w-full transition-colors">
                            <ArrowLeftRight size={15} className="text-[#0F4C8A]" />
                            {t('nav.switch_host')}
                          </button>
                        ) : (
                          <Link href="/host/submit" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                            <Plus size={15} className="text-[#0F4C8A]" /> {t('nav.publish_listing')}
                          </Link>
                        )}
                        {hasServices ? (
                          <button onClick={() => switchTo('prestataire')} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 w-full transition-colors">
                            <Package size={15} className="text-[#0F4C8A]" />
                            {t('nav.switch_prestataire')}
                          </button>
                        ) : (
                          <Link href="/prestataire/submit" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                            <Plus size={15} className="text-[#0F4C8A]" /> {t('nav.propose_service')}
                          </Link>
                        )}
                      </>
                    )}
                    <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 text-sm text-red-600 w-full border-t border-gray-100 transition-colors">
                      <LogOut size={15} /> {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 rounded-full text-sm font-medium text-white/90 hover:bg-white/15 transition-colors">
                  {t('nav.login')}
                </Link>
                <Link href="/register" className="px-4 py-2 bg-white text-sm font-semibold rounded-full hover:bg-white/90 transition-colors" style={{ color: TEAL }}>
                  {t('nav.register')}
                </Link>
              </>
            )}
          </nav>

          <div className="md:hidden flex items-center gap-1">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.locale}
                onClick={() => setLocale(opt.locale)}
                className={`px-2 py-1 rounded-full text-xs font-semibold transition-colors ${
                  locale === opt.locale
                    ? 'bg-white text-[rgb(10,186,181)]'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {!user && (
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-full text-white hover:bg-white/15 transition-colors ml-1"
                aria-label="Menu"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
          </div>
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
              placeholder={t('search.where')}
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
              {t('nav.login')}
            </Link>
            <Link href="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2.5 text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: TEAL }}>
              {t('nav.register')}
            </Link>
          </div>

        </div>
      )}
    </header>
  );
}
