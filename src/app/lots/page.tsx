export default function Lots() {
  const lots = [
    { code: 'LOT-CL-001', sku: 'CL-42', statut: 'DISPONIBLE', reception: '10/01/2025', ref_fournisseur: 'FRN-CLOU-2025-01' },
    { code: 'LOT-VIS-001', sku: 'VIS-304', statut: 'DISPONIBLE', reception: '15/03/2025', ref_fournisseur: 'FRN-VIS-2025-03' },
  ]
  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Lots</h1>
      <p style={{ color: '#6c6a65', marginBottom: 24 }}>Traçabilité par lot, référence fournisseur, date de réception et statut.</p>
      <div style={{ background: '#fbfbf9', border: '1px solid #d4d1ca', borderRadius: 16, padding: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead><tr>{['Code lot', 'SKU', 'Statut', 'Réception', 'Réf. fournisseur'].map(h => <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid #d4d1ca', color: '#6c6a65', fontSize: 12, textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
          <tbody>{lots.map(l => <tr key={l.code}>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5', fontWeight: 700 }}>{l.code}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5' }}>{l.sku}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5' }}><span style={{ background: '#dff0d5', color: '#437a22', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{l.statut}</span></td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5', color: '#6c6a65' }}>{l.reception}</td>
            <td style={{ padding: '14px 10px', borderBottom: '1px solid #dcd9d5', color: '#6c6a65' }}>{l.ref_fournisseur}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </main>
  )
}
