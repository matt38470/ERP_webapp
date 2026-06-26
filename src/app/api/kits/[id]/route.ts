import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const kit = await prisma.article.findUnique({
    where: { id: Number(params.id) },
    select: {
      id: true,
      code: true,
      designationFr: true,
      designationEn: true,
      commentaire: true,
      isActive: true,
      parentKits: {
        select: {
          id: true,
          quantity: true,
          childArticle: {
            select: { id: true, code: true, designationFr: true, designationEn: true },
          },
        },
      },
      kitLoans: {
        orderBy: { sentAt: 'desc' },
        select: {
          id: true,
          type: true,
          status: true,
          sentAt: true,
          returnedAt: true,
          contact: true,
          note: true,
          customer: {
            select: { id: true, code: true, etablissement: true, nom: true, prenom: true },
          },
        },
      },
    },
  })

  if (!kit) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(kit)
}
