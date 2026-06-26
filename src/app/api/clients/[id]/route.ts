import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const client = await prisma.customer.findUnique({
    where: { id: Number(params.id) },
    include: {
      country: true,
      orders: { orderBy: { createdAt: 'desc' }, take: 20 },
    }
  })
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const client = await prisma.customer.update({
    where: { id: Number(params.id) },
    data: body,
  })
  return NextResponse.json(client)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.customer.update({
    where: { id: Number(params.id) },
    data: { isActive: false },
  })
  return NextResponse.json({ ok: true })
}
