"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Ligne = {
  lineId: number;
  itemId: number;
  code: string;
  designation: string;
  indice: string;
  qtyAttendue: number;
  qtyRecue: number;
  lotNumber: string;
  unitPrice: number | "";
  checked: boolean;
};

type CommandeF = {
  id: number;
  number: string;
  supplier: { id: number; name: string; code: string };
  dateLivraisonPrevue: string | null;
  lines: {
    id: number;
    item: { id: number; code: string; designationFr: string; indice: string | null };
    qty: number;
    qtyDone: number;
    unitPrice: number | null;
  }[];
};

export default function EntreeStockPage() {
  const router = useRouter();
  const [commandes, setCommandes] = useState<CommandeF[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [commande, setCommande] = useState<CommandeF | null>(null);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/mouvements/commandes-fournisseur")
      .then((r) => r.json())
      .then(setCommandes)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) { setCommande(null); setLignes([]); return; }
    const cde = commandes.find((c) => String(c.id) === selectedId);
    if (!cde) return;
    setCommande(cde);
    setLignes(
      cde.lines
        .filter((l) => l.qty - l.qtyDone > 0)
        .map((l) => ({
          lineId: l.id,
          itemId: l.item.id,
          code: l.item.code,
          designation: l.item.designationFr,
          indice: l.item.indice ?? "",
          qtyAttendue: l.qty - l.qtyDone,
          qtyRecue: l.qty - l.qtyDone,
          lotNumber: "",
          unitPrice: l.unitPrice ?? "",
          checked: true,
        }))
    );
  }, [selectedId, commandes]);

  const updateLigne = (idx: number, field: keyof Ligne, value: any) => {
    setLignes((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const lignesSelectionnees = lignes.filter((l) => l.checked && l.qtyRecue > 0);

  const valider = async () => {
    if (!commande) return;
    if (lignesSelectionnees.length === 0) { setError("Aucune ligne cochée."); return; }
    const lignesSansLot = lignesSelectionnees.filter((l) => !l.lotNumber.trim());
    if (lignesSansLot.length > 0) {
      setError(`Numéro de lot manquant pour : ${lignesSansLot.map((l) => l.code).join(", ")}`);
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/mouvements/reception", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId: commande.id,
          commandeNumber: commande.number,
          date,
          commentaire,
          lignes: lignesSelectionnees.map((l) => ({
            lineId: l.lineId,
            articleId: l.itemId,
            qty: l.qtyRecue,
            lotNumber: l.lotNumber.trim(),
            unitCost: l.unitPrice,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
      setSuccess(`✅ Réception enregistrée — N° ${data.numero} (${data.count} article(s))`);
      setSelectedId("");
      setCommande(null);
      setLignes([]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réception fournisseur</h1>
          <p className="text-sm text-gray-500 mt-1">Pointage des articles reçus sur commande</p>
        </div>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800">← Retour</button>
      </div>

      {/* Sélection commande */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Commande fournisseur</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Sélectionner une commande</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">-- Choisir --</option>
              {commandes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.number} — {c.supplier.name}
                  {c.dateLivraisonPrevue ? ` (livr. prévue : ${new Date(c.dateLivraisonPrevue).toLocaleDateString("fr-FR")})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date de réception</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        {commande && (
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
            <span>Fournisseur : <strong className="text-gray-700">{commande.supplier.name}</strong></span>
            <span className="text-gray-300">|</span>
            <span>Commande : <strong className="text-gray-700">{commande.number}</strong></span>
            <span className="text-gray-300">|</span>
            <span>{lignes.length} ligne(s) en attente</span>
          </div>
        )}
      </div>

      {/* Tableau de pointage */}
      {lignes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pointage des lignes</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setLignes((prev) => prev.map((l) => ({ ...l, checked: true })))}
                className="text-xs text-green-600 hover:underline"
              >
                Tout cocher
              </button>
              <button
                onClick={() => setLignes((prev) => prev.map((l) => ({ ...l, checked: false })))}
                className="text-xs text-gray-400 hover:underline"
              >
                Tout décocher
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Désignation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Ind.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Qté attendue</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Qté reçue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">N° Lot *</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Prix unit. (€)</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr
                  key={l.lineId}
                  className={`border-b border-gray-50 transition-colors ${
                    l.checked ? "bg-white" : "bg-gray-50 opacity-50"
                  }`}
                >
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={l.checked}
                      onChange={(e) => updateLigne(i, "checked", e.target.checked)}
                      className="w-4 h-4 accent-green-600 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">{l.code}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs">
                    <span className="line-clamp-2">{l.designation}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{l.indice}</td>
                  <td className="px-4 py-3 text-right text-gray-400 tabular-nums">{l.qtyAttendue}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={l.qtyRecue}
                      onChange={(e) => updateLigne(i, "qtyRecue", Number(e.target.value))}
                      disabled={!l.checked}
                      min={0}
                      className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-40"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={l.lotNumber}
                      onChange={(e) => updateLigne(i, "lotNumber", e.target.value)}
                      disabled={!l.checked}
                      placeholder="ex : A1, 2024-01"
                      className="w-28 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-40"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={l.unitPrice}
                      onChange={(e) => updateLigne(i, "unitPrice", e.target.value === "" ? "" : Number(e.target.value))}
                      disabled={!l.checked}
                      step="0.01"
                      className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-40"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Commentaire */}
      {lignes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-xs font-medium text-gray-600 mb-1">Commentaire (optionnel)</label>
          <input
            type="text"
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Référence BL fournisseur, remarque…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      )}

      {/* Messages */}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">⚠ {error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">{success}</div>}

      {/* Actions */}
      {lignes.length > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {lignesSelectionnees.length} / {lignes.length} ligne(s) à réceptionner
          </span>
          <div className="flex gap-3">
            <button onClick={() => router.back()} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">
              Annuler
            </button>
            <button
              onClick={valider}
              disabled={loading || lignesSelectionnees.length === 0}
              className="px-8 py-3 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {loading ? "Enregistrement…" : `✓ Valider la réception (${lignesSelectionnees.length} art.)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
