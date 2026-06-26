'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Article = {
  id: number; code: string; indice: string | null; designationFr: string; designationEn: string | null
  etat: string | null; famille: string | null; sousFamille: string | null
  diametre: string | null; longueur: string | null; largeur: string | null; autreCarac: string | null
  typeProduit: string | null; prixAchatRef: string | null; stockMin: string | null; stockSecurite: string | null
  commentaire: string | null; isActive: boolean; type: string; createdAt: string
  lots: { id: number; lotNumber: string; quantity: string; status: string; receivedAt: string | null }[]
}

export default function ArticleDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Article>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/articles/${id}`).then(r => r.json()).then(d => {
      setArticle(d)
      setForm(d)
    })
  }, [id])

  const save = async () => {
    setSaving(true)
    const res = await fetch(`/api/articles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const updated = await res.json()
    setArticle(updated)
    setForm(updated)
    setEditing(false)
    setSaving(false)
  }

  const archive = async () => {
    if (!confirm('Archiver cet article ?')) return
    await fetch(`/api/articles/${id}`, { method: 'DELETE' })
    router.push('/articles')
  }

  if (!article) return <div className="p-8 text-gray-400">Chargement…</div>

  const F = ({ label, field, type = 'text' }: { label: string; field: keyof Article; type?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {editing
        ? <input type={type} value={(form[field] as string) ?? ''}
            onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        : <p className="text-sm text-gray-800">{(article[field] as string) || <span className="text-gray-400">—</span>}</p>
      }
    </div>
  )

  return (
    <main className="p-8 max-w-5xl mx-auto">
      {/* Fil d'ariane */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/articles" className="hover:underline text-teal-700">Articles</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-800 font-semibold">{article.code}</span>
      </div>

      {/* Header fiche */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{article.code} {article.indice ? `(${article.indice})` : ''}</h1>
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
        {/* Identification */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Identification</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <F label="Code" field="code" />
            <F label="Indice" field="indice" />
            <F label="État" field="etat" />
            <F label="Famille" field="famille" />
            <F label="Sous-famille" field="sousFamille" />
            <F label="Type produit" field="typeProduit" />
          </div>
        </section>

        {/* Désignations */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Désignations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <F label="Désignation FR" field="designationFr" />
            <F label="Désignation EN" field="designationEn" />
          </div>
        </section>

        {/* Caractéristiques physiques */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Caractéristiques physiques</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <F label="Diamètre" field="diametre" />
            <F label="Longueur" field="longueur" />
            <F label="Largeur" field="largeur" />
            <F label="Autre carac." field="autreCarac" />
          </div>
        </section>

        {/* Prix & Stock */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Prix & Stock</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <F label="Prix achat réf. (€)" field="prixAchatRef" type="number" />
            <F label="Stock minimum" field="stockMin" type="number" />
            <F label="Stock sécurité" field="stockSecurite" type="number" />
          </div>
        </section>

        {/* Commentaire */}
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Commentaire</h2>
          {editing
            ? <textarea value={form.commentaire ?? ''} rows={3}
                onChange={e => setForm(p => ({ ...p, commentaire: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
            : <p className="text-sm text-gray-700">{article.commentaire || <span className="text-gray-400">—</span>}</p>
          }
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
