# FULL BATCH REVIEW - All pending exercises

$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"

$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   FULL BATCH REVIEW - ALL PENDING" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current stats
$uri = "$supabaseUri/exercises?deleted_at=is.null&select=pedagogical_review_status"
$all = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders
$pendingStart = ($all | Where-Object { $_.pedagogical_review_status -eq 'pending' }).Count

Write-Host "Starting with $pendingStart pending exercises" -ForegroundColor Yellow
Write-Host "Processing in batches of 5..." -ForegroundColor Gray
Write-Host ""

$batchSize = 5
$totalUpdated = 0
$batchNum = 1
$maxBatches = 60  # 60 * 5 = 300 exercises max

while ($totalUpdated -lt 300 -and $batchNum -le $maxBatches) {
    # Get pending
    $uri = "$supabaseUri/exercises?deleted_at=is.null&pedagogical_review_status=eq.pending&select=id,prompt_es,content,correct_answer&limit=$batchSize"
    $exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders
    
    if ($exercises.Count -eq 0) {
        Write-Host "No more pending exercises!" -ForegroundColor Green
        break
    }

    Write-Host "Batch $batchNum ($( $exercises.Count ) exercises)..." -ForegroundColor Yellow

    # Build prompt
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

        # Parse [id, score, reason]
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

# Final stats
Start-Sleep -Seconds 2
$uri = "$supabaseUri/exercises?deleted_at=is.null&select=pedagogical_review_status"
$all = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders
$pendingEnd = ($all | Where-Object { $_.pedagogical_review_status -eq 'pending' }).Count
$approvedEnd = ($all | Where-Object { $_.pedagogical_review_status -eq 'approved' }).Count

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "=== FINAL STATS ===" -ForegroundColor Cyan
Write-Host "Before: $pendingStart pending, $((Get-Hashtable $all | Where-Object { `$_.pedagogical_review_status -eq 'approved' }).Count) approved" -ForegroundColor Yellow
Write-Host "After:  $pendingEnd pending, $approvedEnd approved" -ForegroundColor Green
Write-Host "Updated: $($approvedEnd - 27) exercises!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan