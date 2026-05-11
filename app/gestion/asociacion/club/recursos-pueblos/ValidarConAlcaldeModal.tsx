'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

type Pueblo = {
  id: number;
  nombre: string;
  slug: string;
  precargadosPendientes: number;
};

type Candidato = {
  email: string;
  nombre: string | null;
  etiqueta: string;
  source: 'ALCALDE_WEB' | 'INSTITUCIONAL' | 'COLABORADOR_WEB';
  sugerido: boolean;
};

type DestinatariosResponse = {
  pueblo: { slug: string; nombre: string; provincia: string; comunidad: string };
  candidatos: Candidato[];
};

type TipoLista = 'turisticos' | 'naturales';

function construirPlantilla(tipo: TipoLista): string {
  const queSon =
    tipo === 'turisticos'
      ? 'los principales recursos turísticos visitables (museos, castillos, iglesias visitables, ermitas con horario, casas-museo, monasterios visitables…)'
      : 'los principales recursos rurales / naturales accesibles desde el pueblo (cascadas, miradores, parajes, sendas, fuentes, lagunas…)';
  const validacion =
    tipo === 'turisticos'
      ? 'En unos días te enviaremos por correo postal un <strong>QR estático impreso</strong> para colocar en cada uno: cuando un socio del Club lo lea, sumará puntos. <strong>NO HACE FALTA</strong>, si no queréis, utilizar ningún dispositivo para validar. <strong>NO es obligatorio aplicar descuentos</strong>. Esto ha de servir para promocionar vuestros recursos al máximo y para que el socio que los visite se lleve <strong>Puntos de Gamificación</strong> para regalos del Club, etc.'
      : 'Estos recursos se validan <strong>por GPS</strong> (no necesitan QR físico): cuando un socio del Club pase por allí, su app reconocerá el sitio y le sumará puntos automáticamente. <strong>NO HACE FALTA</strong> ningún dispositivo ni intervención por vuestra parte. <strong>NO es obligatorio aplicar descuentos</strong>. Esto ha de servir para promocionar vuestros recursos al máximo y para que el socio que los visite se lleve <strong>Puntos de Gamificación</strong> para regalos del Club, etc.';
  const cierreFisico =
    tipo === 'turisticos'
      ? 'Solo poner en un mostrador el QR que os enviamos en pocos días.'
      : 'Tampoco hay que poner nada físico: la app del socio detecta el sitio por GPS al pasar.';

  return `<p>Estimado/a alcalde/sa y/o personal del equipo de gobierno de <strong>{NOMBRE_PUEBLO}</strong>,</p>

<p>Para activar el <strong>Club de Amigos de Los Pueblos Más Bonitos de España</strong> en tu municipio, hemos pre-cargado en la web ${queSon}. Hemos detectado <strong>{N_RECURSOS}</strong>.</p>

<p><strong>Quedan inactivos</strong> hasta que tú los apruebes. Si no haces nada, no aparecerán en la web pública ni en la app.</p>

<p>${validacion}</p>

<p style="margin-top:20px;padding:14px 16px;background:#fef3c7;border-left:4px solid #d97706;border-radius:4px"><strong>Importante:</strong> En breve también se ofrecerá a todos los hoteles, restaurantes, casas rurales, etc., del municipio que se <strong>unan al Club</strong> (podrán hacerlo de manera gratuita y de pago, ellos deciden). Esto también va a ser una gran promoción de sus negocios. El sistema es de última generación tecnológica y va a ser una herramienta brutal para todo el ecosistema de nuestros pueblos. Es importante que los municipios estén integrados en el Club con los negocios e ir todos a una. <strong>Hasta que no se activen vuestros recursos NO podremos activar vuestros negocios particulares.</strong> Por ello es importante responder este email. Para ello se ha hecho de la manera más sencilla: no hace falta ni que entréis en la web (aunque recomendamos poner al menos una foto del recurso). Con sólo darle al botón, el recurso pasará a estar activo. No hace falta personal. No hace falta leer nada. ${cierreFisico}</p>

<p style="margin-top:20px;font-weight:600;color:#854d0e">Recursos detectados:</p>
{LISTA_RECURSOS_HTML}

<p style="margin-top:24px"><strong>Tienes dos opciones:</strong></p>

<table cellpadding="0" cellspacing="0" border="0" style="margin:16px 0">
  <tr>
    <td>
      <a href="{URL_APROBAR_TODOS}" style="display:inline-block;padding:14px 32px;background:#16a34a;color:#ffffff!important;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;box-shadow:0 2px 4px rgba(22,163,74,.25)">
        ✅ Aprobar todos y dar de alta
      </a>
    </td>
  </tr>
</table>

<p style="margin:16px 0">
  <a href="{URL_REVISAR}" style="color:#c2410c;text-decoration:underline;font-size:14px;font-weight:600">
    ✏️ Prefiero revisarlos uno a uno (puedo descartar los que no encajen)
  </a>
</p>

<p style="margin-top:24px;color:#57534e;font-size:14px">Una vez aprobados, podrás <strong>editar la foto, el descuento (si lo hay), un regalo o los horarios</strong> entrando con tu cuenta a tu panel de gestión, igual que cualquier recurso que hubieras subido tú a mano.</p>

<p style="margin-top:16px;color:#78716c;font-size:13px">Si crees que alguno de los recursos detectados está mal o falta alguno importante, también puedes responder a este email y lo ajustamos a mano antes de publicarlo.</p>`;
}

const PLANTILLA_DEFAULT_TURISTICOS = construirPlantilla('turisticos');
const PLANTILLA_DEFAULT_NATURALES = construirPlantilla('naturales');

export default function ValidarConAlcaldeModal({
  pueblo,
  onClose,
  onSent,
}: {
  pueblo: Pueblo;
  onClose: () => void;
  onSent: () => void;
}) {
  const [tipoLista, setTipoLista] = useState<TipoLista>('turisticos');
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [emailsSeleccionados, setEmailsSeleccionados] = useState<Set<string>>(new Set());
  const [emailManual, setEmailManual] = useState('');
  const [emailsManuales, setEmailsManuales] = useState<string[]>([]);
  const [asunto, setAsunto] = useState(
    `✅ Validar recursos turísticos de ${pueblo.nombre}`,
  );
  const [cuerpo, setCuerpo] = useState(PLANTILLA_DEFAULT_TURISTICOS);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<{ recursosIncluidos: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const cargandoCandidatos = useRef(false);

  // Cargar destinatarios candidatos al abrir el modal.
  useEffect(() => {
    if (cargandoCandidatos.current) return;
    cargandoCandidatos.current = true;
    fetch(
      `/api/admin/club/preload-validation/destinatarios?puebloSlug=${encodeURIComponent(pueblo.slug)}`,
      { cache: 'no-store' },
    )
      .then(async (res) => {
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`HTTP ${res.status}: ${txt}`);
        }
        return res.json() as Promise<DestinatariosResponse>;
      })
      .then((data) => {
        setCandidatos(data.candidatos);
        setEmailsSeleccionados(
          new Set(
            data.candidatos.filter((c) => c.sugerido).map((c) => c.email.toLowerCase()),
          ),
        );
      })
      .catch((e: any) => setError(e?.message ?? 'No se pudieron cargar los destinatarios'));
  }, [pueblo.slug]);

  // Si cambia el tipoLista, ajustamos asunto y cuerpo por defecto (siempre que el
  // admin no haya editado el cuerpo manualmente — heurística: si está exactamente
  // igual al default anterior, lo cambiamos; si lo había editado, lo respetamos).
  function cambiarTipoLista(nuevo: TipoLista) {
    setTipoLista(nuevo);
    setAsunto(
      nuevo === 'turisticos'
        ? `✅ Validar recursos turísticos de ${pueblo.nombre}`
        : `✅ Validar recursos naturales cerca de ${pueblo.nombre}`,
    );
    if (
      cuerpo === PLANTILLA_DEFAULT_TURISTICOS ||
      cuerpo === PLANTILLA_DEFAULT_NATURALES
    ) {
      setCuerpo(
        nuevo === 'turisticos'
          ? PLANTILLA_DEFAULT_TURISTICOS
          : PLANTILLA_DEFAULT_NATURALES,
      );
    }
  }

  function toggleEmail(email: string) {
    const k = email.toLowerCase();
    setEmailsSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  function añadirEmailManual() {
    const e = emailManual.trim();
    if (!e || !e.includes('@')) {
      setError('Email inválido.');
      return;
    }
    setError(null);
    const k = e.toLowerCase();
    if (
      emailsManuales.includes(k) ||
      candidatos.some((c) => c.email.toLowerCase() === k)
    ) {
      setEmailsSeleccionados((prev) => new Set(prev).add(k));
    } else {
      setEmailsManuales((prev) => [...prev, k]);
      setEmailsSeleccionados((prev) => new Set(prev).add(k));
    }
    setEmailManual('');
  }

  function quitarEmailManual(e: string) {
    setEmailsManuales((prev) => prev.filter((x) => x !== e));
    setEmailsSeleccionados((prev) => {
      const next = new Set(prev);
      next.delete(e);
      return next;
    });
  }

  const todosLosEmails = useMemo(() => {
    const s = new Set<string>();
    candidatos.forEach((c) => s.add(c.email.toLowerCase()));
    emailsManuales.forEach((e) => s.add(e));
    return Array.from(s);
  }, [candidatos, emailsManuales]);

  const seleccionados = useMemo(
    () => todosLosEmails.filter((e) => emailsSeleccionados.has(e)),
    [todosLosEmails, emailsSeleccionados],
  );

  // Vista previa renderizada con datos placeholder
  const cuerpoPreview = useMemo(() => {
    const placeholderLista = `<ul style="margin:8px 0 16px 20px;padding-left:0;color:#1c1917;font-size:14px;line-height:1.6">
      <li><strong>(Lista real de recursos)</strong> <span style="color:#854d0e;font-size:13px">(tipo)</span></li>
      <li>Se generará al pulsar Enviar — son los ${pueblo.precargadosPendientes} pre-cargados pendientes</li>
    </ul>`;
    const vars: Record<string, string> = {
      NOMBRE_PUEBLO: pueblo.nombre,
      LISTA_RECURSOS_HTML: placeholderLista,
      URL_APROBAR_TODOS: '#preview',
      URL_REVISAR: '#preview',
      N_RECURSOS: String(pueblo.precargadosPendientes),
      TIPO_LISTA: tipoLista,
    };
    return cuerpo.replace(/\{([A-Z_][A-Z0-9_]*)\}/g, (m, key) =>
      Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : m,
    );
  }, [cuerpo, pueblo.nombre, pueblo.precargadosPendientes, tipoLista]);

  function enviar() {
    if (seleccionados.length === 0) {
      setError('Selecciona al menos un destinatario.');
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/admin/club/preload-validation/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puebloSlug: pueblo.slug,
          tipoLista,
          asunto,
          cuerpoCustomHtml: cuerpo,
          destinatarios: seleccionados,
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        setError(`Error al enviar: ${t}`);
        return;
      }
      const data = (await res.json()) as { recursosIncluidos: number };
      setOk(data);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/60 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
              Validación con alcalde
            </p>
            <h2 className="mt-1 text-lg font-semibold text-foreground">
              {pueblo.nombre}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {pueblo.precargadosPendientes} recursos pre-cargados pendientes de validar
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
            </svg>
          </button>
        </div>

        {ok ? (
          <div className="p-6 text-center">
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
              ✓
            </div>
            <h3 className="text-lg font-semibold text-emerald-900">Email enviado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Se ha enviado a {seleccionados.length} destinatario
              {seleccionados.length === 1 ? '' : 's'} con {ok.recursosIncluidos} recursos.
            </p>
            <button
              onClick={onSent}
              className="mt-6 rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
            >
              Cerrar y refrescar lista
            </button>
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto p-5">
            {/* Tipo lista */}
            <Section titulo="Tipo de recursos">
              <div className="flex gap-2">
                <RadioPill
                  selected={tipoLista === 'turisticos'}
                  onClick={() => cambiarTipoLista('turisticos')}
                >
                  Turísticos (museos, castillos…)
                </RadioPill>
                <RadioPill
                  selected={tipoLista === 'naturales'}
                  onClick={() => cambiarTipoLista('naturales')}
                >
                  Naturales (cascadas, miradores…)
                </RadioPill>
              </div>
            </Section>

            {/* Destinatarios */}
            <Section
              titulo={`Destinatarios (${seleccionados.length} seleccionados)`}
              subtitulo="Sugeridos vienen marcados. Puedes desmarcar o añadir más."
            >
              <div className="space-y-1.5">
                {candidatos.map((c) => {
                  const k = c.email.toLowerCase();
                  return (
                    <label
                      key={k}
                      className="flex cursor-pointer items-start gap-2 rounded-md border border-border/60 bg-background px-3 py-2 text-sm hover:bg-muted/50"
                    >
                      <input
                        type="checkbox"
                        checked={emailsSeleccionados.has(k)}
                        onChange={() => toggleEmail(c.email)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium">{c.email}</span>
                          <SourceBadge source={c.source} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {c.nombre ? `${c.nombre} · ` : ''}
                          {c.etiqueta}
                        </div>
                      </div>
                    </label>
                  );
                })}
                {emailsManuales.map((e) => (
                  <div
                    key={e}
                    className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={emailsSeleccionados.has(e)}
                      onChange={() => toggleEmail(e)}
                      className="mt-0.5"
                    />
                    <span className="flex-1 font-medium">{e}</span>
                    <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900">
                      Añadido manualmente
                    </span>
                    <button
                      type="button"
                      onClick={() => quitarEmailManual(e)}
                      className="text-xs text-red-700 hover:underline"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                {candidatos.length === 0 && emailsManuales.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                    No hay destinatarios automáticos para este pueblo. Añade al menos uno manualmente.
                  </div>
                ) : null}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  value={emailManual}
                  onChange={(e) => setEmailManual(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      añadirEmailManual();
                    }
                  }}
                  placeholder="añadir-otro-correo@ejemplo.es"
                  className="flex-1 rounded-md border border-border/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button
                  type="button"
                  onClick={añadirEmailManual}
                  className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  + Añadir
                </button>
              </div>
            </Section>

            {/* Asunto */}
            <Section titulo="Asunto">
              <input
                type="text"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                className="w-full rounded-md border border-border/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </Section>

            {/* Cuerpo */}
            <Section
              titulo="Cuerpo del email"
              subtitulo="Variables soportadas: {NOMBRE_PUEBLO}, {LISTA_RECURSOS_HTML}, {URL_APROBAR_TODOS}, {URL_REVISAR}, {N_RECURSOS}"
            >
              <textarea
                value={cuerpo}
                onChange={(e) => setCuerpo(e.target.value)}
                rows={12}
                className="w-full rounded-md border border-border/60 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </Section>

            {/* Vista previa */}
            <Section titulo="Vista previa">
              <button
                type="button"
                onClick={() => setVistaPrevia((v) => !v)}
                className="rounded-md border border-border/60 bg-background px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                {vistaPrevia ? 'Ocultar vista previa' : 'Mostrar vista previa'}
              </button>
              {vistaPrevia ? (
                <div className="mt-2 rounded-lg border border-border/60 bg-muted/20 p-2">
                  <iframe
                    srcDoc={`<html><body style="font-family:Segoe UI,Tahoma,sans-serif;padding:16px;color:#1c1917">${cuerpoPreview}</body></html>`}
                    title="Vista previa"
                    className="h-[400px] w-full rounded bg-white"
                    sandbox=""
                  />
                </div>
              ) : null}
            </Section>

            {error ? (
              <div className="mb-3 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                {error}
              </div>
            ) : null}
          </div>
        )}

        {ok ? null : (
          <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground">
              Antes de pulsar Enviar, revisa la vista previa.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="rounded-md border border-border/60 bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={enviar}
                disabled={pending || seleccionados.length === 0}
                className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50"
              >
                {pending
                  ? 'Enviando…'
                  : `Enviar a ${seleccionados.length} destinatario${seleccionados.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  titulo,
  subtitulo,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {titulo}
      </h3>
      {subtitulo ? (
        <p className="mb-2 text-xs text-muted-foreground">{subtitulo}</p>
      ) : null}
      {children}
    </section>
  );
}

function RadioPill({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        selected
          ? 'border-amber-600 bg-amber-600 text-white'
          : 'border-border/60 bg-background hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

function SourceBadge({
  source,
}: {
  source: 'ALCALDE_WEB' | 'INSTITUCIONAL' | 'COLABORADOR_WEB';
}) {
  const cfg = {
    ALCALDE_WEB: { label: 'Alcalde web', cls: 'bg-emerald-100 text-emerald-900' },
    INSTITUCIONAL: { label: 'Institucional', cls: 'bg-sky-100 text-sky-900' },
    COLABORADOR_WEB: { label: 'Colaborador', cls: 'bg-slate-100 text-slate-700' },
  }[source];
  return (
    <span
      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}
