import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MovementDirection, MovementType, ProductType } from "@prisma/client";

// POST /api/mouvements/transfert
// Crée une SORTIE (TRANSFER_OUT) + une ENTREE (TRANSFER_IN) pour chaque ligne
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, commentaire, lignes } = body;
    if (!lignes?.length) return NextResponse.json({ error: "Aucune ligne" }, { status: 400 });

    const today = new Date();
    const prefix = `TR-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const countToday = await prisma.movement.count({ where: { referenceId: { startsWith: prefix } } });
    const numero = `${prefix}-${String(countToday + 1).padStart(3, "0")}`;
    const movedAt = date ? new Date(date) : new Date();

    const sysUser = await prisma.user.findFirst();
    const createdById = sysUser?.id ?? 1;

    for (const ligne of lignes) {
      const { articleId, qty, lotSource, lotCible, typStockSource, typStockCible } = ligne;
      const artId = parseInt(articleId);

      // Lot source (doit exister)
      const lotSrc = lotSource?.trim();
      let lotSrcRecord = lotSrc
        ? await prisma.stockLot.findUnique({ where: { articleId_lotNumber: { articleId: artId, lotNumber: lotSrc } } })
        : null;
      if (!lotSrcRecord) {
        lotSrcRecord = await prisma.stockLot.create({
          data: { articleId: artId, lotNumber: lotSrc || "I", quantity: 0 },
        });
      }

      // Lot cible
      const lotDst = (lotCible?.trim() || lotSrc || "I");
      let lotDstRecord = await prisma.stockLot.findUnique({
        where: { articleId_lotNumber: { articleId: artId, lotNumber: lotDst } },
      });
      if (!lotDstRecord) {
        lotDstRecord = await prisma.stockLot.create({
          data: { articleId: artId, lotNumber: lotDst, quantity: 0 },
        });
      }

      // Mouvement SORTIE du stock source
      const mvtOut = await prisma.movement.create({
        data: {
          movedAt, direction: MovementDirection.SORTIE, type: MovementType.TRANSFER_OUT,
          quantity: qty, referenceType: "TRANSFER", referenceId: numero,
          note: commentaire || null,
          itemId: artId, lotId: lotSrcRecord.id, createdById,
        },
      });
      await prisma.stockMovementLine.create({
        data: { movementId: mvtOut.id, articleId: artId, lotId: lotSrcRecord.id, quantity: -qty, sourceLotNumber: lotSrc, targetLotNumber: lotDst },
      });
      await prisma.stockLot.update({ where: { id: lotSrcRecord.id }, data: { quantity: { decrement: qty } } });

      // Mouvement ENTREE dans le stock cible
      const mvtIn = await prisma.movement.create({
        data: {
          movedAt, direction: MovementDirection.ENTREE, type: MovementType.TRANSFER_IN,
          quantity: qty, referenceType: "TRANSFER", referenceId: numero,
          note: commentaire || null,
          itemId: artId, lotId: lotDstRecord.id, createdById,
        },
      });
      await prisma.stockMovementLine.create({
        data: { movementId: mvtIn.id, articleId: artId, lotId: lotDstRecord.id, quantity: qty, sourceLotNumber: lotSrc, targetLotNumber: lotDst },
      });
      await prisma.stockLot.update({ where: { id: lotDstRecord.id }, data: { quantity: { increment: qty } } });

      // Mettre à jour le typeProduit de l'article
      const typeCibleEnum = typStockCible as ProductType;
      await prisma.article.update({ where: { id: artId }, data: { typeProduit: typeCibleEnum } });
    }

    return NextResponse.json({ success: true, numero });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
