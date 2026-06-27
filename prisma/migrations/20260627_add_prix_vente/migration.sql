-- Migration: ajoute les 7 colonnes de tarifs de vente sur la table Article
-- Correspond à prix0 (tarif public) → prix6 (tarif spécial)

ALTER TABLE "Article"
  ADD COLUMN IF NOT EXISTS "prix0" DECIMAL(18,4),
  ADD COLUMN IF NOT EXISTS "prix1" DECIMAL(18,4),
  ADD COLUMN IF NOT EXISTS "prix2" DECIMAL(18,4),
  ADD COLUMN IF NOT EXISTS "prix3" DECIMAL(18,4),
  ADD COLUMN IF NOT EXISTS "prix4" DECIMAL(18,4),
  ADD COLUMN IF NOT EXISTS "prix5" DECIMAL(18,4),
  ADD COLUMN IF NOT EXISTS "prix6" DECIMAL(18,4);
