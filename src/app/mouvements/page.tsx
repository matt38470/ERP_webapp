export default function Mouvements() {
  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Journal des mouvements</h1>
      <p style={{ color: '#6c6a65', marginBottom: 24 }}>Source de vérité du stock. Chaque entrée, sortie, transfert et correction est enregistrée ici.</p>
      <div style={{ background: '#fbfbf9', border: '1px solid #d4d1ca', borderRadius: 16, padding: 24 }}>
        <p style={{ color: '#6c6a65' }}>👷 Module en construction — à brancher sur <code>/api/mouvements</code></p>
        <ul style={{ marginTop: 16, paddingLeft: 20, lineHeight: 2, color: '#28251d' }}>
          <li>POST /api/mouvements — créer un mouvement (entrée, sortie, transfert, correction)</li>
          <li>GET /api/mouvements — historique filtrable par article, lot, date, type</li>
          <li>GET /api/ledger?sku=VIS-304 — ledger complet d'un article</li>
        </ul>
      </div>
    </main>
  )
}
