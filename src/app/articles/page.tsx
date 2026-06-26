'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

type Article = {
  id: number; code: string; indice: string | null; designationFr: string
  etat: string | null; famille: string | null; sousFamille: string | null
  type: string; typeProduit: string | null; isActive: boolean
  stockMin: number | null; prixAchatRef: number | null
}

const TYPE_COLORS: Record<string, string> = {
  SIMPLE: 'bg-green-100 text-green-800',
  KIT: 'bg-blue-100 text-blue-800',
  COMPONENT: 'bg-yellow-100 text-yellow-800',
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [q, setQ] = useState('')
  const [famille, setFamille] = useState('')
  const [type, setType] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (famille) params.set('famille', famille)
    if (type) params.set('type', type)
    const res = await fetch(`/api/articles?${params}`)
    setArticles(await res.json())
    setLoading(false)
  }, [q, famille, type])

  useEffect(() => { load() }, [load])

  return (
    <main className="p-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Référentiel articles</h1>
          <p className="text-sm text-gray-500 mt-1">{articles.length} article{articles.length > 1 ? 's' : ''}</p>
        </div>
        <Link href="/articles/nouveau"
          className="inline-flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-800 transition">
          + Nouvel article
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="text" placeholder="Rechercher code, désignation…"
          value={q} onChange={e => setQ(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
        <input
          type="text" placeholder="Famille…"
          value={famille} onChange={e => setFamille(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
        <select value={type} onChange={e => setType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
          <option value="">Tous les types</option>
          <option value="SIMPLE">Simple</option>
          <option value="KIT">Kit</option>
          <option value="COMPONENT">Composant</option>
        </select>
      </div>

      {/* Tableau */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Code', 'Indice', 'Désignation FR', 'État', 'Famille', 'Sous-famille', 'Type', 'Prix achat', 'Stock min', 'Actif'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}><td colSpan={10} className="px-4 py-3">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                </td></tr>
              ))
            ) : articles.length === 0 ? (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">Aucun article trouvé</td></tr>
            ) : articles.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-bold">
                  <Link href={`/articles/${a.id}`} className="text-teal-700 hover:underline">{a.code}</Link>
                </td>
                <td className="px-4 py-3 text-gray-500">{a.indice ?? '—'}</td>
                <td className="px-4 py-3 max-w-xs truncate">{a.designationFr}</td>
                <td className="px-4 py-3 text-gray-500">{a.etat ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{a.famille ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{a.sousFamille ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[a.type] ?? 'bg-gray-100 text-gray-700'}`}>
                    {a.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 tabular-nums">
                  {a.prixAchatRef != null ? Number(a.prixAchatRef).toFixed(2) + ' €' : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600 tabular-nums">{a.stockMin ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`w-2 h-2 rounded-full inline-block ${a.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
