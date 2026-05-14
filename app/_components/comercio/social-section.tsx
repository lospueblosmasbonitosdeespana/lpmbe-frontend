import { Instagram, Facebook, Youtube, Globe } from 'lucide-react'
import type { SocialLink } from './comercio-config'

interface SocialSectionProps {
  links: SocialLink[]
}

const iconMap = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: () => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  ),
  web: Globe,
  tripadvisor: () => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15.5c-1.93 0-3.5-1.57-3.5-3.5S8.07 10.5 10 10.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5zm4-3.5c0-1.93 1.57-3.5 3.5-3.5S21 12.07 21 14s-1.57 3.5-3.5 3.5-3.5-1.57-3.5-3.5zM12 6c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" />
    </svg>
  ),
}

const platformNames = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  web: 'Web',
  tripadvisor: 'TripAdvisor',
}

export function SocialSection({ links }: SocialSectionProps) {
  if (links.length === 0) return null

  return (
    <section className="bg-muted py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center">
          <h2 className="mb-8 font-serif text-2xl font-bold text-foreground">
            Síguenos en redes
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {links.map((link, index) => {
              const Icon = iconMap[link.platform]

              return (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label={platformNames[link.platform]}
                >
                  <Icon />
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
