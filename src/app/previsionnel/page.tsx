export default function Previsionnel() {
  const rows = [
    { mois: 'Juil 2026', entrees: '8 400', sorties: '6 200', solde: '+2 200', tresorerie: '+42 000 €' },
    { mois: 'Août 2026', entrees: '5 000', sorties: '7 100', solde: '-2 100', tresorerie: '-18 000 €' },
    { mois: 'Sept 2026', entrees: '9 200', sorties: '8 400', solde: '+800', tresorerie: '+12 000 €' },
  ]
  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Prévisionnel</h1>
      <p style={{ color: '#6c6a65', marginBottom: 24 }}>Flux entrant / sortant prévisionnels à 3 mois et impact trésorerie.</p>
      <div style={{ background: '#fbfbf9', border: '1px solid #d4d1ca', borderRadius: 16, padding: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr>{['Mois', 'Entrées (pcs)', 'Sorties (pcs)', 'Solde stock', 'Impact trésorerie'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #d4d1ca', color: '#6c6a65', fontSize: 12, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
          <tbody>{rows.map(r => <tr key={r.mois}>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5', fontWeight: 700 }}>{r.mois}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5', color: '#437a22' }}>{r.entrees}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5', color: '#964219' }}>{r.sorties}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5', fontWeight: 800 }}>{r.solde}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5' }}>{r.tresorerie}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </main>
  )
}
