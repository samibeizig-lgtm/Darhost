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
    <div className="group">
      <Link href={`/properties/${property.id}`} className="block">
        {/* Image container */}
        <div className="relative rounded-2xl overflow-hidden bg-gray-200 aspect-[4/3] mb-3">
          <img
            src={property.images[imgIdx]}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Superhost badge */}
          {property.host.isSuperhost && (
            <span className="absolute top-3 left-3 px-2.5 py-1 bg-white text-[#0F4C8A] text-xs font-bold rounded-full shadow-sm">
              Superhôte
            </span>
          )}

          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setLiked(!liked);
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-sm"
            aria-label="Ajouter aux favoris"
          >
            <Heart
              size={18}
              className={liked ? 'fill-red-500 text-red-500' : 'text-gray-700'}
            />
          </button>

          {/* Image navigation dots */}
          {property.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {property.images.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    setImgIdx(i);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === imgIdx ? 'bg-white' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900 leading-tight line-clamp-1 text-[15px]">
              {property.title}
            </h3>
            <div className="flex items-center gap-0.5 shrink-0">
              <Star size={13} className="fill-[#0F4C8A] text-[#0F4C8A]" />
              <span className="text-sm font-medium text-gray-800">{property.rating}</span>
            </div>
          </div>

          <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">
            {property.location}, {property.wilaya}
          </p>
          <p className="text-gray-400 text-sm">
            {property.type} · {property.guests} voyageurs max
          </p>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-bold text-gray-900">{property.price} DT</span>
            <span className="text-gray-500 text-sm">/ nuit</span>
          </div>
        </div>
      </Link>
    </div>
  );
}
