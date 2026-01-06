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

export default function ValidadorPage({ params }: { params: Promise<{ recursoId: string }> }) {
  const [recursoId, setRecursoId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('SCANNING');
  const [motivo, setMotivo] = useState<string | null>(null);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    params.then((p) => setRecursoId(p.recursoId));
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
      } catch (err: any) {
        console.error('Error iniciando escáner:', err);
        setStatus('ERROR');
        setMotivo('No se pudo acceder a la cámara');
        scanningRef.current = false;
      }
    }

    startScanning();

    return () => {
      if (scanner) {
        scanner
          .stop()
          .then(() => {
            scanner?.clear();
            scanningRef.current = false;
          })
          .catch(() => {
            scanningRef.current = false;
          });
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
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scanningRef.current = false;
      } catch (e) {
        // Ignorar error al parar
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
        }),
      });

      if (res.status !== 200) {
        // Cualquier status != 200 es ERROR
        setStatus('ERROR');
        setMotivo('Error del servidor');
        playBeepInvalid(); // Sonido de error
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.valido === true) {
          setStatus('VALID');
          setMotivo(null);
          playBeepValid(); // Sonido de válido
        } else {
          // 200 con valido:false es NO VÁLIDO (no ERROR)
          setStatus('INVALID');
          setMotivo(data.motivo || null);
          playBeepInvalid(); // Sonido de inválido
        }
      }
    } catch (e: any) {
      setStatus('ERROR');
      setMotivo('Error de red');
      playBeepInvalid(); // Sonido de error
    }

    // Reset después de 2 segundos
    setTimeout(() => {
      setStatus('SCANNING');
      setMotivo(null);
      isProcessingRef.current = false;
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
    } catch (err) {
      console.error('Error reiniciando escáner:', err);
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
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Validador</h1>
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
      <div style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
        Recurso ID: {recursoId}
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
        <div style={{ textAlign: 'center', fontSize: 48, fontWeight: 700, color: '#22c55e' }}>
          VÁLIDO
        </div>
      )}

      {status === 'INVALID' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>
            NO VÁLIDO
          </div>
          {motivo && (
            <div style={{ fontSize: 14, color: '#666' }}>{motivo}</div>
          )}
        </div>
      )}

      {status === 'ERROR' && (
        <div style={{ textAlign: 'center', fontSize: 48, fontWeight: 700, color: '#ef4444' }}>
          ERROR
        </div>
      )}
    </div>
  );
}


