import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const f = await prisma.supplier.findUnique({
    where: { id: Number(params.id) },
    include: {
      country: true,
      purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 20 },
    }
  })
  if (!f) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(f)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const f = await prisma.supplier.update({
    where: { id: Number(params.id) },
    data: body,
  })
  return NextResponse.json(f)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.supplier.update({
    where: { id: Number(params.id) },
    data: { isActive: false },
  })
  return NextResponse.json({ ok: true })
}
