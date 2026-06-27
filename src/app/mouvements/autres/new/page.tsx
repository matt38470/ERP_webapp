"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const MOTIFS = [
  { value: "DEMO_OUT",    label: "Envoi démo / congrès", icon: "🎪", desc: "Implants envoyés à un distributeur ou congrès" },
  { value: "LOAN_OUT",    label: "Prêt (retour prévu)",  icon: "🔄", desc: "Matériel prêté avec retour attendu" },
  { value: "ADJUSTMENT",  label: "Ajustement / Perte",   icon: "⚖️", desc: "Correction d'inventaire, casse, perte" },
];

type Article = { id: number; code: string; designationFr: string; indice: string | null };
type LignePanier = { articleId: number; code: string; designation: string; indice: string; qty: number; lotNumber: string; unitCost: number | "" };

export default function AutresSortiesPage() {
  const router = useRouter();
  const [motif, setMotif] = useState("");
  const [destinataire, setDestinataire] = useState("");
  const [contact, setContact] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [commentaire, setCommentaire] = useState("");

  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<Article[]>([]);
  const [selected, setSelected] = useState<Article | null>(null);
  const [qty, setQty] = useState<number | "">("");
  const [lot, setLot] = useState("");
  const [cout, setCout] = useState<number | "">("");
  const [panier, setPanier] = useState<LignePanier[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/articles?limit=2000").then((r) => r.json()).then((d) => setArticles(d.data ?? d)).catch(() => {});
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    if (q.length < 2) { setFiltered([]); return; }
    setFiltered(articles.filter((a) => a.code.toLowerCase().includes(q) || a.designationFr.toLowerCase().includes(q)).slice(0, 15));
  }, [search, articles]);

  const ajouterLigne = () => {
    if (!selected || !qty || Number(qty) <= 0) return;
    setPanier((prev) => [...prev, {
      articleId: selected.id, code: selected.code, designation: selected.designationFr,
      indice: selected.indice ?? "", qty: Number(qty), lotNumber: lot, unitCost: cout,
    }]);
    setSelected(null); setSearch(""); setQty(""); setLot(""); setCout("");
  };

  const valider = async () => {
    if (!motif) { setError("Choisissez un motif."); return; }
    if (panier.length === 0) { setError("Panier vide."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/mouvements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction: "SORTIE",
          type: motif,
          date,
          numCommande: "",
          nomPartenaire: destinataire,
          commentaire: [contact, commentaire].filter(Boolean).join(" — "),
          lignes: panier.map((l) => ({
            articleId: l.articleId, qty: l.qty, lotNumber: l.lotNumber, unitCost: l.unitCost,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
      setSuccess(`✅ Sortie enregistrée — N° ${data.numero}`);
      setPanier([]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Autres sorties</h1>
          <p className="text-sm text-gray-500 mt-1">Démo, congrès, prêt, ajustement…</p>
        </div>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800">← Retour</button>
      </div>

      {/* Choix du motif */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Motif de la sortie</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {MOTIFS.map((m) => (
            <button key={m.value} onClick={() => setMotif(m.value)}
              className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                motif === m.value
                  ? "bg-purple-50 border-purple-400 text-purple-700"
                  : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
              }`}>
              <span className="text-2xl">{m.icon}</span>
              <span className="font-semibold text-sm">{m.label}</span>
              <span className="text-xs opacity-70">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Destinataire */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Destinataire</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Société / Événement / Nom</label>
            <input type="text" value={destinataire} onChange={(e) => setDestinataire(e.target.value)}
              placeholder="ex : Congrès AOT 2026, Dr Dupont, Distributeur Italie…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Contact</label>
            <input type="text" value={contact} onChange={(e) => setContact(e.target.value)}
              placeholder="Interlocuteur"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mt-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date de sortie</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Commentaire</label>
            <input type="text" value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Notes complémentaires…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
        </div>
      </div>

      {/* Ajouter article */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Articles</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6 items-end">
          <div className="col-span-2 relative">
            <label className="block text-xs font-medium text-gray-600 mb-1">Article</label>
            <input type="text"
              value={selected ? `${selected.code} — ${selected.designationFr}` : search}
              onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
              placeholder="Rechercher…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
            {filtered.length > 0 && !selected && (
              <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {filtered.map((a) => (
                  <li key={a.id} onClick={() => { setSelected(a); setSearch(""); setFiltered([]); }}
                    className="px-3 py-2 text-sm hover:bg-purple-50 cursor-pointer">
                    <span className="font-mono font-semibold">{a.code}</span>
                    {a.indice && <span className="text-gray-400 text-xs ml-1">({a.indice})</span>}
                    <span className="text-gray-600 ml-2">{a.designationFr}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quantité</label>
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value === "" ? "" : Number(e.target.value))}
              min={1} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lot</label>
            <input type="text" value={lot} onChange={(e) => setLot(e.target.value)}
              placeholder="lot"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Valeur (€)</label>
            <input type="number" value={cout} onChange={(e) => setCout(e.target.value === "" ? "" : Number(e.target.value))}
              step="0.01" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          <div>
            <button onClick={ajouterLigne} disabled={!selected || !qty}
              className="w-full py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition mt-5">
              + Ajouter
            </button>
          </div>
        </div>

        {/* Panier */}
        {panier.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500">Code</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500">Désignation</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500">Qté</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500">Lot</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500">Valeur</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {panier.map((l, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-2 py-2 font-mono text-xs font-semibold">{l.code}</td>
                    <td className="px-2 py-2 text-gray-700 text-xs max-w-xs truncate">{l.designation}</td>
                    <td className="px-2 py-2 text-right tabular-nums font-semibold text-red-600">-{l.qty}</td>
                    <td className="px-2 py-2 font-mono text-xs text-gray-500">{l.lotNumber || "—"}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-xs">{l.unitCost !== "" ? `${l.unitCost} €` : "—"}</td>
                    <td className="px-2 py-2">
                      <button onClick={() => setPanier((prev) => prev.filter((_, j) => j !== i))}
                        className="text-red-400 hover:text-red-600 text-lg">×</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">⚠ {error}</div>}
      {success && <div className="bg-purple-50 border border-purple-200 text-purple-700 rounded-lg px-4 py-3 text-sm">{success}</div>}

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">Annuler</button>
        <button onClick={valider} disabled={loading || panier.length === 0 || !motif}
          className="px-8 py-3 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
          {loading ? "Enregistrement…" : `✓ Valider la sortie (${panier.length} art.)`}
        </button>
      </div>
    </div>
  );
}
