'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Phone, Camera, Plus } from 'lucide-react';
import { setUser } from '@/lib/store';

export default function RegisterPage() {
  const [role, setRole] = useState<'guest' | 'host'>('guest');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '',
  });
  const [avatar, setAvatar] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirect, setRedirect] = useState('/');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('redirect') ?? '/';
    setRedirect(r);
    if (r.includes('host')) setRole('host');
  }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image trop grande (max 5 Mo).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (!avatar) {
      setError('Veuillez ajouter une photo de profil.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (!agreed) {
      setError("Vous devez accepter les conditions d'utilisation.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setUser({
        id: `u-${Date.now()}`,
        name: `${form.firstName} ${form.lastName}`,
        email: form.email,
        role,
        avatar,
      });
      window.location.href = redirect;
    }, 900);
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
            <span className="text-3xl font-extrabold text-[#0F4C8A]">DarHost</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-gray-500 mt-1">Rejoignez la communauté DarHost</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => setRole('guest')}
              className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                role === 'guest' ? 'bg-white text-[#0F4C8A] shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Je suis voyageur
            </button>
            <button
              onClick={() => setRole('host')}
              className={`py-2.5 rounded-lg text-sm font-semibold transition-all ${
                role === 'host' ? 'bg-white text-[#0F4C8A] shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Je suis hôte
            </button>
          </div>

          {role === 'host' && (
            <div className="bg-[#E8F0FB] rounded-xl p-3 mb-5 text-sm text-[#0F4C8A]">
              En tant qu&apos;hôte, vous pourrez publier votre logement après l&apos;inscription.
            </div>
          )}

          {/* Profile photo upload */}
          <div className="flex flex-col items-center mb-6">
            <label className="relative cursor-pointer group">
              <div className={`w-24 h-24 rounded-full overflow-hidden border-2 flex items-center justify-center transition-colors ${
                avatar
                  ? 'border-[#0F4C8A]'
                  : 'border-dashed border-gray-300 bg-gray-50 hover:border-[#0F4C8A]'
              }`}>
                {avatar ? (
                  <img src={avatar} alt="Photo de profil" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={28} className="text-gray-400" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#0F4C8A] rounded-full flex items-center justify-center shadow-sm">
                <Plus size={14} className="text-white" />
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Photo de profil <span className="text-red-500">*</span>
            </p>
            {!avatar && (
              <p className="text-xs text-gray-400 mt-0.5">Cliquez pour ajouter</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Prénom *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={form.firstName}
                    onChange={(e) => set('firstName', e.target.value)}
                    placeholder="Mohamed"
                    className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nom *</label>
                <input
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  placeholder="Ben Salah"
                  className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">E-mail *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Téléphone</label>
              <div className="flex">
                <span className="flex items-center px-3 py-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-sm text-gray-600 font-medium whitespace-nowrap">
                  🇹🇳 +216
                </span>
                <div className="relative flex-1">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    placeholder="XX XXX XXX"
                    className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-r-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Mot de passe *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="w-full pl-9 pr-11 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="mt-1.5 flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full ${
                        form.password.length > i * 3
                          ? form.password.length < 6 ? 'bg-red-400'
                            : form.password.length < 10 ? 'bg-yellow-400' : 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Confirmer le mot de passe *</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={form.confirm}
                  onChange={(e) => set('confirm', e.target.value)}
                  placeholder="Répétez votre mot de passe"
                  className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C8A]"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#0F4C8A]"
              />
              <span className="text-sm text-gray-600">
                J&apos;accepte les{' '}
                <Link href="#" className="text-[#0F4C8A] underline">Conditions d&apos;utilisation</Link>{' '}
                et la{' '}
                <Link href="#" className="text-[#0F4C8A] underline">Politique de confidentialité</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F4C8A] text-white py-3.5 rounded-xl font-bold hover:bg-[#0A3566] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création du compte...
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-600">
              Déjà un compte ?{' '}
              <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-[#0F4C8A] font-semibold hover:underline">
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
