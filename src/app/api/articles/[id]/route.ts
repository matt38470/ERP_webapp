import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({
    where: { id: Number(params.id) },
    include: {
      lots: { where: { status: 'AVAILABLE' }, orderBy: { receivedAt: 'desc' } },
      parentKits: { include: { parentArticle: true } },
      childKits: { include: { childArticle: true } },
    }
  })
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(article)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json()
  const article = await prisma.article.update({
    where: { id: Number(params.id) },
    data: body,
  })
  return NextResponse.json(article)
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.article.update({
    where: { id: Number(params.id) },
    data: { isActive: false },
  })
  return NextResponse.json({ ok: true })
}
