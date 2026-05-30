'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, MessageSquare, User, Home, Search } from 'lucide-react';

function DarHostLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0">
      <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1 42V17C1 7.611 8.163 1 17 1C25.837 1 33 7.611 33 17V42H1Z"
          fill="#0F4C8A"
        />
        <path
          d="M9 42V22C9 16.477 12.686 13 17 13C21.314 13 25 16.477 25 22V42H9Z"
          fill="white"
        />
        <circle cx="21" cy="32" r="1.8" fill="#0F4C8A" />
        <circle cx="17" cy="6" r="2" fill="white" opacity="0.5" />
      </svg>
      <span className="text-2xl font-bold text-[#0F4C8A] tracking-tight hidden sm:block">
        DarHost
      </span>
    </Link>
  );
}

const navLinks = [
  { href: '/properties', label: 'Logements' },
  { href: '/host/submit', label: 'Devenir hôte' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <DarHostLogo />

          {/* Desktop search pill */}
          <Link
            href="/properties"
            className="hidden lg:flex items-center gap-3 border border-gray-300 rounded-full px-5 py-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="text-sm font-medium text-gray-700">Où allez-vous ?</span>
            <span className="w-px h-4 bg-gray-300" />
            <span className="text-sm text-gray-500">Dates</span>
            <span className="w-px h-4 bg-gray-300" />
            <span className="text-sm text-gray-500">Voyageurs</span>
            <div className="w-8 h-8 bg-[#0F4C8A] rounded-full flex items-center justify-center ml-1">
              <Search size={14} className="text-white" />
            </div>
          </Link>

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

            <div className="w-px h-6 bg-gray-200 mx-1" />

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
          <Link
            href="/properties"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 border border-gray-300 rounded-full px-4 py-3 mb-4 shadow-sm"
          >
            <Search size={18} className="text-[#0F4C8A]" />
            <span className="text-sm text-gray-500">Rechercher un logement...</span>
          </Link>

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
            <Link
              href="/messages"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <MessageSquare size={18} />
              Messages
            </Link>
            <Link
              href="/profile"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <User size={18} />
              Mon profil
            </Link>
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              <Home size={18} />
              Accueil
            </Link>
          </nav>

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
        </div>
      )}
    </header>
  );
}
