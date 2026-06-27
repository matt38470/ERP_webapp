"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

type Direction = "ENTREE" | "SORTIE";

type Article = {
  id: number;
  code: string;
  designationFr: string;
  indice: string | null;
  prixAchatRef?: number | null;
};

type LignePanier = {
  articleId: number;
  code: string;
  designation: string;
  indice: string;
  qty: number;
  lotNumber: string;
  typStock: string;
  unitCost: number | "";
  ral?: number;
};

type CommandeF = {
  id: number;
  number: string;
  supplier: { id: number; name: string; code: string };
  lines: { item: Article; qty: number; qtyDone: number; unitPrice: number | null }[];
};

type CommandeC = {
  id: number;
  number: string;
  customer: { id: number; etablissement: string | null; nom: string | null; code: string };
  lines: { item: Article; qty: number; ral: number }[];
};

type Fournisseur = { id: number; name: string; code: string };
type Client = { id: number; etablissement: string | null; nom: string | null; prenom: string | null; code: string };

// ─── Motifs ──────────────────────────────────────────────────────────────────

const MOTIFS_ENTREE = [
  { value: "RECEIPT", label: "Commande fournisseur" },
  { value: "LOAN_IN", label: "Retour prêt" },
  { value: "ADJUSTMENT", label: "Autre entrée" },
];

const MOTIFS_SORTIE = [
  { value: "ISSUE", label: "Commande client" },
  { value: "LOAN_OUT", label: "Prêt" },
  { value: "DEMO_OUT", label: "Sortie démo" },
  { value: "TRANSFER_OUT", label: "Réassort" },
  { value: "ADJUSTMENT", label: "Autre sortie" },
];

const TYP_STOCKS = ["Fini", "Ebauche", "Matière première", "Demo"];

// ─── Composant principal ──────────────────────────────────────────────────────

export default function NouveauMouvement() {
  const router = useRouter();

  // ── État global du formulaire ──
  const [direction, setDirection] = useState<Direction>("SORTIE");
  const [motif, setMotif] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [commentaire, setCommentaire] = useState("");

  // ── Partenaire ──
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedFournisseurId, setSelectedFournisseurId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");

  // ── Commandes ──
  const [commandesF, setCommandesF] = useState<CommandeF[]>([]);
  const [commandesC, setCommandesC] = useState<CommandeC[]>([]);
  const [selectedCommandeId, setSelectedCommandeId] = useState("");

  // ── Articles de la commande ──
  const [articlesCommande, setArticlesCommande] = useState<LignePanier[]>([]);

  // ── Saisie article libre ──
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchArticle, setSearchArticle] = useState("");
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [qtyLibre, setQtyLibre] = useState<number | "">("");
  const [lotLibre, setLotLibre] = useState("");
  const [typStockLibre, setTypStockLibre] = useState("Fini");
  const [coutLibre, setCoutLibre] = useState<number | "">("");

  // ── Panier ──
  const [panier, setPanier] = useState<LignePanier[]>([]);

  // ── UI ──
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const motifs = direction === "ENTREE" ? MOTIFS_ENTREE : MOTIFS_SORTIE;

  // ── Chargement initial ──
  useEffect(() => {
    fetch("/api/fournisseurs?limit=500")
      .then((r) => r.json())
      .then((d) => setFournisseurs(d.data ?? d))
      .catch(() => {});
    fetch("/api/clients?limit=500")
      .then((r) => r.json())
      .then((d) => setClients(d.data ?? d))
      .catch(() => {});
    fetch("/api/articles?limit=2000")
      .then((r) => r.json())
      .then((d) => setArticles(d.data ?? d))
      .catch(() => {});
  }, []);

  // ── Reset motif quand direction change ──
  useEffect(() => {
    setMotif("");
    setSelectedFournisseurId("");
    setSelectedClientId("");
    setCommandesF([]);
    setCommandesC([]);
    setSelectedCommandeId("");
    setArticlesCommande([]);
  }, [direction]);

  // ── Charger commandes fournisseur ──
  useEffect(() => {
    if (!selectedFournisseurId) { setCommandesF([]); return; }
    fetch(`/api/mouvements/commandes-fournisseur?supplierId=${selectedFournisseurId}`)
      .then((r) => r.json())
      .then(setCommandesF)
      .catch(() => {});
  }, [selectedFournisseurId]);

  // ── Charger commandes client ──
  useEffect(() => {
    if (!selectedClientId) { setCommandesC([]); return; }
    fetch(`/api/mouvements/commandes-client?customerId=${selectedClientId}`)
      .then((r) => r.json())
      .then(setCommandesC)
      .catch(() => {});
  }, [selectedClientId]);

  // ── Charger articles de la commande sélectionnée ──
  useEffect(() => {
    if (!selectedCommandeId) { setArticlesCommande([]); return; }

    if (direction === "ENTREE" && motif === "RECEIPT") {
      const cde = commandesF.find((c) => String(c.id) === selectedCommandeId);
      if (!cde) return;
      setArticlesCommande(
        cde.lines.map((l) => ({
          articleId: l.item.id,
          code: l.item.code,
          designation: l.item.designationFr,
          indice: l.item.indice ?? "",
          qty: l.qty - (l.qtyDone ?? 0),
          lotNumber: "",
          typStock: "Fini",
          unitCost: l.unitPrice ?? "",
        }))
      );
    } else {
      const cde = commandesC.find((c) => String(c.id) === selectedCommandeId);
      if (!cde) return;
      setArticlesCommande(
        cde.lines
          .filter((l) => l.ral > 0)
          .map((l) => ({
            articleId: l.item.id,
            code: l.item.code,
            designation: l.item.designationFr,
            indice: l.item.indice ?? "",
            qty: l.ral,
            lotNumber: "",
            typStock: "Fini",
            unitCost: "",
            ral: l.ral,
          }))
      );
    }
  }, [selectedCommandeId, commandesF, commandesC, direction, motif]);

  // ── Recherche article libre ──
  useEffect(() => {
    const q = searchArticle.toLowerCase();
    if (q.length < 2) { setFilteredArticles([]); return; }
    setFilteredArticles(
      articles
        .filter((a) => a.code.toLowerCase().includes(q) || a.designationFr.toLowerCase().includes(q))
        .slice(0, 20)
    );
  }, [searchArticle, articles]);

  // ── Ajouter lignes commande au panier ──
  const ajouterLignesCommande = () => {
    if (articlesCommande.length === 0) return;
    setPanier((prev) => {
      const ids = new Set(prev.map((l) => l.articleId));
      const nouvelles = articlesCommande.filter((l) => !ids.has(l.articleId));
      return [...prev, ...nouvelles];
    });
  };

  // ── Ajouter article libre au panier ──
  const ajouterArticleLibre = () => {
    if (!selectedArticle || !qtyLibre || Number(qtyLibre) <= 0) return;
    const ligne: LignePanier = {
      articleId: selectedArticle.id,
      code: selectedArticle.code,
      designation: selectedArticle.designationFr,
      indice: selectedArticle.indice ?? "",
      qty: Number(qtyLibre),
      lotNumber: lotLibre,
      typStock: typStockLibre,
      unitCost: coutLibre,
    };
    setPanier((prev) => [...prev, ligne]);
    setSelectedArticle(null);
    setSearchArticle("");
    setQtyLibre("");
    setLotLibre("");
    setCoutLibre("");
  };

  // ── Mettre à jour une ligne du panier ──
  const updateLigne = (idx: number, field: keyof LignePanier, value: any) => {
    setPanier((prev) => prev.map((l, i) => (i === idx ? { ...l, [field]: value } : l)));
  };

  // ── Supprimer ligne panier ──
  const supprimerLigne = (idx: number) => {
    setPanier((prev) => prev.filter((_, i) => i !== idx));
  };

  // ── Validation ──
  const valider = async () => {
    if (panier.length === 0) { setError("Aucune ligne dans le panier."); return; }
    if (!motif) { setError("Sélectionnez un motif."); return; }
    setLoading(true);
    setError("");
    setSuccess("");

    const selectedCde = direction === "ENTREE"
      ? commandesF.find((c) => String(c.id) === selectedCommandeId)
      : commandesC.find((c) => String(c.id) === selectedCommandeId);

    try {
      const res = await fetch("/api/mouvements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          type: motif,
          date,
          numCommande: selectedCde?.number ?? "",
          commentaire,
          lignes: panier.map((l) => ({
            articleId: l.articleId,
            qty: l.qty,
            lotNumber: l.lotNumber,
            unitCost: l.unitCost,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur serveur");
      setSuccess(`✅ ${data.count} mouvement(s) créé(s) — N° ${data.numero}`);
      setPanier([]);
      setArticlesCommande([]);
      setSelectedCommandeId("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const nomPartenaire = direction === "ENTREE"
    ? fournisseurs.find((f) => String(f.id) === selectedFournisseurId)?.name
    : clients.find((c) => String(c.id) === selectedClientId)?.etablissement ?? clients.find((c) => String(c.id) === selectedClientId)?.nom;

  const commandesDisponibles = direction === "ENTREE" ? commandesF : commandesC;

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Nouveau mouvement de stock</h1>
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-800">
          ← Retour
        </button>
      </div>

      {/* Bloc direction */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Direction</h2>
        <div className="flex gap-3">
          {(["ENTREE", "SORTIE"] as Direction[]).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={`flex-1 py-4 rounded-xl text-lg font-bold border-2 transition-all ${
                direction === d
                  ? d === "ENTREE"
                    ? "bg-green-50 border-green-500 text-green-700"
                    : "bg-red-50 border-red-500 text-red-700"
                  : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"
              }`}
            >
              {d === "ENTREE" ? "▲ ENTRÉE" : "▼ SORTIE"}
            </button>
          ))}
        </div>
      </div>

      {/* Bloc infos générales */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Informations</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {/* Motif */}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Motif *</label>
            <select
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Sélectionner --</option>
              {motifs.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Commentaire</label>
            <input
              type="text"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Optionnel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Bloc commande (si motif lié à une commande) */}
      {(motif === "RECEIPT" || motif === "ISSUE" || motif === "TRANSFER_OUT") && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {direction === "ENTREE" ? "Fournisseur & Commande" : "Client & Commande"}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Partenaire */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {direction === "ENTREE" ? "Fournisseur" : "Client"}
              </label>
              {direction === "ENTREE" ? (
                <select
                  value={selectedFournisseurId}
                  onChange={(e) => { setSelectedFournisseurId(e.target.value); setSelectedCommandeId(""); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Tous --</option>
                  {fournisseurs.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => { setSelectedClientId(e.target.value); setSelectedCommandeId(""); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Tous --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.etablissement ?? `${c.prenom ?? ""} ${c.nom ?? ""}`.trim()} ({c.code})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Commande */}
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Numéro de commande</label>
              <div className="flex gap-2">
                <select
                  value={selectedCommandeId}
                  onChange={(e) => setSelectedCommandeId(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Sélectionner une commande --</option>
                  {(commandesDisponibles as any[]).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.number} — {direction === "ENTREE" ? c.supplier?.name : (c.customer?.etablissement ?? c.customer?.nom)}
                    </option>
                  ))}
                </select>
                {articlesCommande.length > 0 && (
                  <button
                    onClick={ajouterLignesCommande}
                    className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 whitespace-nowrap"
                  >
                    + Ajouter au panier ({articlesCommande.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Aperçu articles de la commande */}
          {articlesCommande.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <p className="text-xs text-gray-500 mb-2">Articles de la commande (RAL / qtés restantes) :</p>
              <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Code</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">Désignation</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">Qté</th>
                  </tr>
                </thead>
                <tbody>
                  {articlesCommande.map((l) => (
                    <tr key={l.articleId} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-mono">{l.code}</td>
                      <td className="px-3 py-2 text-gray-700">{l.designation}</td>
                      <td className="px-3 py-2 text-right font-semibold">{l.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Bloc article libre */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Ajouter un article manuellement</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6 items-end">
          {/* Recherche article */}
          <div className="col-span-2 relative">
            <label className="block text-xs font-medium text-gray-600 mb-1">Article (code ou désignation)</label>
            <input
              type="text"
              value={selectedArticle ? `${selectedArticle.code} — ${selectedArticle.designationFr}` : searchArticle}
              onChange={(e) => { setSearchArticle(e.target.value); setSelectedArticle(null); }}
              placeholder="Rechercher..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {filteredArticles.length > 0 && !selectedArticle && (
              <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                {filteredArticles.map((a) => (
                  <li
                    key={a.id}
                    onClick={() => { setSelectedArticle(a); setSearchArticle(""); setFilteredArticles([]); }}
                    className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer"
                  >
                    <span className="font-mono font-semibold">{a.code}</span>
                    {a.indice && <span className="text-gray-400 text-xs ml-1">({a.indice})</span>}
                    <span className="text-gray-600 ml-2">{a.designationFr}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quantité */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quantité</label>
            <input
              type="number"
              value={qtyLibre}
              onChange={(e) => setQtyLibre(e.target.value === "" ? "" : Number(e.target.value))}
              min={1}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Lot */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lot</label>
            <input
              type="text"
              value={lotLibre}
              onChange={(e) => setLotLibre(e.target.value)}
              placeholder="ex: A1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Prix unitaire */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Prix unit. (€)</label>
            <input
              type="number"
              value={coutLibre}
              onChange={(e) => setCoutLibre(e.target.value === "" ? "" : Number(e.target.value))}
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bouton ajouter */}
          <div>
            <button
              onClick={ajouterArticleLibre}
              disabled={!selectedArticle || !qtyLibre}
              className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              + Ajouter
            </button>
          </div>
        </div>
      </div>

      {/* Panier */}
      {panier.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Panier — {panier.length} ligne(s)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500">Code</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500">Désignation</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500">Ind.</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500">Qté</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500">Lot</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500">Prix unit.</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {panier.map((l, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-2 py-2 font-mono text-xs font-semibold">{l.code}</td>
                    <td className="px-2 py-2 text-gray-700 max-w-xs truncate">{l.designation}</td>
                    <td className="px-2 py-2 text-gray-400 text-xs">{l.indice}</td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={l.qty}
                        onChange={(e) => updateLigne(i, "qty", Number(e.target.value))}
                        className="w-16 border border-gray-200 rounded px-2 py-1 text-right text-sm"
                        min={1}
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={l.lotNumber}
                        onChange={(e) => updateLigne(i, "lotNumber", e.target.value)}
                        placeholder="lot"
                        className="w-20 border border-gray-200 rounded px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="number"
                        value={l.unitCost}
                        onChange={(e) => updateLigne(i, "unitCost", e.target.value === "" ? "" : Number(e.target.value))}
                        step="0.01"
                        className="w-24 border border-gray-200 rounded px-2 py-1 text-right text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => supprimerLigne(i)}
                        className="text-red-400 hover:text-red-600 text-lg leading-none"
                        title="Supprimer"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          ⚠ {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
          {success}
        </div>
      )}

      {/* Bouton valider */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
        >
          Annuler
        </button>
        <button
          onClick={valider}
          disabled={loading || panier.length === 0}
          className={`px-8 py-3 rounded-lg text-sm font-bold text-white transition ${
            direction === "ENTREE"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {loading ? "Enregistrement..." : `Valider ${direction === "ENTREE" ? "l'entrée" : "la sortie"} (${panier.length} art.)`}
        </button>
      </div>
    </div>
  );
}
