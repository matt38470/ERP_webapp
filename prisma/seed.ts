import { PrismaClient, MovementType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Utilisateur admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@erp.local' },
    update: {},
    create: { email: 'admin@erp.local', name: 'Admin', role: 'admin' },
  })

  // Entrepôt principal
  const warehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-MAIN' },
    update: {},
    create: {
      code: 'WH-MAIN', name: 'Entrepôt principal',
      locations: { create: [
        { code: 'A1', label: 'Zone A - Allée 1' },
        { code: 'B1', label: 'Zone B - Allée 1' },
        { code: 'DEMO', label: 'Démonstration' },
        { code: 'PRET', label: 'Prêts clients' },
      ]},
    },
  })

  // Référentiel articles
  const items = await Promise.all([
    prisma.item.upsert({ where: { sku: 'CL-42' }, update: {}, create: { sku: 'CL-42', name: 'Clou 42mm', family: 'Clous', unit: 'pcs' } }),
    prisma.item.upsert({ where: { sku: 'VIS-304' }, update: {}, create: { sku: 'VIS-304', name: 'Vis 30x4mm', family: 'Vis', unit: 'pcs' } }),
    prisma.item.upsert({ where: { sku: 'SET-AX' }, update: {}, create: { sku: 'SET-AX', name: 'Set Assemblage AX', family: 'Sets', unit: 'set' } }),
  ])

  // Lots
  const lots = await Promise.all([
    prisma.lot.upsert({ where: { itemId_code: { itemId: items[0].id, code: 'LOT-CL-001' } }, update: {}, create: { itemId: items[0].id, code: 'LOT-CL-001', receivedAt: new Date('2025-01-10') } }),
    prisma.lot.upsert({ where: { itemId_code: { itemId: items[1].id, code: 'LOT-VIS-001' } }, update: {}, create: { itemId: items[1].id, code: 'LOT-VIS-001', receivedAt: new Date('2025-03-15') } }),
  ])

  // Mouvements d'inventaire initial
  await prisma.movement.createMany({
    data: [
      { movedAt: new Date('2025-12-31'), itemId: items[0].id, lotId: lots[0].id, type: MovementType.RECEIPT, quantity: 5000, referenceType: 'INVENTAIRE', referenceId: 'INV-31122025', note: 'Inventaire initial', createdById: admin.id },
      { movedAt: new Date('2025-12-31'), itemId: items[1].id, lotId: lots[1].id, type: MovementType.RECEIPT, quantity: 3200, referenceType: 'INVENTAIRE', referenceId: 'INV-31122025', note: 'Inventaire initial', createdById: admin.id },
      { movedAt: new Date('2026-01-15'), itemId: items[0].id, lotId: lots[0].id, type: MovementType.ISSUE, quantity: 120, referenceType: 'COMMANDE_CLIENT', referenceId: 'CC-0001', createdById: admin.id },
      { movedAt: new Date('2026-02-03'), itemId: items[1].id, lotId: lots[1].id, type: MovementType.ISSUE, quantity: 400, referenceType: 'COMMANDE_CLIENT', referenceId: 'CC-0002', createdById: admin.id },
    ],
  })

  console.log('✅ Seed terminé')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
