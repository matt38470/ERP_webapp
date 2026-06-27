const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Nettoyage dans l'ordre des dépendances
  await prisma.stockMovementLine.deleteMany()
  await prisma.movement.deleteMany()
  await prisma.stockLot.deleteMany()
  await prisma.kitComponent.deleteMany()
  await prisma.kitLoan.deleteMany()
  await prisma.salesOrderLine.deleteMany()
  await prisma.purchaseOrderLine.deleteMany()
  await prisma.deliveryNote.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.salesOrder.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.priceListItem.deleteMany()
  await prisma.priceList.deleteMany()
  await prisma.supplierPrice.deleteMany()
  await prisma.location.deleteMany()
  await prisma.warehouse.deleteMany()
  await prisma.article.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.country.deleteMany()
  await prisma.customerGroup.deleteMany()
  await prisma.movementReason.deleteMany()
  await prisma.user.deleteMany()

  // Utilisateur
  const user = await prisma.user.create({
    data: {
      email: 'admin@local.test',
      name: 'Admin',
      role: 'stock',
    },
  })

  // Pays
  const france = await prisma.country.create({
    data: { code: 'FR', name: 'France' },
  })

  // Entrepôt + emplacements
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
    include: { locations: true },
  })

  const mainLocation = wh.locations.find((l) => l.code === 'MAIN')

  // Articles
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

  // Lots — locationId à la place de location
  const lot1 = await prisma.stockLot.create({
    data: {
      articleId:  a1.id,
      lotNumber:  'LOT-A1',
      quantity:   '10',
      status:     'AVAILABLE',
      locationId: mainLocation.id,
    },
  })

  const lot2 = await prisma.stockLot.create({
    data: {
      articleId:  a2.id,
      lotNumber:  'LOT-A2',
      quantity:   '8',
      status:     'AVAILABLE',
      locationId: mainLocation.id,
    },
  })

  // Client — plus de champ `name`, utiliser nom/etablissement + countryId
  const customer = await prisma.customer.create({
    data: {
      code:         'CUST-001',
      etablissement: 'Client test',
      countryId:    france.id,
    },
  })

  // Commande client
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

  console.log('✅ Seed terminé')
  console.log({ user, wh: wh.code, a1: a1.code, a2: a2.code, kit: kit.code, lot1: lot1.lotNumber, lot2: lot2.lotNumber, customer: customer.code, order: order.number })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
