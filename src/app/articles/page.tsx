export default function Articles() {
  const items = [
    { sku: 'CL-42', name: 'Clou 42mm', family: 'Clous', unit: 'pcs', active: true },
    { sku: 'VIS-304', name: 'Vis 30x4mm', family: 'Vis', unit: 'pcs', active: true },
    { sku: 'SET-AX', name: 'Set Assemblage AX', family: 'Sets', unit: 'set', active: true },
  ]
  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Référentiel articles</h1>
      <p style={{ color: '#6c6a65', marginBottom: 24 }}>Chaque article est identifié par un SKU unique. Il peut avoir plusieurs lots actifs.</p>
      <div style={{ background: '#fbfbf9', border: '1px solid #d4d1ca', borderRadius: 16, padding: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr>{['SKU', 'Nom', 'Famille', 'Unité', 'Actif'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #d4d1ca', color: '#6c6a65', fontSize: 12, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
          <tbody>{items.map(i => <tr key={i.sku}>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5', fontWeight: 700 }}>{i.sku}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5' }}>{i.name}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5', color: '#6c6a65' }}>{i.family}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5' }}>{i.unit}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5' }}>{i.active ? '✅' : '❌'}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </main>
  )
}
