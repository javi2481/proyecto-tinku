$headers = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}

# Get concepts
$conceptsUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1/concepts?select=id,code,primary_subject,grade,name_es&deleted_at=is.null&order=primary_subject,display_order'
$concepts = Invoke-RestMethod -Uri $conceptsUri -Method GET -Headers $headers

# Get exercises count per concept_id
$exercisesUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1/exercises?deleted_at=is.null&select=concept_id'
$exercises = Invoke-RestMethod -Uri $exercisesUri -Method GET -Headers $headers
$exCount = $exercises | Group-Object -Property concept_id | ForEach-Object { @{id=$_.Name; count=$_.Count} }

Write-Host ""
Write-Host "==================== TINKU: RESUMEN DE EJERCICIOS ====================" -ForegroundColor Cyan
Write-Host ""

$currentSubject = ""
foreach ($c in $concepts) {
    $subject = $c.primary_subject
    $grade = $c.grade -replace "grade_", "G"
    $code = $c.code

    $countInfo = $exCount | Where-Object { $_.id -eq $c.id }
    $count = if ($countInfo) { $countInfo.count } else { 0 }

    if ($subject -ne $currentSubject) {
        Write-Host ""
        Write-Host "=== $subject ===" -ForegroundColor Yellow
        $currentSubject = $subject
    }

    Write-Host "  $code ($grade) - $count ejercicios - $($c.name_es)" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
$total = $exercises.Count
Write-Host "TOTAL: $total ejercicios" -ForegroundColor Magenta