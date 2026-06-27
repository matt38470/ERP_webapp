'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Customer = { id: number; code: string; etablissement: string | null; nom: string | null; prenom: string | null; codeTarif: string | null }
type Article  = { id: number; code: string; designationFr: string }

type Line = { itemId: string; qty: string; unitPrice: string }

const emptyLine = (): Line => ({ itemId: '', qty: '', unitPrice: '' })

export default function NouvelleCommandeClient() {
  const router = useRouter()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [articles,  setArticles]  = useState<Article[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  const [customerId,      setCustomerId]      = useState('')
  const [referenceClient, setReferenceClient] = useState('')
  const [numDevis,        setNumDevis]        = useState('')
  const [delai,           setDelai]           = useState('')
  const [devise,          setDevise]          = useState('EUR')
  const [dateFacturation, setDateFacturation] = useState('')
  const [commentaire,     setCommentaire]     = useState('')

  const [lines, setLines] = useState<Line[]>([emptyLine()])

  // Tarif du client sélectionné
  const selectedCustomer = customers.find(c => String(c.id) === customerId)
  const codeTarif = selectedCustomer?.codeTarif ?? null

  useEffect(() => {
    Promise.all([
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/articles').then(r => r.json()),
    ]).then(([c, a]) => {
      setCustomers(Array.isArray(c) ? c : [])
      setArticles(Array.isArray(a) ? a : [])
    })
  }, [])

  function updateLine(i: number, field: keyof Line, value: string) {
    setLines(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l))
  }

  function addLine() { setLines(prev => [...prev, emptyLine()]) }

  function removeLine(i: number) {
    setLines(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i))
  }

  // Auto-remplissage du prix via /api/customer-price
  async function handleArticleChange(i: number, articleId: string) {
    updateLine(i, 'itemId', articleId)
    if (!articleId) return
    try {
      const params = new URLSearchParams({ articleId })
      if (customerId) params.set('customerId', customerId)
      const res = await fetch(`/api/customer-price?${params}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.unitPrice != null) {
          updateLine(i, 'unitPrice', String(data.unitPrice))
        }
      }
    } catch {}
  }

  // Quand le client change, recalculer les prix de toutes les lignes déjà saisies
  async function handleCustomerChange(newCustomerId: string) {
    setCustomerId(newCustomerId)
    if (!newCustomerId) return
    const updated = await Promise.all(
      lines.map(async (l) => {
        if (!l.itemId) return l
        try {
          const res = await fetch(`/api/customer-price?articleId=${l.itemId}&customerId=${newCustomerId}`)
          if (res.ok) {
            const data = await res.json()
            if (data?.unitPrice != null) return { ...l, unitPrice: String(data.unitPrice) }
          }
        } catch {}
        return l
      })
    )
    setLines(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const validLines = lines.filter(l => l.itemId && Number(l.qty) > 0)
    if (validLines.length === 0) { setError('Ajoutez au moins une ligne avec un article et une quantité.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/commandes-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId:      customerId      || null,
          referenceClient: referenceClient || null,
          numDevis:        numDevis        || null,
          delai:           delai           || null,
          devise:          devise          || 'EUR',
          dateFacturation: dateFacturation || null,
          commentaire:     commentaire     || null,
          lines: validLines.map(l => ({
            itemId:    Number(l.itemId),
            qty:       Number(l.qty),
            unitPrice: l.unitPrice ? Number(l.unitPrice) : undefined,
          })),
        }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Erreur lors de la création'); return }
      router.push('/commandes')
    } finally { setLoading(false) }
  }

  const totalHT = lines.reduce((sum, l) => sum + (parseFloat(l.qty) || 0) * (parseFloat(l.unitPrice) || 0), 0)

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <a href="/commandes" className="text-sm text-gray-500 hover:text-gray-700">← Commandes</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nouvelle commande client</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* En-tête */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">En-tête de commande</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                value={customerId}
                onChange={e => handleCustomerChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— Sélectionner un client —</option>
                {customers.map(c => {
                  const label = c.etablissement || [c.prenom, c.nom].filter(Boolean).join(' ') || c.code
                  return <option key={c.id} value={c.id}>{c.code} — {label}</option>
                })}
              </select>
              {/* Indicateur de tarif actif */}
              {customerId && (
                <p className="mt-1 text-xs text-gray-400">
                  {codeTarif
                    ? <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>Tarif <strong>{codeTarif}</strong> appliqué automatiquement aux prix</span>
                    : <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>Aucun code tarif — prix à saisir manuellement</span>
                  }
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Référence client</label>
              <input type="text" value={referenceClient} onChange={e => setReferenceClient(e.target.value)} placeholder="ex: PO-2026-0042" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">N° devis interne</label>
              <input type="text" value={numDevis} onChange={e => setNumDevis(e.target.value)} placeholder="ex: DEV-0012" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Délai de livraison</label>
              <input type="text" value={delai} onChange={e => setDelai(e.target.value)} placeholder="ex: 4 semaines" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
              <select value={devise} onChange={e => setDevise(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="EUR">EUR — Euro</option>
                <option value="USD">USD — Dollar</option>
                <option value="GBP">GBP — Livre sterling</option>
                <option value="CHF">CHF — Franc suisse</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de facturation prévue</label>
              <input type="date" value={dateFacturation} onChange={e => setDateFacturation(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
              <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          </div>
        </div>

        {/* Lignes */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-700">Lignes de commande</h2>
              {codeTarif && (
                <p className="text-xs text-blue-600 mt-0.5">Prix remplis automatiquement selon le tarif {codeTarif} du client</p>
              )}
            </div>
            <button type="button" onClick={addLine} className="text-sm text-blue-700 hover:text-blue-900 font-medium">+ Ajouter une ligne</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-2 pr-3 font-medium text-gray-600">Article</th>
                  <th className="text-left pb-2 pr-3 font-medium text-gray-600 w-28">Qté</th>
                  <th className="text-left pb-2 pr-3 font-medium text-gray-600 w-40">Prix unitaire ({devise})</th>
                  <th className="text-right pb-2 font-medium text-gray-600 w-28">Total HT</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lines.map((l, i) => {
                  const lineTotal = (parseFloat(l.qty) || 0) * (parseFloat(l.unitPrice) || 0)
                  return (
                    <tr key={i}>
                      <td className="py-2 pr-3">
                        <select
                          value={l.itemId}
                          onChange={e => handleArticleChange(i, e.target.value)}
                          required
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">— Article —</option>
                          {articles.map(a => (<option key={a.id} value={a.id}>{a.code} — {a.designationFr}</option>))}
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" min="0.001" step="any" value={l.qty} onChange={e => updateLine(i, 'qty', e.target.value)} required placeholder="0"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </td>
                      <td className="py-2 pr-3">
                        <input type="number" min="0" step="any" value={l.unitPrice} onChange={e => updateLine(i, 'unitPrice', e.target.value)} placeholder="0.00"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </td>
                      <td className="py-2 text-right font-mono text-gray-700">{lineTotal > 0 ? lineTotal.toFixed(2) + ' ' + devise : '—'}</td>
                      <td className="py-2 pl-2">
                        <button type="button" onClick={() => removeLine(i)} className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none" title="Supprimer">×</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {totalHT > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={3} className="pt-3 text-right text-sm font-semibold text-gray-700 pr-3">Total HT</td>
                    <td className="pt-3 text-right font-mono font-bold text-gray-900">{totalHT.toFixed(2)} {devise}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="flex justify-end gap-3">
          <a href="/commandes" className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Annuler</a>
          <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50 transition-colors">
            {loading ? 'Enregistrement…' : 'Créer la commande'}
          </button>
        </div>
      </form>
    </main>
  )
}
