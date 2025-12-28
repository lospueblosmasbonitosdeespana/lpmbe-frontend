"use client";

import { useState } from "react";

const DESCRIPCION_LIMIT = 900;

function stripHtml(html: string) {
  return html.replace(/<[^>]*>?/gm, "");
}

function truncateHtmlPreserveText(html: string, limit: number) {
  const text = stripHtml(html);
  if (text.length <= limit) return html;
  const truncatedText = text.slice(0, limit) + "…";
  return `<p>${truncatedText}</p>`;
}

export default function DescripcionPueblo({
  descripcion,
}: {
  descripcion: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!descripcion) {
    return (
      <p className="text-sm text-muted-foreground">
        Descripción próximamente.
      </p>
    );
  }

  const textLength = stripHtml(descripcion).length;
  const shouldShowButton = textLength > DESCRIPCION_LIMIT;

  return (
    <div className="space-y-4">
      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{
          __html: expanded
            ? descripcion
            : truncateHtmlPreserveText(descripcion, DESCRIPCION_LIMIT),
        }}
      />
      {shouldShowButton && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm font-medium text-primary hover:underline"
        >
          {expanded ? "Leer menos" : "Leer más"}
        </button>
      )}
    </div>
  );
}

