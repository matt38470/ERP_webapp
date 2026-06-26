import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const actif = searchParams.get('actif')

  const clients = await prisma.customer.findMany({
    where: {
      AND: [
        q ? {
          OR: [
            { code: { contains: q, mode: 'insensitive' } },
            { etablissement: { contains: q, mode: 'insensitive' } },
            { nom: { contains: q, mode: 'insensitive' } },
            { prenom: { contains: q, mode: 'insensitive' } },
          ]
        } : {},
        actif !== null && actif !== '' ? { isActive: actif === 'true' } : {},
      ]
    },
    include: { country: true },
    orderBy: { code: 'asc' },
    take: 200,
  })
  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const client = await prisma.customer.create({ data: body })
  return NextResponse.json(client, { status: 201 })
}
