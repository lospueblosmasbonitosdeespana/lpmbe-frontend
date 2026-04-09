'use client';

import { useState } from 'react';
import { ChevronDown, MapPin, ExternalLink } from 'lucide-react';

interface NRExpandableCardProps {
  children: React.ReactNode;
  direccion?: string | null;
  lat?: number | null;
  lng?: number | null;
  menuUrl?: string | null;
  menuLabel?: string;
  telefono?: string | null;
  email?: string | null;
}

export default function NRExpandableCard({
  children,
  direccion,
  lat,
  lng,
  menuUrl,
  menuLabel = 'Ver carta / menú',
  telefono,
  email,
}: NRExpandableCardProps) {
  const [open, setOpen] = useState(false);
  const hasCoords = !!(lat && lng);
  const hasContact = !!(telefono || email);
  const hasExtra = hasCoords || menuUrl || hasContact;

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => hasExtra && setOpen((v) => !v)}
        className="w-full text-left"
      >
        <div className="relative">
          {children}
          {hasExtra && (
            <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 border border-rose-200 transition-transform duration-200"
              style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <ChevronDown className="h-4 w-4 text-rose-600" />
            </div>
          )}
        </div>
      </button>

      {open && hasExtra && (
        <div className="border-t border-rose-100 bg-rose-50/30 px-5 py-4 space-y-4">
          {hasCoords && (
            <>
              {direccion && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MapPin className="h-4 w-4 text-rose-500 flex-shrink-0" />
                  <span>{direccion}</span>
                </div>
              )}
              <div className="overflow-hidden rounded-lg border border-rose-200">
                <iframe
                  title="Ubicación"
                  width="100%"
                  height="220"
                  style={{ border: 0 }}
                  loading="lazy"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng! - 0.003},${lat! - 0.002},${lng! + 0.003},${lat! + 0.002}&layer=mapnik&marker=${lat},${lng}`}
                />
              </div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Cómo llegar
              </a>
            </>
          )}
          {hasContact && (
            <div className="rounded-lg border border-rose-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 mb-1.5">Para reservar</p>
              <div className="flex flex-wrap gap-3">
                {telefono && (
                  <a
                    href={`tel:${telefono.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-rose-600 transition-colors"
                  >
                    📞 {telefono}
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="inline-flex items-center gap-1.5 text-sm text-gray-700 hover:text-rose-600 transition-colors"
                  >
                    ✉️ {email}
                  </a>
                )}
              </div>
            </div>
          )}
          {menuUrl && (
            <a
              href={menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              📋 {menuLabel}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
