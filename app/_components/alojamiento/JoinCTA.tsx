'use client'

import { Button } from '@/app/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function JoinCTA() {
  return (
    <section
      className="py-24"
      style={{ background: 'linear-gradient(to bottom, oklch(0.62 0.12 45 / 0.05), transparent)' }}
    >
      <div className="max-w-2xl mx-auto px-4 md:px-6 text-center">
        <h2
          className="text-4xl md:text-5xl font-serif font-bold mb-6 text-balance"
          style={{ color: 'var(--color-midnight)' }}
        >
          Forma parte de nuestra historia
        </h2>
        <p
          className="text-lg mb-10 text-balance leading-relaxed"
          style={{ color: 'oklch(0.22 0.05 250 / 0.70)' }}
        >
          Únete a nuestra comunidad exclusiva y accede antes que nadie a eventos especiales, experiencias seleccionadas y tarifas exclusivas para socios en nuestro refugio de montaña.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="text-white gap-2"
            style={{ background: 'var(--color-terracotta)' }}
          >
            Únete al Club
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            style={{
              borderColor: 'oklch(0.22 0.05 250 / 0.20)',
              color: 'var(--color-midnight)',
            }}
          >
            Saber más
          </Button>
        </div>
      </div>
    </section>
  )
}

export { JoinCTA }
