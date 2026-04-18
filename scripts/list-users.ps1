$headers = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}

# List users
$usersUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1/profiles?select=id,email,full_name,role&limit=20'
$users = Invoke-RestMethod -Uri $usersUri -Method GET -Headers $headers

Write-Host "=== USUARIOS EN SUPABASE ===" -ForegroundColor Cyan
Write-Host "Total: $($users.Count)" -ForegroundColor Yellow
Write-Host ""

foreach ($u in $users) {
    Write-Host "Email: $($u.email)" -ForegroundColor White
    Write-Host "  Name: $($u.full_name)" -ForegroundColor Gray
    Write-Host "  Role: $($u.role)" -ForegroundColor Gray
    Write-Host "  ID: $($u.id)" -ForegroundColor Gray
    Write-Host ""
}