const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  await prisma.stockMovementLine.deleteMany()
  await prisma.movement.deleteMany()
  await prisma.stockLot.deleteMany()
  await prisma.kitComponent.deleteMany()
  await prisma.salesOrderLine.deleteMany()
  await prisma.purchaseOrderLine.deleteMany()
  await prisma.deliveryNote.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.salesOrder.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.location.deleteMany()
  await prisma.warehouse.deleteMany()
  await prisma.article.deleteMany()
  await prisma.user.deleteMany()

  const user = await prisma.user.create({
    data: {
      email: 'admin@local.test',
      name: 'Admin',
      role: 'stock',
    },
  })

  const wh = await prisma.warehouse.create({
    data: {
      code: 'WH1',
      name: 'Entrepôt principal',
      locations: {
        create: [
          { code: 'MAIN', label: 'Zone principale' },
          { code: 'RECV', label: 'Réception' },
        ],
      },
    },
  })

const a1 = await prisma.article.create({
  data: {
    code: 'IN000214',
    designationFr: 'Clou intramédullaire verrouillé 3,5mm Lg 102mm',
    designationEn: 'Locked intramedullary nail 3.5mm L 102mm',
    type: 'SIMPLE',
  },
})

const a2 = await prisma.article.create({
  data: {
    code: 'IN000215',
    designationFr: 'Clou intramédullaire verrouillé 3,5mm Lg 118mm',
    designationEn: 'Locked intramedullary nail 3.5mm L 118mm',
    type: 'SIMPLE',
  },
})

const kit = await prisma.article.create({
  data: {
    code: 'IS000001',
    designationFr: 'Kit démonstration 3,5mm',
    designationEn: '3.5mm demo kit',
    type: 'KIT',
  },
})

  await prisma.kitComponent.createMany({
    data: [
      { parentArticleId: kit.id, childArticleId: a1.id, quantity: '2' },
      { parentArticleId: kit.id, childArticleId: a2.id, quantity: '1' },
    ],
  })

  const lot1 = await prisma.stockLot.create({
    data: {
      articleId: a1.id,
      lotNumber: 'LOT-A1',
      quantity: '10',
      status: 'AVAILABLE',
      location: 'MAIN',
    },
  })

  const lot2 = await prisma.stockLot.create({
    data: {
      articleId: a2.id,
      lotNumber: 'LOT-A2',
      quantity: '8',
      status: 'AVAILABLE',
      location: 'MAIN',
    },
  })

const customer = await prisma.customer.create({
  data: {
    code: 'CUST-001',
    name: 'Client test',
    country: {
      create: {
        code: 'FR',
        name: 'France',
      },
    },
  },
})

const order = await prisma.salesOrder.create({
  data: {
    number: 'SO-0001',
    status: 'DRAFT',
    customer: {
      connect: { id: customer.id },
    },
    lines: {
      create: [
        { itemId: kit.id, qty: '2', qtyDone: '0' },
      ],
    },
  },
})

  console.log({ user, wh, a1, a2, kit, lot1, lot2, order })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })