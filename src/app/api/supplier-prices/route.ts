import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const articleId = searchParams.get('articleId')
  const supplierId = searchParams.get('supplierId')

  const prices = await prisma.supplierPrice.findMany({
    where: {
      ...(articleId ? { articleId: Number(articleId) } : {}),
      ...(supplierId ? { supplierId: Number(supplierId) } : {}),
    },
    include: {
      supplier: { select: { id: true, code: true, name: true } },
      article:  { select: { id: true, code: true, designationFr: true } },
    },
    orderBy: [{ supplierId: 'asc' }, { qtyMin: 'asc' }, { validFrom: 'desc' }],
  })
  return NextResponse.json(prices)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const price = await prisma.supplierPrice.create({
    data: {
      supplierId:  Number(body.supplierId),
      articleId:   Number(body.articleId),
      unitPrice:   body.unitPrice,
      qtyMin:      body.qtyMin      ?? null,
      refDevis:    body.refDevis    ?? null,
      dateDevis:   body.dateDevis   ? new Date(body.dateDevis)  : null,
      validFrom:   body.validFrom   ? new Date(body.validFrom)  : null,
      validTo:     body.validTo     ? new Date(body.validTo)    : null,
      currency:    body.currency    ?? 'EUR',
      note:        body.note        ?? null,
    },
    include: {
      supplier: { select: { id: true, code: true, name: true } },
    },
  })
  return NextResponse.json(price, { status: 201 })
}
