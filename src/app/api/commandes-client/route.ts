import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — liste des commandes client
export async function GET() {
  try {
    const orders = await prisma.salesOrder.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, code: true, etablissement: true, nom: true, prenom: true } },
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

// POST — créer une commande client
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      customerId,
      referenceClient,
      numDevis,
      delai,
      devise,
      dateFacturation,
      commentaire,
      lines, // [{ itemId, qty, unitPrice }]
    } = body

    if (!lines || lines.length === 0) {
      return NextResponse.json({ error: 'Au moins une ligne est requise' }, { status: 400 })
    }

    const count = await prisma.salesOrder.count()
    const number = `CC-${String(count + 1).padStart(5, '0')}`

    const order = await prisma.salesOrder.create({
      data: {
        number,
        customerId:      customerId ? Number(customerId) : null,
        status:          'CONFIRMED',
        referenceClient: referenceClient || null,
        numDevis:        numDevis        || null,
        delai:           delai           || null,
        devise:          devise          || 'EUR',
        dateFacturation: dateFacturation ? new Date(dateFacturation) : null,
        commentaire:     commentaire     || null,
        lines: {
          create: lines.map((l: { itemId: number; qty: number; unitPrice?: number }) => ({
            itemId:    Number(l.itemId),
            qty:       Number(l.qty),
            qtyDone:   0,
            unitPrice: l.unitPrice ? Number(l.unitPrice) : null,
            prixTotal: l.unitPrice ? Number(l.qty) * Number(l.unitPrice) : null,
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
