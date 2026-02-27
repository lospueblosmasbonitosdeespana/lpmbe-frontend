"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import type { NavItem } from "./nav.config";
import { navConfig } from "./nav.config";
import AuthNavLink from "./AuthNavLink";

function NavLinkItem({
  label,
  href,
  onClick,
  compact,
}: {
  label: string;
  href: string;
  onClick?: () => void;
  compact?: boolean;
}) {
  const isExternal = href.startsWith("http");
  const className = compact
    ? "block py-2 text-sm text-muted-foreground hover:text-primary"
    : "block py-3 text-base font-medium text-foreground hover:text-primary border-b border-border";

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={onClick}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className} onClick={onClick}>
      {label}
    </Link>
  );
}

export function MobileMenu() {
  const tTabs = useTranslations("tabs");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [expandedLabel, setExpandedLabel] = useState<string | null>(null);

  const getItemLabel = (item: NavItem) =>
    item.labelNs === "tabs" ? tTabs(item.labelKey) : tNav(item.labelKey);

  const close = () => {
    setOpen(false);
    setExpandedLabel(null);
  };

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-transparent p-2"
        aria-label={open ? tCommon("closeMenu") : tCommon("openMenu")}
        aria-expanded={open}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 top-0 z-40 bg-black/40"
            onClick={close}
            aria-hidden
          />
          <aside
            className="fixed right-0 top-0 z-50 h-full w-full max-w-sm overflow-y-auto bg-background shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
          >
            <div className="flex flex-col px-6 py-6">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">
                  {tCommon("menu")}
                </span>
                <button
                  type="button"
                  onClick={close}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-border"
                  aria-label={tCommon("close")}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <nav className="space-y-2">
                {navConfig.map((item) => {
                  const itemLabel = getItemLabel(item);
                  if (item.type === "link") {
                    return (
                      <NavLinkItem
                        key={item.labelKey}
                        label={itemLabel}
                        href={item.href}
                        onClick={close}
                      />
                    );
                  }

                  const isExpanded = expandedLabel === itemLabel;

                  return (
                    <div key={item.labelKey} className="border-b border-border">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedLabel(isExpanded ? null : itemLabel)
                        }
                        className="flex w-full items-center justify-between py-3 text-left text-base font-medium text-foreground hover:text-primary"
                        aria-expanded={isExpanded}
                      >
                        {itemLabel}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="space-y-1 pb-4 pl-3">
                          {item.columns.map((col) => (
                            <div key={col.titleKey}>
                              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {tNav(col.titleKey)}
                              </span>
                              <ul className="mt-2 space-y-1">
                                {col.links.map((l) => (
                                  <li key={l.href}>
                                    <NavLinkItem
                                      label={tNav(l.labelKey)}
                                      href={l.href}
                                      onClick={close}
                                      compact
                                    />
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              <div className="mt-6 space-y-2 border-t border-border pt-6">
                <AuthNavLink variant="drawer" />
                <NavLinkItem
                  label={tNav("contact")}
                  href="/contacto"
                  onClick={close}
                />
              </div>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
