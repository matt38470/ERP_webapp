import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MovementDirection, MovementType } from "@prisma/client";

// POST /api/mouvements/reception
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { commandeId, commandeNumber, date, commentaire, lignes } = body;

    if (!lignes?.length) return NextResponse.json({ error: "Aucune ligne" }, { status: 400 });

    // Numéro de mouvement auto
    const today = new Date();
    const prefix = `RC-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const countToday = await prisma.movement.count({ where: { referenceId: { startsWith: prefix } } });
    const numero = `${prefix}-${String(countToday + 1).padStart(3, "0")}`;

    const movedAt = date ? new Date(date) : new Date();

    // Utilisateur système
    const sysUser = await prisma.user.findFirst();
    const createdById = sysUser?.id ?? 1;

    const results = [];

    for (const ligne of lignes) {
      const { lineId, articleId, qty, lotNumber, unitCost } = ligne;

      // Créer ou mettre à jour le lot
      let lot = await prisma.stockLot.findUnique({
        where: { articleId_lotNumber: { articleId: parseInt(articleId), lotNumber } },
      });
      if (!lot) {
        lot = await prisma.stockLot.create({
          data: {
            articleId: parseInt(articleId),
            lotNumber,
            quantity: 0,
            coutRevient: unitCost ? parseFloat(unitCost) : null,
          },
        });
      }

      // Créer le mouvement
      const mvt = await prisma.movement.create({
        data: {
          movedAt,
          direction: MovementDirection.ENTREE,
          type: MovementType.RECEIPT,
          quantity: qty,
          referenceType: "PURCHASE_ORDER",
          referenceId: commandeNumber ?? numero,
          note: commentaire || null,
          itemId: parseInt(articleId),
          lotId: lot.id,
          createdById,
        },
      });

      // Créer la ligne de mouvement
      await prisma.stockMovementLine.create({
        data: {
          movementId: mvt.id,
          articleId: parseInt(articleId),
          lotId: lot.id,
          quantity: qty,
          unitCost: unitCost ? parseFloat(unitCost) : null,
        },
      });

      // Mettre à jour qtyDone sur la ligne de commande
      if (lineId) {
        await prisma.purchaseOrderLine.update({
          where: { id: parseInt(lineId) },
          data: { qtyDone: { increment: qty } },
        });
      }

      // Mettre à jour la quantité du lot
      await prisma.stockLot.update({
        where: { id: lot.id },
        data: { quantity: { increment: qty } },
      });

      results.push(mvt);
    }

    // Vérifier si la commande est entièrement réceptionnée
    const commande = await prisma.purchaseOrder.findUnique({
      where: { id: parseInt(commandeId) },
      include: { lines: true },
    });
    if (commande) {
      const toutRecu = commande.lines.every((l) => Number(l.qtyDone) >= Number(l.qty));
      if (toutRecu) {
        await prisma.purchaseOrder.update({
          where: { id: parseInt(commandeId) },
          data: { status: "DELIVERED", dateLivraisonReelle: movedAt },
        });
      } else {
        await prisma.purchaseOrder.update({
          where: { id: parseInt(commandeId) },
          data: { status: "PARTIALLY_DELIVERED" },
        });
      }
    }

    return NextResponse.json({ success: true, numero, count: results.length });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
