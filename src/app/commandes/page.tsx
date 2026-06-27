import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  DRAFT:               'Brouillon',
  CONFIRMED:           'Confirmée',
  PARTIALLY_DELIVERED: 'Livraison partielle',
  DELIVERED:           'Livrée',
  INVOICED:            'Facturée',
  CLOSED:              'Clôturée',
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT:               'bg-gray-100 text-gray-600',
  CONFIRMED:           'bg-blue-100 text-blue-700',
  PARTIALLY_DELIVERED: 'bg-orange-100 text-orange-700',
  DELIVERED:           'bg-green-100 text-green-700',
  INVOICED:            'bg-purple-100 text-purple-700',
  CLOSED:              'bg-gray-200 text-gray-500',
}

export default async function CommandesPage() {
  const [purchaseOrders, salesOrders] = await Promise.all([
    prisma.purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { supplier: { select: { name: true } }, lines: true },
    }),
    prisma.salesOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { customer: { select: { etablissement: true, nom: true, prenom: true } }, lines: true },
    }),
  ])

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commandes</h1>
          <p className="text-gray-500 mt-1">Gestion des commandes clients et fournisseurs</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/commandes/fournisseur/nouvelle"
            className="px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors"
          >
            + Commande fournisseur
          </Link>
          <Link
            href="/commandes/client/nouvelle"
            className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            + Commande client
          </Link>
        </div>
      </div>

      {/* Commandes fournisseur */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Commandes fournisseur</h2>
        {purchaseOrders.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-400">
            Aucune commande fournisseur.{' '}
            <Link href="/commandes/fournisseur/nouvelle" className="text-teal-700 underline">Créer la première</Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">N°</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Fournisseur</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Livraison prévue</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Lignes</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchaseOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-teal-700">{o.number}</td>
                    <td className="px-4 py-3 text-gray-700">{o.supplier?.name ?? <span className="text-gray-400">—</span>}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {o.dateLivraisonPrevue ? new Date(o.dateLivraisonPrevue).toLocaleDateString('fr-FR') : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{o.lines.length}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[o.status]}`}>
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Commandes client */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Commandes client</h2>
        {salesOrders.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-400">
            Aucune commande client.{' '}
            <Link href="/commandes/client/nouvelle" className="text-blue-700 underline">Créer la première</Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">N°</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Réf. client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Lignes</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salesOrders.map((o) => {
                  const clientName = o.customer
                    ? (o.customer.etablissement || [o.customer.prenom, o.customer.nom].filter(Boolean).join(' ') || '—')
                    : '—'
                  return (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-blue-700">{o.number}</td>
                      <td className="px-4 py-3 text-gray-700">{clientName}</td>
                      <td className="px-4 py-3 text-gray-500">{o.referenceClient ?? <span className="text-gray-300">—</span>}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3 text-gray-500">{o.lines.length}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[o.status]}`}>
                          {STATUS_LABEL[o.status] ?? o.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
