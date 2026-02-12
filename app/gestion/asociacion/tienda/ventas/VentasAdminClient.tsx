'use client';

import { useState } from 'react';
import Link from 'next/link';

type SalesRow = {
  orderId: number;
  orderNumber: string;
  fecha: string;
  cliente: string;
  email: string;
  producto: string;
  cantidad: number;
  precioUnit: number;
  baseImponibleProducto: number;
  ivaPercentProducto: number;
  ivaProducto: number;
  subtotalProducto: number;
  porteBase: number;
  porteIvaPercent: number;
  porteIva: number;
  porteTotal: number;
  totalPedido: number | null;
  totalBaseImponible: number | null;
  totalIva: number | null;
  exentoIva: boolean;
  zona: string;
  cupon: string;
  descuento: number;
};

type SalesReport = {
  from: string | null;
  to: string | null;
  totalOrders: number;
  rows: SalesRow[];
};

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '';
  return n.toFixed(2).replace('.', ',');
}

export default function VentasAdminClient() {
  const now = new Date();
  const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const today = now.toISOString().slice(0, 10);

  const [from, setFrom] = useState(firstDayOfMonth);
  const [to, setTo] = useState(today);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadReport() {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      const res = await fetch(`/api/admin/orders/sales-report?${qs.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setReport(data);
    } catch (e: any) {
      setError(e?.message ?? 'Error cargando informe');
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    window.open(`/api/admin/orders/sales-report/csv?${qs.toString()}`, '_blank');
  }

  // Agrupar por pedido para resumen
  const orderSummaries = report
    ? Object.values(
        report.rows.reduce<Record<string, {
          orderNumber: string;
          fecha: string;
          cliente: string;
          totalBase: number;
          totalIva: number;
          total: number;
          exento: boolean;
        }>>((acc, r) => {
          if (!acc[r.orderNumber]) {
            acc[r.orderNumber] = {
              orderNumber: r.orderNumber,
              fecha: r.fecha,
              cliente: r.cliente,
              totalBase: 0,
              totalIva: 0,
              total: 0,
              exento: r.exentoIva,
            };
          }
          if (r.totalPedido !== null) {
            acc[r.orderNumber].total = r.totalPedido;
            acc[r.orderNumber].totalBase = r.totalBaseImponible ?? 0;
            acc[r.orderNumber].totalIva = r.totalIva ?? 0;
          }
          return acc;
        }, {})
      )
    : [];

  // Totales globales
  const globalTotals = orderSummaries.reduce(
    (acc, o) => ({
      base: acc.base + o.totalBase,
      iva: acc.iva + o.totalIva,
      total: acc.total + o.total,
    }),
    { base: 0, iva: 0, total: 0 }
  );

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <Link
          href="/gestion/asociacion/tienda"
          className="mb-4 inline-block text-sm text-gray-600 hover:text-gray-900"
        >
          &larr; Volver a Tienda
        </Link>
        <h1 className="text-3xl font-bold">Informe de Ventas</h1>
        <p className="mt-2 text-gray-600">
          Desglose fiscal para contabilidad: base imponible, IVA, portes y totales.
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Desde</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Hasta</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={loadReport}
          disabled={loading}
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Consultar'}
        </button>
        {report && (
          <button
            onClick={downloadCsv}
            className="rounded-md border border-green-600 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
          >
            Descargar CSV
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {report && (
        <>
          {/* Resumen global */}
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500 uppercase">Pedidos</p>
              <p className="text-2xl font-bold">{report.totalOrders}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500 uppercase">Total Base Imponible</p>
              <p className="text-2xl font-bold">{fmt(globalTotals.base)} €</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500 uppercase">Total IVA</p>
              <p className="text-2xl font-bold">{fmt(globalTotals.iva)} €</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <p className="text-xs text-gray-500 uppercase">Total Cobrado</p>
              <p className="text-2xl font-bold">{fmt(globalTotals.total)} €</p>
            </div>
          </div>

          {/* Tabla detallada */}
          {report.rows.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
              No hay ventas en el periodo seleccionado.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-600">Pedido</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-600">Fecha</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-600">Producto</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-600">Cant.</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-600">Base Prod.</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-600">IVA %</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-600">IVA Prod.</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-600">Subtotal</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-600">Porte Base</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-600">Porte IVA</th>
                    <th className="px-3 py-2 text-right text-xs font-medium uppercase text-gray-600">Total</th>
                    <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-600">Exento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.rows.map((r, i) => {
                    const isFirstLine = r.totalPedido !== null;
                    return (
                      <tr key={i} className={isFirstLine ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="px-3 py-2 font-mono text-xs">
                          {isFirstLine ? r.orderNumber : ''}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-600">
                          {isFirstLine ? r.fecha : ''}
                        </td>
                        <td className="px-3 py-2 max-w-[200px] truncate" title={r.producto}>
                          {r.producto}
                        </td>
                        <td className="px-3 py-2 text-right">{r.cantidad}</td>
                        <td className="px-3 py-2 text-right">{fmt(r.baseImponibleProducto)}</td>
                        <td className="px-3 py-2 text-right">
                          <span className={`inline-block rounded px-1.5 py-0.5 text-xs ${
                            r.exentoIva ? 'bg-amber-100 text-amber-800' :
                            r.ivaPercentProducto === 4 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {r.exentoIva ? '0%' : `${r.ivaPercentProducto}%`}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">{fmt(r.ivaProducto)}</td>
                        <td className="px-3 py-2 text-right font-medium">{fmt(r.subtotalProducto)}</td>
                        <td className="px-3 py-2 text-right">
                          {r.porteBase > 0 ? fmt(r.porteBase) : ''}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {r.porteIva > 0 ? fmt(r.porteIva) : ''}
                        </td>
                        <td className="px-3 py-2 text-right font-bold">
                          {r.totalPedido !== null ? `${fmt(r.totalPedido)} €` : ''}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {r.exentoIva && isFirstLine ? (
                            <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                              Canarias
                            </span>
                          ) : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                {/* Fila de totales */}
                <tfoot className="border-t-2 border-gray-300 bg-gray-100">
                  <tr className="font-bold text-sm">
                    <td colSpan={4} className="px-3 py-3 text-right">TOTALES:</td>
                    <td className="px-3 py-3 text-right">{fmt(globalTotals.base)} €</td>
                    <td></td>
                    <td className="px-3 py-3 text-right">{fmt(globalTotals.iva)} €</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td className="px-3 py-3 text-right">{fmt(globalTotals.total)} €</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  );
}
