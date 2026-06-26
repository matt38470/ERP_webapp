import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; compId: string } }
) {
  await prisma.kitComponent.delete({
    where: { id: Number(params.compId) },
  })
  return NextResponse.json({ ok: true })
}
