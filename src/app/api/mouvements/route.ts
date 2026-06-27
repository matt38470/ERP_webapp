import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MovementDirection, MovementType } from "@prisma/client";

// GET /api/mouvements?page=1&limit=50
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.movement.findMany({
      skip,
      take: limit,
      orderBy: { movedAt: "desc" },
      include: {
        item: { select: { code: true, designationFr: true, indice: true } },
        lot: { select: { lotNumber: true } },
        createdBy: { select: { name: true } },
      },
    }),
    prisma.movement.count(),
  ]);

  return NextResponse.json({ data, total, page, limit });
}

// POST /api/mouvements  — crée un ou plusieurs mouvements (panier)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // body: { direction, type, motif, date, nomPartenaire, numCommande,
    //         numCommandeClient, commentaire, userId,
    //         lignes: [{ articleId, qty, indice, lotNumber, typStock, unitCost }] }

    const {
      direction,
      type,
      motif,
      date,
      nomPartenaire,
      numCommande,
      numCommandeClient,
      commentaire,
      userId,
      lignes,
    } = body;

    if (!lignes || lignes.length === 0) {
      return NextResponse.json({ error: "Aucune ligne" }, { status: 400 });
    }

    // Générer le numéro de mouvement (format MV-YYYYMMDD-XXX)
    const today = new Date();
    const prefix = `MV-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const countToday = await prisma.movement.count({
      where: { referenceId: { startsWith: prefix } },
    });
    const numero = `${prefix}-${String(countToday + 1).padStart(3, "0")}`;

    const movedAt = date ? new Date(date) : new Date();
    const dir: MovementDirection =
      direction === "ENTREE" ? MovementDirection.ENTREE : MovementDirection.SORTIE;
    const mvtType: MovementType = (type as MovementType) ?? MovementType.ADJUSTMENT;

    // Trouver ou créer l'utilisateur système si pas de userId
    let createdById = userId ? parseInt(userId) : null;
    if (!createdById) {
      const sysUser = await prisma.user.findUnique({ where: { email: "import@system.local" } });
      createdById = sysUser?.id ?? 1;
    }

    const results = [];

    for (const ligne of lignes) {
      const { articleId, qty, lotNumber, unitCost } = ligne;

      // Gérer le lot
      const lotNum = (lotNumber ?? "").trim() || "I";
      let lot = await prisma.stockLot.findUnique({
        where: { articleId_lotNumber: { articleId: parseInt(articleId), lotNumber: lotNum } },
      });
      if (!lot) {
        lot = await prisma.stockLot.create({
          data: { articleId: parseInt(articleId), lotNumber: lotNum, quantity: 0 },
        });
      }

      // Vérification stock si SORTIE
      if (dir === MovementDirection.SORTIE) {
        const stockActuel = await prisma.stockMovementLine.aggregate({
          where: { articleId: parseInt(articleId) },
          _sum: { quantity: true },
        });
        const stock = stockActuel._sum.quantity ?? 0;
        if (stock < qty) {
          return NextResponse.json(
            { error: `Stock insuffisant pour l'article ID ${articleId} (stock: ${stock}, demandé: ${qty})` },
            { status: 422 }
          );
        }
      }

      const mvt = await prisma.movement.create({
        data: {
          movedAt,
          direction: dir,
          type: mvtType,
          quantity: qty,
          referenceType: motif ?? "MANUEL",
          referenceId: numCommande ?? numero,
          note: [nomPartenaire, numCommandeClient, commentaire].filter(Boolean).join(" | ") || null,
          itemId: parseInt(articleId),
          lotId: lot.id,
          createdById,
        },
      });

      await prisma.stockMovementLine.create({
        data: {
          movementId: mvt.id,
          articleId: parseInt(articleId),
          lotId: lot.id,
          quantity: dir === MovementDirection.ENTREE ? qty : -qty,
          unitCost: unitCost ? parseFloat(unitCost) : null,
        },
      });

      results.push(mvt);
    }

    return NextResponse.json({ success: true, numero, count: results.length });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
