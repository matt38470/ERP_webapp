'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Supplier = { id: number; code: string; name: string }
type Article  = { id: number; code: string; designationFr: string }

type Line = {
  itemId:    string
  qty:       string
  unitPrice: string
  lotNumber: string
}

const emptyLine = (): Line => ({ itemId: '', qty: '', unitPrice: '', lotNumber: '' })

export default function NouvelleCommandeFournisseur() {
  const router = useRouter()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [articles,  setArticles]  = useState<Article[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  // En-tête
  const [supplierId,           setSupplierId]           = useState('')
  const [refDevisFournisseur,  setRefDevisFournisseur]  = useState('')
  const [dateDevisFournisseur, setDateDevisFournisseur] = useState('')
  const [dateLivraisonPrevue,  setDateLivraisonPrevue]  = useState('')
  const [commentaire,          setCommentaire]          = useState('')

  // Lignes
  const [lines, setLines] = useState<Line[]>([emptyLine()])

  useEffect(() => {
    Promise.all([
      fetch('/api/fournisseurs').then(r => r.json()),
      fetch('/api/articles').then(r => r.json()),
    ]).then(([s, a]) => {
      setSuppliers(Array.isArray(s) ? s : [])
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

  // Prix unitaire auto depuis tarif fournisseur
  async function handleArticleChange(i: number, articleId: string) {
    updateLine(i, 'itemId', articleId)
    if (!articleId || !supplierId) return
    try {
      const res = await fetch(`/api/supplier-prices?supplierId=${supplierId}&articleId=${articleId}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.unitPrice) updateLine(i, 'unitPrice', String(data.unitPrice))
      }
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const validLines = lines.filter(l => l.itemId && Number(l.qty) > 0)
    if (validLines.length === 0) {
      setError('Ajoutez au moins une ligne avec un article et une quantité.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/commandes-fournisseur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId:           supplierId || null,
          refDevisFournisseur:  refDevisFournisseur  || null,
          dateDevisFournisseur: dateDevisFournisseur || null,
          dateLivraisonPrevue:  dateLivraisonPrevue  || null,
          commentaire:          commentaire          || null,
          lines: validLines.map(l => ({
            itemId:    Number(l.itemId),
            qty:       Number(l.qty),
            unitPrice: l.unitPrice ? Number(l.unitPrice) : undefined,
            lotNumber: l.lotNumber || undefined,
          })),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Erreur lors de la création')
        return
      }
      const order = await res.json()
      router.push('/commandes')
    } finally {
      setLoading(false)
    }
  }

  const totalHT = lines.reduce((sum, l) => {
    const q = parseFloat(l.qty)  || 0
    const p = parseFloat(l.unitPrice) || 0
    return sum + q * p
  }, 0)

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <a href="/commandes" className="text-sm text-gray-500 hover:text-gray-700">← Commandes</a>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nouvelle commande fournisseur</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* En-tête */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">En-tête de commande</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
              <select
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">— Sélectionner un fournisseur —</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.code} — {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Réf. devis fournisseur</label>
              <input
                type="text"
                value={refDevisFournisseur}
                onChange={e => setRefDevisFournisseur(e.target.value)}
                placeholder="ex: DEV-2026-042"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date du devis fournisseur</label>
              <input
                type="date"
                value={dateDevisFournisseur}
                onChange={e => setDateDevisFournisseur(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de livraison prévue</label>
              <input
                type="date"
                value={dateLivraisonPrevue}
                onChange={e => setDateLivraisonPrevue(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire</label>
              <textarea
                value={commentaire}
                onChange={e => setCommentaire(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Lignes */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-700">Lignes de commande</h2>
            <button
              type="button"
              onClick={addLine}
              className="text-sm text-teal-700 hover:text-teal-900 font-medium"
            >
              + Ajouter une ligne
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-2 pr-3 font-medium text-gray-600 w-72">Article</th>
                  <th className="text-left pb-2 pr-3 font-medium text-gray-600 w-28">Qté commandée</th>
                  <th className="text-left pb-2 pr-3 font-medium text-gray-600 w-32">Prix unitaire (€)</th>
                  <th className="text-left pb-2 pr-3 font-medium text-gray-600 w-36">N° lot attendu</th>
                  <th className="text-right pb-2 font-medium text-gray-600 w-24">Total HT</th>
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
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">— Article —</option>
                          {articles.map(a => (
                            <option key={a.id} value={a.id}>{a.code} — {a.designationFr}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min="0.001"
                          step="any"
                          value={l.qty}
                          onChange={e => updateLine(i, 'qty', e.target.value)}
                          required
                          placeholder="0"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={l.unitPrice}
                          onChange={e => updateLine(i, 'unitPrice', e.target.value)}
                          placeholder="0.00"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <input
                          type="text"
                          value={l.lotNumber}
                          onChange={e => updateLine(i, 'lotNumber', e.target.value)}
                          placeholder="ex: LOT-2026-01"
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </td>
                      <td className="py-2 text-right font-mono text-gray-700">
                        {lineTotal > 0 ? lineTotal.toFixed(2) + ' €' : '—'}
                      </td>
                      <td className="py-2 pl-2">
                        <button
                          type="button"
                          onClick={() => removeLine(i)}
                          className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none"
                          title="Supprimer la ligne"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {totalHT > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td colSpan={4} className="pt-3 text-right text-sm font-semibold text-gray-700 pr-3">Total HT</td>
                    <td className="pt-3 text-right font-mono font-bold text-gray-900">{totalHT.toFixed(2)} €</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <a
            href="/commandes"
            className="px-5 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </a>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Enregistrement…' : 'Créer la commande'}
          </button>
        </div>
      </form>
    </main>
  )
}
