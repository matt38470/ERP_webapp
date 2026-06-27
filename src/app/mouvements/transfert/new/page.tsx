"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const TYPES_STOCK = ["FINI", "EBAUCHE", "MATIERE_PREMIERE", "DEMO"];
const LABELS_STOCK: Record<string, string> = {
  FINI: "Stock Fini",
  EBAUCHE: "Stock Ébauche",
  MATIERE_PREMIERE: "Matière première",
  DEMO: "Stock Démo",
};

type Article = { id: number; code: string; designationFr: string; indice: string | null; typeProduit: string | null };
type LignePanier = {
  articleId: number;
  code: string;
  designation: string;
  indice: string;
  qty: number;
  lotSource: string;
  lotCible: string;
  typStockSource: string;
  typStockCible: string;
};

export default function TransfertStockPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState<Article[]>([]);
  const [selected, setSelected] = useState<Article | null>(null);
  const [qty, setQty] = useState<number | "">("");
  const [lotSource, setLotSource] = useState("");
  const [lotCible, setLotCible] = useState("");
  const [typSource, setTypSource] = useState("FINI");
  const [typCible, setTypCible] = useState("DEMO");
  const [panier, setPanier] = useState<LignePanier[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [commentaire, setCommentaire] = useState("");
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
    if (!selected || !qty || Number(qty) <= 0 || typSource === typCible) return;
    setPanier((prev) => [...prev, {
      articleId: selected.id, code: selected.code, designation: selected.designationFr,
      indice: selected.indice ?? "", qty: Number(qty),
      lotSource, lotCible: lotCible || lotSource, typStockSource: typSource, typStockCible: typCible,
    }]);
    setSelected(null); setSearch(""); setQty(""); setLotSource(""); setLotCible("");
  };

  const valider = async () => {
    if (panier.length === 0) { setError("Panier vide."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch("/api/mouvements/transfert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, commentaire, lignes: panier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
      setSuccess(`✅ Transfert enregistré — N° ${data.numero}`);
      setPanier([]);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transfert de stock</h1>
          <p className="text-sm text-gray-500 mt-1">Changer le type de stock d'un article (ex : Fini → Démo)</p>
        </div>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800">← Retour</button>
      </div>

      {/* Ajouter un article */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ajouter un article au transfert</h2>

        {/* Flèche de transfert */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Stock source</label>
            <select value={typSource} onChange={(e) => setTypSource(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
              {TYPES_STOCK.map((t) => <option key={t} value={t}>{LABELS_STOCK[t]}</option>)}
            </select>
          </div>
          <div className="pt-5 text-2xl text-orange-400 font-bold">→</div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Stock cible</label>
            <select value={typCible} onChange={(e) => setTypCible(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
              {TYPES_STOCK.map((t) => <option key={t} value={t}>{LABELS_STOCK[t]}</option>)}
            </select>
          </div>
        </div>
        {typSource === typCible && <p className="text-xs text-red-500">⚠ Le stock source et cible doivent être différents.</p>}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5 items-end">
          {/* Article */}
          <div className="col-span-2 relative">
            <label className="block text-xs font-medium text-gray-600 mb-1">Article</label>
            <input type="text"
              value={selected ? `${selected.code} — ${selected.designationFr}` : search}
              onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
              placeholder="Rechercher…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
            {filtered.length > 0 && !selected && (
              <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {filtered.map((a) => (
                  <li key={a.id} onClick={() => { setSelected(a); setSearch(""); setFiltered([]); }}
                    className="px-3 py-2 text-sm hover:bg-orange-50 cursor-pointer">
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
              min={1} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lot source</label>
            <input type="text" value={lotSource} onChange={(e) => setLotSource(e.target.value)}
              placeholder="lot actuel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
          </div>
          <div>
            <button onClick={ajouterLigne} disabled={!selected || !qty || typSource === typCible}
              className="w-full py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition mt-5">
              + Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* Panier */}
      {panier.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Articles à transférer ({panier.length})</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Désignation</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500">Qté</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Lot source</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Transfert</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {panier.map((l, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{l.code}</td>
                  <td className="px-4 py-3 text-gray-700 text-xs">{l.designation}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">{l.qty}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{l.lotSource || "—"}</td>
                  <td className="px-4 py-3 text-center text-xs">
                    <span className="inline-flex items-center gap-1">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{LABELS_STOCK[l.typStockSource]}</span>
                      <span className="text-orange-400">→</span>
                      <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded">{LABELS_STOCK[l.typStockCible]}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => setPanier((prev) => prev.filter((_, j) => j !== i))}
                      className="text-red-400 hover:text-red-600 text-lg">×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Commentaire</label>
          <input type="text" value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Motif du transfert…"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">⚠ {error}</div>}
      {success && <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-4 py-3 text-sm">{success}</div>}

      <div className="flex justify-end gap-3">
        <button onClick={() => router.back()} className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium">Annuler</button>
        <button onClick={valider} disabled={loading || panier.length === 0}
          className="px-8 py-3 bg-orange-500 text-white rounded-lg text-sm font-bold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition">
          {loading ? "Enregistrement…" : `✓ Valider le transfert (${panier.length} art.)`}
        </button>
      </div>
    </div>
  );
}
