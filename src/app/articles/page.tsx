import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { code: 'asc' },
  })

  return (
    <main style={{ padding: 32 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Référentiel articles</h1>
      <p style={{ color: '#6c6a65', marginBottom: 24 }}>
        {articles.length} article{articles.length > 1 ? 's' : ''} trouvé{articles.length > 1 ? 's' : ''}
      </p>

      <div style={{ background: '#fbfbf9', border: '1px solid #d4d1ca', borderRadius: 16, padding: 24 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {['Code', 'Indice', 'Désignation FR', 'État', 'Famille', 'Sous-famille', 'Type', 'Actif'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '8px 10px',
                  borderBottom: '1px solid #d4d1ca',
                  color: '#6c6a65', fontSize: 12, textTransform: 'uppercase'
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {articles.map(a => (
              <tr key={a.id} style={{ cursor: 'pointer' }}>
                <td style={{ padding: '12px 10px', borderBottom: '1px solid #dcd9d5', fontWeight: 700 }}>
                  <Link href={`/articles/${a.id}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                    {a.code}
                  </Link>
                </td>
                <td style={{ padding: '12px 10px', borderBottom: '1px solid #dcd9d5', color: '#6c6a65' }}>{a.indice ?? '—'}</td>
                <td style={{ padding: '12px 10px', borderBottom: '1px solid #dcd9d5' }}>{a.designationFr}</td>
                <td style={{ padding: '12px 10px', borderBottom: '1px solid #dcd9d5', color: '#6c6a65' }}>{a.etat ?? '—'}</td>
                <td style={{ padding: '12px 10px', borderBottom: '1px solid #dcd9d5', color: '#6c6a65' }}>{a.famille ?? '—'}</td>
                <td style={{ padding: '12px 10px', borderBottom: '1px solid #dcd9d5', color: '#6c6a65' }}>{a.sousFamille ?? '—'}</td>
                <td style={{ padding: '12px 10px', borderBottom: '1px solid #dcd9d5' }}>
                  <span style={{
                    background: a.type === 'KIT' ? '#dbeafe' : a.type === 'COMPONENT' ? '#fef9c3' : '#f0fdf4',
                    color: a.type === 'KIT' ? '#1d4ed8' : a.type === 'COMPONENT' ? '#854d0e' : '#166534',
                    borderRadius: 8, padding: '2px 8px', fontSize: 11, fontWeight: 600
                  }}>
                    {a.type}
                  </span>
                </td>
                <td style={{ padding: '12px 10px', borderBottom: '1px solid #dcd9d5' }}>
                  {a.isActive ? '✅' : '❌'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
