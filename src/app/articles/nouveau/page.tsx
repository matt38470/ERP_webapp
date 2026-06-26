'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Champs simples — définis HORS du composant pour éviter le bug de perte de focus
function TextField({ label, value, onChange, required, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void
  required?: boolean; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
    </div>
  )
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { v: string; l: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  )
}

type FormState = {
  code: string; indice: string; designationFr: string; designationEn: string
  etat: string; famille: string; sousFamille: string; type: string; typeProduit: string
  diametre: string; longueur: string; largeur: string; autreCarac: string
  prixAchatRef: string; stockMin: string; stockSecurite: string; commentaire: string
}

export default function NouvelArticlePage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    code: '', indice: '', designationFr: '', designationEn: '',
    etat: '', famille: '', sousFamille: '', type: 'SIMPLE', typeProduit: 'FINI',
    diametre: '', longueur: '', largeur: '', autreCarac: '',
    prixAchatRef: '', stockMin: '', stockSecurite: '', commentaire: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof FormState) => (v: string) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.code) { setError('Le code est obligatoire'); return }
    setSaving(true); setError('')
    const body: Record<string, unknown> = { ...form }
    for (const k of ['prixAchatRef', 'stockMin', 'stockSecurite']) {
      if (body[k] === '') delete body[k]; else body[k] = parseFloat(body[k] as string)
    }
    for (const k of ['indice','designationEn','etat','famille','sousFamille','diametre','longueur','largeur','autreCarac','commentaire']) {
      if (body[k] === '') body[k] = null
    }
    const res = await fetch('/api/articles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) { const art = await res.json(); router.push(`/articles/${art.id}`) }
    else { setError('Erreur lors de la création'); setSaving(false) }
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/articles" className="hover:underline text-teal-700">Articles</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-800 font-semibold">Nouvel article</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Créer un article</h1>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="space-y-6">
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Identification</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TextField label="Code" value={form.code} onChange={set('code')} required />
            <TextField label="Indice" value={form.indice} onChange={set('indice')} />
            <TextField label="État" value={form.etat} onChange={set('etat')} />
            <SelectField label="Type article" value={form.type} onChange={set('type')} options={[
              { v: 'SIMPLE', l: 'Simple' }, { v: 'KIT', l: 'Kit' }, { v: 'COMPONENT', l: 'Composant' }
            ]} />
            <SelectField label="Type produit" value={form.typeProduit} onChange={set('typeProduit')} options={[
              { v: 'FINI', l: 'Fini' }, { v: 'EBAUCHE', l: 'Ébauche' },
              { v: 'MATIERE_PREMIERE', l: 'Matière première' }, { v: 'DEMO', l: 'Démo' }
            ]} />
            <TextField label="Famille" value={form.famille} onChange={set('famille')} />
            <TextField label="Sous-famille" value={form.sousFamille} onChange={set('sousFamille')} />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Désignations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField label="Désignation FR" value={form.designationFr} onChange={set('designationFr')} required />
            <TextField label="Désignation EN" value={form.designationEn} onChange={set('designationEn')} />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Caractéristiques physiques</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <TextField label="Diamètre" value={form.diametre} onChange={set('diametre')} />
            <TextField label="Longueur" value={form.longueur} onChange={set('longueur')} />
            <TextField label="Largeur" value={form.largeur} onChange={set('largeur')} />
            <TextField label="Autre carac." value={form.autreCarac} onChange={set('autreCarac')} />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Stock</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <TextField label="Stock minimum" value={form.stockMin} onChange={set('stockMin')} type="number" />
            <TextField label="Stock sécurité" value={form.stockSecurite} onChange={set('stockSecurite')} type="number" />
          </div>
          <p className="text-xs text-gray-400 mt-3">ℹ️ Le prix d'achat fournisseur se configure après la création de l'article, dans l'onglet « Tarifs fournisseurs » de la fiche article.</p>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Commentaire</h2>
          <textarea value={form.commentaire} rows={3}
            onChange={e => setForm(p => ({ ...p, commentaire: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        </section>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Link href="/articles" className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</Link>
        <button onClick={submit} disabled={saving}
          className="px-6 py-2 text-sm bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-60 font-semibold">
          {saving ? 'Création…' : "Créer l'article"}
        </button>
      </div>
    </main>
  )
}
