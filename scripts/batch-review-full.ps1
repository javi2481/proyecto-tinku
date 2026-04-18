# Full batch review with OpenRouter - Updates Supabase

$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"
$model = "meta-llama/llama-3.3-70b-instruct"

$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   BATCH REVIEW - OPENROUTER LLAMA" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get pending exercises
$uri = "$supabaseUri/exercises?deleted_at=is.null&pedagogical_review_status=eq.pending&select=id,prompt_es,content,correct_answer,exercise_type"
$allExercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders
$pending = $allExercises.Count

Write-Host "Pending: $pending exercises" -ForegroundColor Yellow
Write-Host "Processing in batches of 10..." -ForegroundColor Gray
Write-Host ""

$batchSize = 10
$processed = 0
$approved = 0

for ($i = 0; $i -lt $pending; $i += $batchSize) {
    Write-Host "Batch " (($i / $batchSize) + 1) "..."
    
    $uri = "$supabaseUri/exercises?deleted_at=is.null&pedagogical_review_status=eq.pending&select=id,prompt_es,content,correct_answer&limit=$batchSize&offset=$i"
    $exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

    if ($exercises.Count -eq 0) { break }

    # Build prompt - only MCQ and numeric_input
    $exerciseText = ""
    $counter = 1
    foreach ($e in $exercises) {
        if ($e.exercise_type -eq "multiple_choice" -or $e.exercise_type -eq "numeric_input") {
            $opts = ""
            if ($e.content.options) { $opts = " [" + ($e.content.options -join ", ") + "]" }
            $correct = $e.correct_answer.value
            $exerciseText = $exerciseText + "`n$counter. " + $e.prompt_es + $opts + " -> " + $correct
            $counter++
        }
    }

    if ($exerciseText.Length -lt 10) {
        Write-Host "  No valid exercises, skipping..."
        continue
    }

    $systemContent = "You are a pedagogy expert for Argentine kids (6-12yo). Rate math/language/science exercises 1-5. 5=perfecto, 4=muy bueno, 3=aceptable, 2=problemas, 1=inutil. Reply JSON only: [id,score,reason]"
    $userContent = "Rate:`n$exerciseText`n`nJSON:"

    $body = @{
        model = $model
        messages = @(
            @{role = "system"; content = $systemContent},
            @{role = "user"; content = $userContent}
        )
        max_tokens = 800
        temperature = 0.3
    } | ConvertTo-Json -Depth 4

    try {
        $resp = Invoke-RestMethod -Uri "$baseUrl/chat/completions" -Method POST -Headers @{
            'Authorization' = "Bearer $apiKey"
            'Content-Type' = 'application/json'
        } -Body $body -TimeoutSec 120

        $reply = $resp.choices[0].message.content

        # Parse JSON and update Supabase
        if ($reply -match '\[[\s\S]*\]') {
            $jsonStr = $Matches[0] -replace '(\w+):', '"$1":' | ConvertFrom-Json
            
            foreach ($review in $jsonStr) {
                if ($review.score -ge 3) {
                    # Approve
                    $updateUri = "$supabaseUri/exercises?id=eq.$($exercises[$review.id - 1].id)"
                    $updateBody = @{
                        pedagogical_review_status = "approved"
                        pedagogical_notes = "AI review: $($review.reason)"
                        quality_score = $review.score
                    } | ConvertTo-Json

                    try {
                        Invoke-RestMethod -Uri $updateUri -Method PATCH -Headers $supabaseHeaders -Body $updateBody | Out-Null
                        $approved++
                    } catch {}
                }
            }
        }

        $processed += $exercises.Count
        Write-Host "  Approved: $approved so far"

    } catch {
        Write-Host "  ERROR: " $_.Exception.Message -ForegroundColor Red
    }

    Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DONE! Approved: $approved / $processed" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan