'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Client = {
  id: number; code: string; prenom: string | null; nom: string | null
  etablissement: string | null; phone: string | null; email: string | null; langue: string | null; numTVA: string | null
  adresseLivraison: string | null; cpLivraison: string | null; villeLivraison: string | null
  adresseFacturation: string | null; cpFacturation: string | null; villeFacturation: string | null
  contactBL: string | null; telBL: string | null; contactFact: string | null; telFact: string | null
  fraisDePort: string | null; codeTarif: string | null; isActive: boolean
  country: { name: string } | null
  orders: { id: number; number: string; status: string; createdAt: string; prixTotal: string | null }[]
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Partial<Client>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/clients/${id}`).then(r => r.json()).then(d => {
      setClient(d); setForm(d)
    })
  }, [id])

  const save = async () => {
    setSaving(true)
    const { country, orders, ...data } = form as any
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const updated = await res.json()
    setClient(c => ({ ...c!, ...updated }))
    setEditing(false); setSaving(false)
  }

  const archive = async () => {
    if (!confirm('Archiver ce client ?')) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    router.push('/clients')
  }

  if (!client) return <div className="p-8 text-gray-400">Chargement…</div>

  const F = ({ label, field, type = 'text' }: { label: string; field: keyof Client; type?: string }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {editing
        ? <input type={type} value={(form[field] as string) ?? ''}
            onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        : <p className="text-sm text-gray-800">{(client[field] as string) || <span className="text-gray-400">—</span>}</p>
      }
    </div>
  )

  const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600', CONFIRMED: 'bg-blue-100 text-blue-700',
    DELIVERED: 'bg-green-100 text-green-700', INVOICED: 'bg-purple-100 text-purple-700',
    CLOSED: 'bg-gray-200 text-gray-500',
  }

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/clients" className="hover:underline text-teal-700">Clients</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-800 font-semibold">{client.code}</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{client.etablissement || `${client.prenom ?? ''} ${client.nom ?? ''}`.trim() || client.code}</h1>
          <p className="text-gray-500 text-sm mt-1">Code : {client.code} {client.langue && `· ${client.langue}`}</p>
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
            <F label="Code" field="code" />
            <F label="Prénom" field="prenom" />
            <F label="Nom" field="nom" />
            <F label="Établissement" field="etablissement" />
            <F label="Téléphone" field="phone" />
            <F label="Email" field="email" />
            <F label="Langue" field="langue" />
            <F label="N° TVA" field="numTVA" />
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Adresse de livraison</h2>
            <div className="grid grid-cols-1 gap-4">
              <F label="Adresse" field="adresseLivraison" />
              <div className="grid grid-cols-2 gap-4">
                <F label="CP" field="cpLivraison" />
                <F label="Ville" field="villeLivraison" />
              </div>
              <F label="Contact BL" field="contactBL" />
              <F label="Tél. BL" field="telBL" />
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Adresse de facturation</h2>
            <div className="grid grid-cols-1 gap-4">
              <F label="Adresse" field="adresseFacturation" />
              <div className="grid grid-cols-2 gap-4">
                <F label="CP" field="cpFacturation" />
                <F label="Ville" field="villeFacturation" />
              </div>
              <F label="Contact fact." field="contactFact" />
              <F label="Tél. fact." field="telFact" />
            </div>
          </section>
        </div>

        <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Paramètres commerciaux</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <F label="Code tarif" field="codeTarif" />
            <F label="Frais de port (€)" field="fraisDePort" type="number" />
          </div>
        </section>

        {client.orders.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4">Commandes ({client.orders.length})</h2>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                {['N° commande', 'Statut', 'Montant', 'Date'].map(h => (
                  <th key={h} className="text-left pb-2 text-xs text-gray-500 uppercase">{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {client.orders.map(o => (
                  <tr key={o.id}>
                    <td className="py-2">
                      <Link href={`/commandes/${o.id}`} className="text-teal-700 hover:underline font-medium">{o.number}</Link>
                    </td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>{o.status}</span>
                    </td>
                    <td className="py-2 tabular-nums text-gray-700">
                      {o.prixTotal != null ? Number(o.prixTotal).toFixed(2) + ' €' : '—'}
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
