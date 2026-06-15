'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Star } from 'lucide-react';
import { Property } from '@/lib/types';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const [liked, setLiked] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  return (
    <div className="group card-lift">
      <Link href={`/properties/${property.id}`} className="block">
        <div className="relative rounded-2xl overflow-hidden bg-gray-200 aspect-[4/3] mb-3">
          <img
            src={property.images[imgIdx]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />

          {/* Gradient overlay on hover */}
          <div className="img-overlay rounded-2xl" />

          {property.host.isSuperhost && (
            <span className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-[#0F4C8A] to-[#1B6FBF] text-white text-xs font-bold rounded-full shadow-brand">
              ★ Superhôte
            </span>
          )}

          {!property.host.isSuperhost && property.createdAt && Date.now() - property.createdAt < 7 * 24 * 60 * 60 * 1000 && (
            <span className="absolute top-3 left-3 px-2.5 py-1 bg-gradient-to-r from-[#0ABAB5] to-[#0F4C8A] text-white text-xs font-bold rounded-full shadow-sm">
              Nouveau
            </span>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              setLiked(!liked);
            }}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200 shadow-sm ${
              liked
                ? 'bg-white scale-110'
                : 'bg-white/80 hover:bg-white hover:scale-110'
            }`}
            aria-label="Ajouter aux favoris"
          >
            <Heart
              size={17}
              className={`transition-all duration-200 ${liked ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
            />
          </button>

          {property.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {property.images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    setImgIdx(i);
                  }}
                  className={`rounded-full transition-all duration-200 ${
                    i === imgIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/65 hover:bg-white/90'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 leading-tight line-clamp-1 text-[15px]">
              {property.title}
            </h3>
            <div className="flex items-center gap-0.5 shrink-0 bg-[#E8F0FB] px-1.5 py-0.5 rounded-full">
              <Star size={11} className="fill-[#0F4C8A] text-[#0F4C8A]" />
              <span className="text-xs font-bold text-[#0F4C8A]">{property.rating}</span>
            </div>
          </div>

          <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">
            {property.location}, {property.wilaya}
          </p>
          <p className="text-gray-400 text-sm">
            {property.type} · {property.guests} voyageurs max
          </p>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-extrabold text-[#0F4C8A]">{property.price} DT</span>
            <span className="text-gray-400 text-sm">/ nuit</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
