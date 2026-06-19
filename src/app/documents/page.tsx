export default function Documents() {
  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>BL / Factures</h1>
      <p style={{ color: '#6c6a65', marginBottom: 24 }}>Chaînage documentaire : commande → bon de livraison → facture.</p>
      <div style={{ background: '#fbfbf9', border: '1px solid #d4d1ca', borderRadius: 16, padding: 24 }}>
        <p style={{ color: '#6c6a65' }}>👷 Module en construction — à brancher sur <code>/api/bl</code> et <code>/api/factures</code></p>
        <ul style={{ marginTop: 16, paddingLeft: 20, lineHeight: 2, color: '#28251d' }}>
          <li>POST /api/bl — générer un bon de livraison depuis une commande</li>
          <li>PATCH /api/bl/:id/valider — valider la livraison (déclenche le mouvement de sortie)</li>
          <li>POST /api/factures — émettre une facture depuis un BL validé</li>
          <li>GET /api/bl?status=DELIVERED — BL livrés sans facture</li>
        </ul>
      </div>
    </main>
  )
}
