'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

// — Composants définis HORS du composant parent pour éviter le bug de perte de focus —

function ReadField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-800">{value || <span className="text-gray-400">—</span>}</p>
    </div>
  )
}

function EditField({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
    </div>
  )
}

type Article = {
  id: number; code: string; indice: string | null; designationFr: string; designationEn: string | null
  etat: string | null; famille: string | null; sousFamille: string | null
  diametre: string | null; longueur: string | null; largeur: string | null; autreCarac: string | null
  typeProduit: string | null; prixAchatRef: string | null; stockMin: string | null; stockSecurite: string | null
  commentaire: string | null; isActive: boolean; type: string; createdAt: string
  lots: { id: number; lotNumber: string; quantity: string; status: string; receivedAt: string | null }[]
}

type SupplierPrice = {
  id: number; supplierId: number; unitPrice: string; qtyMin: string | null
  refDevis: string | null; dateDevis: string | null; validFrom: string | null; validTo: string | null
  currency: string; note: string | null; isActive: boolean
  supplier: { id: number; code: string; name: string }
}

type Supplier = { id: number; code: string; name: string }

// Ligne du tableau des tarifs fournisseurs (mode affichage)
function PriceRow({ sp, onDelete }: { sp: SupplierPrice; onDelete: (id: number) => void }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="py-2 pr-4 text-sm font-medium">{sp.supplier.name} <span className="text-gray-400 text-xs">({sp.supplier.code})</span></td>
      <td className="py-2 pr-4 tabular-nums text-sm font-bold text-teal-700">{Number(sp.unitPrice).toFixed(4)} {sp.currency}</td>
      <td className="py-2 pr-4 text-sm text-gray-600">{sp.qtyMin != null ? `≥ ${Number(sp.qtyMin)}` : '—'}</td>
      <td className="py-2 pr-4 text-sm text-gray-600">{sp.refDevis || '—'}</td>
      <td className="py-2 pr-4 text-sm text-gray-500">{sp.dateDevis ? new Date(sp.dateDevis).toLocaleDateString('fr-FR') : '—'}</td>
      <td className="py-2 pr-4 text-sm text-gray-500">
        {sp.validFrom ? new Date(sp.validFrom).toLocaleDateString('fr-FR') : '—'}
        {sp.validTo ? ` → ${new Date(sp.validTo).toLocaleDateString('fr-FR')}` : ''}
      </td>
      <td className="py-2">
        <button onClick={() => onDelete(sp.id)}
          className="text-xs text-red-500 hover:text-red-700 hover:underline">Supprimer</button>
      </td>
    </tr>
  )
}

// Formulaire d'ajout d'un tarif fournisseur — défini hors du parent
function AddPriceForm({ articleId, suppliers, onAdded }: {
  articleId: number; suppliers: Supplier[];
  onAdded: (sp: SupplierPrice) => void
}) {
  const [form, setForm] = useState({
    supplierId: '', unitPrice: '', qtyMin: '', refDevis: '', dateDevis: '',
    validFrom: '', validTo: '', currency: 'EUR', note: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.supplierId || !form.unitPrice) { setError('Fournisseur et prix obligatoires'); return }
    setSaving(true); setError('')
    const res = await fetch('/api/supplier-prices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, articleId, unitPrice: parseFloat(form.unitPrice), qtyMin: form.qtyMin ? parseFloat(form.qtyMin) : null }),
    })
    if (res.ok) {
      const sp = await res.json()
      onAdded(sp)
      setForm({ supplierId: '', unitPrice: '', qtyMin: '', refDevis: '', dateDevis: '', validFrom: '', validTo: '', currency: 'EUR', note: '' })
    } else setError('Erreur')
    setSaving(false)
  }

  return (
    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
      <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Ajouter un tarif</h3>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fournisseur *</label>
          <select value={form.supplierId} onChange={e => set('supplierId')(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
            <option value="">-- choisir --</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Prix unitaire (€) *</label>
          <input type="number" step="0.0001" value={form.unitPrice} onChange={e => set('unitPrice')(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Qte min.</label>
          <input type="number" step="1" value={form.qtyMin} onChange={e => set('qtyMin')(e.target.value)}
            placeholder="sans limite"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Devise</label>
          <select value={form.currency} onChange={e => set('currency')(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
            <option value="EUR">€ EUR</option>
            <option value="USD">$ USD</option>
            <option value="GBP">£ GBP</option>
            <option value="CHF">CHF</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Réf. devis</label>
          <input type="text" value={form.refDevis} onChange={e => set('refDevis')(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date devis</label>
          <input type="date" value={form.dateDevis} onChange={e => set('dateDevis')(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Valide du</label>
          <input type="date" value={form.validFrom} onChange={e => set('validFrom')(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">au</label>
          <input type="date" value={form.validTo} onChange={e => set('validTo')(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        </div>
        <div className="md:col-span-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Note</label>
          <input type="text" value={form.note} onChange={e => set('note')(e.target.value)}
            placeholder="Ex: prix valable si commande groupée, réf. catalogue…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <button onClick={submit} disabled={saving}
          className="px-4 py-2 text-sm bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-60 font-semibold">
          {saving ? 'Ajout…' : 'Ajouter ce tarif'}
        </button>
      </div>
    </div>
  )
}

// — Page principale —

export default function ArticleDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [prices, setPrices] = useState<SupplierPrice[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [showAddPrice, setShowAddPrice] = useState(false)

  useEffect(() => {
    fetch(`/api/articles/${id}`).then(r => r.json()).then(d => {
      setArticle(d)
      // Convertir tous les champs en string pour le formulaire
      const f: Record<string, string> = {}
      for (const k of Object.keys(d)) {
        if (typeof d[k] === 'string' || typeof d[k] === 'number') f[k] = String(d[k] ?? '')
        else if (d[k] === null) f[k] = ''
      }
      setForm(f)
    })
    fetch(`/api/supplier-prices?articleId=${id}`).then(r => r.json()).then(setPrices)
    fetch('/api/fournisseurs').then(r => r.json()).then(setSuppliers)
  }, [id])

  const save = async () => {
    setSaving(true)
    const body: Record<string, unknown> = { ...form }
    for (const k of ['prixAchatRef', 'stockMin', 'stockSecurite']) {
      if (body[k] === '') body[k] = null; else if (body[k]) body[k] = parseFloat(body[k] as string)
    }
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const updated = await res.json()
    setArticle(updated)
    const f: Record<string, string> = {}
    for (const k of Object.keys(updated)) {
      if (typeof updated[k] === 'string' || typeof updated[k] === 'number') f[k] = String(updated[k] ?? '')
      else if (updated[k] === null) f[k] = ''
    }
    setForm(f)
    setEditing(false); setSaving(false)
  }

  const archive = async () => {
    if (!confirm('Archiver cet article ?')) return
    await fetch(`/api/articles/${id}`, { method: 'DELETE' })
    router.push('/articles')
  }

  const deletePrice = useCallback(async (priceId: number) => {
    if (!confirm('Supprimer ce tarif ?')) return
    await fetch(`/api/supplier-prices/${priceId}`, { method: 'DELETE' })
    setPrices(p => p.filter(x => x.id !== priceId))
  }, [])

  if (!article) return <div className="p-8 text-gray-400">Chargement…</div>

  // Champ en lecture seule
  const RF = (label: string, field: string) => <ReadField key={field} label={label} value={article[field as keyof Article] as string} />
  // Champ éditable
  const EF = (label: string, field: string, type = 'text') => (
    <EditField key={field} label={label} type={type}
      value={form[field] ?? ''}
      onChange={v => setForm(p => ({ ...p, [field]: v }))} />
  )

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/articles" className="hover:underline text-teal-700">Articles</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-800 font-semibold">{article.code}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{article.code}{article.indice ? ` (${article.indice})` : ''}</h1>
          <p className="text-gray-600 mt-1">{article.designationFr}</p>
          {!article.isActive && <span className="mt-2 inline-block text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Archivé</span>}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 text-sm bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-60">
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="px-4 py-2 text-sm border border-teal-600 text-teal-700 rounded-lg hover:bg-teal-50">Modifier</button>
              <button onClick={archive} className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Archiver</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Identification</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {editing ? <>
              {EF('Code', 'code')}
              {EF('Indice', 'indice')}
              {EF('État', 'etat')}
              {EF('Famille', 'famille')}
              {EF('Sous-famille', 'sousFamille')}
            </> : <>
              {RF('Code', 'code')}
              {RF('Indice', 'indice')}
              {RF('État', 'etat')}
              {RF('Famille', 'famille')}
              {RF('Sous-famille', 'sousFamille')}
              {RF('Type produit', 'typeProduit')}
            </>}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Désignations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editing ? <>
              {EF('Désignation FR', 'designationFr')}
              {EF('Désignation EN', 'designationEn')}
            </> : <>
              {RF('Désignation FR', 'designationFr')}
              {RF('Désignation EN', 'designationEn')}
            </>}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Caractéristiques physiques</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {editing ? <>
              {EF('Diamètre', 'diametre')}
              {EF('Longueur', 'longueur')}
              {EF('Largeur', 'largeur')}
              {EF('Autre carac.', 'autreCarac')}
            </> : <>
              {RF('Diamètre', 'diametre')}
              {RF('Longueur', 'longueur')}
              {RF('Largeur', 'largeur')}
              {RF('Autre carac.', 'autreCarac')}
            </>}
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Stock</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {editing ? <>
              {EF('Stock minimum', 'stockMin', 'number')}
              {EF('Stock sécurité', 'stockSecurite', 'number')}
            </> : <>
              {RF('Stock minimum', 'stockMin')}
              {RF('Stock sécurité', 'stockSecurite')}
            </>}
          </div>
        </section>

        {/* Section commentaire */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Commentaire</h2>
          {editing
            ? <textarea value={form.commentaire ?? ''} rows={3}
                onChange={e => setForm(p => ({ ...p, commentaire: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
            : <p className="text-sm text-gray-700">{article.commentaire || <span className="text-gray-400">—</span>}</p>
          }
        </section>

        {/* Tarifs fournisseurs */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Tarifs fournisseurs ({prices.length})</h2>
            <button onClick={() => setShowAddPrice(p => !p)}
              className="text-sm text-teal-700 border border-teal-600 px-3 py-1 rounded-lg hover:bg-teal-50">
              {showAddPrice ? 'Annuler' : '+ Ajouter un tarif'}
            </button>
          </div>

          {prices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  {['Fournisseur', 'Prix unit.', 'Qte min', 'Réf. devis', 'Date devis', 'Validité', ''].map(h => (
                    <th key={h} className="text-left pb-2 text-xs text-gray-500 uppercase pr-4">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {prices.map(sp => <PriceRow key={sp.id} sp={sp} onDelete={deletePrice} />)}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucun tarif fournisseur enregistré.</p>
          )}

          {showAddPrice && (
            <AddPriceForm
              articleId={article.id}
              suppliers={suppliers}
              onAdded={sp => { setPrices(p => [...p, sp]); setShowAddPrice(false) }}
            />
          )}
        </section>

        {/* Lots disponibles */}
        {article.lots.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Lots disponibles ({article.lots.length})</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                {['N° lot', 'Quantité', 'Statut', 'Reçu le'].map(h => (
                  <th key={h} className="text-left pb-2 text-xs text-gray-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {article.lots.map(lot => (
                  <tr key={lot.id}>
                    <td className="py-2 font-mono text-xs">{lot.lotNumber}</td>
                    <td className="py-2 tabular-nums">{Number(lot.quantity).toFixed(3)}</td>
                    <td className="py-2"><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{lot.status}</span></td>
                    <td className="py-2 text-gray-500">{lot.receivedAt ? new Date(lot.receivedAt).toLocaleDateString('fr-FR') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </main>
  )
}
