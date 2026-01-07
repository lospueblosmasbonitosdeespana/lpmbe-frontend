'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

type Status = 'SCANNING' | 'VALID' | 'INVALID' | 'ERROR';

const IS_DEV = process.env.NODE_ENV === 'development';

// Tipo para WakeLock (si no está disponible en el navegador)
interface WakeLockSentinel {
  release(): Promise<void>;
  addEventListener(type: 'release', listener: () => void): void;
}

type Metricas = {
  hoy: {
    total: number;
    ok: number;
    noOk: number;
    adultos: number;
    menores: number;
  };
  ultimosDias: Array<{
    fecha: string;
    total: number;
    ok: number;
    adultos: number;
    menores: number;
  }>;
  ultimosEscaneos: Array<{
    hora: string;
    resultado: 'OK' | 'NO_OK';
    adultosUsados?: number;
    menoresUsados?: number;
  }>;
};

// Helper para normalizar métricas (nunca undefined)
const normalizeMetricas = (raw: any): Metricas => {
  const hoy = raw?.hoy ?? {};
  const dias = Array.isArray(raw?.dias) 
    ? raw.dias 
    : Array.isArray(raw?.ultimosDias) 
      ? raw.ultimosDias 
      : [];
  const escaneos = Array.isArray(raw?.ultimosEscaneos) 
    ? raw.ultimosEscaneos 
    : Array.isArray(raw?.escaneos) 
      ? raw.escaneos 
      : [];

  return {
    hoy: {
      total: Number(hoy.total ?? hoy.count ?? 0),
      ok: Number(hoy.ok ?? hoy.validas ?? 0),
      noOk: Number(hoy.noOk ?? hoy.invalidas ?? 0),
      adultos: Number(hoy.adultos ?? hoy.adultosUsados ?? 0),
      menores: Number(hoy.menores ?? hoy.menoresUsados ?? 0),
    },
    ultimosDias: dias.map((d: any) => ({
      fecha: String(d.fecha ?? d.day ?? d.date ?? ''),
      total: Number(d.total ?? d.count ?? 0),
      ok: Number(d.ok ?? d.validas ?? 0),
      adultos: Number(d.adultos ?? d.adultosUsados ?? 0),
      menores: Number(d.menores ?? d.menoresUsados ?? 0),
    })),
    ultimosEscaneos: escaneos.map((e: any) => ({
      hora: String(e.hora ?? e.time ?? e.timestamp ?? e.scannedAt ?? e.fecha ?? ''),
      resultado: (e.resultado === 'OK' || e.resultado === 'VALID' || e.valid === true) ? 'OK' : 'NO_OK',
      adultosUsados: e.adultosUsados !== undefined ? Number(e.adultosUsados) : undefined,
      menoresUsados: e.menoresUsados !== undefined ? Number(e.menoresUsados) : undefined,
    })),
  };
};

export default function ValidadorPage({ params }: { params: Promise<{ recursoId: string }> }) {
  const [recursoId, setRecursoId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('SCANNING');
  const [motivo, setMotivo] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any | null>(null);
  const [adultosUsados, setAdultosUsados] = useState<1 | 2>(2);
  const [menoresUsados, setMenoresUsados] = useState(0);
  const [metricas, setMetricas] = useState<Metricas>(() => normalizeMetricas(null));
  const [metricasError, setMetricasError] = useState<string | null>(null);
  const [puebloId, setPuebloId] = useState<number | null>(null);
  const [metricasPueblo, setMetricasPueblo] = useState<Metricas>(() => normalizeMetricas(null));
  const [metricasPuebloError, setMetricasPuebloError] = useState<string | null>(null);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);
  const scannerRunningRef = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isProcessingRef = useRef(false);
  const lastScanRef = useRef<{ text: string; at: number } | null>(null);
  const showingResultRef = useRef(false);

  useEffect(() => {
    params.then((p) => {
      setRecursoId(p.recursoId);
      // Limpiar lastResult al cambiar de recurso
      setLastResult(null);
    });
  }, [params]);

  useEffect(() => {
    if (!recursoId) return;

    const scannerId = `scanner-${recursoId}`;
    let scanner: Html5Qrcode | null = null;

    async function startScanning() {
      if (scanningRef.current) return;
      scanningRef.current = true;

      try {
        scanner = new Html5Qrcode(scannerId);
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            handleScan(decodedText);
          },
          () => {
            // Error ignorado durante escaneo
          }
        );
        scannerRef.current = scanner;
        scannerRunningRef.current = true;
      } catch (err: any) {
        console.error('Error iniciando escáner:', err);
        setStatus('ERROR');
        setMotivo('No se pudo acceder a la cámara');
        scanningRef.current = false;
        scannerRunningRef.current = false;
      }
    }

    startScanning();

    return () => {
      if (scanner && scannerRunningRef.current) {
        scannerRunningRef.current = false;
        scanner
          .stop()
          .then(() => {
            scanner?.clear();
            scanningRef.current = false;
          })
          .catch(() => {
            scanningRef.current = false;
          });
      } else {
        scanningRef.current = false;
      }
    };
  }, [recursoId]);


  // Sonidos con WebAudio API
  function playBeepValid() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frecuencia más alta para válido
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Ignorar si no está disponible
    }
  }

  function playBeepInvalid() {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 400; // Frecuencia más baja para inválido
      oscillator.type = 'sawtooth';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (e) {
      // Ignorar si no está disponible
    }
  }

  // WakeLock para mantener pantalla activa
  async function handleWakeLock() {
    if (!('wakeLock' in navigator)) {
      alert('Tu navegador no soporta mantener la pantalla activa');
      return;
    }

    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setWakeLockActive(false);
      } else {
        const wakeLock = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current = wakeLock;
        setWakeLockActive(true);
        wakeLock.addEventListener('release', () => {
          wakeLockRef.current = null;
          setWakeLockActive(false);
        });
      }
    } catch (err: any) {
      console.error('Error con WakeLock:', err);
      alert('No se pudo activar el modo kiosko: ' + (err.message || 'Error desconocido'));
    }
  }

  useEffect(() => {
    // Limpiar wakeLock al desmontar
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, []);

  // Polling de métricas cada 15 segundos (no refrescar mientras muestra resultado)
  useEffect(() => {
    if (!recursoId) return;

    async function loadMetricas() {
      // No refrescar si está mostrando resultado
      if (showingResultRef.current) return;

      try {
        const res = await fetch(`/api/club/validador/metricas?recursoId=${recursoId}&days=7`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          setMetricasError('Error cargando métricas');
          return;
        }

        const data = await res.json();
        setMetricas(normalizeMetricas(data));
        setMetricasError(null);
      } catch (e: any) {
        setMetricasError('Error cargando métricas');
      }
    }

    loadMetricas();

    const interval = setInterval(() => {
      loadMetricas();
    }, 15000);

    return () => clearInterval(interval);
  }, [recursoId]);

  // Función para refrescar métricas (usada tras escaneo o manual)
  async function refreshMetricas() {
    if (!recursoId) return;

    try {
      const res = await fetch(`/api/club/validador/metricas?recursoId=${recursoId}&days=7`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();
      setMetricas(normalizeMetricas(data));
      setMetricasError(null);
    } catch (e: any) {
      // Ignorar errores silenciosamente en refresh
    }
  }

  // Función para refrescar métricas del pueblo
  async function refreshMetricasPueblo() {
    if (!puebloId) return;

    try {
      const res = await fetch(`/api/club/validador/metricas-pueblo?puebloId=${puebloId}&days=7`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        setMetricasPuebloError('Error cargando métricas del pueblo');
        return;
      }

      const data = await res.json();
      setMetricasPueblo(normalizeMetricas(data));
      setMetricasPuebloError(null);
    } catch (e: any) {
      setMetricasPuebloError('Error cargando métricas del pueblo');
    }
  }

  // Polling de métricas del pueblo cada 15 segundos
  useEffect(() => {
    if (!puebloId) return;

    async function loadMetricasPueblo() {
      if (showingResultRef.current) return;

      try {
        const res = await fetch(`/api/club/validador/metricas-pueblo?puebloId=${puebloId}&days=7`, {
          cache: 'no-store',
        });

        if (!res.ok) {
          setMetricasPuebloError('Error cargando métricas del pueblo');
          return;
        }

        const data = await res.json();
        setMetricasPueblo(normalizeMetricas(data));
        setMetricasPuebloError(null);
      } catch (e: any) {
        setMetricasPuebloError('Error cargando métricas del pueblo');
      }
    }

    loadMetricasPueblo();

    const interval = setInterval(() => {
      loadMetricasPueblo();
    }, 15000);

    return () => clearInterval(interval);
  }, [puebloId]);

  async function handleScan(rawText: string) {
    if (status !== 'SCANNING') return;
    
    // Bloquear doble lectura
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    // Normalizar token
    const raw = rawText.trim();
    let token = raw;
    if (raw.startsWith('LPBME:QR:')) {
      token = raw.replace('LPBME:QR:', '').trim();
    }

    // Anti-duplicado: evitar escanear el mismo QR múltiples veces
    if (lastScanRef.current && lastScanRef.current.text === raw && Date.now() - lastScanRef.current.at < 3000) {
      isProcessingRef.current = false;
      return;
    }
    lastScanRef.current = { text: raw, at: Date.now() };

    // Validar token antes de llamar a la API
    if (!token || token.length < 10) {
      setStatus('INVALID');
      playBeepInvalid();
      setTimeout(() => {
        setStatus('SCANNING');
        isProcessingRef.current = false;
      }, 2000);
      return;
    }

    // Parar escáner temporalmente
    if (scannerRef.current && scannerRunningRef.current) {
      try {
        scannerRunningRef.current = false;
        await scannerRef.current.stop();
        scanningRef.current = false;
      } catch (e) {
        // Ignorar error al parar
        scanningRef.current = false;
      }
    }

    try {
      const res = await fetch('/api/club/validador/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qrToken: token,
          recursoId: Number(recursoId),
          adultosUsados,
          menoresUsados,
        }),
      });

      const okHttp = res.status === 200 || res.status === 201;

      if (!okHttp) {
        // ERROR (2s) y rearmar escáner
        setStatus('ERROR');
        setMotivo('Error del servidor');
        playBeepInvalid(); // Sonido de error
        setTimeout(() => {
          setStatus('SCANNING');
          setMotivo(null);
          isProcessingRef.current = false;
          restartScanner();
        }, 2000);
        return;
      }

      // Leer JSON y decidir "VÁLIDO / NO VÁLIDO" por el contenido
      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      // Guardar resultado antes del reset
      setLastResult(data);

      // Extraer puebloId del resultado si está disponible
      if (data?.puebloId) {
        setPuebloId(data.puebloId);
      } else if (data?.pueblo?.id) {
        setPuebloId(data.pueblo.id);
      }

      // Marcar que estamos mostrando resultado (evitar refrescar métricas)
      showingResultRef.current = true;

      if (data?.valido === true || data?.resultado === 'OK') {
        setStatus('VALID');
        setMotivo(null);
        playBeepValid(); // Sonido de válido
      } else {
        setStatus('INVALID');
        // Mostrar motivo detallado si viene del backend
        const motivoText = data?.motivo || data?.mensaje || data?.resultado || null;
        setMotivo(motivoText);
        playBeepInvalid(); // Sonido de inválido
      }

      // Refrescar métricas inmediatamente tras escaneo (solo si no está mostrando resultado)
      // Pero esperamos un poco para que no parpadee
      setTimeout(() => {
        refreshMetricas();
        if (puebloId) {
          refreshMetricasPueblo();
        }
      }, 500);
    } catch (e: any) {
      showingResultRef.current = true;
      setStatus('ERROR');
      setMotivo('Error de red');
      playBeepInvalid(); // Sonido de error
    }

    // Reset después de 2 segundos
    setTimeout(() => {
      setStatus('SCANNING');
      setMotivo(null);
      isProcessingRef.current = false;
      showingResultRef.current = false;
      restartScanner();
    }, 2000);
  }

  async function restartScanner() {
    if (!recursoId || scanningRef.current) return;

    const scannerId = `scanner-${recursoId}`;
    try {
      const scanner = new Html5Qrcode(scannerId);
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {
          // Error ignorado
        }
      );
      scannerRef.current = scanner;
      scanningRef.current = true;
      scannerRunningRef.current = true;
    } catch (err) {
      console.error('Error reiniciando escáner:', err);
      scannerRunningRef.current = false;
    }
  }

  if (!recursoId) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div>Cargando...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Validador</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => {
              refreshMetricas();
              if (puebloId) {
                refreshMetricasPueblo();
              }
            }}
            style={{
              padding: '8px 16px',
              fontSize: 14,
              border: '1px solid #ddd',
              borderRadius: 4,
              background: '#fff',
              color: '#000',
              cursor: 'pointer',
            }}
          >
            Actualizar métricas
          </button>
          {(IS_DEV || true) && (
            <button
              onClick={handleWakeLock}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                border: '1px solid #ddd',
                borderRadius: 4,
                background: wakeLockActive ? '#22c55e' : '#fff',
                color: wakeLockActive ? '#fff' : '#000',
                cursor: 'pointer',
              }}
            >
              {wakeLockActive ? 'Pantalla activa ✓' : 'Mantener pantalla activa'}
            </button>
          )}
        </div>
      </div>
      <div style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
        Recurso ID: {recursoId}
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {/* Columna izquierda: Escáner */}
        <div style={{ flex: '1 1 400px', minWidth: 0 }}>
          {/* Selector de adultos */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, marginRight: 12 }}>Adultos con beneficio:</label>
            <label style={{ marginRight: 12, cursor: 'pointer' }}>
              <input
                type="radio"
                checked={adultosUsados === 1}
                onChange={() => setAdultosUsados(1)}
                style={{ marginRight: 4 }}
              />
              1
            </label>
            <label style={{ cursor: 'pointer' }}>
              <input
                type="radio"
                checked={adultosUsados === 2}
                onChange={() => setAdultosUsados(2)}
                style={{ marginRight: 4 }}
              />
              2
            </label>
          </div>

          {/* Selector de menores */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, marginRight: 12 }}>Menores:</label>
            {[0, 1, 2, 3, 4, 5].map((num) => (
              <label key={num} style={{ marginRight: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={menoresUsados === num}
                  onChange={() => setMenoresUsados(num)}
                  style={{ marginRight: 4 }}
                />
                {num}
              </label>
            ))}
          </div>

          <div
            id={`scanner-${recursoId}`}
            style={{
              width: '100%',
              minHeight: 300,
              border: '1px solid #ddd',
              marginBottom: 12,
            }}
          />
          
          <p style={{ fontSize: 14, opacity: 0.7, textAlign: 'center', marginBottom: 24 }}>
            Alinea el código QR frente a la cámara del ordenador
          </p>

      {status === 'SCANNING' && (
        <div style={{ textAlign: 'center', fontSize: 18, color: '#666' }}>
          Escaneando...
        </div>
      )}

      {status === 'VALID' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#22c55e', marginBottom: 16 }}>
            VÁLIDO
          </div>
          {lastResult && (
            <div style={{ fontSize: 14, color: '#666', marginTop: 16 }}>
              <div>Pueblo: {lastResult?.puebloNombre ?? lastResult?.pueblo?.nombre ?? lastResult?.pueblo ?? '—'}</div>
              <div>Recurso: {lastResult?.recursoNombre ?? lastResult?.recurso?.nombre ?? lastResult?.recurso ?? '—'}</div>
              <div>Adultos: {lastResult?.adultosUsados ?? adultosUsados} / Menores: {lastResult?.menoresUsados ?? menoresUsados}</div>
              <div>Descuento: {lastResult?.descuentoPorcentaje ? `${lastResult.descuentoPorcentaje}%` : '—'}</div>
            </div>
          )}
        </div>
      )}

      {status === 'INVALID' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>
            NO VÁLIDO
          </div>
          {motivo && (
            <div style={{ fontSize: 16, fontWeight: 600, color: '#ef4444', marginBottom: 8 }}>
              {motivo}
            </div>
          )}
          {lastResult && (
            <div style={{ fontSize: 14, color: '#666', marginTop: 16 }}>
              <div>Pueblo: {lastResult?.puebloNombre ?? lastResult?.pueblo?.nombre ?? lastResult?.pueblo ?? '—'}</div>
              <div>Recurso: {lastResult?.recursoNombre ?? lastResult?.recurso?.nombre ?? lastResult?.recurso ?? '—'}</div>
              <div>Adultos: {lastResult?.adultosUsados ?? adultosUsados} / Menores: {lastResult?.menoresUsados ?? menoresUsados}</div>
              <div>Descuento: {lastResult?.descuentoPorcentaje ? `${lastResult.descuentoPorcentaje}%` : '—'}</div>
            </div>
          )}
        </div>
      )}

      {status === 'ERROR' && (
        <div style={{ textAlign: 'center', fontSize: 48, fontWeight: 700, color: '#ef4444' }}>
          ERROR
        </div>
      )}
        </div>

        {/* Columna derecha: Panel de métricas */}
        <div style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 4 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Métricas</h2>

            {metricasError && (
              <div style={{ fontSize: 14, color: '#ef4444', marginBottom: 16 }}>
                {metricasError}
              </div>
            )}

            {/* HOY */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>HOY</div>
              <div style={{ fontSize: 14 }}>
                {metricas.hoy.total} intentos | OK: {metricas.hoy.ok} | NO OK: {metricas.hoy.noOk} | Adultos: {metricas.hoy.adultos} | Menores: {metricas.hoy.menores}
              </div>
            </div>

            {/* Últimos 7 días */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>ÚLTIMOS 7 DÍAS</div>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <th style={{ textAlign: 'left', padding: '4px 8px' }}>Fecha</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px' }}>Total</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px' }}>OK</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px' }}>Adultos</th>
                    <th style={{ textAlign: 'center', padding: '4px 8px' }}>Menores</th>
                  </tr>
                </thead>
                <tbody>
                  {metricas.ultimosDias.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '8px', textAlign: 'center', color: '#666' }}>
                        No hay datos
                      </td>
                    </tr>
                  ) : (
                    metricas.ultimosDias.map((dia, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '4px 8px' }}>
                          {dia.fecha ? new Date(dia.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '—'}
                        </td>
                        <td style={{ textAlign: 'center', padding: '4px 8px' }}>{dia.total}</td>
                        <td style={{ textAlign: 'center', padding: '4px 8px' }}>{dia.ok}</td>
                        <td style={{ textAlign: 'center', padding: '4px 8px' }}>{dia.adultos}</td>
                        <td style={{ textAlign: 'center', padding: '4px 8px' }}>{dia.menores}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Últimos escaneos */}
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>ÚLTIMOS ESCANEOS</div>
              <div style={{ fontSize: 12, maxHeight: 200, overflowY: 'auto' }}>
                {metricas.ultimosEscaneos.length === 0 ? (
                  <div style={{ color: '#666' }}>No hay escaneos recientes</div>
                ) : (
                  metricas.ultimosEscaneos.map((escaneo, idx) => {
                    const adultosStr = escaneo.adultosUsados !== undefined ? `A: ${escaneo.adultosUsados}` : '';
                    const menoresStr = escaneo.menoresUsados !== undefined ? `M: ${escaneo.menoresUsados}` : '';
                    const personasStr = [adultosStr, menoresStr].filter(Boolean).join(' / ');
                    return (
                      <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>
                        {escaneo.hora || '—'} — <span style={{ color: escaneo.resultado === 'OK' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                          {escaneo.resultado === 'OK' ? 'OK' : 'NO OK'}
                        </span>
                        {personasStr && <span style={{ marginLeft: 8, fontSize: 11, color: '#666' }}>({personasStr})</span>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Bloque TOTAL PUEBLO */}
          {puebloId && (
            <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 4, marginTop: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>TOTAL PUEBLO</h2>

              {metricasPuebloError && (
                <div style={{ fontSize: 14, color: '#ef4444', marginBottom: 16 }}>
                  {metricasPuebloError}
                </div>
              )}

              {/* HOY */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>HOY</div>
                <div style={{ fontSize: 14 }}>
                  {metricasPueblo.hoy.total} intentos | OK: {metricasPueblo.hoy.ok} | NO OK: {metricasPueblo.hoy.noOk} | Adultos: {metricasPueblo.hoy.adultos} | Menores: {metricasPueblo.hoy.menores}
                </div>
              </div>

              {/* Últimos 7 días */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>ÚLTIMOS 7 DÍAS</div>
                <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #ddd' }}>
                      <th style={{ textAlign: 'left', padding: '4px 8px' }}>Fecha</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px' }}>Total</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px' }}>OK</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px' }}>Adultos</th>
                      <th style={{ textAlign: 'center', padding: '4px 8px' }}>Menores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricasPueblo.ultimosDias.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '8px', textAlign: 'center', color: '#666' }}>
                          No hay datos
                        </td>
                      </tr>
                    ) : (
                      metricasPueblo.ultimosDias.map((dia, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '4px 8px' }}>
                            {dia.fecha ? new Date(dia.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '—'}
                          </td>
                          <td style={{ textAlign: 'center', padding: '4px 8px' }}>{dia.total}</td>
                          <td style={{ textAlign: 'center', padding: '4px 8px' }}>{dia.ok}</td>
                          <td style={{ textAlign: 'center', padding: '4px 8px' }}>{dia.adultos}</td>
                          <td style={{ textAlign: 'center', padding: '4px 8px' }}>{dia.menores}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Últimos escaneos */}
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>ÚLTIMOS ESCANEOS</div>
                <div style={{ fontSize: 12, maxHeight: 200, overflowY: 'auto' }}>
                  {metricasPueblo.ultimosEscaneos.length === 0 ? (
                    <div style={{ color: '#666' }}>No hay escaneos recientes</div>
                  ) : (
                    metricasPueblo.ultimosEscaneos.map((escaneo, idx) => {
                      const adultosStr = escaneo.adultosUsados !== undefined ? `A: ${escaneo.adultosUsados}` : '';
                      const menoresStr = escaneo.menoresUsados !== undefined ? `M: ${escaneo.menoresUsados}` : '';
                      const personasStr = [adultosStr, menoresStr].filter(Boolean).join(' / ');
                      return (
                        <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid #eee' }}>
                          {escaneo.hora || '—'} — <span style={{ color: escaneo.resultado === 'OK' ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                            {escaneo.resultado === 'OK' ? 'OK' : 'NO OK'}
                          </span>
                          {personasStr && <span style={{ marginLeft: 8, fontSize: 11, color: '#666' }}>({personasStr})</span>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


