# Quick test - review 10 exercises and update Supabase

$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"

$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "=== TEST: 10 EXERCISES ===" -ForegroundColor Cyan

# Get 10 pending exercises
$uri = "$supabaseUri/exercises?deleted_at=is.null&pedagogical_review_status=eq.pending&select=id,prompt_es,content,correct_answer&limit=10"
$exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

Write-Host "Got $($exercises.Count)" -ForegroundColor Yellow

# Build prompt
$exerciseText = ""
$counter = 1
foreach ($e in $exercises) {
    $opts = ""
    if ($e.content.options) { $opts = " [" + ($e.content.options -join ", ") + "]" }
    $exerciseText = $exerciseText + "`n$counter. " + $e.prompt_es + $opts + " -> " + $e.correct_answer.value
    $counter++
}

$systemContent = "Rate exercises 1-5 for kids. 5=perfect, 4=good, 3=ok, 2=bad, 1=useless. Reply JSON: [id,score,reason]"
$userContent = "Rate these:`n$exerciseText`n`nJSON:"

$body = @{
    model = "meta-llama/llama-3.3-70b-instruct"
    messages = @(
        @{role = "system"; content = $systemContent},
        @{role = "user"; content = $userContent}
    )
    max_tokens = 800
    temperature = 0.3
} | ConvertTo-Json -Depth 4

Write-Host "Sending to OpenRouter..." -ForegroundColor Yellow

$resp = Invoke-RestMethod -Uri "$baseUrl/chat/completions" -Method POST -Headers @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type' = 'application/json'
} -Body $body -TimeoutSec 120

$reply = $resp.choices[0].message.content

Write-Host ""
Write-Host "=== RESPONSE ===" -ForegroundColor Green
Write-Host $reply -ForegroundColor White
Write-Host ""

# Try to parse and update
Write-Host "Trying to parse and update Supabase..." -ForegroundColor Yellow

try {
    # Clean the JSON
    $cleanReply = $reply -replace '```json', '' -replace '```', '' -replace '\s+', ' '
    
    if ($cleanReply -match '\[[\s\S]*\]') {
        $jsonStr = $Matches[0]
        $reviews = $jsonStr | ConvertFrom-Json
        
        $updated = 0
        foreach ($r in $reviews) {
            $idx = [int]$r.id - 1
            if ($idx -ge 0 -and $idx -lt $exercises.Count) {
                $exId = $exercises[$idx].id
                $score = $r.score
                $status = if ($score -ge 3) { "approved" } else { "needs_revision" }
                $notes = $r.reason
                
                $updateUri = "$supabaseUri/exercises?id=eq.$exId"
                $updateBody = @{
                    pedagogical_review_status = $status
                    pedagogical_notes = "AI: $($notes.Substring(0, [Math]::Min(100, $notes.Length)))"
                    quality_score = $score
                } | ConvertTo-Json

                Invoke-RestMethod -Uri $updateUri -Method PATCH -Headers $supabaseHeaders -Body $updateBody | Out-Null
                $updated++
                Write-Host "  Updated exercise $($idx+1): score=$score, status=$status" -ForegroundColor Gray
            }
        }
        
        Write-Host ""
        Write-Host "Updated $updated exercises!" -ForegroundColor Green
    }
} catch {
    Write-Host "Parse error: " $_ -ForegroundColor Red
    Write-Host $reply -ForegroundColor Red
}

Write-Host ""
Write-Host "=== DONE ===" -ForegroundColor Cyan