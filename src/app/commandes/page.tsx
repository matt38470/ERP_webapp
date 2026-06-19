export default function Commandes() {
  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Commandes</h1>
      <p style={{ color: '#6c6a65', marginBottom: 24 }}>Gestion des commandes clients et fournisseurs, réservations et reliquats.</p>
      <div style={{ background: '#fbfbf9', border: '1px solid #d4d1ca', borderRadius: 16, padding: 24 }}>
        <p style={{ color: '#6c6a65' }}>👷 Module en construction — à brancher sur <code>/api/commandes</code></p>
        <ul style={{ marginTop: 16, paddingLeft: 20, lineHeight: 2, color: '#28251d' }}>
          <li>POST /api/commandes-client — créer une commande + réservations de stock</li>
          <li>POST /api/commandes-fournisseur — créer un approvisionnement</li>
          <li>GET /api/commandes — liste avec statut, filtres et reliquats</li>
          <li>PATCH /api/commandes/:id — confirmer, livrer partiellement, clôturer</li>
        </ul>
      </div>
    </main>
  )
}
