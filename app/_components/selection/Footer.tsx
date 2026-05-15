'use client'

import { Star, Instagram, Facebook, Twitter, MapPin, Phone, Mail } from 'lucide-react'
import type { HotelConfig } from './types'

interface Props {
  name: string
  location: HotelConfig['location']
  social: HotelConfig['social']
}

export default function Footer({ name, location, social }: Props) {
  return (
    <footer
      className="w-full pt-16 pb-10 px-8 md:px-16 lg:px-24"
      style={{
        background: '#111111',
        borderTop: '1px solid rgba(201,169,110,0.15)',
      }}
    >
      <div className="max-w-screen-xl mx-auto">
        {/* Top row — hotel + LPMBE cobranding */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10"
          style={{ borderBottom: '1px solid rgba(201,169,110,0.12)' }}>
          {/* Hotel name */}
          <div>
            <span
              className="font-serif block"
              style={{
                fontSize: '1.4rem',
                color: 'var(--hotel-ivory)',
                fontWeight: 300,
                letterSpacing: '0.04em',
              }}
            >
              {name}
            </span>
            <span
              className="font-sans block mt-1"
              style={{
                fontSize: '0.58rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--hotel-ivory-muted)',
              }}
            >
              {location.village} · {location.region}
            </span>
          </div>

          {/* LPMBE Selection cobranding */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-4 py-2"
              style={{ border: '1px solid rgba(201,169,110,0.3)' }}
            >
              <Star size={12} style={{ color: 'var(--hotel-gold)', fill: 'var(--hotel-gold)' }} />
              <span
                className="font-sans"
                style={{
                  fontSize: '0.58rem',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'var(--hotel-gold)',
                }}
              >
                Club LPMBE Selection
              </span>
            </div>
          </div>
        </div>

        {/* Cobranding caption */}
        <p
          className="font-sans mt-6 mb-10 text-center md:text-left"
          style={{
            fontSize: '0.72rem',
            color: 'var(--hotel-ivory-muted)',
            lineHeight: 1.7,
            maxWidth: 500,
            fontStyle: 'italic',
          }}
        >
          Este establecimiento forma parte de la selección exclusiva de Los Pueblos Más Bonitos de España.
        </p>

        {/* Middle row — contact + social */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10"
          style={{ borderBottom: '1px solid rgba(201,169,110,0.1)' }}>
          {/* Address */}
          <div className="flex flex-col gap-3">
            <span className="eyebrow mb-2">Ubicación</span>
            <div className="flex items-start gap-2">
              <MapPin size={13} style={{ color: 'var(--hotel-gold)', marginTop: 2, flexShrink: 0 }} />
              <span
                className="font-sans"
                style={{ fontSize: '0.8rem', color: 'var(--hotel-ivory-dim)', lineHeight: 1.6 }}
              >
                {location.address}
              </span>
            </div>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-3">
            <span className="eyebrow mb-2">Contacto</span>
            <div className="flex items-center gap-2">
              <Phone size={13} style={{ color: 'var(--hotel-gold)', flexShrink: 0 }} />
              <a
                href={`tel:${location.phone}`}
                className="font-sans"
                style={{ fontSize: '0.8rem', color: 'var(--hotel-ivory-dim)' }}
              >
                {location.phone}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={13} style={{ color: 'var(--hotel-gold)', flexShrink: 0 }} />
              <a
                href={`mailto:${location.email}`}
                className="font-sans"
                style={{ fontSize: '0.8rem', color: 'var(--hotel-ivory-dim)' }}
              >
                {location.email}
              </a>
            </div>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3">
            <span className="eyebrow mb-2">Síguenos</span>
            <div className="flex gap-4">
              {social.instagram && (
                <a
                  href={social.instagram}
                  aria-label="Instagram"
                  className="transition-opacity hover:opacity-100"
                  style={{ opacity: 0.55 }}
                >
                  <Instagram size={18} style={{ color: 'var(--hotel-gold)' }} />
                </a>
              )}
              {social.facebook && (
                <a
                  href={social.facebook}
                  aria-label="Facebook"
                  className="transition-opacity hover:opacity-100"
                  style={{ opacity: 0.55 }}
                >
                  <Facebook size={18} style={{ color: 'var(--hotel-gold)' }} />
                </a>
              )}
              {social.twitter && (
                <a
                  href={social.twitter}
                  aria-label="Twitter / X"
                  className="transition-opacity hover:opacity-100"
                  style={{ opacity: 0.55 }}
                >
                  <Twitter size={18} style={{ color: 'var(--hotel-gold)' }} />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
          <span
            className="font-sans"
            style={{
              fontSize: '0.62rem',
              letterSpacing: '0.12em',
              color: 'var(--hotel-ivory-muted)',
              opacity: 0.5,
            }}
          >
            © {new Date().getFullYear()} {name}. Todos los derechos reservados.
          </span>
          <div className="flex gap-6">
            {['Política de privacidad', 'Aviso legal', 'Cookies'].map((item) => (
              <span
                key={item}
                className="font-sans cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.12em',
                  color: 'var(--hotel-ivory-muted)',
                  opacity: 0.5,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
