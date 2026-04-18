$headers = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}

# Get concepts with subject
$conceptsUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1/concepts?select=code,primary_subject,grade,name_es,display_order&deleted_at=is.null&order=primary_subject,display_order'
$concepts = Invoke-RestMethod -Uri $conceptsUri -Method GET -Headers $headers

# Get exercises count per concept
$exercisesUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1/exercises?deleted_at=is.null&select=id,concept_id&limit=500'
$exercises = Invoke-RestMethod -Uri $exercisesUri -Method GET -Headers $headers

# Group by concept
$byConcept = $exercises | Group-Object -Property concept_id | ForEach-Object {
    $conceptId = $_.Name
    $concept = $concepts | Where-Object { $_.id -eq $conceptId }
    [PSCustomObject]@{
        concept_id = $conceptId
        subject = $concept.primary_subject
        grade = $concept.grade
        name = $concept.name_es
        code = $concept.code
        count = $_.Count
    }
} | Sort-Object subject, grade, name

Write-Host "=== RESUMEN POR CONCEPTO ===" -ForegroundColor Cyan

$currentSubject = ""
foreach ($c in $byConcept) {
    if ($c.subject -ne $currentSubject) {
        Write-Host ""
        Write-Host "--- $($c.subject.ToUpper()) ---" -ForegroundColor Yellow
        $currentSubject = $c.subject
    }
    $gradeStr = "G" + $c.grade.Replace("grade_", "")
    Write-Host "  $($c.code) ($gradeStr): $($c.count) ejercicios - $($c.name)" -ForegroundColor White
}

Write-Host ""
Write-Host "=== TOTALES POR MATERIA ===" -ForegroundColor Cyan
$bySubject = $byConcept | Group-Object -Property subject
foreach ($s in $bySubject) {
    $total = ($s.Group | Measure-Object -Property count -Sum).Sum
    Write-Host "$($s.Name): $total ejercicios" -ForegroundColor Green
}

$totalAll = ($byConcept | Measure-Object -Property count -Sum).Sum
Write-Host ""
Write-Host "TOTAL GENERAL: $totalAll ejercicios" -ForegroundColor Magenta