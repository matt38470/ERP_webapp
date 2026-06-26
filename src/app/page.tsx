'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type KpiData = {
  articlesActifs: number
  lotsSuivis: number
  stockDisponible: number
  blAFacturer: number
  clientsActifs: number
  fournisseursActifs: number
  commandesOuvertes: number
  commandesFournOuvertes: number
}

type Movement = {
  id: number
  referenceType: string
  referenceId: string
  type: string
  quantity: string
  movedAt: string
  item: { code: string }
  lot: { lotNumber: string } | null
  reason: { label: string } | null
}

type Alert = { level: 'warn' | 'info' | 'danger'; msg: string; href?: string }

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  RECEIPT:       { bg: '#d1fae5', color: '#065f46' },
  ISSUE:         { bg: '#fee2e2', color: '#991b1b' },
  ADJUSTMENT:    { bg: '#fef3c7', color: '#92400e' },
  TRANSFER_IN:   { bg: '#dbeafe', color: '#1e40af' },
  TRANSFER_OUT:  { bg: '#ede9fe', color: '#4c1d95' },
  KIT_BUILD:     { bg: '#f0fdf4', color: '#14532d' },
  KIT_BREAK:     { bg: '#fdf2f8', color: '#701a75' },
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<KpiData | null>(null)
  const [movements, setMovements] = useState<Movement[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        setKpis(d.kpis)
        setMovements(d.recentMovements ?? [])
        setAlerts(d.alerts ?? [])
      })
      .catch(() => {})
  }, [])

  const kpiCards = kpis ? [
    { label: 'Articles actifs',          value: kpis.articlesActifs,          href: '/articles',     color: '#0c4e54' },
    { label: 'Lots suivis',               value: kpis.lotsSuivis,               href: '/lots',         color: '#1e40af' },
    { label: 'Stock disponible',          value: kpis.stockDisponible.toLocaleString('fr-FR'), href: '/stock', color: '#065f46' },
    { label: 'Clients actifs',            value: kpis.clientsActifs,           href: '/clients',      color: '#7c3aed' },
    { label: 'Fournisseurs',             value: kpis.fournisseursActifs,       href: '/fournisseurs', color: '#b45309' },
    { label: 'Cdes client ouvertes',      value: kpis.commandesOuvertes,       href: '/commandes',    color: '#0369a1' },
    { label: 'Cdes fourn. ouvertes',      value: kpis.commandesFournOuvertes,  href: '/fournisseurs', color: '#be185d' },
    { label: 'BL à facturer',             value: kpis.blAFacturer,             href: '/documents',    color: '#b91c1c' },
  ] : []

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Vue opérationnelle — stock, mouvements et alertes</p>
      </header>

      {/* KPIs */}
      {kpis ? (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {kpiCards.map(k => (
            <Link key={k.label} href={k.href}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow no-underline block">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{k.label}</div>
              <div className="text-3xl font-black" style={{ color: k.color }}>{k.value}</div>
            </Link>
          ))}
        </section>
      ) : (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="h-3 bg-gray-100 rounded w-3/4 mb-3 animate-pulse" />
              <div className="h-8 bg-gray-100 rounded w-1/2 animate-pulse" />
            </div>
          ))}
        </section>
      )}

      {/* Journal + Alertes */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mouvements récents */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800">Derniers mouvements</h2>
            <Link href="/mouvements" className="text-sm text-teal-700 hover:underline">Voir tout →</Link>
          </div>
          {movements.length === 0 ? (
            <p className="text-sm text-gray-400">Aucun mouvement enregistré.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Référence', 'Type', 'Article', 'Lot', 'Qté', 'Motif', 'Date'].map(h => (
                      <th key={h} className="text-left pb-2 text-xs text-gray-400 uppercase font-semibold pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {movements.map(m => {
                    const tc = TYPE_COLORS[m.type] ?? { bg: '#f3f4f6', color: '#374151' }
                    const qty = Number(m.quantity)
                    const isEntry = ['RECEIPT', 'TRANSFER_IN', 'KIT_BREAK', 'ADJUSTMENT'].includes(m.type)
                    return (
                      <tr key={m.id} className="hover:bg-gray-50">
                        <td className="py-2 pr-3 font-mono text-xs">{m.referenceType}-{m.referenceId}</td>
                        <td className="py-2 pr-3">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: tc.bg, color: tc.color }}>{m.type}</span>
                        </td>
                        <td className="py-2 pr-3 font-medium">{m.item.code}</td>
                        <td className="py-2 pr-3 text-gray-500">{m.lot?.lotNumber ?? '—'}</td>
                        <td className={`py-2 pr-3 font-bold tabular-nums ${isEntry ? 'text-green-700' : 'text-red-600'}`}>
                          {isEntry ? '+' : '-'}{Math.abs(qty).toLocaleString('fr-FR')}
                        </td>
                        <td className="py-2 pr-3 text-gray-400">{m.reason?.label ?? '—'}</td>
                        <td className="py-2 text-gray-400 text-xs whitespace-nowrap">{new Date(m.movedAt).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alertes */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-gray-800 mb-4">Alertes</h2>
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-400">✅ Aucune alerte.</p>
          ) : (
            <div className="space-y-3">
              {alerts.map((a, i) => (
                <div key={i} className={`p-3 rounded-lg text-sm border ${
                  a.level === 'danger' ? 'bg-red-50 border-red-200 text-red-800' :
                  a.level === 'warn'   ? 'bg-orange-50 border-orange-200 text-orange-800' :
                                         'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                  {a.href ? <Link href={a.href} className="hover:underline">{a.msg}</Link> : a.msg}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
