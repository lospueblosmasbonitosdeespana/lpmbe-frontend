import React from "react"
import { cn } from "@/lib/utils"

type GridColumns = 1 | 2 | 3 | 4 | 5 | 6
type GridGap = "sm" | "md" | "lg"

interface GridProps {
  children: React.ReactNode
  columns?: GridColumns
  gap?: GridGap
  className?: string
}

const gapClasses: Record<GridGap, string> = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
}

const columnClasses: Record<GridColumns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
  6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6",
}

export function Grid({
  children,
  columns = 3,
  gap = "md",
  className,
}: GridProps) {
  return (
    <div
      className={cn(
        "grid",
        columnClasses[columns],
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}
