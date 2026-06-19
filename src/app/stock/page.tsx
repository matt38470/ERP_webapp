export default function Stock() {
  const rows = [
    { sku: 'CL-42', name: 'Clou 42mm', lot: 'LOT-CL-001', physique: 4880, reserve: 200, dispo: 4680, alerte: false },
    { sku: 'VIS-304', name: 'Vis 30x4mm', lot: 'LOT-VIS-001', physique: 2803, reserve: 500, dispo: 2303, alerte: true },
    { sku: 'SET-AX', name: 'Set Assemblage AX', lot: '—', physique: 740, reserve: 80, dispo: 660, alerte: false },
  ]
  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Stock temps réel</h1>
      <p style={{ color: '#6c6a65', marginBottom: 24 }}>Stock calculé à partir du journal de mouvements — physique, réservé et disponible.</p>
      <div style={{ background: '#fbfbf9', border: '1px solid #d4d1ca', borderRadius: 16, padding: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr>{['SKU', 'Article', 'Lot', 'Stock physique', 'Réservé', 'Disponible', 'Alerte'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #d4d1ca', color: '#6c6a65', fontSize: 12, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
          <tbody>{rows.map(r => <tr key={r.sku}>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5', fontWeight: 700 }}>{r.sku}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5' }}>{r.name}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5', color: '#6c6a65' }}>{r.lot}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5' }}>{r.physique.toLocaleString()}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5', color: '#964219' }}>{r.reserve.toLocaleString()}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5', fontWeight: 800, color: '#437a22' }}>{r.dispo.toLocaleString()}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5' }}>{r.alerte ? <span style={{ background: '#ffe8db', color: '#964219', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>⚠ Rupture</span> : <span style={{ background: '#dff0d5', color: '#437a22', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>OK</span>}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </main>
  )
}
