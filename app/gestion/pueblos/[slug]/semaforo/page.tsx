import Link from "next/link";
import { getPuebloBySlug } from "@/lib/api";
import { getMeServer } from "@/lib/me";
import { getMisPueblosServer } from "@/lib/misPueblos";
import { redirect } from "next/navigation";
import SemaforoForm from "./SemaforoForm.client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function GestionSemaforoPage({ params }: Props) {
  const { slug } = await params;
  
  const me = await getMeServer();
  if (!me) redirect('/entrar');
  if (me.rol !== 'ALCALDE' && me.rol !== 'ADMIN') redirect('/cuenta');

  // Si es ALCALDE, verificamos que el pueblo está en su lista.
  if (me.rol === 'ALCALDE') {
    const mis = await getMisPueblosServer();
    const allowed = mis.some((p) => p.slug === slug);
    if (!allowed) redirect('/gestion/mis-pueblos');
  }

  const pueblo = await getPuebloBySlug(slug);

  // Leer datos del semáforo desde pueblo.semaforo (que viene de getPuebloBySlug)
  const s = (pueblo as any)?.semaforo ?? null;

  const estadoActual = s?.estado ?? "VERDE";
  const mensajeActual = s?.mensaje ?? "";
  const mensajePublicoActual = s?.mensaje_publico ?? "";
  const motivoActual = s?.motivo ?? "";
  const inicioProgramadoActual = s?.programado_inicio ?? null;
  const finProgramadoActual = s?.programado_fin ?? null;
  const caducaEn = s?.caduca_en ?? null;
  const ultimaActualizacion = s?.ultima_actualizacion ?? (s?.ultimaActualizacion ?? null);

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700 }}>Semáforo (Gestión)</h1>

      <p style={{ marginTop: 8, color: "#666" }}>
        Pueblo: <b>{pueblo?.nombre ?? slug}</b> · ID: <b>{pueblo?.id ?? "—"}</b>
      </p>

      <div style={{ marginTop: 20 }}>
        <Link href={`/gestion/pueblos/${slug}`}>&larr; Volver a gestión</Link>
      </div>

      {/* Estado actual guardado */}
      <div style={{ marginTop: 24, padding: 16, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Actual (guardado)</h2>
        <p>Estado: <strong>{estadoActual}</strong></p>
        {ultimaActualizacion && (
          <p style={{ marginTop: 4 }}>
            Actualizado: {new Date(ultimaActualizacion).toLocaleString("es-ES")}
          </p>
        )}
        {mensajePublicoActual && (
          <p style={{ marginTop: 4 }}>Mensaje público: {mensajePublicoActual}</p>
        )}
        {mensajeActual && (
          <p style={{ marginTop: 4 }}>Mensaje interno: {mensajeActual}</p>
        )}
        {inicioProgramadoActual && finProgramadoActual ? (
          <p style={{ marginTop: 4 }}>
            Programado: {new Date(inicioProgramadoActual).toLocaleString("es-ES")} → {new Date(finProgramadoActual).toLocaleString("es-ES")}
          </p>
        ) : caducaEn && estadoActual !== "VERDE" && !inicioProgramadoActual && !finProgramadoActual ? (
          <p style={{ marginTop: 4 }}>
            Caduca automático: {new Date(caducaEn).toLocaleString("es-ES")}
          </p>
        ) : null}
        {motivoActual && (
          <p style={{ marginTop: 4 }}>Motivo: {motivoActual}</p>
        )}
      </div>

      <SemaforoForm
        key={`${pueblo.id}-${ultimaActualizacion ?? "na"}`}
        puebloId={pueblo.id}
        slug={slug}
        estadoInicial={estadoActual}
        mensajeInicial={mensajeActual}
        mensajePublicoInicial={mensajePublicoActual}
        motivoInicial={motivoActual}
        inicioProgramadoInicial={inicioProgramadoActual}
        finProgramadoInicial={finProgramadoActual}
        estadoActual={estadoActual}
      />

      <p style={{ marginTop: 12, color: "#666" }}>
        Nota: Por ahora es cambio manual. Programación (inicio/fin) va después.
      </p>
    </main>
  );
}

