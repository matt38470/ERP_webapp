import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — liste des commandes fournisseur
export async function GET() {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, code: true, name: true } },
        lines: {
          include: { item: { select: { id: true, code: true, designationFr: true } } },
        },
      },
    })
    return NextResponse.json(orders)
  } catch (e) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST — créer une commande fournisseur
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      supplierId,
      refDevisFournisseur,
      dateDevisFournisseur,
      dateLivraisonPrevue,
      commentaire,
      lines, // [{ itemId, qty, unitPrice, lotNumber }]
    } = body

    if (!lines || lines.length === 0) {
      return NextResponse.json({ error: 'Au moins une ligne est requise' }, { status: 400 })
    }

    // Génération du numéro auto
    const count = await prisma.purchaseOrder.count()
    const number = `CF-${String(count + 1).padStart(5, '0')}`

    const order = await prisma.purchaseOrder.create({
      data: {
        number,
        supplierId:           supplierId ? Number(supplierId) : null,
        status:               'CONFIRMED',
        refDevisFournisseur:  refDevisFournisseur || null,
        dateDevisFournisseur: dateDevisFournisseur ? new Date(dateDevisFournisseur) : null,
        dateLivraisonPrevue:  dateLivraisonPrevue  ? new Date(dateLivraisonPrevue)  : null,
        commentaire:          commentaire || null,
        lines: {
          create: lines.map((l: { itemId: number; qty: number; unitPrice?: number; lotNumber?: string }) => ({
            itemId:    Number(l.itemId),
            qty:       Number(l.qty),
            qtyDone:   0,
            unitPrice: l.unitPrice ? Number(l.unitPrice) : null,
            lotNumber: l.lotNumber || null,
          })),
        },
      },
      include: { lines: true },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: e.message ?? 'Erreur serveur' }, { status: 500 })
  }
}
