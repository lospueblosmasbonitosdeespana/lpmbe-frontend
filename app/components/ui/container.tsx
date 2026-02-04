import React from "react"
import { cn } from "@/lib/utils"

type ContainerSize = "sm" | "md" | "lg" | "xl" | "full"

interface ContainerProps {
  children: React.ReactNode
  size?: ContainerSize
  className?: string
  as?: keyof React.JSX.IntrinsicElements
}

const sizeClasses: Record<ContainerSize, string> = {
  sm: "max-w-[40rem]",
  md: "max-w-[48rem]",
  lg: "max-w-[64rem]",
  xl: "max-w-[80rem]",
  full: "max-w-none",
}

export function Container({
  children,
  size = "xl",
  className,
  as: Component = "div",
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizeClasses[size],
        className
      )}
    >
      {children}
    </Component>
  )
}
