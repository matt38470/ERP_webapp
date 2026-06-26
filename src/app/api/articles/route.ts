import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? ''
  const famille = searchParams.get('famille') ?? ''
  const type = searchParams.get('type') ?? ''
  const actif = searchParams.get('actif')

  const articles = await prisma.article.findMany({
    where: {
      AND: [
        q ? {
          OR: [
            { code: { contains: q, mode: 'insensitive' } },
            { designationFr: { contains: q, mode: 'insensitive' } },
            { designationEn: { contains: q, mode: 'insensitive' } },
          ]
        } : {},
        famille ? { famille: { contains: famille, mode: 'insensitive' } } : {},
        type ? { type: type as any } : {},
        actif !== null && actif !== '' ? { isActive: actif === 'true' } : {},
      ]
    },
    orderBy: { code: 'asc' },
    take: 200,
  })
  return NextResponse.json(articles)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const article = await prisma.article.create({ data: body })
  return NextResponse.json(article, { status: 201 })
}
