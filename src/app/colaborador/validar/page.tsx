'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getMisRecursos,
  scanValidador,
  type RecursoTuristico,
} from '@/src/lib/api/club';

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
  const [recursos, setRecursos] = useState<RecursoTuristico[]>([]);
  const [selectedRecurso, setSelectedRecurso] = useState<number | null>(null);
  const [qrInput, setQrInput] = useState('');
  const [adultos, setAdultos] = useState(2);
  const [menores, setMenores] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRecursos = useCallback(async () => {
    try {
      const data = await getMisRecursos();
      setRecursos(data.filter((r) => r.activo && !r.cerradoTemporal));
      if (data.length > 0) {
        setSelectedRecurso(data[0].id);
      }
    } catch {
      setError('Error cargando recursos. Asegúrate de haber iniciado sesión.');
    }
  }, []);

  useEffect(() => { loadRecursos(); }, [loadRecursos]);

  const handleScan = async () => {
    if (!selectedRecurso || !qrInput.trim()) {
      setError('Selecciona un recurso e introduce el código QR');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const data = await scanValidador(qrInput.trim(), selectedRecurso, adultos, menores);
      setResult(data);
      setQrInput('');
    } catch (err: any) {
      setError(err.message || 'Error validando QR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ margin: '0 0 24px', fontSize: 24 }}>Validar QR</h1>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16, color: '#dc2626', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Selector de recurso */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
          Recurso
        </label>
        <select
          value={selectedRecurso ?? ''}
          onChange={(e) => setSelectedRecurso(Number(e.target.value))}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            fontSize: 14,
          }}
        >
          {recursos.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre} ({r.pueblo?.nombre ?? `Pueblo ${r.puebloId}`})
            </option>
          ))}
        </select>
      </div>

      {/* Input QR */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
          Código QR del socio
        </label>
        <input
          type="text"
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          placeholder="Escanea o pega el código QR aquí"
          autoFocus
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            fontSize: 16,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Adultos y menores */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            Adultos
          </label>
          <select
            value={adultos}
            onChange={(e) => setAdultos(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
            Menores
          </label>
          <select
            value={menores}
            onChange={(e) => setMenores(Number(e.target.value))}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14 }}
          >
            {[0, 1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Botón validar */}
      <button
        onClick={handleScan}
        disabled={loading || !qrInput.trim() || !selectedRecurso}
        style={{
          width: '100%',
          padding: '12px 24px',
          borderRadius: 8,
          border: 'none',
          background: loading ? '#9ca3af' : '#2563eb',
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Validando...' : 'Validar QR'}
      </button>

      {/* Resultado */}
      {result && (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            borderRadius: 12,
            border: `2px solid ${result.valido ? '#10b981' : '#ef4444'}`,
            background: result.valido ? '#ecfdf5' : '#fef2f2',
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: result.valido ? '#059669' : '#dc2626' }}>
            {result.valido ? 'Validación correcta' : 'Validación fallida'}
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 14, color: '#374151' }}>
            <strong>Resultado:</strong> {result.resultado}
          </p>
          <p style={{ margin: '0 0 4px', fontSize: 14, color: '#374151' }}>
            <strong>Mensaje:</strong> {result.mensaje}
          </p>
          {result.valido && (
            <>
              <p style={{ margin: '0 0 4px', fontSize: 14, color: '#374151' }}>
                <strong>Adultos:</strong> {result.adultosUsados} &middot; <strong>Menores:</strong> {result.menoresUsados}
              </p>
              {result.descuentoPorcentaje != null && (
                <p style={{ margin: '0 0 4px', fontSize: 14, color: '#059669', fontWeight: 600 }}>
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
