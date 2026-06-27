import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/mouvements/commandes-fournisseur?supplierId=X
// Retourne les commandes fournisseur non clôturées + leurs lignes
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get("supplierId");

  const where: any = {};
  if (supplierId) where.supplierId = parseInt(supplierId);

  const commandes = await prisma.purchaseOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      supplier: { select: { id: true, name: true, code: true } },
      lines: {
        include: {
          item: { select: { id: true, code: true, designationFr: true, indice: true, prixAchatRef: true } },
        },
      },
    },
  });

  return NextResponse.json(commandes);
}
