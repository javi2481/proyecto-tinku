# Fixed parser - handles [id, score, reason] format

$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"

$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "=== BATCH REVIEW (10 exercises) ===" -ForegroundColor Cyan

# Get 10 pending
$uri = "$supabaseUri/exercises?deleted_at=is.null&pedagogical_review_status=eq.pending&select=id,prompt_es,content,correct_answer&limit=10"
$exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

$exerciseText = ""
$counter = 1
foreach ($e in $exercises) {
    $opts = ""
    if ($e.content.options) { $opts = " [" + ($e.content.options -join ", ") + "]" }
    $exerciseText = $exerciseText + "`n$counter. " + $e.prompt_es + $opts + " -> " + $e.correct_answer.value
    $counter++
}

$systemContent = "Rate exercises 1-5 for kids. JSON: [id,score,reason]"
$userContent = "Rate:`n$exerciseText`nJSON:"

$body = @{
    model = "meta-llama/llama-3.3-70b-instruct"
    messages = @(
        @{role = "system"; content = $systemContent},
        @{role = "user"; content = $userContent}
    )
    max_tokens = 800
    temperature = 0.3
} | ConvertTo-Json -Depth 4

$resp = Invoke-RestMethod -Uri "$baseUrl/chat/completions" -Method POST -Headers @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type' = 'application/json'
} -Body $body -TimeoutSec 120

$reply = $resp.choices[0].message.content
Write-Host "Response received..." -ForegroundColor Yellow

# Parse [id, score, reason] format
$updated = 0
if ($reply -match '\[.*\]') {
    $jsonStr = $Matches[0]
    
    # Parse each [id,score,reason]
    if ($jsonStr -match '\[(\d+),\s*(\d+),\s*"([^"]+)"\]') {
        $matches = [regex]::Matches($jsonStr, '\[(\d+),\s*(\d+),\s*"([^"]+)"\]')
        
        foreach ($m in $matches) {
            $exIdx = [int]$m.Groups[1].Value - 1
            $score = [int]$m.Groups[2].Value
            $reason = $m.Groups[3].Value
            
            if ($exIdx -ge 0 -and $exIdx -lt $exercises.Count) {
                $exId = $exercises[$exIdx].id
                $status = if ($score -ge 3) { "approved" } else { "needs_revision" }
                
                $updateUri = "$supabaseUri/exercises?id=eq.$exId"
                $updateBody = @{
                    pedagogical_review_status = $status
                    pedagogical_notes = $reason
                    quality_score = $score
                } | ConvertTo-Json

                Invoke-RestMethod -Uri $updateUri -Method PATCH -Headers $supabaseHeaders -Body $updateBody | Out-Null
                $updated++
                Write-Host "  #$($exIdx+1): score=$score -> $status" -ForegroundColor Gray
            }
        }
    }
}

Write-Host ""
Write-Host "Updated $updated exercises!" -ForegroundColor Green

# Check stats
Start-Sleep -Seconds 1
$uri = "$supabaseUri/exercises?deleted_at=is.null&select=pedagogical_review_status"
$stats = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders
$pending = ($stats | Where-Object { $_.pedagogical_review_status -eq 'pending' }).Count
$approved = ($stats | Where-Object { $_.pedagogical_review_status -eq 'approved' }).Count

Write-Host ""
Write-Host "=== STATS ===" -ForegroundColor Cyan
Write-Host "Pending: $pending" -ForegroundColor Yellow
Write-Host "Approved: $approved" -ForegroundColor Green