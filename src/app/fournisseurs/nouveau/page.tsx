'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NouveauFournisseurPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    code: '', name: '', address: '', cp: '', city: '',
    phone: '', email: '', contact1: '', phone1: '', email1: '',
    langue: 'FR', delaiHabituel: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const submit = async () => {
    if (!form.code || !form.name) { setError('Le code et le nom sont obligatoires'); return }
    setSaving(true); setError('')
    const body: Record<string, unknown> = { ...form }
    if (body.delaiHabituel === '') delete body.delaiHabituel
    else if (body.delaiHabituel) body.delaiHabituel = parseInt(body.delaiHabituel as string)
    for (const k of ['address', 'cp', 'city', 'phone', 'email', 'contact1', 'phone1', 'email1']) {
      if (body[k] === '') body[k] = null
    }
    const res = await fetch('/api/fournisseurs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const f = await res.json()
      router.push(`/fournisseurs/${f.id}`)
    } else {
      setError('Erreur lors de la création'); setSaving(false)
    }
  }

  const F = ({ label, k, required = false, type = 'text' }: { label: string; k: string; required?: boolean; type?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input type={type} value={(form as any)[k]} onChange={e => set(k, e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
    </div>
  )

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/fournisseurs" className="hover:underline text-teal-700">Fournisseurs</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-800 font-semibold">Nouveau fournisseur</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Créer un fournisseur</h1>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div className="space-y-6">
        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Identité</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <F label="Code" k="code" required />
            <F label="Nom" k="name" required />
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Langue</label>
              <select value={form.langue} onChange={e => set('langue', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
                <option value="FR">FR</option>
                <option value="EN">EN</option>
                <option value="DE">DE</option>
                <option value="ES">ES</option>
              </select>
            </div>
            <F label="Délai habituel (jours)" k="delaiHabituel" type="number" />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Coordonnées</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="col-span-2 md:col-span-3"><F label="Adresse" k="address" /></div>
            <F label="Code postal" k="cp" />
            <F label="Ville" k="city" />
            <F label="Téléphone" k="phone" />
            <F label="Email" k="email" />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Contact secondaire</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <F label="Nom contact" k="contact1" />
            <F label="Tél." k="phone1" />
            <F label="Email" k="email1" />
          </div>
        </section>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Link href="/fournisseurs" className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Annuler</Link>
        <button onClick={submit} disabled={saving}
          className="px-6 py-2 text-sm bg-teal-700 text-white rounded-lg hover:bg-teal-800 disabled:opacity-60 font-semibold">
          {saving ? 'Création…' : 'Créer le fournisseur'}
        </button>
      </div>
    </main>
  )
}
