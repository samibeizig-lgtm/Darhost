'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Star, Eye, Share2, Check, Pencil, Trash2 } from 'lucide-react';
import { getUser, syncPropertiesFromRemote, generateShareLink, deleteProperty } from '@/lib/store';
import { Property } from '@/lib/types';
import { useLanguage } from '@/lib/i18n';
import ConfirmModal from '@/components/ConfirmModal';

export default function HostListingsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmProp, setConfirmProp] = useState<Property | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.push('/login?redirect=/host/listings'); return; }
    if (user.role !== 'host') { router.push('/'); return; }
    syncPropertiesFromRemote().then((props) => {
      setProperties(props.filter(p => p.host?.id === user.id));
      setLoading(false);
    });
  }, [router]);

  async function confirmDelete(property: Property) {
    setConfirmProp(property);
  }

  async function handleDelete() {
    if (!confirmProp) return;
    const id = confirmProp.id;
    setConfirmProp(null);
    setDeletingId(id);
    await deleteProperty(id);
    setProperties(prev => prev.filter(p => p.id !== id));
    setDeletingId(null);
  }

  function handleShare(property: Property) {
    const link = generateShareLink(property);
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedId(property.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8">
      {confirmProp && (
        <ConfirmModal
          message={`Supprimer "${confirmProp.title}" ? Cette action est irréversible.`}
          confirmLabel="Supprimer"
          danger
          onConfirm={handleDelete}
          onCancel={() => setConfirmProp(null)}
        />
      )}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('host.active_listings')}</h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {properties.length} logement{properties.length !== 1 ? 's' : ''} publié{properties.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <Link
          href="/host/submit"
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0F4C8A] text-white rounded-xl font-semibold text-sm hover:bg-[#0A3566] transition-colors shrink-0"
        >
          <Plus size={16} />
          {t('host.new_listing')}
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-100 rounded-2xl h-36 animate-pulse" />
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="w-16 h-16 bg-[#E8F0FB] rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus size={28} className="text-[#0F4C8A]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Aucune annonce publiée</h3>
          <p className="text-gray-500 text-sm mb-6">Créez votre première annonce et commencez à recevoir des réservations.</p>
          <Link
            href="/host/submit"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F4C8A] text-white rounded-full font-semibold hover:bg-[#0A3566] transition-colors"
          >
            <Plus size={16} />
            Créer une annonce
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {properties.map((property) => (
            <div key={property.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex gap-4 p-4">
                <div className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden">
                  <img src={property.images[0]} alt={property.title} className="w-full h-full object-cover" />
                  {property.isDraft === true || property.available === false ? (
                    <span className="absolute top-1.5 right-1.5 bg-gray-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {t('host.listing_draft')}
                    </span>
                  ) : (
                    <span className="absolute top-1.5 right-1.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {t('host.listing_active')}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{property.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{property.location} · {property.type}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star size={11} className="fill-[#0F4C8A] text-[#0F4C8A]" />
                      <span className="font-semibold text-gray-800">{property.rating > 0 ? property.rating : '—'}</span>
                      <span>({property.reviewCount})</span>
                    </div>
                    <span className="font-bold text-[#0F4C8A] text-sm">{property.price} DT/{t('common.night')}</span>
                  </div>
                </div>
              </div>

              <div className="flex border-t border-gray-100">
                <Link
                  href={`/properties/${property.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Eye size={15} />
                  {t('host.view')}
                </Link>
                <div className="w-px bg-gray-100" />
                <Link
                  href={`/host/edit?id=${property.id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={15} />
                  {t('host.edit_listing')}
                </Link>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={() => handleShare(property)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-[#0F4C8A] hover:bg-[#E8F0FB] transition-colors"
                >
                  {copiedId === property.id ? <Check size={15} /> : <Share2 size={15} />}
                  {copiedId === property.id ? t('common.copied') : t('common.share')}
                </button>
                <div className="w-px bg-gray-100" />
                <button
                  onClick={() => confirmDelete(property)}
                  disabled={deletingId === property.id}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {deletingId === property.id
                    ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    : <Trash2 size={15} />}
                  {t('host.delete_listing')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
