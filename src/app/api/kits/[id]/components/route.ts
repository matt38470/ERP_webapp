import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const components = await prisma.articleKit.findMany({
    where: { parentArticleId: Number(params.id) },
    orderBy: { childArticle: { code: 'asc' } },
    select: {
      id: true,
      quantity: true,
      childArticle: { select: { id: true, code: true, designationFr: true } },
    },
  })
  return NextResponse.json(components)
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { childArticleId, quantity } = await req.json()

  // Empêcher un kit d'être son propre composant
  if (Number(childArticleId) === Number(params.id)) {
    return NextResponse.json({ error: 'Un kit ne peut pas être son propre composant.' }, { status: 400 })
  }

  // Vérifier doublon
  const existing = await prisma.articleKit.findFirst({
    where: { parentArticleId: Number(params.id), childArticleId: Number(childArticleId) },
  })
  if (existing) {
    return NextResponse.json({ error: 'Cet article est déjà dans la composition.' }, { status: 409 })
  }

  const comp = await prisma.articleKit.create({
    data: {
      parentArticleId: Number(params.id),
      childArticleId: Number(childArticleId),
      quantity: Number(quantity),
    },
    select: {
      id: true,
      quantity: true,
      childArticle: { select: { id: true, code: true, designationFr: true } },
    },
  })

  return NextResponse.json(comp, { status: 201 })
}
