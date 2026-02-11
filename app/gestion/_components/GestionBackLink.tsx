"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  href: string;
  label: string;
};

/** Solo se muestra cuando la ruta actual es distinta a href (estamos en una subpágina) */
export default function GestionBackLink({ href, label }: Props) {
  const pathname = usePathname();
  const normalizedHref = href.replace(/\/$/, "");
  const normalizedPath = pathname?.replace(/\/$/, "") ?? "";
  if (normalizedPath === normalizedHref) return null;

  return (
    <div className="mb-4 px-6 pt-6">
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {label}
      </Link>
    </div>
  );
}
