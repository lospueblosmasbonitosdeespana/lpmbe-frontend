'use client';

import { useEffect, useState, useCallback } from 'react';

type Recurso = {
  id: number;
  nombre: string;
  activo: boolean;
  cerradoTemporal: boolean;
  puebloId: number;
  pueblo?: { id: number; nombre: string };
};

type ScanResult = {
  valido: boolean;
  resultado: string;
  mensaje: string;
  adultosUsados: number;
  menoresUsados: number;
  puebloNombre: string | null;
  recursoNombre: string | null;
  descuentoPorcentaje: number | null;
};

export default function ValidarQRPage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [adultos, setAdultos] = useState(2);
  const [menores, setMenores] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRecursos = useCallback(async () => {
    try {
      const res = await fetch('/api/colaborador/mis-recursos');
      if (!res.ok) throw new Error('Error cargando recursos');
      const data: Recurso[] = await res.json();
      const activos = data.filter((r) => r.activo && !r.cerradoTemporal);
      setRecursos(activos);
      if (activos.length > 0) setSelectedId(activos[0].id);
    } catch {
      setError('Error cargando recursos. Asegúrate de haber iniciado sesión.');
    }
  }, []);

  useEffect(() => {
    loadRecursos();
  }, [loadRecursos]);

  const handleScan = async () => {
    if (!selectedId || !qrInput.trim()) {
      setError('Selecciona un recurso e introduce el código QR');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const res = await fetch('/api/colaborador/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken: qrInput.trim(),
          recursoId: selectedId,
          adultosUsados: adultos,
          menoresUsados: menores,
        }),
      });
      const data = await res.json();
      if (!res.ok && !data.valido) {
        throw new Error(data.message || data.error || 'Error validando QR');
      }
      setResult(data);
      setQrInput('');
    } catch (err: any) {
      setError(err.message || 'Error validando QR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Selector de recurso */}
      <div>
        <label className="mb-1 block text-sm font-medium">Recurso</label>
        <select
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
        >
          {recursos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre} ({r.pueblo?.nombre ?? `Pueblo ${r.puebloId}`})
            </option>
          ))}
        </select>
      </div>

      {/* Input QR */}
      <div>
        <label className="mb-1 block text-sm font-medium">Código QR del socio</label>
        <input
          type="text"
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          placeholder="Escanea o pega el código QR aquí"
          autoFocus
          className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base"
        />
      </div>

      {/* Adultos y menores */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Adultos</label>
          <select
            value={adultos}
            onChange={(e) => setAdultos(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Menores</label>
          <select
            value={menores}
            onChange={(e) => setMenores(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botón */}
      <button
        onClick={handleScan}
        disabled={loading || !qrInput.trim() || !selectedId}
        className="w-full rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Validando...' : 'Validar QR'}
      </button>

      {/* Resultado */}
      {result && (
        <div
          className={`rounded-xl border-2 p-5 ${
            result.valido
              ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
              : 'border-destructive bg-destructive/5'
          }`}
        >
          <div
            className={`mb-2 text-xl font-bold ${
              result.valido ? 'text-green-600' : 'text-destructive'
            }`}
          >
            {result.valido ? 'Validación correcta' : 'Validación fallida'}
          </div>
          <p className="text-sm">
            <strong>Resultado:</strong> {result.resultado}
          </p>
          <p className="text-sm">
            <strong>Mensaje:</strong> {result.mensaje}
          </p>
          {result.valido && (
            <>
              <p className="text-sm">
                <strong>Adultos:</strong> {result.adultosUsados} ·{' '}
                <strong>Menores:</strong> {result.menoresUsados}
              </p>
              {result.descuentoPorcentaje != null && (
                <p className="mt-1 text-sm font-semibold text-green-600">
                  Descuento aplicable: {result.descuentoPorcentaje}%
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
