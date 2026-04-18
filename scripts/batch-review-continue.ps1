# Continue batch review - remaining pending exercises

$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"

$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CONTINUAR REVISION - RESTO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check current
$uri = "$supabaseUri/exercises?deleted_at=is.null&pedagogical_review_status=eq.pending"
$pending = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders
$pendingCount = $pending.Count

Write-Host "Pending: $pendingCount" -ForegroundColor Yellow
Write-Host ""

$batchSize = 5
$totalUpdated = 0
$batchNum = 1
$maxBatches = 30

while ($totalUpdated -lt $pendingCount -and $batchNum -le $maxBatches) {
    $uri = "$supabaseUri/exercises?deleted_at=is.null&pedagogical_review_status=eq.pending&select=id,prompt_es,content,correct_answer&limit=$batchSize"
    $exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders
    
    if ($exercises.Count -eq 0) {
        Write-Host "No more pending!" -ForegroundColor Green
        break
    }

    Write-Host "Batch $batchNum ($( $exercises.Count ) exercises)..." -ForegroundColor Yellow

    $exerciseText = ""
    $counter = 1
    foreach ($e in $exercises) {
        $opts = ""
        if ($e.content.options) { $opts = " [" + ($e.content.options -join ", ") + "]" }
        $exerciseText = $exerciseText + "`n$counter. " + $e.prompt_es + $opts + " -> " + $e.correct_answer.value
        $counter++
    }

    $systemContent = "Rate 1-5 for kids. JSON: [id,score,reason]"
    $userContent = "Rate:`n$exerciseText`nJSON:"

    $body = @{
        model = "meta-llama/llama-3.3-70b-instruct"
        messages = @(
            @{role = "system"; content = $systemContent},
            @{role = "user"; content = $userContent}
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

        $replyClean = $reply -replace '```.*', '' -replace '```', ''
        $lines = $replyClean -split "`n" | Where-Object { $_ -match '\[' }
        $batchUpdated = 0

        foreach ($line in $lines) {
            if ($line -match '\[(\d+),\s*(\d+),\s*"?([^"\]]+)') {
                $id = $Matches[1]
                $score = $Matches[2]
                $reason = $Matches[3] -replace '"\]$', ''

                $idx = [int]$id - 1
                if ($idx -ge 0 -and $idx -lt $exercises.Count) {
                    $exId = $exercises[$idx].id
                    $status = if ([int]$score -ge 3) { "approved" } else { "needs_revision" }
                    
                    $updateUri = "$supabaseUri/exercises?id=eq.$exId"
                    $updateBody = @{
                        pedagogical_review_status = $status
                        pedagogical_notes = $reason
                        quality_score = [int]$score
                    } | ConvertTo-Json

                    try {
                        Invoke-RestMethod -Uri $updateUri -Method PATCH -Headers $supabaseHeaders -Body $updateBody | Out-Null
                        $batchUpdated++
                    } catch {}
                }
            }
        }

        $totalUpdated += $batchUpdated
        Write-Host "  Updated: $batchUpdated (total: $totalUpdated)" -ForegroundColor Green

    } catch {
        Write-Host "  ERROR: " $_.Exception.Message -ForegroundColor Red
    }

    $batchNum++
    Start-Sleep -Seconds 1.5
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green