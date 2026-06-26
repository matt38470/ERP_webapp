'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'

type Client = {
  id: number; code: string; prenom: string | null; nom: string | null
  etablissement: string | null; phone: string | null; email: string | null
  villeLivraison: string | null; langue: string | null; isActive: boolean
  country: { name: string } | null
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    const res = await fetch(`/api/clients?${params}`)
    setClients(await res.json())
    setLoading(false)
  }, [q])

  useEffect(() => { load() }, [load])

  const displayName = (c: Client) => [
    c.etablissement, c.prenom && c.nom ? `${c.prenom} ${c.nom}` : (c.nom ?? c.prenom)
  ].filter(Boolean).join(' — ')

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">{clients.length} client{clients.length > 1 ? 's' : ''}</p>
        </div>
        <Link href="/clients/nouveau"
          className="inline-flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-teal-800 transition">
          + Nouveau client
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        <input type="text" placeholder="Rechercher code, nom, établissement…"
          value={q} onChange={e => setQ(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-80 focus:outline-none focus:ring-2 focus:ring-teal-600" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Code', 'Nom / Établissement', 'Email', 'Tél.', 'Ville', 'Pays', 'Langue', 'Actif'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-3">
                  <div className="h-4 bg-gray-100 rounded animate-pulse w-full" />
                </td></tr>
              ))
            ) : clients.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">Aucun client trouvé</td></tr>
            ) : clients.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-bold">
                  <Link href={`/clients/${c.id}`} className="text-teal-700 hover:underline">{c.code}</Link>
                </td>
                <td className="px-4 py-3">{displayName(c) || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.email || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.villeLivraison || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.country?.name || '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{c.langue ?? 'FR'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`w-2 h-2 rounded-full inline-block ${c.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
