import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/customer-price?customerId=X&articleId=Y
 *
 * Résout le prix de vente applicable pour un client + article donnés.
 * Logique : on lit le codeTarif du client ("0" à "6"),
 * puis on retourne article.prixN correspondant.
 * Si le champ est null ou le codeTarif inconnu, on descend en cascade :
 *   codeTarif du client → prix0 (public) → null
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customerId')
  const articleId  = searchParams.get('articleId')

  if (!articleId) {
    return NextResponse.json({ error: 'articleId requis' }, { status: 400 })
  }

  // Charger l'article avec tous ses prix
  const article = await prisma.article.findUnique({
    where: { id: Number(articleId) },
    select: {
      id: true,
      prix0: true, prix1: true, prix2: true,
      prix3: true, prix4: true, prix5: true, prix6: true,
    },
  })

  if (!article) {
    return NextResponse.json({ error: 'Article introuvable' }, { status: 404 })
  }

  const prixMap: Record<string, number | null> = {
    '0': article.prix0 ? Number(article.prix0) : null,
    '1': article.prix1 ? Number(article.prix1) : null,
    '2': article.prix2 ? Number(article.prix2) : null,
    '3': article.prix3 ? Number(article.prix3) : null,
    '4': article.prix4 ? Number(article.prix4) : null,
    '5': article.prix5 ? Number(article.prix5) : null,
    '6': article.prix6 ? Number(article.prix6) : null,
  }

  let codeTarif: string | null = null
  let unitPrice: number | null = null
  let source = 'none'

  // Récupérer le codeTarif du client si fourni
  if (customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: Number(customerId) },
      select: { codeTarif: true },
    })
    codeTarif = customer?.codeTarif ?? null
  }

  // Résolution avec cascade
  if (codeTarif && prixMap[codeTarif] != null) {
    unitPrice = prixMap[codeTarif]
    source = `tarif${codeTarif}`
  } else if (prixMap['0'] != null) {
    // Fallback tarif public
    unitPrice = prixMap['0']
    source = 'tarif0 (public, fallback)'
  }

  return NextResponse.json({
    articleId: Number(articleId),
    customerId: customerId ? Number(customerId) : null,
    codeTarif,
    unitPrice,
    source,
    allPrices: prixMap,
  })
}
