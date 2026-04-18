# Fixed batch review using OpenRouter

$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"

$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "=== BATCH REVIEW WITH LLAMA ===" -ForegroundColor Cyan

# Get 3 exercises for test
$uri = "$supabaseUri/exercises?deleted_at=is.null&pedagogical_review_status=eq.pending&select=id,prompt_es,content,correct_answer&limit=3"
$exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

Write-Host "Exercises to review:" $exercises.Count -ForegroundColor Yellow

# Build prompt
$exerciseText = ""
$counter = 1
foreach ($e in $exercises) {
    $opts = $e.content.options -join ", "
    $exerciseText = $exerciseText + "`n" + $counter + ". Q: " + $e.prompt_es + " | Options: [" + $opts + "] Answer: " + $e.correct_answer.value
    $counter++
}

$systemMsg = "You are a pedagogy expert for Argentine primary school kids (6-12 years). Assign quality_score 1-5. 5=perfect, 4=good, 3=acceptable, 2=problems, 1=unusable. Respond JSON only: [{\"id\":1,\"score\":4,\"reason\":\"...\"}]"
$userMsg = "Review these math exercises for children:`n" + $exerciseText + "`n`nRespond JSON only."

Write-Host "Sending to OpenRouter Llama..." -ForegroundColor Yellow

$body = @{
    model = "meta-llama/llama-3.3-70b-instruct"
    messages = @(
        @{role = "system"; content = $systemMsg},
        @{role = "user"; content = $userMsg}
    )
    max_tokens = 600
    temperature = 0.3
} | ConvertTo-Json -Depth 4

try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/chat/completions" -Method POST -Headers @{
        'Authorization' = "Bearer $apiKey"
        'Content-Type' = 'application/json'
    } -Body $body -TimeoutSec 120

    $reply = $resp.choices[0].message.content
    Write-Host ""
    Write-Host "=== RESPONSE ===" -ForegroundColor Green
    Write-Host $reply -ForegroundColor White

} catch {
    Write-Host "ERROR: " $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Done." -ForegroundColor Cyan