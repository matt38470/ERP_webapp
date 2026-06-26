'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type KpiData = {
  articlesActifs: number
  lotsSuivis: number
  stockDisponible: number
  clientsActifs: number
  fournisseursActifs: number
  commandesOuvertes: number
  commandesFournOuvertes: number
  blAFacturer: number
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
  RECEIPT:      { bg: '#d1fae5', color: '#065f46' },
  ISSUE:        { bg: '#fee2e2', color: '#991b1b' },
  ADJUSTMENT:   { bg: '#fef3c7', color: '#92400e' },
  TRANSFER_IN:  { bg: '#dbeafe', color: '#1e40af' },
  TRANSFER_OUT: { bg: '#ede9fe', color: '#4c1d95' },
  KIT_BUILD:    { bg: '#f0fdf4', color: '#14532d' },
  KIT_BREAK:    { bg: '#fdf2f8', color: '#701a75' },
}

const ALERT_STYLE: Record<string, { bg: string; border: string; color: string }> = {
  danger: { bg: '#fff1f2', border: '#fecdd3', color: '#9f1239' },
  warn:   { bg: '#fff7ed', border: '#fed7aa', color: '#9a3412' },
  info:   { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af' },
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
    { label: 'Articles actifs',       value: kpis.articlesActifs,                                  href: '/articles',     accent: '#0c4e54', icon: '📦' },
    { label: 'Lots suivis',            value: kpis.lotsSuivis,                                      href: '/lots',         accent: '#1e40af', icon: '🗃️' },
    { label: 'Stock disponible',       value: Number(kpis.stockDisponible).toLocaleString('fr-FR'),  href: '/stock',        accent: '#065f46', icon: '📊' },
    { label: 'Clients actifs',         value: kpis.clientsActifs,                                   href: '/clients',      accent: '#7c3aed', icon: '👤' },
    { label: 'Fournisseurs',           value: kpis.fournisseursActifs,                              href: '/fournisseurs', accent: '#b45309', icon: '🏭' },
    { label: 'Cdes client ouvertes',   value: kpis.commandesOuvertes,                               href: '/commandes',    accent: '#0369a1', icon: '🛒' },
    { label: 'Cdes fourn. ouvertes',   value: kpis.commandesFournOuvertes,                          href: '/fournisseurs', accent: '#be185d', icon: '📋' },
    { label: 'BL à facturer',          value: kpis.blAFacturer,                                     href: '/documents',    accent: '#b91c1c', icon: '📄' },
  ] : []

  return (
    <main style={{ padding: 32, maxWidth: 1300, margin: '0 auto' }}>

      {/* Header */}
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, margin: 0, color: '#111827' }}>Dashboard</h1>
        <p style={{ color: '#6b7280', marginTop: 6, fontSize: 15, margin: '6px 0 0' }}>Vue opérationnelle — stock, mouvements et alertes</p>
      </header>

      {/* KPIs */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {kpis
          ? kpiCards.map(k => (
              <Link key={k.label} href={k.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 14,
                  padding: '18px 20px',
                  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                    <span style={{ fontSize: 17 }}>{k.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af' }}>{k.label}</span>
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 900, color: k.accent, lineHeight: 1 }}>{k.value}</div>
                </div>
              </Link>
            ))
          : Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ height: 11, background: '#f3f4f6', borderRadius: 4, width: '55%', marginBottom: 14 }} />
                <div style={{ height: 34, background: '#f3f4f6', borderRadius: 4, width: '35%' }} />
              </div>
            ))
        }
      </section>

      {/* Journal + Alertes */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* Mouvements */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>Journal des mouvements</h2>
            <Link href="/mouvements" style={{ fontSize: 13, color: '#0c4e54', textDecoration: 'none', fontWeight: 600 }}>Voir tout →</Link>
          </div>

          {movements.length === 0
            ? <p style={{ color: '#9ca3af', fontSize: 14 }}>Aucun mouvement enregistré.</p>
            : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      {['Référence', 'Type', 'Article', 'Lot', 'Qté', 'Motif', 'Date'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0 10px 12px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9ca3af', borderBottom: '1px solid #f3f4f6' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map(m => {
                      const tc = TYPE_COLORS[m.type] ?? { bg: '#f3f4f6', color: '#374151' }
                      const qty = Number(m.quantity)
                      const isEntry = ['RECEIPT', 'TRANSFER_IN', 'KIT_BREAK'].includes(m.type) || (m.type === 'ADJUSTMENT' && qty >= 0)
                      return (
                        <tr key={m.id} style={{ borderBottom: '1px solid #f9fafb' }}>
                          <td style={{ padding: '11px 10px', fontFamily: 'monospace', fontSize: 12, color: '#374151' }}>{m.referenceType}-{m.referenceId}</td>
                          <td style={{ padding: '11px 10px' }}>
                            <span style={{ background: tc.bg, color: tc.color, padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{m.type}</span>
                          </td>
                          <td style={{ padding: '11px 10px', fontWeight: 600, color: '#111827' }}>{m.item.code}</td>
                          <td style={{ padding: '11px 10px', color: '#6b7280' }}>{m.lot?.lotNumber ?? '—'}</td>
                          <td style={{ padding: '11px 10px', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: isEntry ? '#065f46' : '#991b1b' }}>
                            {isEntry ? '+' : '-'}{Math.abs(qty).toLocaleString('fr-FR')}
                          </td>
                          <td style={{ padding: '11px 10px', color: '#9ca3af' }}>{m.reason?.label ?? '—'}</td>
                          <td style={{ padding: '11px 10px', color: '#9ca3af', fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(m.movedAt).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>

        {/* Alertes */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,.05)' }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 700, color: '#111827' }}>Alertes</h2>
          {alerts.length === 0
            ? <p style={{ color: '#9ca3af', fontSize: 14 }}>✅ Aucune alerte active.</p>
            : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {alerts.map((a, i) => {
                  const s = ALERT_STYLE[a.level] ?? ALERT_STYLE.info
                  return (
                    <div key={i} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '11px 14px', fontSize: 13, color: s.color, lineHeight: 1.5 }}>
                      {a.href
                        ? <Link href={a.href} style={{ color: s.color, textDecoration: 'none', fontWeight: 500 }}>{a.msg}</Link>
                        : <span style={{ fontWeight: 500 }}>{a.msg}</span>
                      }
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>
      </section>
    </main>
  )
}
