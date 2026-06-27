/**
 * import_excel.ts
 * ----------------
 * Importe les données depuis Gestion_stock.xlsx vers la base PostgreSQL via Prisma.
 *
 * Feuilles traitées :
 *   - Fournisseurs
 *   - Articles
 *   - Clients
 *   - Stock (lots + mouvements d'entrée initiaux)
 *   - Commandes fournisseur  (avec lot par ligne → PurchaseOrderLine.lotNumber)
 *   - Commandes client
 *
 * Règles métier :
 *   - Réception partielle possible : qtyDone < qty → statut PARTIALLY_DELIVERED, commande reste ouverte
 *   - Le lotNumber est renseigné sur chaque ligne de commande fournisseur
 *     et sera pré-rempli dans le formulaire de réception
 *
 * Usage :
 *   npx ts-node scripts/import_excel.ts
 */

import * as XLSX from 'xlsx';
import * as path from 'path';
import { PrismaClient, DocStatus, MovementDirection, MovementType } from '@prisma/client';

const prisma = new PrismaClient();
const FILE = path.resolve(__dirname, '..', 'Gestion_stock.xlsx');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readSheet(wb: XLSX.WorkBook, name: string): Record<string, unknown>[] {
  const ws = wb.Sheets[name];
  if (!ws) { console.warn(`⚠  Feuille "${name}" introuvable — ignorée`); return []; }
  return XLSX.utils.sheet_to_json(ws, { defval: null });
}

function str(v: unknown): string | null {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  return String(v).trim();
}

function num(v: unknown): number | null {
  if (v === null || v === undefined || String(v).trim() === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return isNaN(n) ? null : n;
}

function excelDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const n = Number(v);
  if (!isNaN(n) && n > 1000) return XLSX.SSF.parse_date_code(n) ? new Date((n - 25569) * 86400000) : null;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

/** Calcule le statut d'une commande selon les lignes */
function computeDocStatus(lines: { qty: number; qtyDone: number }[]): DocStatus {
  if (lines.length === 0) return 'CONFIRMED';
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  const totalDone = lines.reduce((s, l) => s + l.qtyDone, 0);
  if (totalDone === 0) return 'CONFIRMED';
  if (totalDone >= totalQty) return 'DELIVERED';
  return 'PARTIALLY_DELIVERED'; // commande reste ouverte
}

// ─── Utilisateur système (requis pour Movement.createdById) ──────────────────

async function ensureSystemUser(): Promise<number> {
  const user = await prisma.user.upsert({
    where: { email: 'system@import' },
    update: {},
    create: { email: 'system@import', name: 'Import Excel', role: 'admin' },
  });
  return user.id;
}

// ─── 1. FOURNISSEURS ─────────────────────────────────────────────────────────

async function importFournisseurs(rows: Record<string, unknown>[]) {
  console.log(`\n📦 Fournisseurs : ${rows.length} lignes`);
  let ok = 0, skip = 0;

  for (const r of rows) {
    const code = str(r['Code'] ?? r['CODE'] ?? r['code']);
    const name = str(r['Nom'] ?? r['NOM'] ?? r['Raison sociale'] ?? r['name']);
    if (!code || !name) { skip++; continue; }

    // Résolution pays
    let countryId: number | null = null;
    const paysRaw = str(r['Pays'] ?? r['PAYS'] ?? r['pays']);
    if (paysRaw) {
      const country = await prisma.country.findFirst({
        where: { OR: [{ name: { contains: paysRaw, mode: 'insensitive' } }, { code: paysRaw.toUpperCase() }] },
      });
      countryId = country?.id ?? null;
    }

    await prisma.supplier.upsert({
      where: { code },
      update: {
        name,
        address:       str(r['Adresse'] ?? r['adresse']),
        cp:            str(r['CP'] ?? r['cp']),
        city:          str(r['Ville'] ?? r['ville']),
        countryId,
        phone:         str(r['Téléphone'] ?? r['Tel'] ?? r['tel']),
        email:         str(r['Email'] ?? r['email']),
        contact1:      str(r['Contact'] ?? r['contact']),
        phone1:        str(r['Tel contact'] ?? r['Tel1']),
        email1:        str(r['Email contact'] ?? r['Email1']),
        langue:        str(r['Langue'] ?? r['langue']) ?? 'FR',
        delaiHabituel: num(r['Délai'] ?? r['delai']) ? Math.round(num(r['Délai'] ?? r['delai'])!) : null,
      },
      create: {
        code,
        name,
        address:       str(r['Adresse'] ?? r['adresse']),
        cp:            str(r['CP'] ?? r['cp']),
        city:          str(r['Ville'] ?? r['ville']),
        countryId,
        phone:         str(r['Téléphone'] ?? r['Tel'] ?? r['tel']),
        email:         str(r['Email'] ?? r['email']),
        contact1:      str(r['Contact'] ?? r['contact']),
        phone1:        str(r['Tel contact'] ?? r['Tel1']),
        email1:        str(r['Email contact'] ?? r['Email1']),
        langue:        str(r['Langue'] ?? r['langue']) ?? 'FR',
        delaiHabituel: num(r['Délai'] ?? r['delai']) ? Math.round(num(r['Délai'] ?? r['delai'])!) : null,
      },
    });
    ok++;
  }
  console.log(`   ✅ ${ok} importés, ${skip} ignorés (code ou nom manquant)`);
}

// ─── 2. ARTICLES ─────────────────────────────────────────────────────────────

async function importArticles(rows: Record<string, unknown>[]) {
  console.log(`\n🔩 Articles : ${rows.length} lignes`);
  let ok = 0, skip = 0;

  for (const r of rows) {
    const code = str(r['Code'] ?? r['CODE'] ?? r['Référence'] ?? r['ref']);
    if (!code) { skip++; continue; }

    const designationFr = str(r['Désignation'] ?? r['designation'] ?? r['DesignationFR'] ?? r['Designation FR']) ?? '';

    await prisma.article.upsert({
      where: { code },
      update: {
        indice:        str(r['Indice'] ?? r['indice']),
        designationFr,
        designationEn: str(r['Désignation EN'] ?? r['DesignationEN'] ?? r['Designation EN']),
        etat:          str(r['Etat'] ?? r['État'] ?? r['etat']),
        famille:       str(r['Famille'] ?? r['famille']),
        sousFamille:   str(r['Sous-famille'] ?? r['SousFamille'] ?? r['sous_famille']),
        diametre:      str(r['Diamètre'] ?? r['Diametre'] ?? r['diam']),
        longueur:      str(r['Longueur'] ?? r['longueur']),
        largeur:       str(r['Largeur'] ?? r['largeur']),
        autreCarac:    str(r['Autre carac'] ?? r['AutreCarac'] ?? r['autres']),
        prixAchatRef:  num(r['Prix achat'] ?? r['PrixAchat'] ?? r['prix_achat']),
        stockMin:      num(r['Stock min'] ?? r['StockMin'] ?? r['stock_min']),
        stockSecurite: num(r['Stock sécu'] ?? r['StockSecu'] ?? r['stock_securite']),
        commentaire:   str(r['Commentaire'] ?? r['commentaire']),
      },
      create: {
        code,
        indice:        str(r['Indice'] ?? r['indice']),
        designationFr,
        designationEn: str(r['Désignation EN'] ?? r['DesignationEN'] ?? r['Designation EN']),
        etat:          str(r['Etat'] ?? r['État'] ?? r['etat']),
        famille:       str(r['Famille'] ?? r['famille']),
        sousFamille:   str(r['Sous-famille'] ?? r['SousFamille'] ?? r['sous_famille']),
        diametre:      str(r['Diamètre'] ?? r['Diametre'] ?? r['diam']),
        longueur:      str(r['Longueur'] ?? r['longueur']),
        largeur:       str(r['Largeur'] ?? r['largeur']),
        autreCarac:    str(r['Autre carac'] ?? r['AutreCarac'] ?? r['autres']),
        prixAchatRef:  num(r['Prix achat'] ?? r['PrixAchat'] ?? r['prix_achat']),
        stockMin:      num(r['Stock min'] ?? r['StockMin'] ?? r['stock_min']),
        stockSecurite: num(r['Stock sécu'] ?? r['StockSecu'] ?? r['stock_securite']),
        commentaire:   str(r['Commentaire'] ?? r['commentaire']),
      },
    });
    ok++;
  }
  console.log(`   ✅ ${ok} importés, ${skip} ignorés`);
}

// ─── 3. CLIENTS ──────────────────────────────────────────────────────────────

async function importClients(rows: Record<string, unknown>[]) {
  console.log(`\n👤 Clients : ${rows.length} lignes`);
  let ok = 0, skip = 0;

  for (const r of rows) {
    const code = str(r['Code'] ?? r['CODE'] ?? r['code']);
    if (!code) { skip++; continue; }

    let countryId: number | null = null;
    const paysRaw = str(r['Pays'] ?? r['pays'] ?? r['PAYS']);
    if (paysRaw) {
      const country = await prisma.country.findFirst({
        where: { OR: [{ name: { contains: paysRaw, mode: 'insensitive' } }, { code: paysRaw.toUpperCase() }] },
      });
      countryId = country?.id ?? null;
    }

    await prisma.customer.upsert({
      where: { code },
      update: {
        prenom:             str(r['Prénom'] ?? r['prenom']),
        nom:                str(r['Nom'] ?? r['nom']),
        etablissement:      str(r['Etablissement'] ?? r['etablissement'] ?? r['Société']),
        phone:              str(r['Téléphone'] ?? r['Tel'] ?? r['tel']),
        email:              str(r['Email'] ?? r['email']),
        langue:             str(r['Langue'] ?? r['langue']) ?? 'FR',
        numTVA:             str(r['N° TVA'] ?? r['numTVA'] ?? r['TVA']),
        adresseLivraison:   str(r['Adresse livraison'] ?? r['AdresseLiv']),
        cpLivraison:        str(r['CP livraison'] ?? r['CPLiv'] ?? r['cp_livraison']),
        villeLivraison:     str(r['Ville livraison'] ?? r['VilleLiv']),
        adresseFacturation: str(r['Adresse facturation'] ?? r['AdresseFact']),
        cpFacturation:      str(r['CP facturation'] ?? r['CPFact']),
        villeFacturation:   str(r['Ville facturation'] ?? r['VilleFact']),
        contactBL:          str(r['Contact BL'] ?? r['contactBL']),
        telBL:              str(r['Tel BL'] ?? r['telBL']),
        contactFact:        str(r['Contact fact'] ?? r['contactFact']),
        telFact:            str(r['Tel fact'] ?? r['telFact']),
        fraisDePort:        num(r['Frais de port'] ?? r['FDP'] ?? r['fraisDePort']),
        codeTarif:          str(r['Code tarif'] ?? r['codeTarif'] ?? r['Tarif']),
        countryId,
      },
      create: {
        code,
        prenom:             str(r['Prénom'] ?? r['prenom']),
        nom:                str(r['Nom'] ?? r['nom']),
        etablissement:      str(r['Etablissement'] ?? r['etablissement'] ?? r['Société']),
        phone:              str(r['Téléphone'] ?? r['Tel'] ?? r['tel']),
        email:              str(r['Email'] ?? r['email']),
        langue:             str(r['Langue'] ?? r['langue']) ?? 'FR',
        numTVA:             str(r['N° TVA'] ?? r['numTVA'] ?? r['TVA']),
        adresseLivraison:   str(r['Adresse livraison'] ?? r['AdresseLiv']),
        cpLivraison:        str(r['CP livraison'] ?? r['CPLiv'] ?? r['cp_livraison']),
        villeLivraison:     str(r['Ville livraison'] ?? r['VilleLiv']),
        adresseFacturation: str(r['Adresse facturation'] ?? r['AdresseFact']),
        cpFacturation:      str(r['CP facturation'] ?? r['CPFact']),
        villeFacturation:   str(r['Ville facturation'] ?? r['VilleFact']),
        contactBL:          str(r['Contact BL'] ?? r['contactBL']),
        telBL:              str(r['Tel BL'] ?? r['telBL']),
        contactFact:        str(r['Contact fact'] ?? r['contactFact']),
        telFact:            str(r['Tel fact'] ?? r['telFact']),
        fraisDePort:        num(r['Frais de port'] ?? r['FDP'] ?? r['fraisDePort']),
        codeTarif:          str(r['Code tarif'] ?? r['codeTarif'] ?? r['Tarif']),
        countryId,
      },
    });
    ok++;
  }
  console.log(`   ✅ ${ok} importés, ${skip} ignorés`);
}

// ─── 4. STOCK (lots + mouvements initiaux) ───────────────────────────────────

async function importStock(rows: Record<string, unknown>[], systemUserId: number) {
  console.log(`\n📊 Stock : ${rows.length} lignes`);
  let ok = 0, skip = 0;

  // Entrepôt par défaut
  let warehouse = await prisma.warehouse.findFirst({ where: { code: 'PRINCIPAL' } });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({ data: { code: 'PRINCIPAL', name: 'Dépôt principal' } });
  }
  let location = await prisma.location.findFirst({ where: { warehouseId: warehouse.id, code: 'DEFAULT' } });
  if (!location) {
    location = await prisma.location.create({
      data: { warehouseId: warehouse.id, code: 'DEFAULT', label: 'Emplacement par défaut' },
    });
  }

  for (const r of rows) {
    const articleCode = str(r['Code article'] ?? r['Article'] ?? r['code_article'] ?? r['Référence']);
    const lotNumber   = str(r['Lot'] ?? r['N° lot'] ?? r['lot'] ?? r['NumLot']);
    const qtyRaw      = num(r['Quantité'] ?? r['Qté'] ?? r['qty'] ?? r['quantite']);

    if (!articleCode || !lotNumber || qtyRaw === null) { skip++; continue; }

    const article = await prisma.article.findUnique({ where: { code: articleCode } });
    if (!article) { console.warn(`   ⚠  Article "${articleCode}" introuvable`); skip++; continue; }

    // Lot
    const lot = await prisma.stockLot.upsert({
      where: { articleId_lotNumber: { articleId: article.id, lotNumber } },
      update: { quantity: qtyRaw, locationId: location.id },
      create: {
        articleId:  article.id,
        lotNumber,
        quantity:   qtyRaw,
        locationId: location.id,
        receivedAt: excelDate(r['Date réception'] ?? r['DateReception']) ?? new Date(),
        expiryDate: excelDate(r['Date expiration'] ?? r['DateExpiration']),
        coutRevient: num(r['Coût revient'] ?? r['CoutRevient'] ?? r['cout']),
      },
    });

    // Mouvement d'entrée initial (si pas encore existant)
    const existing = await prisma.movement.findFirst({
      where: { referenceType: 'IMPORT', referenceId: `LOT-${lot.id}` },
    });
    if (!existing) {
      await prisma.movement.create({
        data: {
          direction:    'ENTREE' as MovementDirection,
          type:         'RECEIPT' as MovementType,
          quantity:     qtyRaw,
          referenceType: 'IMPORT',
          referenceId:  `LOT-${lot.id}`,
          itemId:       article.id,
          lotId:        lot.id,
          createdById:  systemUserId,
          toLocationId: location.id,
          note:         'Import Excel initial',
        },
      });
    }
    ok++;
  }
  console.log(`   ✅ ${ok} lots importés, ${skip} ignorés`);
}

// ─── 5. COMMANDES FOURNISSEUR ─────────────────────────────────────────────────
// Règles :
//   - Le lot est renseigné sur chaque ligne (PurchaseOrderLine.lotNumber)
//   - qtyDone < qty  → statut PARTIALLY_DELIVERED, commande reste ouverte
//   - qtyDone >= qty → statut DELIVERED
//   - qtyDone = 0    → statut CONFIRMED
// ─────────────────────────────────────────────────────────────────────────────

async function importCommandesFournisseur(rows: Record<string, unknown>[]) {
  console.log(`\n🛒 Commandes fournisseur : ${rows.length} lignes`);
  let ok = 0, skip = 0;

  // Regrouper les lignes par numéro de commande
  const grouped = new Map<string, Record<string, unknown>[]>();
  for (const r of rows) {
    const num = str(r['N° commande'] ?? r['NumCommande'] ?? r['numero'] ?? r['Commande']);
    if (!num) { skip++; continue; }
    if (!grouped.has(num)) grouped.set(num, []);
    grouped.get(num)!.push(r);
  }

  for (const [number, lignes] of grouped) {
    const first = lignes[0];

    // Fournisseur
    const supplierCode = str(first['Code fournisseur'] ?? first['Fournisseur'] ?? first['fournisseur']);
    let supplierId: number | null = null;
    if (supplierCode) {
      const s = await prisma.supplier.findUnique({ where: { code: supplierCode } });
      supplierId = s?.id ?? null;
    }

    // Calcul statut depuis les lignes
    const lineData: { qty: number; qtyDone: number }[] = [];
    for (const l of lignes) {
      const q  = num(l['Qté commandée'] ?? l['qty'] ?? l['Quantité']);
      const qd = num(l['Qté reçue']    ?? l['qtyDone'] ?? l['Reçu']) ?? 0;
      if (q !== null) lineData.push({ qty: q, qtyDone: qd });
    }
    const status = computeDocStatus(lineData);

    // Upsert entête
    const order = await prisma.purchaseOrder.upsert({
      where: { number },
      update: {
        supplierId,
        status,
        refDevisFournisseur:  str(first['Réf devis fourn'] ?? first['RefDevis']),
        dateDevisFournisseur: excelDate(first['Date devis fourn'] ?? first['DateDevis']),
        dateLivraisonPrevue:  excelDate(first['Date livraison prévue'] ?? first['DateLivPrevue']),
        dateLivraisonReelle:  excelDate(first['Date livraison réelle'] ?? first['DateLivReelle']),
        commentaire:          str(first['Commentaire'] ?? first['commentaire']),
      },
      create: {
        number,
        supplierId,
        status,
        refDevisFournisseur:  str(first['Réf devis fourn'] ?? first['RefDevis']),
        dateDevisFournisseur: excelDate(first['Date devis fourn'] ?? first['DateDevis']),
        dateLivraisonPrevue:  excelDate(first['Date livraison prévue'] ?? first['DateLivPrevue']),
        dateLivraisonReelle:  excelDate(first['Date livraison réelle'] ?? first['DateLivReelle']),
        commentaire:          str(first['Commentaire'] ?? first['commentaire']),
        createdAt:            excelDate(first['Date commande'] ?? first['DateCommande']) ?? new Date(),
      },
    });

    // Lignes
    for (const l of lignes) {
      const articleCode = str(l['Code article'] ?? l['Article'] ?? l['Référence']);
      if (!articleCode) continue;
      const article = await prisma.article.findUnique({ where: { code: articleCode } });
      if (!article) { console.warn(`   ⚠  Article "${articleCode}" introuvable (CF ${number})`); continue; }

      const qty     = num(l['Qté commandée'] ?? l['qty'] ?? l['Quantité']) ?? 0;
      const qtyDone = num(l['Qté reçue']    ?? l['qtyDone'] ?? l['Reçu'])  ?? 0;
      // Lot attendu renseigné sur la ligne de commande
      const lotNumber = str(l['Lot'] ?? l['N° lot'] ?? l['lot'] ?? l['NumLot']);

      // Upsert ligne (idempotent sur orderId + itemId)
      const existingLine = await prisma.purchaseOrderLine.findFirst({
        where: { orderId: order.id, itemId: article.id },
      });
      if (existingLine) {
        await prisma.purchaseOrderLine.update({
          where: { id: existingLine.id },
          data: { qty, qtyDone, unitPrice: num(l['Prix unitaire'] ?? l['PU'] ?? l['prix']), lotNumber },
        });
      } else {
        await prisma.purchaseOrderLine.create({
          data: {
            orderId:   order.id,
            itemId:    article.id,
            qty,
            qtyDone,
            unitPrice: num(l['Prix unitaire'] ?? l['PU'] ?? l['prix']),
            lotNumber,  // ← lot attendu pré-renseigné
          },
        });
      }
    }
    ok++;
  }
  console.log(`   ✅ ${ok} commandes importées, ${skip} lignes ignorées (numéro manquant)`);
}

// ─── 6. COMMANDES CLIENT ──────────────────────────────────────────────────────

async function importCommandesClient(rows: Record<string, unknown>[]) {
  console.log(`\n📋 Commandes client : ${rows.length} lignes`);
  let ok = 0, skip = 0;

  const grouped = new Map<string, Record<string, unknown>[]>();
  for (const r of rows) {
    const n = str(r['N° commande'] ?? r['NumCommande'] ?? r['numero'] ?? r['Commande']);
    if (!n) { skip++; continue; }
    if (!grouped.has(n)) grouped.set(n, []);
    grouped.get(n)!.push(r);
  }

  for (const [number, lignes] of grouped) {
    const first = lignes[0];

    const customerCode = str(first['Code client'] ?? first['Client'] ?? first['client']);
    let customerId: number | null = null;
    if (customerCode) {
      const c = await prisma.customer.findUnique({ where: { code: customerCode } });
      customerId = c?.id ?? null;
    }

    const lineData: { qty: number; qtyDone: number }[] = [];
    for (const l of lignes) {
      const q  = num(l['Qté commandée'] ?? l['qty'] ?? l['Quantité']);
      const qd = num(l['Qté livrée']   ?? l['qtyDone'] ?? l['Livré']) ?? 0;
      if (q !== null) lineData.push({ qty: q, qtyDone: qd });
    }
    const status = computeDocStatus(lineData);

    const order = await prisma.salesOrder.upsert({
      where: { number },
      update: {
        customerId,
        status,
        referenceClient: str(first['Réf client'] ?? first['RefClient']),
        numDevis:        str(first['N° devis'] ?? first['NumDevis']),
        delai:           str(first['Délai'] ?? first['delai']),
        dateFacturation: excelDate(first['Date facturation'] ?? first['DateFact']),
        commentaire:     str(first['Commentaire'] ?? first['commentaire']),
      },
      create: {
        number,
        customerId,
        status,
        referenceClient: str(first['Réf client'] ?? first['RefClient']),
        numDevis:        str(first['N° devis'] ?? first['NumDevis']),
        delai:           str(first['Délai'] ?? first['delai']),
        dateFacturation: excelDate(first['Date facturation'] ?? first['DateFact']),
        commentaire:     str(first['Commentaire'] ?? first['commentaire']),
        createdAt:       excelDate(first['Date commande'] ?? first['DateCommande']) ?? new Date(),
      },
    });

    for (const l of lignes) {
      const articleCode = str(l['Code article'] ?? l['Article'] ?? l['Référence']);
      if (!articleCode) continue;
      const article = await prisma.article.findUnique({ where: { code: articleCode } });
      if (!article) { console.warn(`   ⚠  Article "${articleCode}" introuvable (CC ${number})`); continue; }

      const qty     = num(l['Qté commandée'] ?? l['qty'] ?? l['Quantité']) ?? 0;
      const qtyDone = num(l['Qté livrée']   ?? l['qtyDone'] ?? l['Livré'])  ?? 0;
      const unitPrice = num(l['Prix unitaire'] ?? l['PU'] ?? l['prix']);

      const existingLine = await prisma.salesOrderLine.findFirst({
        where: { orderId: order.id, itemId: article.id },
      });
      if (existingLine) {
        await prisma.salesOrderLine.update({
          where: { id: existingLine.id },
          data: { qty, qtyDone, unitPrice, prixTotal: unitPrice ? qty * unitPrice : null },
        });
      } else {
        await prisma.salesOrderLine.create({
          data: {
            orderId: order.id,
            itemId:  article.id,
            qty,
            qtyDone,
            unitPrice,
            prixTotal: unitPrice ? qty * unitPrice : null,
          },
        });
      }
    }
    ok++;
  }
  console.log(`   ✅ ${ok} commandes importées, ${skip} lignes ignorées`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Démarrage de l\'import Excel...');
  console.log(`   Fichier : ${FILE}`);

  const wb = XLSX.readFile(FILE);
  console.log(`   Feuilles détectées : ${wb.SheetNames.join(', ')}`);

  const systemUserId = await ensureSystemUser();

  await importFournisseurs(readSheet(wb, 'Fournisseurs'));
  await importArticles(readSheet(wb, 'Articles'));
  await importClients(readSheet(wb, 'Clients'));
  await importStock(readSheet(wb, 'Stock'), systemUserId);
  await importCommandesFournisseur(readSheet(wb, 'Commandes fournisseur'));
  await importCommandesClient(readSheet(wb, 'Commandes client'));

  console.log('\n🎉 Import terminé avec succès !');
}

main()
  .catch((e) => { console.error('❌ Erreur :', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
