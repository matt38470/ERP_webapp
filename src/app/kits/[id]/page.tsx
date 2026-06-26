'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Customer = { id: number; code: string; etablissement?: string; nom?: string; prenom?: string }
type KitLoan = {
  id: number
  type: 'DEMO' | 'LOAN' | 'SALE'
  status: 'EN_COURS' | 'RETOURNE' | 'VENDU'
  sentAt: string
  returnedAt?: string
  contact?: string
  note?: string
  customer: Customer
}
type Component = {
  id: number
  quantity: number
  childArticle: { id: number; code: string; designationFr: string; designationEn?: string }
}
type Kit = {
  id: number
  code: string
  designationFr: string
  designationEn?: string
  commentaire?: string
  isActive: boolean
  parentKits: Component[]
  kitLoans: KitLoan[]
}

const TYPE_LABEL: Record<string, string> = { DEMO: 'Démo', LOAN: 'Prêt', SALE: 'Vente' }
const TYPE_COLOR: Record<string, string> = {
  DEMO: 'bg-blue-100 text-blue-800',
  LOAN: 'bg-orange-100 text-orange-800',
  SALE: 'bg-green-100 text-green-800',
}
const STATUS_COLOR: Record<string, string> = {
  EN_COURS: 'bg-orange-100 text-orange-700',
  RETOURNE: 'bg-gray-100 text-gray-600',
  VENDU: 'bg-green-100 text-green-700',
}
const STATUS_LABEL: Record<string, string> = {
  EN_COURS: 'En cours',
  RETOURNE: 'Retourné',
  VENDU: 'Vendu',
}

export default function KitDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [kit, setKit] = useState<Kit | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'composition' | 'historique'>('composition')
  const [showLoanForm, setShowLoanForm] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loanForm, setLoanForm] = useState({ customerId: '', type: 'DEMO', contact: '', note: '', sentAt: new Date().toISOString().slice(0, 10) })
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    fetch(`/api/kits/${id}`)
      .then(r => r.json())
      .then(data => { setKit(data); setLoading(false) })
  }

  useEffect(() => { load() }, [id])
  useEffect(() => {
    if (showLoanForm && customers.length === 0) {
      fetch('/api/clients?perPage=200').then(r => r.json()).then(d => setCustomers(d.data ?? d))
    }
  }, [showLoanForm])

  const activeLoan = kit?.kitLoans.find(l => l.status === 'EN_COURS')

  const handleReturn = async (loanId: number) => {
    if (!confirm('Confirmer le retour de ce kit ?')) return
    await fetch(`/api/kits/${id}/loans/${loanId}/retour`, { method: 'POST' })
    load()
  }

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await fetch(`/api/kits/${id}/loans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...loanForm, customerId: Number(loanForm.customerId) }),
    })
    setSubmitting(false)
    setShowLoanForm(false)
    setLoanForm({ customerId: '', type: 'DEMO', contact: '', note: '', sentAt: new Date().toISOString().slice(0, 10) })
    load()
  }

  if (loading) return <div className="p-8 text-gray-400">Chargement...</div>
  if (!kit) return <div className="p-8 text-red-500">Kit introuvable</div>

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
        <Link href="/kits" className="hover:text-teal-600">Kits</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{kit.code}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{kit.code}</h1>
            {activeLoan && (
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${TYPE_COLOR[activeLoan.type]}`}>
                {TYPE_LABEL[activeLoan.type]} en cours
              </span>
            )}
            {!activeLoan && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                Disponible
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">{kit.designationFr}</p>
          {kit.designationEn && <p className="text-gray-400 text-sm">{kit.designationEn}</p>}
        </div>
        <div className="flex gap-2">
          <Link
            href={`/articles/${kit.id}`}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            ✏️ Modifier
          </Link>
          {!activeLoan && (
            <button
              onClick={() => setShowLoanForm(true)}
              className="px-4 py-2 text-sm bg-teal-700 text-white rounded-lg hover:bg-teal-800 transition font-medium"
            >
              📤 Envoyer
            </button>
          )}
        </div>
      </div>

      {/* Prêt actif — bloc d'alerte */}
      {activeLoan && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
          <div>
            <div className="font-semibold text-orange-800">
              {TYPE_LABEL[activeLoan.type]} en cours chez{' '}
              <span className="underline">
                {activeLoan.customer.etablissement ||
                  `${activeLoan.customer.prenom ?? ''} ${activeLoan.customer.nom ?? ''}`.trim()}
              </span>
            </div>
            <div className="text-sm text-orange-600 mt-0.5">
              Depuis le {new Date(activeLoan.sentAt).toLocaleDateString('fr-FR')}
              {activeLoan.contact && ` · Contact : ${activeLoan.contact}`}
            </div>
            {activeLoan.note && <div className="text-sm text-orange-500 italic mt-0.5">{activeLoan.note}</div>}
          </div>
          <button
            onClick={() => handleReturn(activeLoan.id)}
            className="px-4 py-2 text-sm bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition font-medium"
          >
            📥 Retour
          </button>
        </div>
      )}

      {/* Formulaire envoi */}
      {showLoanForm && (
        <div className="mb-6 p-5 bg-white border border-teal-200 rounded-xl shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Envoyer le kit</h3>
          <form onSubmit={handleLoanSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Client *</label>
              <select
                required
                value={loanForm.customerId}
                onChange={e => setLoanForm(f => ({ ...f, customerId: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Sélectionner un client...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.etablissement || `${c.prenom ?? ''} ${c.nom ?? ''}`.trim()} ({c.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
              <select
                value={loanForm.type}
                onChange={e => setLoanForm(f => ({ ...f, type: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="DEMO">Démonstration</option>
                <option value="LOAN">Prêt</option>
                <option value="SALE">Vente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date de départ</label>
              <input
                type="date"
                value={loanForm.sentAt}
                onChange={e => setLoanForm(f => ({ ...f, sentAt: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Contact chez le client</label>
              <input
                type="text"
                value={loanForm.contact}
                onChange={e => setLoanForm(f => ({ ...f, contact: e.target.value }))}
                placeholder="Dr. Martin..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Note</label>
              <input
                type="text"
                value={loanForm.note}
                onChange={e => setLoanForm(f => ({ ...f, note: e.target.value }))}
                placeholder="Observations..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="col-span-2 flex gap-3 justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowLoanForm(false)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 font-medium"
              >
                {submitting ? 'Enregistrement...' : '📤 Envoyer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 border-b border-gray-200 mb-5">
        {(['composition', 'historique'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
              tab === t ? 'border-teal-600 text-teal-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'composition' ? `📦 Composition (${kit.parentKits.length})` : `📋 Historique (${kit.kitLoans.length})`}
          </button>
        ))}
      </div>

      {/* Tab: Composition */}
      {tab === 'composition' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {kit.parentKits.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-2">📭</div>
              <p>Aucun composant défini</p>
              <Link href={`/articles/${kit.id}`} className="text-teal-600 text-sm hover:underline mt-1 inline-block">
                Ajouter des composants →
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Désignation</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-600">Quantité</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kit.parentKits.map(comp => (
                  <tr key={comp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-teal-700 font-semibold">{comp.childArticle.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{comp.childArticle.designationFr}</div>
                      {comp.childArticle.designationEn && (
                        <div className="text-xs text-gray-400">{comp.childArticle.designationEn}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{comp.quantity}</td>
                    <td className="px-4 py-3">
                      <Link href={`/articles/${comp.childArticle.id}`} className="text-xs text-teal-600 hover:underline">
                        Voir article
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Historique */}
      {tab === 'historique' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {kit.kitLoans.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-2">📋</div>
              <p>Aucun prêt ou démo enregistré</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Client</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Départ</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Retour</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Statut</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Contact / Note</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {kit.kitLoans.map(loan => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${TYPE_COLOR[loan.type]}`}>
                        {TYPE_LABEL[loan.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {loan.customer.etablissement ||
                        `${loan.customer.prenom ?? ''} ${loan.customer.nom ?? ''}`.trim()}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {new Date(loan.sentAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {loan.returnedAt
                        ? new Date(loan.returnedAt).toLocaleDateString('fr-FR')
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[loan.status]}`}>
                        {STATUS_LABEL[loan.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {[loan.contact, loan.note].filter(Boolean).join(' · ') || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {loan.status === 'EN_COURS' && (
                        <button
                          onClick={() => handleReturn(loan.id)}
                          className="text-xs text-orange-600 hover:underline"
                        >
                          Retour
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
