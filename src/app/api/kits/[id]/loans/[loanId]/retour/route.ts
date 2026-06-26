import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: Request,
  { params }: { params: { id: string; loanId: string } }
) {
  const loan = await prisma.kitLoan.update({
    where: { id: Number(params.loanId) },
    data: {
      status: 'RETOURNE',
      returnedAt: new Date(),
    },
  })

  return NextResponse.json(loan)
}
