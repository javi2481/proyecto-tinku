# Debug parser - see exact format

$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"

$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "=== DEBUG PARSER ===" -ForegroundColor Cyan

# Get 5 pending
$uri = "$supabaseUri/exercises?deleted_at=is.null&pedagogical_review_status=eq.pending&select=id,prompt_es,content,correct_answer&limit=5"
$exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

$exerciseText = ""
$counter = 1
foreach ($e in $exercises) {
    $opts = ""
    if ($e.content.options) { $opts = " [" + ($e.content.options -join ", ") + "]" }
    $exerciseText = $exerciseText + "`n$counter. " + $e.prompt_es + $opts + " -> " + $e.correct_answer.value
    $counter++
}

$systemContent = "Rate 1-5. Output JSON array of [id,score,reason]"
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

$resp = Invoke-RestMethod -Uri "$baseUrl/chat/completions" -Method POST -Headers @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type' = 'application/json'
} -Body $body -TimeoutSec 120

$reply = $resp.choices[0].message.content

Write-Host "Raw reply:" -ForegroundColor Yellow
Write-Host $reply -ForegroundColor White
Write-Host ""

# Manual parse
$replyClean = $reply -replace '```.*', '' -replace '```', ''
Write-Host "Cleaned:" -ForegroundColor Yellow
Write-Host $replyClean -ForegroundColor White
Write-Host ""

# Try different parse approaches
Write-Host "=== PARSING ===" -ForegroundColor Cyan

# Approach 1: Split by newlines and find [id, score, reason]
$lines = $replyClean -split "`n" | Where-Object { $_ -match '\[' }
$updated = 0

foreach ($line in $lines) {
    # Match [id, score, "reason"] or [id, score, text...]
    if ($line -match '\[(\d+),\s*(\d+),\s*(.+)') {
        $id = $Matches[1]
        $score = $Matches[2]
        
        # Extract reason between quotes
        $reason = ""
        if ($line -match '\[(\d+),\s*(\d+),\s*"(.+?)"') {
            $reason = $Matches[3]
        } elseif ($line -match '\[(\d+),\s*(\d+),\s*([^\]]+)') {
            $reason = $Matches[3] -replace '\]$', ''
        }
        
        if ($id -and $score) {
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
                    $updated++
                    Write-Host "  #$id score=$score -> $status ($reason)" -ForegroundColor Green
                } catch {
                    Write-Host "  ERROR: " $_.Exception.Message -ForegroundColor Red
                }
            }
        }
    }
}

Write-Host ""
Write-Host "Updated $updated exercises!" -ForegroundColor Green

# Check new stats
Start-Sleep -Seconds 1
$uri = "$supabaseUri/exercises?deleted_at=is.null&select=pedagogical_review_status"
$all = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders
$pending = ($all | Where-Object { $_.pedagogical_review_status -eq 'pending' }).Count
$approved = ($all | Where-Object { $_.pedagogical_review_status -eq 'approved' }).Count
$needs = ($all | Where-Object { $_.pedagogical_review_status -eq 'needs_revision' }).Count

Write-Host ""
Write-Host "=== FINAL STATS ===" -ForegroundColor Cyan
Write-Host "Pending: $pending" -ForegroundColor Yellow
Write-Host "Approved: $approved" -ForegroundColor Green
Write-Host "Needs Revision: $needs" -ForegroundColor Red