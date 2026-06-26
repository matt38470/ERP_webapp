import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const actif = searchParams.get('actif')

  const fournisseurs = await prisma.supplier.findMany({
    where: {
      AND: [
        q ? {
          OR: [
            { code: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ]
        } : {},
        actif !== null && actif !== '' ? { isActive: actif === 'true' } : {},
      ]
    },
    include: { country: true },
    orderBy: { code: 'asc' },
    take: 200,
  })
  return NextResponse.json(fournisseurs)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const fournisseur = await prisma.supplier.create({ data: body })
  return NextResponse.json(fournisseur, { status: 201 })
}
