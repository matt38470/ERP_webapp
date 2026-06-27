/**
 * Script d'import Excel → PostgreSQL via Prisma
 * Source : Gestion_stock.xlsx
 * Schéma  : matt38470/ERP_webapp (schema.prisma)
 *
 * Ordre d'import :
 *  1. Supplier        (onglet Fournisseur)
 *  2. Article         (onglet Article_stock)
 *  3. Customer        (onglet Client)
 *  4. Mouvement       (onglet Mouvement  → Movement + StockMovementLine par ligne)
 *  5. SalesOrder      (onglet Vente      → SalesOrder + SalesOrderLine)
 *  6. PurchaseOrder   (onglet Commande_F → PurchaseOrder + PurchaseOrderLine)
 *
 * Usage : npx ts-node scripts/import_excel.ts
 * Deps  : npm install xlsx
 */

// xlsx est un module CommonJS — on l'importe via createRequire pour compatibilité ESM
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const XLSX = require("xlsx") as typeof import("xlsx");

import { PrismaClient, MovementDirection, MovementType } from "@prisma/client";
import * as path from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FILE = path.join(__dirname, "..", "Gestion_stock.xlsx");

// ── Helpers ────────────────────────────────────────────────────────

function readSheet(wb: import("xlsx").WorkBook, name: string, headerRow = 5) {
  const ws = wb.Sheets[name];
  if (!ws) throw new Error(`Onglet "${name}" introuvable`);
  return XLSX.utils.sheet_to_json<Record<string, any>>(ws, {
    range: headerRow - 1,
    defval: null,
    raw: true,
  });
}

function str(v: any): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function dec(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? null : n;
}

function xDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    return new Date(Math.round((v - 25569) * 86400 * 1000));
  }
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function toMovementType(raw: string | null): MovementType {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("entrée") || s.includes("entree")) return MovementType.RECEIPT;
  if (s.includes("retour prêt")) return MovementType.LOAN_IN;
  if (s.includes("sortie")) return MovementType.ISSUE;
  if (s.includes("prêt")) return MovementType.LOAN_OUT;
  if (s.includes("demo") || s.includes("démo")) return MovementType.DEMO_OUT;
  if (s.includes("transfer")) return MovementType.TRANSFER;
  return MovementType.ADJUSTMENT;
}

function toDirection(type: MovementType): MovementDirection {
  const sortie: MovementType[] = [
    MovementType.ISSUE,
    MovementType.LOAN_OUT,
    MovementType.DEMO_OUT,
    MovementType.TRANSFER_OUT,
  ];
  return sortie.includes(type)
    ? MovementDirection.SORTIE
    : MovementDirection.ENTREE;
}

// ── 1. FOURNISSEURS ───────────────────────────────────────────────────────────

async function importFournisseurs(wb: import("xlsx").WorkBook) {
  console.log("\n📦  Fournisseurs...");
  const rows = readSheet(wb, "Fournisseur");
  let ok = 0, skip = 0;

  for (const r of rows) {
    const code = str(r["Code fournisseur"]);
    if (!code) { skip++; continue; }

    const paysRaw = str(r["Pays"]);
    let countryId: number | undefined;
    if (paysRaw) {
      const pays = await prisma.country.findFirst({
        where: { name: { contains: paysRaw, mode: "insensitive" } },
      });
      countryId = pays?.id;
    }

    await prisma.supplier.upsert({
      where: { code },
      update: {},
      create: {
        code,
        name: str(r["Nom"]) ?? code,
        address: str(r["Adresse"]),
        cp: str(r["CP"]),
        city: str(r["Ville"]),
        phone: str(r["Téléphone"]),
        email: str(r["Email"]),
        contact1: str(r["Contact 1"]),
        phone1: str(r["Téléphone1"]),
        email1: str(r["email2"]),
        langue: str(r["Langue"]) ?? "FR",
        countryId,
      },
    });
    ok++;
  }
  console.log(`  ✔ ${ok} fournisseurs, ${skip} ignorés`);
}

// ── 2. ARTICLES ───────────────────────────────────────────────────────────────

async function importArticles(wb: import("xlsx").WorkBook) {
  console.log("\n🔩  Articles...");
  const rows = readSheet(wb, "Article_stock");
  let ok = 0, skip = 0;

  for (const r of rows) {
    const code = str(r["Code"]);
    const designation = str(r["Désignation FR"]);
    if (!code || !designation) { skip++; continue; }

    await prisma.article.upsert({
      where: { code },
      update: {},
      create: {
        code,
        indice: str(r["Indice"]),
        designationFr: designation,
        etat: str(r["Etat"]),
        prixAchatRef: dec(r["Prix achat  unitaire"]),
        stockMin: dec(r["Stock Min"]),
        stockSecurite: dec(r["Stock Sécurité"]),
      },
    });
    ok++;
  }
  console.log(`  ✔ ${ok} articles, ${skip} ignorés`);
}

// ── 3. CLIENTS ────────────────────────────────────────────────────────────────

async function importClients(wb: import("xlsx").WorkBook) {
  console.log("\n👤  Clients...");
  const rows = readSheet(wb, "Client");
  let ok = 0, skip = 0;

  for (const r of rows) {
    const code = str(r["Code Client"]);
    if (!code) { skip++; continue; }

    const paysRaw = str(r["PAYS"]);
    let countryId: number | undefined;
    if (paysRaw) {
      const pays = await prisma.country.findFirst({
        where: { name: { contains: paysRaw, mode: "insensitive" } },
      });
      countryId = pays?.id;
    }

    await prisma.customer.upsert({
      where: { code },
      update: {},
      create: {
        code,
        prenom: str(r["Prénom"]),
        nom: str(r["NOM"]),
        etablissement: str(r["Etablissement"]),
        phone: str(r["TEL"]),
        email: str(r["EMAIL"]),
        langue: str(r["Langue"]) ?? "FR",
        numTVA: str(r["Num TVA"]),
        adresseLivraison: str(r["Adresse de Livraison"]),
        cpLivraison: str(r["CP"]),
        villeLivraison: str(r["VILLE"]),
        adresseFacturation: str(r["Adresse de Facturation"]),
        contactBL: str(r["Contact BL"]),
        telBL: str(r["Tel BL"]),
        contactFact: str(r["Contact FACT"]),
        telFact: str(r["Tel FACT"]),
        fraisDePort: dec(r["Frais de port"]),
        codeTarif: str(r["Code Tarif"]),
        countryId,
      },
    });
    ok++;
  }
  console.log(`  ✔ ${ok} clients, ${skip} ignorés`);
}

// ── 4. MOUVEMENTS ─────────────────────────────────────────────────────────────

async function importMouvements(wb: import("xlsx").WorkBook) {
  console.log("\n🔄  Mouvements...");
  const rows = readSheet(wb, "Mouvement");

  const importUser = await prisma.user.upsert({
    where: { email: "import@system.local" },
    update: {},
    create: { email: "import@system.local", name: "Import Excel", role: "admin" },
  });

  let ok = 0, skip = 0, err = 0;

  for (const r of rows) {
    const nr = str(r["Nr mouvement"]);
    const articleCode = str(r["Code article"]);
    if (!nr || !articleCode) { skip++; continue; }

    const article = await prisma.article.findUnique({ where: { code: articleCode } });
    if (!article) {
      console.warn(`  ⚠ Article inconnu "${articleCode}" (mouvement ${nr})`);
      skip++;
      continue;
    }

    const mvtType = toMovementType(str(r["Type mouvement"]));
    const direction = toDirection(mvtType);
    const movedAt = xDate(r["Date de mouvement"]) ?? new Date();
    const qty = dec(r["Quantité"]) ?? 0;

    const lotNumber = str(r["Lot"]) ?? "I";
    let lot = await prisma.stockLot.findUnique({
      where: { articleId_lotNumber: { articleId: article.id, lotNumber } },
    });
    if (!lot) {
      lot = await prisma.stockLot.create({
        data: { articleId: article.id, lotNumber, quantity: 0 },
      });
    }

    const existing = await prisma.movement.findFirst({
      where: { referenceType: "IMPORT", referenceId: nr, itemId: article.id },
    });
    if (existing) { skip++; continue; }

    try {
      const mvt = await prisma.movement.create({
        data: {
          movedAt,
          direction,
          type: mvtType,
          quantity: qty,
          referenceType: "IMPORT",
          referenceId: nr,
          note: str(r["Motif de mouvement"]),
          itemId: article.id,
          lotId: lot.id,
          createdById: importUser.id,
        },
      });

      await prisma.stockMovementLine.create({
        data: {
          movementId: mvt.id,
          articleId: article.id,
          lotId: lot.id,
          quantity: qty,
          unitCost: dec(r["Prix d'achat"]),
        },
      });

      ok++;
    } catch (e: any) {
      console.error(`  ⚠ Mouvement ${nr} / ${articleCode}: ${e.message}`);
      err++;
    }
  }
  console.log(`  ✔ ${ok} mouvements importés, ${skip} ignorés, ${err} erreurs`);
}

// ── 5. COMMANDES CLIENT ───────────────────────────────────────────────────────

async function importVentes(wb: import("xlsx").WorkBook) {
  console.log("\n🛒  Commandes clients...");
  const rows = readSheet(wb, "Vente");

  const grouped = new Map<string, any[]>();
  let skip = 0;
  for (const r of rows) {
    const nr = str(r["Nr Commande"]);
    if (!nr) { skip++; continue; }
    if (!grouped.has(nr)) grouped.set(nr, []);
    grouped.get(nr)!.push(r);
  }

  console.log(`  → ${grouped.size} commandes vente (${skip} lignes sans N°)`);
  let ok = 0, err = 0;

  for (const [nr, lines] of grouped) {
    const first = lines[0];
    const clientName = str(first["Client"]);
    let customerId: number | undefined;
    if (clientName) {
      const c = await prisma.customer.findFirst({
        where: { etablissement: { contains: clientName, mode: "insensitive" } },
      });
      customerId = c?.id;
    }

    try {
      const order = await prisma.salesOrder.upsert({
        where: { number: nr },
        update: {},
        create: {
          number: nr,
          customerId,
          referenceClient: str(first["Référence cde"]),
          numDevis: str(first["N° devis"]),
          delai: str(first["Délai"]),
          dateFacturation: xDate(first["Date de facturation"]),
          dateEncaissement: xDate(first["Date encaissement"]),
          commentaire: str(first["Date de Cde"])
            ? `Date cde: ${str(first["Date de Cde"])}`
            : null,
        },
      });

      for (const line of lines) {
        const code = str(line["Code"]);
        if (!code) continue;
        const article = await prisma.article.findUnique({ where: { code } });
        if (!article) continue;

        const exists = await prisma.salesOrderLine.findFirst({
          where: { orderId: order.id, itemId: article.id },
        });
        if (!exists) {
          await prisma.salesOrderLine.create({
            data: {
              orderId: order.id,
              itemId: article.id,
              qty: dec(line["Qté"]) ?? 0,
              qtyDone: dec(line["Livré"]) ?? 0,
              unitPrice: dec(line["Prix"]),
              prixTotal: dec(line["Prix total"]),
            },
          });
        }
      }
      ok++;
    } catch (e: any) {
      console.error(`  ⚠ Vente ${nr}: ${e.message}`);
      err++;
    }
  }
  console.log(`  ✔ ${ok} commandes vente, ${err} erreurs`);
}

// ── 6. COMMANDES FOURNISSEUR ──────────────────────────────────────────────────

async function importCommandesF(wb: import("xlsx").WorkBook) {
  console.log("\n📋  Commandes fournisseur...");
  const rows = readSheet(wb, "Commande_F");

  const grouped = new Map<string, any[]>();
  let skip = 0;
  for (const r of rows) {
    const nr = str(r["Nr Commande"]);
    if (!nr) { skip++; continue; }
    if (!grouped.has(nr)) grouped.set(nr, []);
    grouped.get(nr)!.push(r);
  }

  console.log(`  → ${grouped.size} commandes fournisseur (${skip} lignes sans N°)`);
  let ok = 0, err = 0;

  for (const [nr, lines] of grouped) {
    const first = lines[0];
    const supplierName = str(first["Fournisseur"]);
    let supplierId: number | undefined;
    if (supplierName) {
      const s = await prisma.supplier.findFirst({
        where: { name: { contains: supplierName, mode: "insensitive" } },
      });
      supplierId = s?.id;
    }

    try {
      const order = await prisma.purchaseOrder.upsert({
        where: { number: nr },
        update: {},
        create: {
          number: nr,
          supplierId,
          dateLivraisonPrevue: xDate(first["Délai souhaité"]),
          dateLivraisonReelle: xDate(first["Date réception"]),
          refDevisFournisseur: str(first["Numéro_ARC"]),
          dateDevisFournisseur: xDate(first["Délai_ARC"]),
          commentaire: str(first["Date de Cde"])
            ? `Date cde: ${str(first["Date de Cde"])}`
            : null,
        },
      });

      for (const line of lines) {
        const code = str(line["Code"]);
        if (!code) continue;
        const article = await prisma.article.findUnique({ where: { code } });
        if (!article) continue;

        const exists = await prisma.purchaseOrderLine.findFirst({
          where: { orderId: order.id, itemId: article.id },
        });
        if (!exists) {
          await prisma.purchaseOrderLine.create({
            data: {
              orderId: order.id,
              itemId: article.id,
              qty: dec(line["Qté"]) ?? 0,
              qtyDone: dec(line["Qté reçue"]) ?? 0,
              unitPrice: dec(line["Prix"]),
            },
          });
        }
      }
      ok++;
    } catch (e: any) {
      console.error(`  ⚠ CmdF ${nr}: ${e.message}`);
      err++;
    }
  }
  console.log(`  ✔ ${ok} commandes fournisseur, ${err} erreurs`);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("📂  Lecture du fichier Excel...");
  const wb = XLSX.readFile(FILE);
  console.log(`✔  Onglets : ${wb.SheetNames.join(", ")}\n`);

  try {
    await importFournisseurs(wb);
    await importArticles(wb);
    await importClients(wb);
    await importMouvements(wb);
    await importVentes(wb);
    await importCommandesF(wb);
    console.log("\n✅  Import terminé !");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("\n❌  Erreur fatale:", e);
  process.exit(1);
});
