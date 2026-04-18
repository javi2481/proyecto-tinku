$headers = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}

# Query exercises
$uri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1/exercises?deleted_at=is.null&select=pedagogical_review_status'
$response = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers

# Group by status
$grouped = $response | Group-Object -Property pedagogical_review_status

Write-Host "=== Ejercicios por Estado ===" -ForegroundColor Cyan
foreach ($group in $grouped) {
    Write-Host "$($group.Name): $($group.Count)" -ForegroundColor Green
}

Write-Host "======================" -ForegroundColor Cyan
Write-Host "Total: $($response.Count)" -ForegroundColor Yellow