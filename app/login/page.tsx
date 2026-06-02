'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { setUser, findAccount, syncAccountsFromRemote, fetchAccountFromRemote, saveAccount, isRemoteConnected } from '@/lib/store';
import { useLanguage } from '@/lib/i18n';

export default function LoginPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirect, setRedirect] = useState('/');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'ok' | 'no-firebase'>('idle');
  const [remoteCount, setRemoteCount] = useState<number | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setRedirect(params.get('redirect') ?? '/');
    if (!isRemoteConnected()) { setSyncStatus('no-firebase'); return; }
    setSyncStatus('syncing');
    syncAccountsFromRemote().then((n) => { setRemoteCount(n); setSyncStatus('ok'); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    await syncAccountsFromRemote();
    let account = findAccount(email, password);
    if (!account) {
      const remote = await fetchAccountFromRemote(email);
      if (remote) {
        saveAccount(remote);
        if (remote.password === password) account = remote;
      }
    }
    if (!account) {
      setLoading(false);
      setError('E-mail ou mot de passe incorrect.');
      return;
    }
    setUser({ id: account.id, name: account.name, email: account.email, role: account.role, avatar: account.avatar });
    window.location.href = redirect;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <svg width="40" height="48" viewBox="0 0 34 42" fill="none">
              <path d="M1 42V17C1 7.611 8.163 1 17 1C25.837 1 33 7.611 33 17V42H1Z" fill="#0F4C8A" />
              <path d="M9 42V22C9 16.477 12.686 13 17 13C21.314 13 25 16.477 25 22V42H9Z" fill="white" />
              <circle cx="21" cy="32" r="1.8" fill="#0F4C8A" />
            </svg>
            <span className="text-3xl font-extrabold text-[#0F4C8A]">Hostn</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('auth.login_title')}</h1>
          <p className="text-gray-500 mt-1">{t('auth.login_subtitle')}</p>
        </div>

        {syncStatus === 'no-firebase' && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-4 py-3">
            ⚠️ Synchronisation désactivée — ajoutez <code className="font-mono bg-amber-100 px-1 rounded">NEXT_PUBLIC_FIREBASE_DB_URL</code> dans les variables d&apos;environnement Cloudflare Pages et redéployez.
          </div>
        )}
        {syncStatus === 'syncing' && (
          <div className="mb-4 text-center text-xs text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse inline-block" />
              Synchronisation des comptes…
            </span>
          </div>
        )}
        {syncStatus === 'ok' && remoteCount === 0 && (
          <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-4 py-3">
            ⚠️ Firebase connecté mais aucun compte trouvé dans la base. Le compte mobile n&apos;a pas été synchronisé — recréez-le sur mobile après le redéploiement.
          </div>
        )}
        {syncStatus === 'ok' && remoteCount !== null && remoteCount > 0 && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl px-4 py-3">
            ✓ {remoteCount} compte{remoteCount > 1 ? 's' : ''} synchronisé{remoteCount > 1 ? 's' : ''} depuis Firebase.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('auth.email')}</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">{t('auth.password')}</label>
                <Link href="#" className="text-sm text-[#0F4C8A] hover:underline font-medium">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F4C8A] text-white py-3.5 rounded-xl font-bold text-base hover:bg-[#0A3566] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('auth.login_btn')
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-600">
              {t('auth.no_account')}{' '}
              <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-[#0F4C8A] font-semibold hover:underline">
                {t('nav.register')}
              </Link>
            </p>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-medium">ou continuer avec</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="text-lg">G</span>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="text-lg">f</span>
                Facebook
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          En vous connectant, vous acceptez nos{' '}
          <Link href="#" className="underline">Conditions d&apos;utilisation</Link> et notre{' '}
          <Link href="#" className="underline">Politique de confidentialité</Link>.
        </p>
      </div>
    </div>
  );
}
