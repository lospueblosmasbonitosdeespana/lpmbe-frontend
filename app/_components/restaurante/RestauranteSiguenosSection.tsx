import { Button } from '@/app/components/ui/button';
import { Instagram, Facebook, Youtube, Twitter, Map, Globe } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z" />
    </svg>
  );
}

const ICON_MAP: Record<string, LucideIcon | ((p: { className?: string }) => any)> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  twitter: Twitter,
  tiktok: TikTokIcon,
  google: Map,
  tripadvisor: Globe,
};

const LABEL_MAP: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  twitter: 'X (Twitter)',
  tiktok: 'TikTok',
  google: 'Google',
  tripadvisor: 'TripAdvisor',
};

interface Props {
  eyebrow: string;
  socialLinks: { key: string; url: string; label: string }[];
}

export default function RestauranteSiguenosSection({ eyebrow, socialLinks }: Props) {
  if (socialLinks.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-background border-t border-border">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-gold uppercase tracking-[0.2em] text-xs font-semibold mb-6">
          {eyebrow}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {socialLinks.map((s) => {
            const Icon = ICON_MAP[s.key] ?? Globe;
            const label = LABEL_MAP[s.key] ?? s.label;
            return (
              <Button
                key={s.key}
                variant="outline"
                size="icon"
                asChild
                className="rounded-full size-12 border-border hover:border-gold/40 hover:text-gold transition-colors"
              >
                <a href={s.url} target="_blank" rel="noopener noreferrer" aria-label={label}>
                  <Icon className="size-5" />
                </a>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
