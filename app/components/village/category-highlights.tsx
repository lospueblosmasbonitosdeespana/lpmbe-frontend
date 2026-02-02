"use client"

import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Section } from "@/app/components/ui/section"
import { Container } from "@/app/components/ui/container"
import { Grid } from "@/app/components/ui/grid"
import { Title, Eyebrow, Body } from "@/app/components/ui/typography"

type CategoryType =
  | "nature"
  | "culture"
  | "family"
  | "heritage"
  | "petfriendly"
  | "gastronomy"

interface CategoryItem {
  title: string
  description?: string
  href?: string
}

interface CategoryData {
  type: CategoryType
  title: string
  description?: string
  items: CategoryItem[]
  image?: string
  href?: string
}

interface CategoryHighlightsProps {
  categories: CategoryData[]
  layout?: "cards" | "list"
  className?: string
}

const categoryIcons: Record<CategoryType, React.ReactNode> = {
  nature: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
      <path d="M12 22c4.97 0 9-2.24 9-5v-1.5c0-2.76-4.03-5-9-5s-9 2.24-9 5V17c0 2.76 4.03 5 9 5z" />
      <path d="M12 11.5V5" />
      <path d="M8 8c0-1.66 1.79-3 4-3s4 1.34 4 3" />
    </svg>
  ),
  culture: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4 8 4v14" />
      <path d="M9 21v-6h6v6" />
    </svg>
  ),
  family: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
      <circle cx="12" cy="5" r="3" />
      <path d="M12 8v4" />
      <circle cx="6" cy="15" r="2" />
      <circle cx="18" cy="15" r="2" />
    </svg>
  ),
  heritage: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
      <path d="M12 2L2 7h20L12 2z" />
      <path d="M4 7v10" />
      <path d="M20 7v10" />
      <path d="M2 17h20" />
    </svg>
  ),
  petfriendly: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
      <circle cx="11" cy="4" r="2" />
      <circle cx="18" cy="8" r="2" />
      <circle cx="20" cy="16" r="2" />
      <path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z" />
    </svg>
  ),
  gastronomy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-full w-full">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </svg>
  ),
}

const categoryColors: Record<
  CategoryType,
  { bg: string; border: string; icon: string }
> = {
  nature: { bg: "bg-green-50", border: "border-green-200", icon: "text-green-600" },
  culture: { bg: "bg-amber-50", border: "border-amber-200", icon: "text-amber-600" },
  family: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600" },
  heritage: { bg: "bg-stone-50", border: "border-stone-200", icon: "text-stone-600" },
  petfriendly: { bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-600" },
  gastronomy: { bg: "bg-rose-50", border: "border-rose-200", icon: "text-rose-600" },
}

function CategoryCard({ category }: { category: CategoryData }) {
  const colors = categoryColors[category.type]

  const content = (
    <article
      className={cn(
        "group rounded-lg border p-5 transition-all hover:shadow-md",
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("h-10 w-10 shrink-0", colors.icon)}>
          {categoryIcons[category.type]}
        </div>
        <div className="flex-1">
          <Title as="h3" className="text-base transition-colors group-hover:text-primary">
            {category.title}
          </Title>
          {category.description && (
            <Body size="sm" className="mt-1 text-muted-foreground">
              {category.description}
            </Body>
          )}
          {category.items.length > 0 && (
            <ul className="mt-3 space-y-1">
              {category.items.slice(0, 3).map((item, index) => (
                <li key={index} className="text-sm text-foreground/80">
                  • {item.title}
                </li>
              ))}
              {category.items.length > 3 && (
                <li className="text-sm text-muted-foreground">
                  +{category.items.length - 3} más
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </article>
  )

  if (category.href) {
    return <Link href={category.href}>{content}</Link>
  }

  return content
}

export function CategoryHighlights({
  categories,
  layout = "cards",
  className,
}: CategoryHighlightsProps) {
  if (categories.length === 0) {
    return null
  }

  return (
    <Section spacing="md" className={className}>
      <Container>
        <div className="mb-6">
          <Eyebrow>Qué hacer</Eyebrow>
          <Title className="mt-2">Experiencias por categoría</Title>
        </div>

        {layout === "cards" && (
          <Grid columns={3} gap="md">
            {categories.map((category, index) => (
              <CategoryCard key={index} category={category} />
            ))}
          </Grid>
        )}

        {layout === "list" && (
          <div className="divide-y divide-border rounded-lg border border-border bg-card p-4">
            {categories.map((category, index) => (
              <div key={index} className="flex items-center gap-3 border-b border-border py-4 last:border-0">
                <div className={cn("h-6 w-6", categoryColors[category.type].icon)}>
                  {categoryIcons[category.type]}
                </div>
                <Eyebrow className={categoryColors[category.type].icon}>
                  {category.title}
                </Eyebrow>
                {category.items.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {category.items.map((item, i) => (
                      <li key={i}>
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="inline-block rounded-full bg-muted px-3 py-1 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                          >
                            {item.title}
                          </Link>
                        ) : (
                          <span className="inline-block rounded-full bg-muted px-3 py-1 text-sm">
                            {item.title}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Container>
    </Section>
  )
}
