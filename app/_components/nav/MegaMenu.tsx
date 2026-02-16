"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NavItem } from "./nav.config";
import { navConfig } from "./nav.config";

const CLOSE_DELAY_MS = 120;

export function MegaMenu() {
  const tTabs = useTranslations("tabs");
  const tNav = useTranslations("nav");
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const items = useMemo(() => navConfig, []);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const getItemLabel = (item: NavItem) =>
    item.labelNs === "tabs" ? tTabs(item.labelKey) : tNav(item.labelKey);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setOpenLabel(null);
      closeTimeoutRef.current = null;
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimeout]);

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

  useEffect(() => {
    return () => clearCloseTimeout();
  }, [clearCloseTimeout]);

  return (
    <div ref={rootRef} className="relative">
      <nav className="relative">
        <div className="flex items-center gap-8">
          {items.map((item) => {
            const label = getItemLabel(item);
            if (item.type === "link") {
              return (
                <Link
                  key={item.labelKey}
                  href={item.href}
                  className="text-sm font-medium hover:underline"
                >
                  {label}
                </Link>
              );
            }

            const isOpen = openLabel === label;

            return (
              <div
                key={item.labelKey}
                className="relative"
                onMouseEnter={() => {
                  clearCloseTimeout();
                  setOpenLabel(label);
                }}
                onMouseLeave={scheduleClose}
              >
                <button
                  type="button"
                  className="text-sm font-medium hover:underline"
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                >
                  {label}
                </button>

                {/* Puente invisible para que no se cierre al bajar el ratón */}
                {isOpen && (
                  <div className="absolute left-1/2 top-full h-5 w-[120%] -translate-x-1/2" />
                )}

                {isOpen && (
                  <MegaPanel
                    item={item}
                    onMouseEnter={clearCloseTimeout}
                    onMouseLeave={() => setOpenLabel(null)}
                    tNav={tNav}
                  />
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function MegaPanel({
  item,
  onMouseEnter,
  onMouseLeave,
  tNav,
}: {
  item: Extract<NavItem, { type: "mega" }>;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  tNav: (key: string) => string;
}) {
  return (
    <div
      className="
        fixed left-1/2 top-auto z-50 mt-4 w-[920px] -translate-x-1/2
        rounded-lg border border-gray-100 bg-white shadow-lg
      "
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="grid grid-cols-3 gap-8 px-8 py-7">
        {item.columns.map((col) => (
          <div key={col.titleKey}>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {tNav(col.titleKey)}
            </div>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => {
                const isExternal = l.href.startsWith("http");
                const linkLabel = tNav(l.labelKey);
                if (isExternal) {
                  return (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline"
                      >
                        {linkLabel}
                      </a>
                    </li>
                  );
                }
                return (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm hover:underline">
                      {linkLabel}
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
