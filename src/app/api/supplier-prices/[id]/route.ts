import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const price = await prisma.supplierPrice.update({
    where: { id: Number(params.id) },
    data: {
      unitPrice:  body.unitPrice  !== undefined ? body.unitPrice  : undefined,
      qtyMin:     body.qtyMin     !== undefined ? (body.qtyMin || null) : undefined,
      refDevis:   body.refDevis   !== undefined ? (body.refDevis || null) : undefined,
      dateDevis:  body.dateDevis  !== undefined ? (body.dateDevis ? new Date(body.dateDevis) : null) : undefined,
      validFrom:  body.validFrom  !== undefined ? (body.validFrom ? new Date(body.validFrom) : null) : undefined,
      validTo:    body.validTo    !== undefined ? (body.validTo   ? new Date(body.validTo)   : null) : undefined,
      currency:   body.currency   !== undefined ? body.currency   : undefined,
      note:       body.note       !== undefined ? (body.note || null) : undefined,
      isActive:   body.isActive   !== undefined ? body.isActive   : undefined,
    },
  })
  return NextResponse.json(price)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.supplierPrice.delete({ where: { id: Number(params.id) } })
  return NextResponse.json({ ok: true })
}
