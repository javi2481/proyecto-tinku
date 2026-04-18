# Review 6 exercises with needs_revision using OpenRouter
# Fixes problematic distractors

$ErrorActionPreference = "Stop"

# OpenRouter API config
$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"

# Supabase config
$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
    'Prefer' = 'return=representation'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "=== REVISION DE 6 EJERCICIOS PROBLEMÁTICOS ===" -ForegroundColor Cyan
Write-Host "Usando OpenRouter (Llama 3.3 70B)" -ForegroundColor Gray
Write-Host ""

# Get the 6 exercises that need revision
$uri = "$supabaseUri/exercises?pedagogical_review_status=eq.needs_revision&select=id,prompt_es,content,correct_answer,difficulty,quality_score"
$exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

Write-Host "Ejercicios a revisar: $($exercises.Count)" -ForegroundColor Yellow
foreach ($e in $exercises) {
    $opts = $e.content.options -join ", "
    $corr = $e.correct_answer.value
    $shortPrompt = if ($e.prompt_es.Length -gt 30) { $e.prompt_es.Substring(0, 30) + "..." } else { $e.prompt_es }
    $shortId = if ($e.id.Length -gt 8) { $e.id.Substring(0, 8) } else { $e.id }
    Write-Host "  - $shortId | Q: $shortPrompt" -ForegroundColor White
    Write-Host "    Options: [$opts]" -ForegroundColor Gray
    Write-Host "    Correct: $corr | Current Score: $($e.quality_score)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== ENVIANDO A OPENROUTER ===" -ForegroundColor Yellow

# Build the prompt
$exerciseList = @()
$counter = 1
foreach ($e in $exercises) {
    $opts = $e.content.options -join ", "
    $corr = $e.correct_answer.value
    
    $exerciseList += @"
$counter. ID: $($e.id)
   Pregunta: $($e.prompt_es)
   Opciones: [$opts]
   Respuesta correcta: $corr
   Dificultad actual: $($e.difficulty)
"@
    $counter++
}

$prompt = @"
Eres un revisor pedagógico experto. Analiza cada ejercicio y determina si los distractores son apropiados para niños de 6-9 años.

## PROBLEMA A DETECTAR:
- Distractor = respuesta_correcta ± 1 (ej: si correct=12, distractores 11, 13 hacen el ejercicio trivial)
- Distractor = respuesta_correcta ± 2 en restas fáciles también es muy fácil

## CRITERIOS:
- **APPROVED**: Los distractores NO son correct±1 ni correct±2. Son plausibles.
- **NEEDS_REVISION**: Al menos un distractor está muy cerca de la respuesta correcta

## Instrucciones:
Para cada ejercicio, determina si APPROVED o NEEDS_REVISION.
Si NEEDS_REVISION, sugiere UNA opción alternativa plausible para reemplazar el distractor problemático.

Responde en JSON:
```json
{
  "reviews": [
    {
      "id": "eb6449f6-de15-4259-a8f7-f54732095a41",
      "status": "NEEDS_REVISION",
      "reason": "11 y 13 están a ±1 de 12",
      "suggested_fix": "Cambiar 11 por 15"
    },
    {
      "id": "d7435636-9e3d-4ea9-9ad2-0a9b647342ff",
      "status": "APPROVED",
      "reason": "Las opciones están suficientemente alejadas"
    }
  ]
}
```

## Ejercicios:
$($exerciseList -join "`n")
"@

$body = @{
    model = "meta-llama/llama-3.3-70b-instruct"
    messages = @(
        @{role = "user"; content = $prompt}
    )
    max_tokens = 2000
} | ConvertTo-Json -Depth 5

try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/chat/completions" -Method POST -Headers @{
        'Authorization' = "Bearer $apiKey"
        'Content-Type' = 'application/json'
    } -Body $body

    $reply = $resp.choices[0].message.content
    Write-Host ""
    Write-Host "=== RESPUESTA DE OPENROUTER ===" -ForegroundColor Cyan
    Write-Host $reply -ForegroundColor White
    Write-Host ""

    # Parse JSON from response
    $jsonMatch = [regex]::Match($reply, '\{[\s\S]*\}')
    if ($jsonMatch.Success) {
        try {
            $result = $jsonMatch.Value | ConvertFrom-Json
            Write-Host ""
            Write-Host "=== APLICANDO CAMBIOS ===" -ForegroundColor Yellow
            
            foreach ($review in $result.reviews) {
                $exercise = $exercises | Where-Object { $_.id -eq $review.id }
                if ($exercise) {
                    $shortId = if ($exercise.id.Length -gt 8) { $exercise.id.Substring(0, 8) } else { $exercise.id }
                    if ($review.status -eq "APPROVED") {
                        Write-Host "✅ Aprobando: $shortId" -ForegroundColor Green
                        Write-Host "   Razón: $($review.reason)" -ForegroundColor Gray
                        
                        # Update to approved
                        $updateUri = "$supabaseUri/exercises?id=eq.$($exercise.id)"
                        $updateBody = @{
                            pedagogical_review_status = "approved"
                            pedagogical_notes = "AI: approved. $($review.reason)"
                            quality_score = 4
                        } | ConvertTo-Json
                        
                        try {
                            $null = Invoke-RestMethod -Uri $updateUri -Method PATCH -Headers $supabaseHeaders -Body $updateBody
                            Write-Host "   ✅ Actualizado a approved" -ForegroundColor Green
                        } catch {
                            Write-Host "   ❌ Error actualizando: $($_.Exception.Message)" -ForegroundColor Red
                        }
                    } else {
                        $shortId2 = if ($exercise.id.Length -gt 8) { $exercise.id.Substring(0, 8) } else { $exercise.id }
                        Write-Host "⚠️ Necesita revisión: $shortId2" -ForegroundColor Yellow
                        Write-Host "   Razón: $($review.reason)" -ForegroundColor Gray
                        if ($review.suggested_fix) {
                            Write-Host "   Sugerencia: $($review.suggested_fix)" -ForegroundColor Cyan
                        }
                    }
                }
            }
            
            Write-Host ""
            Write-Host "=== VERIFICANDO ESTADO FINAL ===" -ForegroundColor Yellow
            $uri = "$supabaseUri/exercises?pedagogical_review_status=eq.needs_revision&select=id"
            $remaining = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders
            Write-Host "Ejercicios restantes con needs_revision: $($remaining.Count)" -ForegroundColor White
            
        } catch {
            Write-Host "❌ Error parseando JSON: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Respuesta raw:" -ForegroundColor Yellow
            Write-Host $reply -ForegroundColor White
        }
    } else {
        Write-Host "❌ No se encontró JSON en la respuesta" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ Error en OpenRouter: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan