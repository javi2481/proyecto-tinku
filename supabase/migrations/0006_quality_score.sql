-- =============================================================================
-- Tinkú — 0006 Agregar quality_score a exercises
-- Para la revisión pedagógica de 212 ejercicios.
-- =============================================================================

-- Agregar columna quality_score (1-5) a exercises
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS quality_score INTEGER
  CHECK (quality_score IS NULL OR (quality_score >= 1 AND quality_score <= 5));

-- Índice para filtrar por quality_score
CREATE INDEX IF NOT EXISTS idx_exercises_quality_score ON exercises(quality_score) WHERE quality_score IS NOT NULL;

-- Comentario para documentación
COMMENT ON COLUMN exercises.quality_score IS 'Calidad pedagógica del ejercicio (1=malo, 5=ejemplar). Usado paraweighted pick en el engine adaptativo.';

-- =============================================================================
-- Actualizar ejercicios existentes:标记los sin quality_score como pending revisión
-- Los 212 ejercicios seedeados que no tienen quality_score asignado
-- =============================================================================

-- Marcar todos los ejercicios existentes sin quality_score como pending (para revisión)
UPDATE exercises
SET pedagogical_review_status = 'pending'
WHERE pedagogical_review_status = 'approved'
  AND quality_score IS NULL
  AND deleted_at IS NULL;

-- Verificar conteo
-- SELECT pedagogical_review_status, COUNT(*) as total
-- FROM exercises WHERE deleted_at IS NULL GROUP BY pedagogical_review_status;