"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { NavItem } from "./nav.config";
import { navConfig } from "./nav.config";

export function MegaMenu() {
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const items = useMemo(() => navConfig, []);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Cerrar con ESC
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenLabel(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Cerrar al click fuera
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      const el = rootRef.current;
      if (!el) return;
      if (openLabel && !el.contains(e.target as Node)) {
        setOpenLabel(null);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [openLabel]);

  return (
    <div ref={rootRef} className="relative">
      <nav className="relative">
        <div className="flex items-center gap-8">
          {items.map((item) => {
            if (item.type === "link") {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium hover:underline"
                >
                  {item.label}
                </Link>
              );
            }

            const isOpen = openLabel === item.label;

            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setOpenLabel(item.label)}
                onMouseLeave={() => setOpenLabel((prev) => (prev === item.label ? null : prev))}
              >
                <button
                  type="button"
                  className="text-sm font-medium hover:underline"
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                >
                  {item.label}
                </button>

                {/* Puente invisible para que no se cierre al bajar el ratón */}
                {isOpen && (
                  <div className="absolute left-1/2 top-full h-5 w-[120%] -translate-x-1/2" />
                )}

                {isOpen && <MegaPanel item={item} />}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function MegaPanel({ item }: { item: Extract<NavItem, { type: "mega" }> }) {
  return (
    <div
      className="
        fixed left-1/2 top-auto z-50 mt-4 w-[920px] -translate-x-1/2
        rounded-lg border border-gray-100 bg-white shadow-lg
      "
    >
      <div className="grid grid-cols-3 gap-8 px-8 py-7">
        {item.columns.map((col) => (
          <div key={col.title}>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {col.title}
            </div>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => {
                const isExternal = l.href.startsWith("http");
                if (isExternal) {
                  return (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                      >
                        {l.label}
                      </a>
                    </li>
                  );
                }
                return (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm hover:underline">
                      {l.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
