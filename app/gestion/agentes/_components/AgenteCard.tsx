'use client';

import { useState } from 'react';
import { AgenteAdminView, ESTADO_LABEL } from '../_types';

interface Props {
  agente: AgenteAdminView;
  onConfig: () => void;
  onChange: () => Promise<void> | void;
}

export function AgenteCard({ agente, onConfig, onChange }: Props) {
  const [busy, setBusy] = useState<null | 'toggle' | 'run'>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const toggleActivo = async () => {
    setError(null);
    setBusy('toggle');
    try {
      const res = await fetch(`/api/admin/agentes/${agente.nombre}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !agente.activo }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || body?.message || `HTTP ${res.status}`);
      }
      await onChange();
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setBusy(null);
    }
  };

  const ejecutarAhora = async () => {
    if (!agente.implementado) return;

    // Para los agentes de pre-carga IA permitimos elegir un pueblo concreto
    // (modo piloto), aumentar el tope de pueblos por tanda, o ejecutar el
    // barrido por defecto. El backend acepta:
    //   - input.puebloId      → número, modo piloto sobre ese pueblo
    //   - input.maxPueblos    → número, tope para barrido (default 10)
    //   - input.dryRun        → boolean, no persiste en BD
    //   - input.autoChain     → boolean, encadenar tandas hasta agotar
    //                           pueblos pendientes (solo agente naturales)
    let input: Record<string, unknown> = {};
    const esPrecarga =
      agente.nombre === 'precarga-recursos-turisticos' ||
      agente.nombre === 'precarga-recursos-naturales';
    // Solo el agente de naturales soporta auto-chain de momento.
    const soportaAutoChain = agente.nombre === 'precarga-recursos-naturales';
    let autoChainPedido = false;
    if (esPrecarga) {
      const respuesta = window.prompt(
        `Ejecutar "${agente.titulo}":\n\n` +
          'OPCIONES:\n' +
          '  • Vacío → barrido por defecto (5–10 pueblos).\n' +
          '  • "max N" → procesar hasta N pueblos en una tanda (ej. "max 20").\n' +
          '  • Un número → PILOTO en ese pueblo (ej. 37 = Aínsa).\n' +
          '  • Añade "dry" para no escribir en BD (ej. "max 5 dry" o "37 dry").\n' +
          (soportaAutoChain
            ? '  • Añade "noauto" para NO encadenar tandas automáticamente\n' +
              '    (por defecto el barrido encadena hasta agotar pueblos pendientes).\n\n'
            : '\n') +
          'La ejecución se lanza en SEGUNDO PLANO. Tras pulsar Aceptar\n' +
          'el agente seguirá trabajando aunque cierres esta pestaña.\n' +
          'Comprueba el progreso en Bandeja / Histórico cuando quieras.',
        '',
      );
      if (respuesta === null) return; // cancel
      const tokens = respuesta.trim().split(/\s+/).filter(Boolean);
      let noAuto = false;
      // Parseo tolerante: detecta "max N", número suelto, "dry", "noauto".
      for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i].toLowerCase();
        if (tok === 'dry') {
          input.dryRun = true;
        } else if (tok === 'noauto') {
          noAuto = true;
        } else if (tok === 'max' && i + 1 < tokens.length) {
          const n = Number(tokens[i + 1]);
          if (Number.isFinite(n) && n > 0) input.maxPueblos = n;
          i++; // saltamos el siguiente token (el número)
        } else {
          const n = Number(tok);
          if (Number.isFinite(n) && n > 0 && input.puebloId === undefined) {
            input.puebloId = n;
          }
        }
      }
      // Activar auto-chain por defecto SOLO si:
      //   - el agente lo soporta,
      //   - es barrido (no piloto: no se pasó puebloId),
      //   - no es dryRun (encadenar un dryRun no avanzaría nada),
      //   - el usuario no pidió "noauto" expresamente.
      if (
        soportaAutoChain &&
        !noAuto &&
        input.puebloId === undefined &&
        input.dryRun !== true
      ) {
        input.autoChain = true;
        autoChainPedido = true;
      } else if (soportaAutoChain) {
        input.autoChain = false;
      }
    } else if (
      !confirm(`¿Ejecutar "${agente.titulo}" ahora? Llamará a la IA y consumirá tokens.`)
    ) {
      return;
    }

    setError(null);
    setInfo(null);
    setBusy('run');
    try {
      // Si pedimos auto-chain pero el agente está pausado, lo activamos
      // primero: el runner respeta `config.activo` antes de encadenar
      // la siguiente tanda, así que sin activar la cadena moriría tras
      // la primera. El admin podrá luego pulsar "Pausar" para frenar
      // el barrido cuando quiera.
      if (autoChainPedido && !agente.activo) {
        const resAct = await fetch(
          `/api/admin/agentes/${agente.nombre}/config`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activo: true }),
          },
        );
        if (!resAct.ok) {
          const body = await resAct.json().catch(() => ({}));
          throw new Error(
            `No se pudo activar el agente para encadenar tandas: ${
              body?.error || body?.message || `HTTP ${resAct.status}`
            }`,
          );
        }
      }
      const res = await fetch(`/api/admin/agentes/${agente.nombre}/ejecutar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || body?.message || `HTTP ${res.status}`);
      }
      const body = await res.json().catch(() => ({} as any));
      // Distinguimos visualmente dos casos:
      //   (a) ejecución nueva lanzada en background → aviso normal
      //   (b) ya había una corriendo y se reutilizó → aviso ámbar
      //       para que el usuario sepa que su click NO ha lanzado
      //       nada nuevo (es lo que más confunde: parece que no
      //       responde y en realidad ya está trabajando otra).
      if (body?.background) {
        if (body.reusedExisting) {
          const segundos = Math.round((body.enCursoDesdeMs || 0) / 1000);
          setInfo(
            `Ya hay una ejecución en curso (#${body.ejecucionId}, lleva ${segundos}s). Espera a que termine antes de lanzar otra. El gasto y los recursos creados aparecerán cuando se cierre la fila.`,
          );
        } else if (autoChainPedido) {
          setInfo(
            `Lanzado en segundo plano (ejecución #${body.ejecucionId}) en MODO AUTOMÁTICO: el agente encadenará nuevas tandas (≈10 pueblos / ~80 s cada una) hasta agotar los pueblos pendientes — son ~28 tandas para ~280 pueblos, total ≈ 38 minutos hasta llegar a Zuheros. Cada tanda crea una fila en el histórico. Para detenerlo: pulsa "Pausar" en el agente o pasa "noauto" la próxima vez.`,
          );
        } else {
          setInfo(
            `Lanzado en segundo plano (ejecución #${body.ejecucionId}). Tarda ~30–90 s en background. El gasto y los recursos NO aparecen hasta que termine. Refresca esta página o ve a Bandeja / Histórico para ver el resultado.`,
          );
        }
      }
      await onChange();
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setBusy(null);
    }
  };

  const dot = agente.implementado
    ? agente.activo
      ? 'bg-emerald-500'
      : 'bg-slate-300'
    : 'bg-amber-400';

  const estadoLabel = agente.ultimoEstado
    ? ESTADO_LABEL[agente.ultimoEstado]
    : '—';

  return (
    <article className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
            <h3 className="text-base font-semibold text-foreground">
              {agente.titulo}
            </h3>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500">
            {agente.nombre}
          </p>
        </div>
        {!agente.implementado && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Stub
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-3 text-sm text-slate-600">
        {agente.descripcion}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <Field label="Modelo" value={agente.modeloIaEfectivo} mono />
        <Field
          label="Cron"
          value={agente.cronExprEfectivo ?? '—'}
          mono
        />
        <Field
          label="Presupuesto"
          value={`${agente.presupuestoMensualEur.toFixed(2)} €/mes`}
        />
        <Field
          label="Gasto mes"
          value={formatGasto(agente.gastoMesActualEur)}
          tone={
            agente.gastoMesActualEur >= agente.presupuestoMensualEur * 0.8
              ? 'red'
              : undefined
          }
        />
        <Field
          label="Ejecuciones"
          value={String(agente.ejecucionesMesActual)}
        />
        <Field label="Último estado" value={estadoLabel} />
      </dl>

      {agente.requiereRevisionHumana && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800">
          La salida queda en bandeja de pendientes hasta tu aprobación.
        </p>
      )}

      {error && (
        <p className="mt-2 rounded-md bg-rose-50 px-3 py-1.5 text-[11px] text-rose-800">
          {error}
        </p>
      )}

      {info && (
        <p className="mt-2 rounded-md bg-emerald-50 px-3 py-1.5 text-[11px] text-emerald-800">
          {info}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleActivo}
          disabled={busy !== null || !agente.implementado}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
            agente.activo
              ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              : 'bg-emerald-600 text-white hover:bg-emerald-700'
          }`}
        >
          {busy === 'toggle' ? '…' : agente.activo ? 'Pausar' : 'Activar'}
        </button>
        <button
          type="button"
          onClick={ejecutarAhora}
          disabled={busy !== null || !agente.implementado}
          className="rounded-md border border-violet-300 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-800 transition hover:bg-violet-100 disabled:opacity-50"
        >
          {busy === 'run' ? 'Ejecutando…' : 'Ejecutar ahora'}
        </button>
        <button
          type="button"
          onClick={onConfig}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Configurar
        </button>
      </div>
    </article>
  );
}

/** Formatea el gasto mensual mostrando "<0,01 €" cuando hay sub-céntimo y >0,
 *  para no quedarnos siempre en "0,00 €" cuando un agente apenas ha consumido. */
function formatGasto(eur: number): string {
  if (!Number.isFinite(eur) || eur <= 0) return '0.00 €';
  if (eur < 0.01) return '<0,01 €';
  return `${eur.toFixed(2)} €`;
}

function Field({
  label,
  value,
  mono,
  tone,
}: {
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'red';
}) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
        {label}
      </dt>
      <dd
        className={`${mono ? 'font-mono text-[11px]' : 'text-xs'} ${
          tone === 'red' ? 'text-rose-600 font-semibold' : 'text-slate-800'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
