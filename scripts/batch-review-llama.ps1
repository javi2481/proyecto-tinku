# Batch review using OpenRouter Llama model for pedagogical review

$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"

$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "=== BATCH PEDAGOGICAL REVIEW ===" -ForegroundColor Cyan
Write-Host "Model: meta-llama/llama-3.3-70b-instruct" -ForegroundColor Gray
Write-Host ""

# Get exercises to review (first 5 as test)
$uri = "$supabaseUri/exercises?deleted_at=is.null&pedagogical_review_status=eq.pending&select=id,prompt_es,content,correct_answer&limit=5"
$exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

Write-Host "Reviewing $($exercises.Count) exercises..." -ForegroundColor Yellow

# Build the prompt
$exerciseText = ""
$counter = 1
foreach ($e in $exercises) {
    $opts = $e.content.options -join ", "
    $exerciseText += @"
$counter. Question: $($e.prompt_es)
   Options: [$opts]
   Answer: $($e.correct_answer.value)
"@
    $counter++
}

$systemPrompt = @"Eres un experto en educación primaria argentina. Evalúas ejercicios pedagógicos para niños de 6-12 años.
Asigna quality_score:
- 5 = perfecto, listo para producción
- 4 = muy bueno
- 3 = aceptable
- 2 = problemas, distractores obvios
- 1 = no usable

Respondés en JSON solo, sin texto extra:
[{"id": 1, "score": 4, "reason": "..."}, {"id": 2, "score": 3, "reason": "..."}]
"@

$userPrompt = $exerciseText

Write-Host "Sending to OpenRouter (Llama 70B)..." -ForegroundColor Yellow

$body = @{
    model = "meta-llama/llama-3.3-70b-instruct"
    messages = @(
        @{role = "system"; content = $systemPrompt},
        @{role = "user"; content = $userPrompt}
    )
    max_tokens = 800
    temperature = 0.3
} | ConvertTo-Json -Depth 5

try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/chat/completions" -Method POST -Headers @{
        'Authorization' = "Bearer $apiKey"
        'Content-Type' = 'application/json'
    } -Body $body -TimeoutSec 120

    $reply = $resp.choices[0].message.content

    Write-Host ""
    Write-Host "=== RESPUESTA DEL MODELO ===" -ForegroundColor Green
    Write-Host $reply -ForegroundColor White

    # Try to parse JSON and show summary
    Write-Host ""
    Write-Host "=== SUMMARY ===" -ForegroundColor Cyan

    # Simple parse
    if ($reply -match '\[.*\]') {
        Write-Host "Parsed some JSON - reviews received" -ForegroundColor Green
    }

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan