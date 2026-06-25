import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ArticleDetailPage({ params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({
    where: { id: Number(params.id) },
    include: {
      parentKits: {
        include: { parentArticle: true }
      },
      childKits: {
        include: { childArticle: true }
      },
      lots: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!article) return notFound()

  const stockTotal = article.lots
    .filter(l => l.status === 'AVAILABLE')
    .reduce((acc, l) => acc + Number(l.quantity), 0)

  return (
    <main style={{ padding: 32, maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/articles" style={{ color: '#6c6a65', textDecoration: 'none', fontSize: 14 }}>← Retour à la liste</Link>
      </div>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>{article.code}</h1>
      <p style={{ color: '#6c6a65', marginBottom: 32, fontSize: 16 }}>{article.designationFr}</p>

      {/* Informations générales */}
      <section style={{ background: '#fbfbf9', border: '1px solid #d4d1ca', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Informations générales</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            ['Code', article.code],
            ['Indice', article.indice ?? '—'],
            ['Désignation FR', article.designationFr],
            ['Désignation EN', article.designationEn ?? '—'],
            ['État', article.etat ?? '—'],
            ['Famille', article.famille ?? '—'],
            ['Sous-famille', article.sousFamille ?? '—'],
            ['Type', article.type],
            ['Actif', article.isActive ? 'Oui' : 'Non'],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: '#6c6a65', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
              <div style={{ fontWeight: 600 }}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Stock */}
      <section style={{ background: '#fbfbf9', border: '1px solid #d4d1ca', borderRadius: 16, padding: 24, marginBottom: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Stock</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#6c6a65', textTransform: 'uppercase', marginBottom: 2 }}>Stock disponible</div>
            <div style={{ fontWeight: 800, fontSize: 24 }}>{stockTotal}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6c6a65', textTransform: 'uppercase', marginBottom: 2 }}>Stock min</div>
            <div style={{ fontWeight: 600 }}>{article.stockMin ? Number(article.stockMin) : '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#6c6a65', textTransform: 'uppercase', marginBottom: 2 }}>Stock sécurité</div>
            <div style={{ fontWeight: 600 }}>{article.stockSecurite ? Number(article.stockSecurite) : '—'}</div>
          </div>
        </div>
      </section>

      {/* Composition kit */}
      {article.childKits.length > 0 && (
        <section style={{ background: '#fbfbf9', border: '1px solid #d4d1ca', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Composants du kit</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['Code', 'Désignation', 'Quantité'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid #d4d1ca', color: '#6c6a65', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {article.childKits.map(k => (
                <tr key={k.id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #dcd9d5', fontWeight: 700 }}>
                    <Link href={`/articles/${k.childArticle.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                      {k.childArticle.code}
                    </Link>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #dcd9d5' }}>{k.childArticle.designationFr}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #dcd9d5' }}>{Number(k.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Utilisé dans les kits */}
      {article.parentKits.length > 0 && (
        <section style={{ background: '#fbfbf9', border: '1px solid #d4d1ca', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Utilisé dans les kits</h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {article.parentKits.map(k => (
              <li key={k.id} style={{ marginBottom: 6 }}>
                <Link href={`/articles/${k.parentArticle.id}`} style={{ color: '#2563eb' }}>
                  {k.parentArticle.code} — {k.parentArticle.designationFr}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Derniers lots */}
      {article.lots.length > 0 && (
        <section style={{ background: '#fbfbf9', border: '1px solid #d4d1ca', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Derniers lots</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr>
                {['N° lot', 'Quantité', 'Statut', 'Expiration'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '1px solid #d4d1ca', color: '#6c6a65', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {article.lots.map(l => (
                <tr key={l.id}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #dcd9d5', fontWeight: 600 }}>{l.lotNumber}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #dcd9d5' }}>{Number(l.quantity)}</td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #dcd9d5' }}>
                    <span style={{
                      background: l.status === 'AVAILABLE' ? '#f0fdf4' : l.status === 'QUARANTINED' ? '#fef2f2' : '#f8fafc',
                      color: l.status === 'AVAILABLE' ? '#166534' : l.status === 'QUARANTINED' ? '#991b1b' : '#475569',
                      borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 600
                    }}>
                      {l.status}
                    </span>
                  </td>
                  <td style={{ padding: '10px', borderBottom: '1px solid #dcd9d5', color: '#6c6a65' }}>
                    {l.expiryDate ? new Date(l.expiryDate).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  )
}
