'use client'

import { Button } from '@/app/components/ui/button'

interface MobileStickyBarProps {
  visitHref: string
  shopHref: string
}

export function MobileStickyBar({ visitHref, shopHref }: MobileStickyBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card p-3 md:hidden">
      <div className="flex gap-3">
        <Button
          asChild
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <a href={visitHref}>Visitar</a>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <a href={shopHref}>Comprar</a>
        </Button>
      </div>
    </div>
  )
}
