# Phase 4 - Mark problematic distractors with score = 2

$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"

$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   PHASE 4 - DISTRACTORES PROBLEMATICOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Get approved exercises to check for problematic patterns
$uri = "$supabaseUri/exercises?deleted_at=is.null&pedagogical_review_status=eq.approved&exercise_type=eq.multiple_choice&select=id,prompt_es,content,correct_answer&limit=100"
$exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

Write-Host "Checking $($exercises.Count) approved MCQ exercises for problematic patterns..." -ForegroundColor Yellow
Write-Host ""

$problematicCount = 0
$batchCounter = 0

foreach ($e in $exercises) {
    $options = $e.content.options
    $correct = $e.correct_answer.value

    if ($options -and $options.Count -ge 4) {
        $optNums = @()
        foreach ($opt in $options) {
            if ($opt -match "^[\d\-]+$") {
                $optNums += [int]$opt
            }
        }

        $isProblematic = $false

        if ($optNums.Count -ge 4) {
            $correctInt = 0
            if ([int]::TryParse($correct, [ref]$correctInt)) {
                # Check: distractor = correct ± 1
                $diff1 = $optNums | Where-Object { [Math]::Abs($_ - $correctInt) -eq 1 }
                if ($diff1) { $isProblematic = $true }

                # Check: all options very close (diff <= 5)
                $minOpt = ($optNums | Measure-Object -Minimum).Minimum
                $maxOpt = ($optNums | Measure-Object -Maximum).Maximum
                if (($maxOpt - $minOpt) -le 5 -and $correctInt -gt 10) { $isProblematic = $true }

                # Check: 0,1,2 when correct > 10
                if ($correctInt -gt 10 -and ($optNums -contains 0 -or $optNums -contains 1 -or $optNums -contains 2)) { $isProblematic = $true }
            }
        }

        if ($isProblematic) {
            # Mark as needs_revision with quality_score = 2
            $updateUri = "$supabaseUri/exercises?id=eq.$($e.id)"
            $updateBody = @{
                pedagogical_review_status = "needs_revision"
                pedagogical_notes = "AI: distractor problematico - opciones muy cercanas o incorrectas"
                quality_score = 2
            } | ConvertTo-Json

            try {
                Invoke-RestMethod -Uri $updateUri -Method PATCH -Headers $supabaseHeaders -Body $updateBody | Out-Null
                $problematicCount++
                $batchCounter++
                
                if ($batchCounter % 10 -eq 0) {
                    Write-Host "Marked: $problematicCount problematicos..." -ForegroundColor Yellow
                }
            } catch {}
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PROBLEMATICOS MARCADOS: $problematicCount" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan

# Final stats
$uri = "$supabaseUri/exercises?deleted_at=is.null&select=pedagogical_review_status,quality_score"
$all = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

$pending = ($all | Where-Object { $_.pedagogical_review_status -eq 'pending' }).Count
$approved = ($all | Where-Object { $_.pedagogical_review_status -eq 'approved' }).Count
$needs = ($all | Where-Object { $_.pedagogical_review_status -eq 'needs_revision' }).Count
$score5 = ($all | Where-Object { $_.quality_score -eq 5 }).Count
$score4 = ($all | Where-Object { $_.quality_score -eq 4 }).Count
$score3 = ($all | Where-Object { $_.quality_score -eq 3 }).Count
$score2 = ($all | Where-Object { $_.quality_score -eq 2 }).Count
$score1 = ($all | Where-Object { $_.quality_score -eq 1 }).Count

Write-Host ""
Write-Host "=== ESTADO FINAL ===" -ForegroundColor Cyan
Write-Host "Pending: $pending" -ForegroundColor Yellow
Write-Host "Approved: $approved" -ForegroundColor Green
Write-Host "Needs Revision: $needs" -ForegroundColor Red
Write-Host ""
Write-Host "Quality Scores:" -ForegroundColor Cyan
Write-Host "  5 (perfecto): $score5"
Write-Host "  4 (muy bueno): $score4"
Write-Host "  3 (aceptable): $score3"
Write-Host "  2 (problemas): $score2"
Write-Host "  1 (inutil): $score1"