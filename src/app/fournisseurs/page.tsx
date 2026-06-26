'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

type Fournisseur = {
  id: number; code: string; name: string; phone: string | null
  email: string | null; city: string | null; langue: string | null
  delaiHabituel: number | null; isActive: boolean
  country: { name: string } | null
}

export default function FournisseursPage() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    const res = await fetch(`/api/fournisseurs?${params}`)
    setFournisseurs(await res.json())
    setLoading(false)
  }, [q])

  useEffect(() => { load() }, [load])

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fournisseurs</h1>
          <p className="text-sm text-gray-500 mt-1">{fournisseurs.length} fournisseur{fournisseurs.length > 1 ? 's' : ''}</p>
        </div>
        <Link href="/fournisseurs/nouveau"
          className="inline-flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-800 transition">
          + Nouveau fournisseur
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        <input type="text" placeholder="Rechercher code, nom, email…"
          value={q} onChange={e => setQ(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-teal-600" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Code', 'Nom', 'Email', 'Tél.', 'Ville', 'Pays', 'Délai (j)', 'Actif'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                </td></tr>
              ))
            ) : fournisseurs.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Aucun fournisseur trouvé</td></tr>
            ) : fournisseurs.map(f => (
              <tr key={f.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-bold">
                  <Link href={`/fournisseurs/${f.id}`} className="text-teal-700 hover:underline">{f.code}</Link>
                </td>
                <td className="px-4 py-3 font-medium">{f.name}</td>
                <td className="px-4 py-3 text-gray-500">{f.email || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{f.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{f.city || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{f.country?.name || '—'}</td>
                <td className="px-4 py-3 tabular-nums text-gray-600">
                  {f.delaiHabituel != null ? `${f.delaiHabituel} j` : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`w-2 h-2 rounded-full inline-block ${f.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
