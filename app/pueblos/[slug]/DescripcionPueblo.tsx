"use client";

import { useState } from "react";
import { decode as heDecode } from "he";

const DESCRIPCION_LIMIT = 600;

function toPlainWithParagraphs(input: string) {
  if (!input) return "";

  let text = input;

  // decode entidades (&nbsp; &aacute; etc.)
  text = heDecode(text);

  // convertir tags típicos a saltos antes de quitar HTML
  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<\/?p[^>]*>/gi, "\n\n");

  // quitar HTML restante
  text = text.replace(/<[^>]*>/g, "");

  // NBSP real a espacio normal
  text = text.replace(/\u00A0/g, " ");

  // normalizar saltos
  text = text.replace(/\r\n/g, "\n");

  // limpiar espacios por línea
  text = text
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n");

  // máximo 2 saltos seguidos
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
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

  // Normalizar y limpiar texto (blindado contra HTML viejo, &nbsp;, etc.)
  const texto = toPlainWithParagraphs(descripcion ?? "");

  // Detectar si hay más texto
  const shouldShowButton = texto.length > DESCRIPCION_LIMIT;

  // Texto visible según estado
  const textoVisible = expanded ? texto : texto.slice(0, DESCRIPCION_LIMIT);

  // Dividir SOLO lo visible en párrafos
  const parrafos = textoVisible
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      <div className="prose max-w-none">
        {parrafos.map((parrafo: string, i: number) => (
          <p key={i} className="mb-4 leading-relaxed">
            {parrafo}
          </p>
        ))}
        {!expanded && shouldShowButton && <span>…</span>}
      </div>
      {shouldShowButton && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-sm font-medium underline"
        >
          {expanded ? "Leer menos" : "Leer más"}
        </button>
      )}
    </div>
  );
}

