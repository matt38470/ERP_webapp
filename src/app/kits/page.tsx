'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type KitLoanActive = {
  id: number
  type: 'DEMO' | 'LOAN' | 'SALE'
  status: 'EN_COURS' | 'RETOURNE' | 'VENDU'
  sentAt: string
  customer: { code: string; etablissement?: string; nom?: string; prenom?: string }
}

type Kit = {
  id: number
  code: string
  designationFr: string
  designationEn?: string
  isActive: boolean
  _count: { parentKits: number; kitLoans: number }
  kitLoans: KitLoanActive[]
}

const TYPE_LABEL: Record<string, string> = { DEMO: 'Démo', LOAN: 'Prêt', SALE: 'Vente' }
const TYPE_COLOR: Record<string, string> = {
  DEMO: 'bg-blue-100 text-blue-800',
  LOAN: 'bg-orange-100 text-orange-800',
  SALE: 'bg-green-100 text-green-800',
}

export default function KitsPage() {
  const [kits, setKits] = useState<Kit[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'EN_COURS' | 'disponible'>('all')

  useEffect(() => {
    fetch('/api/kits')
      .then(r => r.json())
      .then(data => { setKits(data); setLoading(false) })
  }, [])

  const filtered = kits.filter(k => {
    const matchSearch = !search ||
      k.code.toLowerCase().includes(search.toLowerCase()) ||
      k.designationFr.toLowerCase().includes(search.toLowerCase())
    const activeLoan = k.kitLoans.find(l => l.status === 'EN_COURS')
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'EN_COURS' && activeLoan) ||
      (filterStatus === 'disponible' && !activeLoan)
    return matchSearch && matchStatus
  })

  const enCours = kits.filter(k => k.kitLoans.some(l => l.status === 'EN_COURS')).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kits</h1>
          <p className="text-sm text-gray-500 mt-1">
            {kits.length} kit{kits.length > 1 ? 's' : ''} · {enCours} en cours de prêt/démo
          </p>
        </div>
        <Link
          href="/articles/nouveau?type=KIT"
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition"
        >
          <span>+</span> Nouveau kit
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-5">
        <input
          type="text"
          placeholder="Rechercher un kit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="flex gap-2">
          {(['all', 'EN_COURS', 'disponible'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                filterStatus === s
                  ? 'bg-teal-700 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'Tous' : s === 'EN_COURS' ? 'En cours' : 'Disponibles'}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📦</div>
          <p className="font-medium">Aucun kit trouvé</p>
          <p className="text-sm mt-1">Modifiez vos filtres ou créez un nouveau kit</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Désignation</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Composants</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Client actuel</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Depuis</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(kit => {
                const activeLoan = kit.kitLoans.find(l => l.status === 'EN_COURS')
                const customerLabel = activeLoan
                  ? activeLoan.customer.etablissement ||
                    `${activeLoan.customer.prenom ?? ''} ${activeLoan.customer.nom ?? ''}`.trim()
                  : null
                const daysSince = activeLoan
                  ? Math.floor((Date.now() - new Date(activeLoan.sentAt).getTime()) / 86400000)
                  : null

                return (
                  <tr key={kit.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-teal-700">{kit.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{kit.designationFr}</div>
                      {kit.designationEn && (
                        <div className="text-xs text-gray-400">{kit.designationEn}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                        {kit._count.parentKits}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {activeLoan ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${TYPE_COLOR[activeLoan.type]}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {TYPE_LABEL[activeLoan.type]} en cours
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Disponible
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{customerLabel ?? <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {daysSince !== null ? (
                        <span className={daysSince > 30 ? 'text-orange-600 font-semibold' : ''}>
                          {daysSince}j
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/kits/${kit.id}`}
                        className="px-3 py-1.5 text-xs font-medium text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 transition"
                      >
                        Voir
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
