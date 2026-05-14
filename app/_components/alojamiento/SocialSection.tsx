import { ExternalLink } from 'lucide-react'

const socials = [
  {
    label: 'Instagram',
    handle: '@laposadadelsobrarbe',
    href: 'https://instagram.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    handle: 'La Posada del Sobrarbe',
    href: 'https://facebook.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: 'TripAdvisor',
    handle: 'Hotel La Posada del Sobrarbe',
    href: 'https://tripadvisor.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
        <path d="M12.006 4.295c-2.67 0-5.338.67-7.688 2.01L0 6.389l2.405 2.338a5.442 5.442 0 0 0-.412 2.068C1.993 13.834 4.16 16 6.799 16a4.792 4.792 0 0 0 3.093-1.123L12 16.295l2.108-1.418A4.792 4.792 0 0 0 17.201 16c2.639 0 4.806-2.166 4.806-4.805a5.44 5.44 0 0 0-.413-2.07L24 6.824l-4.318-.094C17.332 4.965 14.676 4.295 12.006 4.295zm-5.207 4.93a2.882 2.882 0 1 1 0 5.764 2.882 2.882 0 0 1 0-5.764zm10.414 0a2.882 2.882 0 1 1 0 5.764 2.882 2.882 0 0 1 0-5.764z" />
      </svg>
    ),
  },
  {
    label: 'Google',
    handle: '4.8 ★ en Google Maps',
    href: 'https://maps.google.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5" aria-hidden="true">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
      </svg>
    ),
  },
]

export default function SocialSection() {
  return (
    <section
      className="py-12 px-6 md:px-14 lg:px-20"
      style={{ background: '#fff', borderTop: '1px solid oklch(0.90 0.005 80)' }}
      aria-label="Redes sociales"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-sm font-medium" style={{ color: 'oklch(0.45 0.02 250)' }}>
            Síguenos en redes sociales
          </p>
          <div className="flex flex-wrap justify-center sm:justify-end gap-3">
            {socials.map((s, i) => (
              <a
                key={i}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${s.label}: ${s.handle}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:-translate-y-0.5"
                style={{
                  background: 'var(--color-cream)',
                  border: '1px solid oklch(0.90 0.005 80)',
                  color: 'var(--color-midnight)',
                }}
              >
                {s.icon}
                <span>{s.label}</span>
                <ExternalLink size={11} className="opacity-40" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export { SocialSection }
