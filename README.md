# ERP Stock V5

Noyau full stack pour gestion de stock, lots, mouvements, commandes et documents.

## Stack
- Next.js 14
- Prisma
- PostgreSQL

## Démarrage rapide

```bash
# 1. Cloner le repo
git clone https://github.com/matt38470/ERP_webapp.git
cd ERP_webapp

# 2. Installer les dépendances
npm install

# 3. Configurer la base
cp .env.example .env
# Editer .env avec vos identifiants PostgreSQL

# 4. Créer et migrer la base
npx prisma migrate dev --name init

# 5. Lancer l'app
npm run dev
```

## Architecture

```
items → lots → movements → stock dérivé
warehouses → locations
orders → delivery_notes → invoices
```

## Modules V1
- Journal de mouvements (source de vérité)
- Stock temps réel par article / lot / emplacement
- Commandes clients et fournisseurs
- BL et factures
- Référentiel articles, lots, entrepôts

## Roadmap
| Lot | Périmètre |
|-----|-----------|
| 1 | Noyau stock (articles, lots, mouvements) |
| 2 | Commandes et réservations |
| 3 | BL / Factures |
| 4 | Pilotage et alertes |
| 5 | Import Excel, code-barres, inventaires |
