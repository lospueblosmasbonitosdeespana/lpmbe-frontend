import type { StatItem } from './comercio-config'

interface StatsSectionProps {
  stats: StatItem[]
}

export function StatsSection({ stats }: StatsSectionProps) {
  if (stats.length === 0) return null

  return (
    <section id="conocenos" className="border-y border-border bg-background py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-5 md:gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="font-serif text-3xl font-bold text-primary md:text-4xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
