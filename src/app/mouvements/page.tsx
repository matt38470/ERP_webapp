import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function MouvementsPage() {
  const derniersMouvements = await prisma.movement.findMany({
    take: 50,
    orderBy: { movedAt: "desc" },
    include: {
      item: { select: { code: true, designationFr: true } },
      lot: { select: { lotNumber: true } },
    },
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Titre */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mouvements de stock</h1>
      </div>

      {/* 4 boutons d'action */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Link href="/mouvements/entree/new"
          className="flex flex-col items-center justify-center gap-2 bg-green-50 border-2 border-green-400 text-green-700 rounded-xl p-5 hover:bg-green-100 hover:border-green-500 transition-all group">
          <span className="text-3xl">📥</span>
          <span className="font-bold text-sm text-center">Réception fournisseur</span>
          <span className="text-xs text-green-500 text-center">Entrée en stock</span>
        </Link>

        <Link href="/mouvements/vente/new"
          className="flex flex-col items-center justify-center gap-2 bg-blue-50 border-2 border-blue-400 text-blue-700 rounded-xl p-5 hover:bg-blue-100 hover:border-blue-500 transition-all group">
          <span className="text-3xl">📦</span>
          <span className="font-bold text-sm text-center">Expédition client</span>
          <span className="text-xs text-blue-500 text-center">Sortie sur vente</span>
        </Link>

        <Link href="/mouvements/transfert/new"
          className="flex flex-col items-center justify-center gap-2 bg-orange-50 border-2 border-orange-400 text-orange-700 rounded-xl p-5 hover:bg-orange-100 hover:border-orange-500 transition-all group">
          <span className="text-3xl">🔄</span>
          <span className="font-bold text-sm text-center">Transfert de stock</span>
          <span className="text-xs text-orange-500 text-center">Ex : Fini → Démo</span>
        </Link>

        <Link href="/mouvements/autres/new"
          className="flex flex-col items-center justify-center gap-2 bg-purple-50 border-2 border-purple-400 text-purple-700 rounded-xl p-5 hover:bg-purple-100 hover:border-purple-500 transition-all group">
          <span className="text-3xl">🚀</span>
          <span className="font-bold text-sm text-center">Autres sorties</span>
          <span className="text-xs text-purple-500 text-center">Congrès, démo, prêt…</span>
        </Link>
      </div>

      {/* Liste des derniers mouvements */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700 text-sm">Derniers mouvements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Direction</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Article</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Lot</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Qté</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Référence</th>
              </tr>
            </thead>
            <tbody>
              {derniersMouvements.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">Aucun mouvement enregistré</td></tr>
              )}
              {derniersMouvements.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(m.movedAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                      m.direction === "ENTREE"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {m.direction === "ENTREE" ? "▲ Entrée" : "▼ Sortie"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.type}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-semibold text-gray-800">{m.item.code}</span>
                    <span className="text-gray-500 ml-2 text-xs">{m.item.designationFr}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{m.lot?.lotNumber ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    <span className={m.direction === "ENTREE" ? "text-green-600" : "text-red-600"}>
                      {m.direction === "ENTREE" ? "+" : "-"}{Number(m.quantity)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{m.referenceId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
