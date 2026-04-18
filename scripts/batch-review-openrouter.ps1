# Batch review using OpenRouter API
# Reviews exercises in batch and assigns quality_score

$ErrorActionPreference = "Stop"

# OpenRouter API config
$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"

# Supabase config
$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "=== BATCH REVIEW CON OPENROUTER ===" -ForegroundColor Cyan
Write-Host "Api Key configured: $($apiKey.Substring(0, 20))..." -ForegroundColor Gray
Write-Host ""

# Test OpenRouter connection
Write-Host "Testing OpenRouter connection..." -ForegroundColor Yellow
try {
    $testBody = @{
        model = "anthropic/claude-sonnet-4-20250514"
        messages = @(
            @{role = "user"; content = "Hi"}
        )
        max_tokens = 10
    } | ConvertTo-Json -Depth 3

    $testResp = Invoke-RestMethod -Uri "$baseUrl/chat/completions" -Method POST -Headers @{
        'Authorization' = "Bearer $apiKey"
        'Content-Type' = 'application/json'
    } -Body $testBody

    Write-Host "✅ OpenRouter connected! Model: $($testResp.model)" -ForegroundColor Green
} catch {
    Write-Host "❌ OpenRouter error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "=== GETTING EXERCISES ===" -ForegroundColor Yellow

# Get first 10 pending exercises
$uri = "$supabaseUri/exercises?deleted_at=is.null&pedagogical_review_status=eq.pending&select=id,concept_id,prompt_es,content,correct_answer&limit=10"
$exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

$uri = "$supabaseUri/concepts?deleted_at=is.null&select=id,code"
$concepts = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

Write-Host "Pending exercises to review: $($exercises.Count)" -ForegroundColor White
Write-Host ""

# Build prompt for batch review
$exerciseList = @()
$counter = 1
foreach ($e in $exercises) {
    $concept = ($concepts | Where-Object { $_.id -eq $e.concept_id }).code
    $options = $e.content.options -join ", "
    $correct = $e.correct_answer.value

    $exerciseList += @"
$counter. Concept: $concept
   Question: $($e.prompt_es)
   Options: [$options]
   Correct Answer: $correct
"@
    $counter++
}

$prompt = @"
Eres un experto en pedagogía para niños de 6-12 años. Revisa los siguientes ejercicios y asigna un quality_score de 1-5:

## Criterios:
- 5 = Ejercicio perfecto, distractores plausibles
- 4 = Muy bueno, distractores casi todos plausibles
- 3 = Aceptable, al menos 1 distractor cuestionable
- 2 = Problemas claros, distractores obvios
- 1 = No usable, error conceptual o distractores wrong

Responde en JSON:
```json
{
  "reviews": [
    {"id": 1, "score": 4, "reason": "descripcion breve"},
    {"id": 2, "score": 3, "reason": "distractor X es muy facil"}
  ]
}
```

## Ejercicios:
$($exerciseList -join "`n")
"@

Write-Host "Sending batch to OpenRouter..." -ForegroundColor Yellow

$body = @{
    model = "anthropic/claude-sonnet-4-20250514"
    messages = @(
        @{role = "user"; content = $prompt}
    )
    max_tokens = 1000
} | ConvertTo-Json -Depth 5

try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/chat/completions" -Method POST -Headers @{
        'Authorization' = "Bearer $apiKey"
        'Content-Type' = 'application/json'
    } -Body $body

    $reply = $resp.choices[0].message.content
    Write-Host ""
    Write-Host "=== RESPUESTA ===" -ForegroundColor Cyan
    Write-Host $reply.Substring(0, [Math]::Min(2000, $reply.Length)) -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan