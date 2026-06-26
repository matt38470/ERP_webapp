import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { customerId, type, sentAt, contact, note } = body

  // Vérifier qu'il n'y a pas déjà un prêt EN_COURS
  const existing = await prisma.kitLoan.findFirst({
    where: { articleId: Number(params.id), status: 'EN_COURS' },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'Ce kit a déjà un prêt/démo en cours. Enregistrez le retour avant d\'en créer un nouveau.' },
      { status: 409 }
    )
  }

  const loan = await prisma.kitLoan.create({
    data: {
      articleId: Number(params.id),
      customerId: Number(customerId),
      type,
      status: type === 'SALE' ? 'VENDU' : 'EN_COURS',
      sentAt: sentAt ? new Date(sentAt) : new Date(),
      contact: contact || null,
      note: note || null,
    },
  })

  return NextResponse.json(loan, { status: 201 })
}
