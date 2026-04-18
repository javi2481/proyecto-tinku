$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"

$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "=== RE-EVALUAR 24 EJERCICIOS PROBLEMATICOS ===" -ForegroundColor Cyan

$uri = "$supabaseUri/exercises?pedagogical_review_status=eq.needs_revision&deleted_at=is.null&select=id,prompt_es,content,correct_answer,pedagogical_notes"
$exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

Write-Host "Encontrados: $($exercises.Count)" -ForegroundColor Yellow

$counter = 1
foreach ($e in $exercises) {
    Write-Host "Evaluando $counter / $($exercises.Count)..." -ForegroundColor Gray
    
    $options = ""
    if ($e.content.options) { 
        $options = " Options: [" + ($e.content.options -join ", ") + "]" 
    }
    
    $prompt = "Evaluate this math exercise for kids (6-12 years). Question: " + $e.prompt_es + $options + ". Correct answer: " + $e.correct_answer.value + ". If the distractors are at least 5 different from the correct answer, respond 'approved'. Else respond 'needs_revision'. Just one word."

    $body = @{
        model = "meta-llama/llama-3.3-70b-instruct"
        messages = @(
            @{role = "system"; content = "You are a pedagogy expert. Simple yes/no decision."},
            @{role = "user"; content = $prompt}
        )
        max_tokens = 50
        temperature = 0.3
    } | ConvertTo-Json -Depth 4

    try {
        $resp = Invoke-RestMethod -Uri "$baseUrl/chat/completions" -Method POST -Headers @{
            'Authorization' = "Bearer $apiKey"
            'Content-Type' = 'application/json'
        } -Body $body -TimeoutSec 120

        $reply = $resp.choices[0].message.content.Trim().ToLower()

        if ($reply -match 'approved') {
            $newStatus = "approved"
        } else {
            $newStatus = "needs_revision"
        }
        
        $updateUri = "$supabaseUri/exercises?id=eq.$($e.id)"
        $updateBody = @{
            pedagogical_review_status = $newStatus
            pedagogical_notes = "AI: evaluated as $newStatus"
        } | ConvertTo-Json

        Invoke-RestMethod -Uri $updateUri -Method PATCH -Headers $supabaseHeaders -Body $updateBody | Out-Null
        Write-Host "  -> $newStatus ($reply)" -ForegroundColor Green
        
    } catch {
        Write-Host "  -> ERROR" -ForegroundColor Red
    }

    $counter++
    Start-Sleep -Seconds 1
}

Write-Host "=== COMPLETO ===" -ForegroundColor Cyan

# Stats
Start-Sleep -Seconds 2
$uri = "$supabaseUri/exercises?deleted_at=is.null&select=pedagogical_review_status"
$all = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders
$pending = ($all | Where-Object { $_.pedagogical_review_status -eq 'pending' }).Count
$approved = ($all | Where-Object { $_.pedagogical_review_status -eq 'approved' }).Count
$needs = ($all | Where-Object { $_.pedagogical_review_status -eq 'needs_revision' }).Count

Write-Host ""
Write-Host "=== ESTADO FINAL ===" -ForegroundColor Cyan
Write-Host "Approved: $approved" -ForegroundColor Green
Write-Host "Pending: $pending" -ForegroundColor Yellow
Write-Host "Needs Revision: $needs" -ForegroundColor Red