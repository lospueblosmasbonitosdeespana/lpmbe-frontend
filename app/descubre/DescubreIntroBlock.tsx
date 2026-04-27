"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  html: string;
  readMoreLabel: string;
  readLessLabel: string;
};

export default function DescubreIntroBlock({ html, readMoreLabel, readLessLabel }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="border-b border-neutral-200 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-10 md:py-12">
        <div
          className={`descubre-intro-html text-[15px] leading-relaxed text-neutral-700 transition-all ${
            expanded ? "" : "max-h-44 overflow-hidden [mask-image:linear-gradient(to_bottom,black_60%,transparent)]"
          }`}
          // El HTML viene del backend (SiteSetting) y solo lo edita admin
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
        >
          {expanded ? readLessLabel : readMoreLabel}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>
      <style>{`
        .descubre-intro-html p { margin: 0 0 0.9em 0; }
        .descubre-intro-html p:last-child { margin-bottom: 0; }
        .descubre-intro-html strong { color: #1c1917; font-weight: 600; }
        .descubre-intro-html em { font-style: italic; color: #44403c; }
        .descubre-intro-html a { color: #b45309; text-decoration: underline; }
        .descubre-intro-html a:hover { color: #92400e; }
        .descubre-intro-html ul { list-style: disc; padding-left: 1.25em; margin: 0 0 0.9em 0; }
        .descubre-intro-html li { margin-bottom: 0.25em; }
      `}</style>
    </section>
  );
}
