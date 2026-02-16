'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';

type Pueblo = {
  id: number;
  nombre: string;
  provincia?: string | null;
  comunidad?: string | null;
  slug: string;
};

type Suscripcion = {
  puebloId: number;
  tipo: 'NOTICIA' | 'EVENTO' | 'SEMAFORO' | 'METEO' | 'ALERTA_PUEBLO';
  enabled: boolean;
};

export default function NotificacionesPreferencias() {
  const t = useTranslations('notifications');

  const TIPOS: Array<{ key: 'NOTICIA' | 'EVENTO' | 'SEMAFORO' | 'METEO' | 'ALERTA_PUEBLO'; label: string }> = [
    { key: 'NOTICIA', label: t('news') },
    { key: 'EVENTO', label: t('events') },
    { key: 'SEMAFORO', label: t('semaforos') },
    { key: 'METEO', label: t('meteo') },
    { key: 'ALERTA_PUEBLO', label: t('alerts') },
  ];
  const [pueblos, setPueblos] = useState<Pueblo[]>([]);
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [selectAllStatus, setSelectAllStatus] = useState<{ tipo: string; ok: number; fallos: number } | null>(null);

  // Set de suscripciones activas: key = `${puebloId}:${tipo}`
  const susSet = useMemo(() => {
    const set = new Set<string>();
    suscripciones.forEach((s) => {
      if (s.enabled) {
        const key = `${s.puebloId}:${s.tipo}`;
        set.add(key);
      }
    });
    return set;
  }, [suscripciones]);

  // Estado local para actualización optimista
  const [estadoLocal, setEstadoLocal] = useState<Set<string>>(susSet);

  // Sincronizar estado local cuando cambien las suscripciones
  useEffect(() => {
    setEstadoLocal(susSet);
  }, [susSet]);

  // Cargar pueblos y suscripciones
  useEffect(() => {
    // Cargar pueblos (público)
    fetch('/api/pueblos')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        setPueblos(items);
      })
      .catch(() => setPueblos([]));

    // Cargar suscripciones del usuario
    fetch('/api/suscripciones/me')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any) => {
        const items = Array.isArray(data)
          ? data
          : Array.isArray((data as any)?.items)
            ? (data as any).items
            : [];
        setSuscripciones(items);
      })
      .catch(() => setSuscripciones([]));
  }, []);

  const pueblosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return pueblos;
    const term = searchTerm.toLowerCase();
    return pueblos.filter(
      (p) =>
        p.nombre.toLowerCase().includes(term) ||
        (p.provincia?.toLowerCase().includes(term) ?? false) ||
        (p.comunidad?.toLowerCase().includes(term) ?? false)
    );
  }, [pueblos, searchTerm]);

  async function handleToggle(puebloId: number, tipo: 'NOTICIA' | 'EVENTO' | 'SEMAFORO' | 'METEO' | 'ALERTA_PUEBLO') {
    const key = `${puebloId}:${tipo}`;
    const currentValue = estadoLocal.has(key);
    const newValue = !currentValue;

    // Actualización optimista
    setEstadoLocal((prev) => {
      const next = new Set(prev);
      if (newValue) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });

    setSaving((prev) => new Set(prev).add(key));
    setError(null);

    try {
      const res = await fetch('/api/suscripciones', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
          puebloId,
          tipo,
          enabled: newValue,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        setError(`${t('saveError')} ${text}`);
        // Revertir actualización optimista
        setEstadoLocal((prev) => {
          const next = new Set(prev);
          if (currentValue) {
            next.add(key);
          } else {
            next.delete(key);
          }
          return next;
        });
        return;
      }

      // Actualizar suscripciones desde el servidor
      const updated = await res.json();
      if (updated) {
        // Recargar suscripciones para mantener consistencia
        fetch('/api/suscripciones/me')
          .then((r) => (r.ok ? r.json() : []))
          .then((data: any) => {
            const items = Array.isArray(data)
              ? data
              : Array.isArray((data as any)?.items)
                ? (data as any).items
                : [];
            setSuscripciones(items);
          })
          .catch(() => {});
      }
    } catch (e: any) {
      setError(`${t('saveError')} ${e?.message ?? String(e)}`);
      // Revertir actualización optimista
      setEstadoLocal((prev) => {
        const next = new Set(prev);
        if (currentValue) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  async function handleSelectAll(tipo: 'NOTICIA' | 'EVENTO' | 'SEMAFORO' | 'METEO' | 'ALERTA_PUEBLO') {
    const allOn = pueblos.every((p) => estadoLocal.has(`${p.id}:${tipo}`));
    const targetEnabled = !allOn;

    // Actualización optimista: actualizar Set en memoria de golpe
    setEstadoLocal((prev) => {
      const next = new Set(prev);
      pueblos.forEach((p) => {
        const key = `${p.id}:${tipo}`;
        if (targetEnabled) {
          next.add(key);
        } else {
          next.delete(key);
        }
      });
      return next;
    });

    setError(null);
    setSelectAllStatus(null);
    const savingKeys = new Set<string>();
    pueblos.forEach((p) => {
      savingKeys.add(`${p.id}:${tipo}`);
    });
    setSaving((prev) => new Set([...prev, ...savingKeys]));

    try {
      // Disparar Promise.allSettled para PUT (upsert) por cada pueblo
      // Procesar en lotes de 15 para no saturar
      const BATCH_SIZE = 15;
      const batches: typeof pueblos[] = [];
      for (let i = 0; i < pueblos.length; i += BATCH_SIZE) {
        batches.push(pueblos.slice(i, i + BATCH_SIZE));
      }

      let totalOk = 0;
      let totalFallos = 0;

      for (const batch of batches) {
        const promises = batch.map((p) =>
          fetch('/api/suscripciones', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store',
            body: JSON.stringify({
              puebloId: p.id,
              tipo,
              enabled: targetEnabled,
            }),
          })
        );

        const results = await Promise.allSettled(promises);
        const ok = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length;
        const fallos = results.length - ok;
        totalOk += ok;
        totalFallos += fallos;
      }

      // Mostrar feedback
      setSelectAllStatus({ tipo, ok: totalOk, fallos: totalFallos });

      // Recargar suscripciones para mantener consistencia
      fetch('/api/suscripciones/me')
        .then((r) => (r.ok ? r.json() : []))
        .then((data: any) => {
          const items = Array.isArray(data)
            ? data
            : Array.isArray((data as any)?.items)
              ? (data as any).items
              : [];
          setSuscripciones(items);
        })
        .catch(() => {});

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setSelectAllStatus(null), 5000);
    } catch (e: any) {
      setError(`${t('saveError')} ${e?.message ?? String(e)}`);
      // Re-cargar suscripciones para dejar estado real
      fetch('/api/suscripciones/me')
        .then((r) => (r.ok ? r.json() : []))
        .then((data: any) => {
          const items = Array.isArray(data)
            ? data
            : Array.isArray((data as any)?.items)
              ? (data as any).items
              : [];
          setSuscripciones(items);
        })
        .catch(() => {});
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        savingKeys.forEach((key) => next.delete(key));
        return next;
      });
    }
  }

  return (
    <div className="p-4 border rounded space-y-4">
      <h2 className="font-medium mb-2">{t('preferences')}</h2>
      <p className="text-sm text-gray-600">
        {t('prefsDesc')}
      </p>

      {/* Select-all por tipo */}
      <div className="border-b pb-3 mb-3">
        <div className="text-sm font-medium mb-2">{t('selectAll')}</div>
        <div className="flex flex-wrap gap-3">
          {TIPOS.map((tipo) => {
            const allOn = pueblos.length > 0 && pueblos.every((p) => estadoLocal.has(`${p.id}:${tipo.key}`));
            const isSaving = Array.from(saving).some((key) => key.endsWith(`:${tipo.key}`));

            return (
              <button
                key={tipo.key}
                type="button"
                onClick={() => handleSelectAll(tipo.key)}
                disabled={isSaving || pueblos.length === 0}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50"
              >
                {isSaving ? t('saving') : allOn ? `${t('uncheck')} ${tipo.label}` : `${t('check')} ${tipo.label}`}
              </button>
            );
          })}
        </div>
        {selectAllStatus && (
          <div className="mt-2 text-sm text-gray-600">
            {t('doneOk')} {selectAllStatus.ok} {t('failures')} {selectAllStatus.fallos})
          </div>
        )}
      </div>

      <div>
        <label htmlFor="search" className="block text-sm font-medium mb-2">
          {t('searchVillage')}
        </label>
        <input
          id="search"
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="space-y-4">
        {pueblosFiltrados.map((pueblo) => (
          <div key={pueblo.id} className="border-b pb-4">
            <div className="font-semibold">{pueblo.nombre}</div>
            <div className="text-sm text-gray-600">
              {pueblo.provincia ?? ''}
              {pueblo.provincia && pueblo.comunidad ? ' / ' : ''}
              {pueblo.comunidad ?? ''}
            </div>

            <div className="mt-2 flex flex-wrap gap-4">
              {TIPOS.map((tipo) => {
                const key = `${pueblo.id}:${tipo.key}`;
                const isEnabled = estadoLocal.has(key);
                const isSaving = saving.has(key);

                return (
                  <label key={tipo.key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggle(pueblo.id, tipo.key)}
                      disabled={isSaving}
                      className="rounded"
                    />
                    <span>
                      {tipo.label}
                      {isSaving && <span className="text-gray-500 ml-1">({t('savingInline')})</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {pueblosFiltrados.length === 0 && (
        <p className="text-sm text-gray-600">{t('noVillagesFound')}</p>
      )}
    </div>
  );
}
