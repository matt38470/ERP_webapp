import Link from 'next/link'

export default function Dashboard() {
  const kpis = [
    { label: 'Articles actifs', value: '248' },
    { label: 'Lots suivis', value: '391' },
    { label: 'Stock disponible', value: '18 420' },
    { label: 'BL à facturer', value: '12' },
  ]

  const recentMovements = [
    { ref: 'MVT-00081', type: 'RECEIPT', item: 'CL-42', lot: 'LOT-CL-001', qty: '+5 000', motif: 'Inventaire initial' },
    { ref: 'MVT-00082', type: 'ISSUE', item: 'CL-42', lot: 'LOT-CL-001', qty: '-120', motif: 'Commande CC-0001' },
    { ref: 'MVT-00083', type: 'ISSUE', item: 'VIS-304', lot: 'LOT-VIS-001', qty: '-400', motif: 'Commande CC-0002' },
    { ref: 'MVT-00084', type: 'ADJUSTMENT', item: 'VIS-304', lot: 'LOT-VIS-001', qty: '+3', motif: 'Correction inventaire' },
  ]

  const alerts = [
    { level: 'warn', msg: 'Rupture imminente sur VIS-304 (stock < seuil)' },
    { level: 'warn', msg: '3 BL non facturés depuis + de 7 jours' },
    { level: 'info', msg: '2 commandes fournisseurs en attente de réception' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', padding: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 16 }}>📦 ERP Stock</div>
        {[['/', '🏠 Dashboard'], ['/articles', '🗂 Articles'], ['/lots', '📋 Lots'], ['/mouvements', '🔄 Mouvements'], ['/stock', '📊 Stock temps réel'], ['/commandes', '📝 Commandes'], ['/documents', '📄 BL / Factures'], ['/previsionnel', '📈 Prévisionnel']].map(([href, label]) => (
          <Link key={href} href={href} style={{ padding: '10px 12px', borderRadius: 10, textDecoration: 'none', color: 'var(--muted)', fontWeight: 600, display: 'block' }}>
            {label}
          </Link>
        ))}
      </aside>

      {/* Main */}
      <main style={{ padding: 32, display: 'grid', gap: 24 }}>
        <header>
          <h1 style={{ fontSize: 36, fontWeight: 800 }}>Dashboard</h1>
          <p style={{ color: 'var(--muted)', marginTop: 4 }}>Vue opérationnelle — stock, mouvements et alertes</p>
        </header>

        {/* KPIs */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)' }}>{k.label}</div>
              <div style={{ fontSize: 34, fontWeight: 800, marginTop: 4 }}>{k.value}</div>
            </div>
          ))}
        </section>

        {/* Journal + Alertes */}
        <section style={{ display: 'grid', gridTemplateColumns: '1.4fr .6fr', gap: 16 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <h2 style={{ marginBottom: 16 }}>Journal des mouvements</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead><tr>{['Référence', 'Type', 'Article', 'Lot', 'Qté', 'Motif'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid var(--border)', color: 'var(--muted)', fontSize: 12, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
              <tbody>{recentMovements.map(m => <tr key={m.ref}><td style={{ padding: '12px 6px', borderBottom: '1px solid var(--border)' }}>{m.ref}</td><td style={{ padding: '12px 6px', borderBottom: '1px solid var(--border)' }}><span style={{ background: '#cedcd8', color: '#0c4e54', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{m.type}</span></td><td style={{ padding: '12px 6px', borderBottom: '1px solid var(--border)' }}>{m.item}</td><td style={{ padding: '12px 6px', borderBottom: '1px solid var(--border)' }}>{m.lot}</td><td style={{ padding: '12px 6px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>{m.qty}</td><td style={{ padding: '12px 6px', borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>{m.motif}</td></tr>)}</tbody>
            </table>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
            <h2 style={{ marginBottom: 16 }}>Alertes</h2>
            {alerts.map((a, i) => <div key={i} style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 12, marginBottom: 10, background: a.level === 'warn' ? '#fff7f0' : '#f0f8ff', fontSize: 14 }}>{a.msg}</div>)}
          </div>
        </section>
      </main>
    </div>
  )
}
