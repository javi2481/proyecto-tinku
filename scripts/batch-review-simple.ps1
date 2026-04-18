$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"

$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "=== OPENROUTER BATCH REVIEW ===" -ForegroundColor Cyan

# Get 3 exercises
$uri = "$supabaseUri/exercises?deleted_at=is.null&pedagogical_review_status=eq.pending&select=id,prompt_es,content,correct_answer&limit=3"
$exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

$exerciseText = ""
$counter = 1
foreach ($e in $exercises) {
    $opts = $e.content.options -join ", "
    $exerciseText = $exerciseText + "`n" + $counter + ". " + $e.prompt_es + " [" + $opts + "] = " + $e.correct_answer.value
    $counter++
}

$systemContent = "You are a pedagogy expert. Rate math exercises 1-5 for kids. Reply JSON array: [id,score,reason]"
$userContent = "Review: " + $exerciseText + " - JSON only"

$body = @{
    model = "meta-llama/llama-3.3-70b-instruct"
    messages = @(
        @{role = "system"; content = $systemContent},
        @{role = "user"; content = $userContent}
    )
    max_tokens = 500
    temperature = 0.3
} | ConvertTo-Json

$resp = Invoke-RestMethod -Uri "$baseUrl/chat/completions" -Method POST -Headers @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type' = 'application/json'
} -Body $body -TimeoutSec 120

$reply = $resp.choices[0].message.content
Write-Host $reply -ForegroundColor White