import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/mouvements/commandes-client?customerId=X
// Retourne les commandes client avec RAL calculé par article
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const customerId = searchParams.get("customerId");

  const where: any = {};
  if (customerId) where.customerId = parseInt(customerId);

  const commandes = await prisma.salesOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      customer: { select: { id: true, etablissement: true, nom: true, prenom: true, code: true } },
      lines: {
        include: {
          item: { select: { id: true, code: true, designationFr: true, indice: true } },
        },
      },
    },
  });

  // Calculer le RAL pour chaque ligne (qté commandée - déjà sorties liées)
  const result = await Promise.all(
    commandes.map(async (cde) => ({
      ...cde,
      lines: await Promise.all(
        cde.lines.map(async (line) => {
          const sorties = await prisma.stockMovementLine.aggregate({
            where: {
              articleId: line.itemId,
              movement: { referenceId: cde.number },
            },
            _sum: { quantity: true },
          });
          const qteSortie = Math.abs(sorties._sum.quantity ?? 0);
          return {
            ...line,
            ral: Math.max(0, line.qty - qteSortie),
          };
        })
      ),
    }))
  );

  return NextResponse.json(result);
}
