import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const kits = await prisma.article.findMany({
    where: { type: 'KIT' },
    orderBy: { code: 'asc' },
    select: {
      id: true,
      code: true,
      designationFr: true,
      designationEn: true,
      isActive: true,
      _count: {
        select: {
          parentKits: true,
          kitLoans: true,
        },
      },
      kitLoans: {
        where: { status: 'EN_COURS' },
        orderBy: { sentAt: 'desc' },
        take: 1,
        select: {
          id: true,
          type: true,
          status: true,
          sentAt: true,
          customer: {
            select: { code: true, etablissement: true, nom: true, prenom: true },
          },
        },
      },
    },
  })

  return NextResponse.json(kits)
}
