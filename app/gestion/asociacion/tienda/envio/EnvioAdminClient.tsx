'use client';

import { useEffect, useState, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ShippingConfig {
  id: number;
  freeShippingThreshold: number | string;
  freeShippingMethodId: number | null;
  taraKg: number;
  defaultWidth: number;
  defaultHeight: number;
  defaultLength: number;
}

interface ShippingZone {
  id: number;
  nombre: string;
  cpPrefixes: string[];
  activo: boolean;
  orden: number;
  _count?: { tarifas: number };
}

interface ShippingTariff {
  id: number;
  zoneId: number;
  pesoMinKg: number;
  pesoMaxKg: number;
  precioPvp: number | string;
  sendcloudMethodId: number | null;
  activo: boolean;
  zone?: { id: number; nombre: string };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function EnvioAdminClient() {
  // Config
  const [config, setConfig] = useState<ShippingConfig | null>(null);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState('');

  // Zones
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [newZone, setNewZone] = useState({ nombre: '', cpPrefixes: '', orden: 0 });
  const [editingZone, setEditingZone] = useState<number | null>(null);
  const [editZoneData, setEditZoneData] = useState({ nombre: '', cpPrefixes: '', orden: 0, activo: true });

  // Tariffs
  const [tariffs, setTariffs] = useState<ShippingTariff[]>([]);
  const [newTariff, setNewTariff] = useState({
    zoneId: 0,
    pesoMinKg: 0,
    pesoMaxKg: 0,
    precioPvp: 0,
    sendcloudMethodId: '',
  });

  const [loading, setLoading] = useState(true);

  // ─── Fetch helpers ──────────────────────────────────────────────────

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/shipping/config', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) setConfig(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchZones = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/shipping/zones', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) setZones(await res.json());
    } catch { /* ignore */ }
  }, []);

  const fetchTariffs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/shipping/tariffs', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (res.ok) setTariffs(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([fetchConfig(), fetchZones(), fetchTariffs()]).finally(() =>
      setLoading(false),
    );
  }, [fetchConfig, fetchZones, fetchTariffs]);

  // ─── Config handlers ───────────────────────────────────────────────

  const saveConfig = async () => {
    if (!config) return;
    setConfigSaving(true);
    setConfigMsg('');
    try {
      const res = await fetch('/api/admin/shipping/config', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          freeShippingThreshold: Number(config.freeShippingThreshold),
          freeShippingMethodId: config.freeShippingMethodId || null,
          taraKg: Number(config.taraKg),
          defaultWidth: Number(config.defaultWidth),
          defaultHeight: Number(config.defaultHeight),
          defaultLength: Number(config.defaultLength),
        }),
      });
      if (res.ok) {
        setConfig(await res.json());
        setConfigMsg('Guardado');
      } else {
        setConfigMsg('Error al guardar');
      }
    } catch {
      setConfigMsg('Error al guardar');
    }
    setConfigSaving(false);
  };

  // ─── Zone handlers ─────────────────────────────────────────────────

  const addZone = async () => {
    if (!newZone.nombre.trim()) return;
    const cpPrefixes = newZone.cpPrefixes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch('/api/admin/shipping/zones', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: newZone.nombre, cpPrefixes, orden: newZone.orden }),
    });
    if (res.ok) {
      setNewZone({ nombre: '', cpPrefixes: '', orden: 0 });
      fetchZones();
    }
  };

  const startEditZone = (z: ShippingZone) => {
    setEditingZone(z.id);
    setEditZoneData({
      nombre: z.nombre,
      cpPrefixes: z.cpPrefixes.join(', '),
      orden: z.orden,
      activo: z.activo,
    });
  };

  const saveEditZone = async () => {
    if (editingZone == null) return;
    const cpPrefixes = editZoneData.cpPrefixes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch(`/api/admin/shipping/zones/${editingZone}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: editZoneData.nombre,
        cpPrefixes,
        orden: editZoneData.orden,
        activo: editZoneData.activo,
      }),
    });
    if (res.ok) {
      setEditingZone(null);
      fetchZones();
    }
  };

  const deleteZone = async (id: number) => {
    if (!confirm('Eliminar esta zona? Se eliminaran sus tarifas asociadas.')) return;
    const res = await fetch(`/api/admin/shipping/zones/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      fetchZones();
      fetchTariffs();
    }
  };

  // ─── Tariff handlers ───────────────────────────────────────────────

  const addTariff = async () => {
    if (!newTariff.zoneId) return;
    const res = await fetch('/api/admin/shipping/tariffs', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zoneId: Number(newTariff.zoneId),
        pesoMinKg: Number(newTariff.pesoMinKg),
        pesoMaxKg: Number(newTariff.pesoMaxKg),
        precioPvp: Number(newTariff.precioPvp),
        sendcloudMethodId: newTariff.sendcloudMethodId
          ? Number(newTariff.sendcloudMethodId)
          : null,
      }),
    });
    if (res.ok) {
      setNewTariff({
        zoneId: newTariff.zoneId,
        pesoMinKg: 0,
        pesoMaxKg: 0,
        precioPvp: 0,
        sendcloudMethodId: '',
      });
      fetchTariffs();
    }
  };

  const deleteTariff = async (id: number) => {
    if (!confirm('Eliminar esta tarifa?')) return;
    const res = await fetch(`/api/admin/shipping/tariffs/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) fetchTariffs();
  };

  // ─── Render ─────────────────────────────────────────────────────────

  if (loading) {
    return <p className="text-gray-500">Cargando configuracion de envio...</p>;
  }

  return (
    <div className="space-y-10">
      {/* ── 1. Configuración General ─────────────────────────────────── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Configuracion General</h2>
        {config && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Umbral envio gratis (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                value={config.freeShippingThreshold}
                onChange={(e) =>
                  setConfig({ ...config, freeShippingThreshold: e.target.value })
                }
                className="w-full rounded-lg border px-3 py-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                Si el carrito supera este importe, el envio es gratuito
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ID metodo SendCloud (envio gratis)
              </label>
              <input
                type="number"
                value={config.freeShippingMethodId ?? ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    freeShippingMethodId: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Ej: 8"
              />
              <p className="mt-1 text-xs text-gray-500">
                Metodo de transporte a usar cuando el envio es gratis
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tara embalaje (kg)
              </label>
              <input
                type="number"
                step="0.01"
                value={config.taraKg}
                onChange={(e) =>
                  setConfig({ ...config, taraKg: Number(e.target.value) })
                }
                className="w-full rounded-lg border px-3 py-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                Peso del sobre/embalaje que se suma al peso total
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Ancho por defecto (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={config.defaultWidth}
                onChange={(e) =>
                  setConfig({ ...config, defaultWidth: Number(e.target.value) })
                }
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Alto por defecto (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={config.defaultHeight}
                onChange={(e) =>
                  setConfig({ ...config, defaultHeight: Number(e.target.value) })
                }
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Largo por defecto (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={config.defaultLength}
                onChange={(e) =>
                  setConfig({ ...config, defaultLength: Number(e.target.value) })
                }
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={saveConfig}
            disabled={configSaving}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {configSaving ? 'Guardando...' : 'Guardar configuracion'}
          </button>
          {configMsg && (
            <span
              className={`text-sm ${configMsg === 'Guardado' ? 'text-green-600' : 'text-red-600'}`}
            >
              {configMsg}
            </span>
          )}
        </div>
      </section>

      {/* ── 2. Zonas de Envío ────────────────────────────────────────── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Zonas de Envio</h2>
        <p className="mb-4 text-sm text-gray-500">
          Cada zona agrupa prefijos de codigo postal (los 2 primeros digitos). 
          Ejemplo: Peninsula usa 01-50, Baleares usa 07, etc.
        </p>

        {/* Tabla de zonas */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Prefijos CP</th>
                <th className="px-3 py-2 font-medium">Orden</th>
                <th className="px-3 py-2 font-medium">Activa</th>
                <th className="px-3 py-2 font-medium">Tarifas</th>
                <th className="px-3 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {zones.map((z) => (
                <tr key={z.id}>
                  {editingZone === z.id ? (
                    <>
                      <td className="px-3 py-2">
                        <input
                          value={editZoneData.nombre}
                          onChange={(e) =>
                            setEditZoneData({ ...editZoneData, nombre: e.target.value })
                          }
                          className="w-full rounded border px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={editZoneData.cpPrefixes}
                          onChange={(e) =>
                            setEditZoneData({
                              ...editZoneData,
                              cpPrefixes: e.target.value,
                            })
                          }
                          className="w-full rounded border px-2 py-1 text-sm"
                          placeholder="01, 02, 03..."
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={editZoneData.orden}
                          onChange={(e) =>
                            setEditZoneData({
                              ...editZoneData,
                              orden: Number(e.target.value),
                            })
                          }
                          className="w-16 rounded border px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={editZoneData.activo}
                          onChange={(e) =>
                            setEditZoneData({
                              ...editZoneData,
                              activo: e.target.checked,
                            })
                          }
                        />
                      </td>
                      <td className="px-3 py-2">-</td>
                      <td className="space-x-2 px-3 py-2">
                        <button
                          onClick={saveEditZone}
                          className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingZone(null)}
                          className="rounded bg-gray-400 px-2 py-1 text-xs text-white hover:bg-gray-500"
                        >
                          Cancelar
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2 font-medium">{z.nombre}</td>
                      <td className="max-w-xs truncate px-3 py-2 text-xs text-gray-600">
                        {z.cpPrefixes.join(', ')}
                      </td>
                      <td className="px-3 py-2">{z.orden}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            z.activo
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {z.activo ? 'Si' : 'No'}
                        </span>
                      </td>
                      <td className="px-3 py-2">{z._count?.tarifas ?? 0}</td>
                      <td className="space-x-2 px-3 py-2">
                        <button
                          onClick={() => startEditZone(z)}
                          className="rounded bg-blue-500 px-2 py-1 text-xs text-white hover:bg-blue-600"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => deleteZone(z.id)}
                          className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Añadir zona */}
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Nombre</label>
            <input
              value={newZone.nombre}
              onChange={(e) => setNewZone({ ...newZone, nombre: e.target.value })}
              className="rounded border px-2 py-1 text-sm"
              placeholder="Ej: Canarias"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Prefijos CP (separados por coma)
            </label>
            <input
              value={newZone.cpPrefixes}
              onChange={(e) => setNewZone({ ...newZone, cpPrefixes: e.target.value })}
              className="rounded border px-2 py-1 text-sm"
              placeholder="35, 38"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Orden</label>
            <input
              type="number"
              value={newZone.orden}
              onChange={(e) => setNewZone({ ...newZone, orden: Number(e.target.value) })}
              className="w-16 rounded border px-2 py-1 text-sm"
            />
          </div>
          <button
            onClick={addZone}
            className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Anadir zona
          </button>
        </div>
      </section>

      {/* ── 3. Tabla de Tarifas ──────────────────────────────────────── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Tarifas de Envio</h2>
        <p className="mb-4 text-sm text-gray-500">
          Define el precio de envio (PVP) para cada zona segun el rango de peso del paquete.
          El sistema buscara la tarifa donde pesoMin &le; peso total &lt; pesoMax.
        </p>

        {/* Tarifas agrupadas por zona */}
        {zones.map((z) => {
          const zoneTariffs = tariffs.filter((t) => t.zoneId === z.id);
          return (
            <div key={z.id} className="mb-6">
              <h3 className="mb-2 text-lg font-medium text-gray-800">
                {z.nombre}
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({zoneTariffs.length} tarifa{zoneTariffs.length !== 1 ? 's' : ''})
                </span>
              </h3>
              {zoneTariffs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 font-medium">Peso min (kg)</th>
                        <th className="px-3 py-2 font-medium">Peso max (kg)</th>
                        <th className="px-3 py-2 font-medium">Precio PVP (EUR)</th>
                        <th className="px-3 py-2 font-medium">ID metodo SC</th>
                        <th className="px-3 py-2 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {zoneTariffs.map((t) => (
                        <tr key={t.id}>
                          <td className="px-3 py-2">{t.pesoMinKg}</td>
                          <td className="px-3 py-2">{t.pesoMaxKg}</td>
                          <td className="px-3 py-2 font-medium">
                            {Number(t.precioPvp).toFixed(2)} EUR
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {t.sendcloudMethodId ?? '-'}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => deleteTariff(t.id)}
                              className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm italic text-gray-400">
                  Sin tarifas. Anade una abajo.
                </p>
              )}
            </div>
          );
        })}

        {/* Añadir tarifa */}
        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Zona</label>
            <select
              value={newTariff.zoneId}
              onChange={(e) =>
                setNewTariff({ ...newTariff, zoneId: Number(e.target.value) })
              }
              className="rounded border px-2 py-1 text-sm"
            >
              <option value={0}>-- Seleccionar --</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Peso min (kg)
            </label>
            <input
              type="number"
              step="0.01"
              value={newTariff.pesoMinKg}
              onChange={(e) =>
                setNewTariff({ ...newTariff, pesoMinKg: Number(e.target.value) })
              }
              className="w-24 rounded border px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Peso max (kg)
            </label>
            <input
              type="number"
              step="0.01"
              value={newTariff.pesoMaxKg}
              onChange={(e) =>
                setNewTariff({ ...newTariff, pesoMaxKg: Number(e.target.value) })
              }
              className="w-24 rounded border px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Precio PVP (EUR)
            </label>
            <input
              type="number"
              step="0.01"
              value={newTariff.precioPvp}
              onChange={(e) =>
                setNewTariff({ ...newTariff, precioPvp: Number(e.target.value) })
              }
              className="w-24 rounded border px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              ID metodo SC
            </label>
            <input
              type="number"
              value={newTariff.sendcloudMethodId}
              onChange={(e) =>
                setNewTariff({ ...newTariff, sendcloudMethodId: e.target.value })
              }
              className="w-20 rounded border px-2 py-1 text-sm"
              placeholder="Opcional"
            />
          </div>
          <button
            onClick={addTariff}
            className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
          >
            Anadir tarifa
          </button>
        </div>
      </section>

      {/* ── Info box ─────────────────────────────────────────────────── */}
      <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
        <h3 className="mb-2 font-semibold text-blue-900">Como funciona</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-blue-800">
          <li>
            Al hacer checkout, se suma el peso de todos los productos del carrito + la tara del embalaje.
          </li>
          <li>
            Si el importe total del carrito &ge; el umbral de envio gratis, el envio es 0 EUR 
            y se usa el metodo de envio gratis de SendCloud.
          </li>
          <li>
            Si no, se detecta la zona del cliente por su codigo postal (2 primeros digitos) 
            y se busca la tarifa cuyo rango de peso incluya el peso total.
          </li>
          <li>
            Si un producto no tiene peso definido, se estiman 0.5 kg por unidad.
          </li>
          <li>
            Si un producto no tiene dimensiones, se usan las dimensiones por defecto (sobre).
          </li>
        </ul>
      </section>
    </div>
  );
}
