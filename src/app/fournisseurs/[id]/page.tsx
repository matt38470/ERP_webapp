'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Fournisseur = {
  id: number; code: string; name: string; address: string | null; cp: string | null; city: string | null
  phone: string | null; email: string | null; contact1: string | null; phone1: string | null; email1: string | null
  langue: string | null; delaiHabituel: number | null; isActive: boolean
  country: { name: string } | null
  purchaseOrders: { id: number; number: string; status: string; createdAt: string }[]
}

export default function FournisseurDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [f, setF] = useState<Fournisseur | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Fournisseur>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/fournisseurs/${id}`).then(r => r.json()).then(d => { setF(d); setForm(d) })
  }, [id])

  const save = async () => {
    setSaving(true)
    const { country, purchaseOrders, ...data } = form as any
    const res = await fetch(`/api/fournisseurs/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const updated = await res.json()
    setF(x => ({ ...x!, ...updated }))
    setEditing(false); setSaving(false)
  }

  const archive = async () => {
    if (!confirm('Archiver ce fournisseur ?')) return
    await fetch(`/api/fournisseurs/${id}`, { method: 'DELETE' })
    router.push('/fournisseurs')
  }

  if (!f) return <div className="p-8 text-gray-400">Chargement…</div>

  const Fld = ({ label, field, type = 'text' }: { label: string; field: keyof Fournisseur; type?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {editing
        ? <input type={type} value={(form[field] as string) ?? ''}
            onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        : <p className="text-sm text-gray-800">{(f[field] as string) || <span className="text-gray-400">—</span>}</p>
      }
    </div>
  )

  const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600', CONFIRMED: 'bg-blue-100 text-blue-700',
    DELIVERED: 'bg-green-100 text-green-700', CLOSED: 'bg-gray-200 text-gray-500',
  }

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/fournisseurs" className="hover:underline text-teal-700">Fournisseurs</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-800 font-semibold">{f.code}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{f.name}</h1>
          <p className="text-gray-500 text-sm mt-1">Code : {f.code} {f.langue && `· ${f.langue}`}</p>
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
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Identité</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Fld label="Code" field="code" />
            <Fld label="Nom" field="name" />
            <Fld label="Langue" field="langue" />
            <Fld label="Délai habituel (j)" field="delaiHabituel" type="number" />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Coordonnées</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Fld label="Adresse" field="address" />
            <Fld label="CP" field="cp" />
            <Fld label="Ville" field="city" />
            <Fld label="Téléphone" field="phone" />
            <Fld label="Email" field="email" />
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Contact secondaire</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Fld label="Contact" field="contact1" />
            <Fld label="Tél." field="phone1" />
            <Fld label="Email" field="email1" />
          </div>
        </section>

        {f.purchaseOrders.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Commandes fournisseur ({f.purchaseOrders.length})</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                {['N° commande', 'Statut', 'Date'].map(h => (
                  <th key={h} className="text-left pb-2 text-xs text-gray-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {f.purchaseOrders.map(o => (
                  <tr key={o.id}>
                    <td className="py-2 font-medium text-teal-700">{o.number}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                    </td>
                    <td className="py-2 text-gray-500">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
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
