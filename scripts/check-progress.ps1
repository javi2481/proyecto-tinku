$headers = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}

$baseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

# Check current status
Write-Host "=== PROGRESO DE REVISION ===" -ForegroundColor Cyan

# Get exercises with status
$uri = "$baseUri/exercises?deleted_at=is.null&select=id,concept_id,exercise_type,prompt_es,content,pedagogical_review_status,pedagogical_notes,quality_score"
$ex = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers

$pending = ($ex | Where-Object { $_.pedagogical_review_status -eq 'pending' }).Count
$approved = ($ex | Where-Object { $_.pedagogical_review_status -eq 'approved' }).Count
$needs = ($ex | Where-Object { $_.pedagogical_review_status -eq 'needs_revision' }).Count
$rejected = ($ex | Where-Object { $_.pedagogical_review_status -eq 'rejected' }).Count

Write-Host ""
Write-Host "Status:" -ForegroundColor Yellow
Write-Host "  Pending:       $pending" -ForegroundColor Yellow
Write-Host "  Approved:      $approved" -ForegroundColor Green
Write-Host "  Needs Revision: $needs" -ForegroundColor Red
Write-Host "  Rejected:     $rejected" -ForegroundColor Red
Write-Host "  -------------------" -ForegroundColor Gray
Write-Host "  TOTAL:        $($ex.Count)" -ForegroundColor White
Write-Host ""

# Get concepts
$uri = "$baseUri/concepts?deleted_at=is.null&select=id,code,primary_subject,grade,name_es"
$concepts = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers

Write-Host "=== POR CONCEPTO ===" -ForegroundColor Yellow

$currentSubject = ""
foreach ($e in $ex) {
    $concept = $concepts | Where-Object { $_.id -eq $e.concept_id } | Select-Object -First 1
    if ($concept) {
        if ($concept.primary_subject -ne $currentSubject) {
            Write-Host ""
            Write-Host "--- $($concept.primary_subject) ---" -ForegroundColor Magenta
            $currentSubject = $concept.primary_subject
        }

        $statusEmoji = switch ($e.pedagogical_review_status) {
            "approved" { "✅" }
            "needs_revision" { "⚠️" }
            "rejected" { "❌" }
            default { "⏳" }
        }

        Write-Host "  $($statusEmoji) $($concept.code): $($e.prompt_es.Substring(0, [Math]::Min(50, $e.prompt_es.Length)))..." -ForegroundColor White
    }
}

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan