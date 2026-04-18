$headers = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}

$baseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

# Get all MCQ exercises with options
Write-Host "=== ANALIZANDO DISTRACTORES ===" -ForegroundColor Cyan
Write-Host ""

$uri = "$baseUri/exercises?deleted_at=is.null&exercise_type=eq.multiple_choice&select=id,concept_id,prompt_es,content,correct_answer"
$ex = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers

$uri = "$baseUri/concepts?deleted_at=is.null&select=id,code,name_es"
$concepts = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers

Write-Host "Total MCQ exercises: $($ex.Count)" -ForegroundColor Yellow
Write-Host ""

# Analyze distractors
$issues = @()
$patterns = @(
    @{regex="\[(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\]"; desc="Opciones secuenciales (1,2,3,4)"},
    @{regex="\[(\d+),\s*(\d+),\s*(\1+1),\s*(\1+2)\]"; desc="Distractor = correcto + 1"},
    @{regex="\[(\d+),\s*(\d+),\s*(\1\+1),\s*(\1\+2)\]"; desc="Pattern simple wrong"},
    @{regex="\[0,\s*1,\s*2,\s*3\]"; desc="Opciones muy bajas (0,1,2,3)"},
    @{regex="\[(\d{2,4})\s*,\s*(\1+1)\s*,\s*(\1-1)\s*,\s*(\1+100)\]"; desc="Wrong cercano al correcto"}
)

$problematic = @()
$checked = 0

foreach ($e in $ex) {
    $checked++
    $concept = $concepts | Where-Object { $_.id -eq $e.concept_id } | Select-Object -First 1

    $options = $e.content.options
    $correct = $e.correct_answer.value

    if ($options -and $options.Count -ge 4) {
        # Check for obvious wrong patterns
        $optNums = @()
        foreach ($opt in $options) {
            if ($opt -match "^[\d\-]+$") {
                $optNums += [int]$opt
            }
        }

        if ($optNums.Count -ge 4) {
            $correctInt = [int]$correct

            # Pattern 1: All options very close to each other (within 5)
            $minOpt = ($optNums | Measure-Object -Minimum).Minimum
            $maxOpt = ($optNums | Measure-Object -Maximum).Maximum
            if (($maxOpt - $minOpt) -le 5 -and $optNums.Count -gt 1) {
                $problematic += @{
                    concept = $concept.code
                    prompt = $e.prompt_es
                    issue = "Opciones Muy cercanas (diff <= 5)"
                    options = $options -join ", "
                    correct = $correct
                }
            }

            # Pattern 2: One option = 0, 1, 2 (obviously wrong for math)
            if ($optNums -contains 0 -or $optNums -contains 1 -or $optNums -contains 2) {
                if ($correctInt -gt 10) {
                    $problematic += @{
                        concept = $concept.code
                        prompt = $e.prompt_es
                        issue = "Opcion low (0/1/2) en операacion grande"
                        options = $options -join ", "
                        correct = $correct
                    }
                }
            }

            # Pattern 3: Distractor is just +1 or -1 from correct
            $diff1 = $optNums | Where-Object { [Math]::Abs($_ - $correctInt) -eq 1 }
            if ($diff1) {
                $problematic += @{
                    concept = $concept.code
                    prompt = $e.prompt_es
                    issue = "Distractor = correcto +/- 1"
                    options = $options -join ", "
                    correct = $correct
                }
            }
        }
    }
}

Write-Host "=== PROBLEMAS ENCONTRADOS ===" -ForegroundColor Red
Write-Host "Total problematicos: $($problematic.Count)" -ForegroundColor Yellow
Write-Host ""

if ($problematic.Count -gt 0) {
    $grouped = $problematic | Group-Object -Property concept
    foreach ($g in $grouped | Select-Object -First 15) {
        Write-Host "--- $($g.Name) ($( $g.Count ) issues) ---" -ForegroundColor Cyan
        foreach ($p in $g.Group | Select-Object -First 3) {
            Write-Host "  ⚠️  $($p.issue)" -ForegroundColor Yellow
            Write-Host "      Q: $($p.prompt.Substring(0, [Math]::Min(60, $p.prompt.Length)))..." -ForegroundColor White
            Write-Host "      Options: [$($p.options)] Correct: $($p.correct)" -ForegroundColor Gray
            Write-Host ""
        }
    }
}

Write-Host ""
Write-Host "=== RESUMEN ===" -ForegroundColor Cyan
Write-Host "Math exercises analyzed: $($ex.Count)"
Write-Host "Problematic patterns: $($problematic.Count)"
Write-Host ""
Write-Host "Recommended actions:" -ForegroundColor Yellow
Write-Host "  1. Review manually los listados arriba" -ForegroundColor White
Write-Host "  2. Assignar quality_score = 2 o 1" -ForegroundColor White
Write-Host "  3. Add notas con el problema especifico" -ForegroundColor White