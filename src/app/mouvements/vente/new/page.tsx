"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Client = { id: number; etablissement: string | null; nom: string | null; prenom: string | null; code: string };
type CommandeC = {
  id: number;
  number: string;
  customer: Client;
  lines: { id: number; item: { id: number; code: string; designationFr: string; indice: string | null }; qty: number; ral: number }[];
};
type Ligne = {
  lineId: number;
  itemId: number;
  code: string;
  designation: string;
  indice: string;
  ral: number;
  qtyExpediee: number;
  lotNumber: string;
  checked: boolean;
};

export default function VenteStockPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [commandes, setCommandes] = useState<CommandeC[]>([]);
  const [selectedCommandeId, setSelectedCommandeId] = useState("");
  const [commande, setCommande] = useState<CommandeC | null>(null);
  const [lignes, setLignes] = useState<Ligne[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [commentaire, setCommentaire] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/clients?limit=500").then((r) => r.json()).then((d) => setClients(d.data ?? d)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedClientId) { setCommandes([]); return; }
    fetch(`/api/mouvements/commandes-client?customerId=${selectedClientId}`)
      .then((r) => r.json()).then(setCommandes).catch(() => {});
  }, [selectedClientId]);

  useEffect(() => {
    if (!selectedCommandeId) { setCommande(null); setLignes([]); return; }
    const cde = commandes.find((c) => String(c.id) === selectedCommandeId);
    if (!cde) return;
    setCommande(cde);
    setLignes(
      cde.lines
        .filter((l) => l.ral > 0)
        .map((l) => ({
          lineId: l.id,
          itemId: l.item.id,
          code: l.item.code,
          designation: l.item.designationFr,
          indice: l.item.indice ?? "",
          ral: l.ral,
          qtyExpediee: l.ral,
          lotNumber: "",
          checked: true,
        }))
    );
  }, [selectedCommandeId, commandes]);

  const updateLigne = (idx: number, field: keyof Ligne, value: any) => {
    setLignes((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  const lignesSelectionnees = lignes.filter((l) => l.checked && l.qtyExpediee > 0);

  const valider = async () => {
    if (!commande) return;
    if (lignesSelectionnees.length === 0) { setError("Aucune ligne cochée."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/mouvements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: "SORTIE",
          type: "ISSUE",
          date,
          numCommande: commande.number,
          commentaire,
          lignes: lignesSelectionnees.map((l) => ({
            articleId: l.itemId,
            qty: l.qtyExpediee,
            lotNumber: l.lotNumber,
            unitCost: "",
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
      setSuccess(`✅ Expédition enregistrée — N° ${data.numero}`);
      setSelectedCommandeId(""); setCommande(null); setLignes([]);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expédition client</h1>
          <p className="text-sm text-gray-500 mt-1">Sortie de stock sur commande client</p>
        </div>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800">← Retour</button>
      </div>

      {/* Sélection client + commande */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Commande client</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Client</label>
            <select value={selectedClientId} onChange={(e) => { setSelectedClientId(e.target.value); setSelectedCommandeId(""); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Choisir --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.etablissement ?? `${c.prenom ?? ""} ${c.nom ?? ""}`.trim()} ({c.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Commande</label>
            <select value={selectedCommandeId} onChange={(e) => setSelectedCommandeId(e.target.value)}
              disabled={!selectedClientId}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40">
              <option value="">-- Choisir --</option>
              {commandes.map((c) => (
                <option key={c.id} value={c.id}>{c.number}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date d'expédition</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        {commande && (
          <div className="mt-3 text-xs text-gray-500">
            Client : <strong className="text-gray-700">{commande.customer.etablissement ?? commande.customer.nom}</strong>
            <span className="mx-2 text-gray-300">|</span>
            {lignes.length} ligne(s) — RAL total : {lignes.reduce((s, l) => s + l.ral, 0)} pièce(s)
          </div>
        )}
      </div>

      {/* Tableau de pointage */}
      {lignes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Articles à expédier (RAL)</h2>
            <div className="flex gap-3">
              <button onClick={() => setLignes((prev) => prev.map((l) => ({ ...l, checked: true })))} className="text-xs text-blue-600 hover:underline">Tout cocher</button>
              <button onClick={() => setLignes((prev) => prev.map((l) => ({ ...l, checked: false })))} className="text-xs text-gray-400 hover:underline">Tout décocher</button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Désignation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Ind.</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">RAL</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Qté expédiée</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Lot</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={l.lineId} className={`border-b border-gray-50 ${l.checked ? "bg-white" : "bg-gray-50 opacity-50"}`}>
                  <td className="px-4 py-3 text-center">
                    <input type="checkbox" checked={l.checked} onChange={(e) => updateLigne(i, "checked", e.target.checked)} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">{l.code}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs"><span className="line-clamp-2">{l.designation}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{l.indice}</td>
                  <td className="px-4 py-3 text-right text-orange-600 font-semibold tabular-nums">{l.ral}</td>
                  <td className="px-4 py-3">
                    <input type="number" value={l.qtyExpediee} onChange={(e) => updateLigne(i, "qtyExpediee", Number(e.target.value))}
                      disabled={!l.checked} min={0} max={l.ral}
                      className="w-20 border border-gray-200 rounded-lg px-2 py-1 text-right text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="text" value={l.lotNumber} onChange={(e) => updateLigne(i, "lotNumber", e.target.value)}
                      disabled={!l.checked} placeholder="lot"
                      className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lignes.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <label className="block text-xs font-medium text-gray-600 mb-1">Commentaire</label>
          <input type="text" value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
            placeholder="N° BL, transporteur…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">⚠ {error}</div>}
      {success && <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-4 py-3 text-sm">{success}</div>}

      {lignes.length > 0 && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">{lignesSelectionnees.length} / {lignes.length} ligne(s) à expédier</span>
          <div className="flex gap-3">
            <button onClick={() => router.back()} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">Annuler</button>
            <button onClick={valider} disabled={loading || lignesSelectionnees.length === 0}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
              {loading ? "Enregistrement…" : `✓ Valider l'expédition (${lignesSelectionnees.length} art.)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
