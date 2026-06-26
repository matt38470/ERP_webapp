import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      articlesActifs,
      lotsSuivis,
      stockDisponible,
      clientsActifs,
      fournisseursActifs,
      commandesOuvertes,
      commandesFournOuvertes,
      blAFacturer,
      recentMovements,
      stockAlerts,
    ] = await Promise.all([
      prisma.article.count({ where: { isActive: true } }),
      prisma.stockLot.count({ where: { status: { in: ['AVAILABLE', 'RESERVED'] } } }),
      prisma.stockLot.aggregate({
        where: { status: 'AVAILABLE' },
        _sum: { quantity: true },
      }),
      prisma.customer.count({ where: { isActive: true } }),
      prisma.supplier.count({ where: { isActive: true } }),
      prisma.salesOrder.count({ where: { status: { in: ['DRAFT', 'CONFIRMED', 'PARTIALLY_DELIVERED'] } } }),
      prisma.purchaseOrder.count({ where: { status: { in: ['DRAFT', 'CONFIRMED', 'PARTIALLY_DELIVERED'] } } }),
      prisma.deliveryNote.count({ where: { status: { in: ['DRAFT', 'CONFIRMED', 'DELIVERED'] } } }),
      prisma.movement.findMany({
        take: 10,
        orderBy: { movedAt: 'desc' },
        include: {
          item:   { select: { code: true } },
          lot:    { select: { lotNumber: true } },
          reason: { select: { label: true } },
        },
      }),
      // Articles sous stock min
      prisma.$queryRaw<{ code: string; total: number; stockMin: number }[]>`
        SELECT a.code, a."stockMin",
               COALESCE(SUM(l.quantity), 0) AS total
        FROM "Article" a
        LEFT JOIN "StockLot" l ON l."articleId" = a.id AND l.status = 'AVAILABLE'
        WHERE a."isActive" = true AND a."stockMin" IS NOT NULL
        GROUP BY a.id
        HAVING COALESCE(SUM(l.quantity), 0) <= a."stockMin"
        LIMIT 5
      `,
    ])

    // Construction des alertes
    const alerts = []

    for (const art of stockAlerts) {
      alerts.push({
        level: Number(art.total) === 0 ? 'danger' : 'warn',
        msg: `${Number(art.total) === 0 ? '🔴 Rupture' : '🟠 Stock bas'} : ${art.code} (${Number(art.total).toFixed(0)} / min ${Number(art.stockMin).toFixed(0)})`,
        href: '/stock',
      })
    }

    if (blAFacturer > 0) {
      alerts.push({ level: 'warn', msg: `📋 ${blAFacturer} BL en attente de facturation`, href: '/documents' })
    }
    if (commandesFournOuvertes > 0) {
      alerts.push({ level: 'info', msg: `🏭 ${commandesFournOuvertes} commande(s) fournisseur ouverte(s)`, href: '/fournisseurs' })
    }

    return NextResponse.json({
      kpis: {
        articlesActifs,
        lotsSuivis,
        stockDisponible: Number(stockDisponible._sum.quantity ?? 0),
        clientsActifs,
        fournisseursActifs,
        commandesOuvertes,
        commandesFournOuvertes,
        blAFacturer,
      },
      recentMovements,
      alerts,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
