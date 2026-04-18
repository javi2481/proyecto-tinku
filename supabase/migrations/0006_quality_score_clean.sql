-- 0006 Agregar quality_score a exercises
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS quality_score INTEGER;

UPDATE exercises
SET pedagogical_review_status = 'pending'
WHERE pedagogical_review_status = 'approved'
  AND quality_score IS NULL
  AND deleted_at IS NULL;