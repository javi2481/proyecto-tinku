$headers = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}

$baseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

# Tables to check
$tables = @('profiles', 'students', 'concepts', 'exercises', 'sessions', 'attempts', 'children', 'student_islands', 'badges', 'xp_rules', 'data_access_log', 'classrooms')

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   INFORME COMPLETO DE SUPABASE" -ForegroundColor Cyan
Write-Host "   Proyecto: rihbkanevxlvisanlvsn" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# 1. USERS/AUTH
Write-Host "=== 1. AUTH.USERS ===" -ForegroundColor Yellow
$uri = "$baseUri/profiles?select=id,email,full_name,role,created_at&order=created_at&limit=10"
try {
    $users = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    Write-Host "Total profiles: $($users.Count)" -ForegroundColor Green
    foreach ($u in $users) {
        Write-Host "  - $($u.email) | $($u.role) | $($u.full_name)" -ForegroundColor White
    }
} catch { Write-Host "  Error: $_" -ForegroundColor Red }
Write-Host ""

# 2. STUDENTS
Write-Host "=== 2. STUDENTS ===" -ForegroundColor Yellow
$uri = "$baseUri/students?select=id,login_code,parent_id,created_at&limit=10"
try {
    $students = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    Write-Host "Total: $($students.Count)" -ForegroundColor Green
} catch { Write-Host "  Error: $_" -ForegroundColor Red }
Write-Host ""

# 3. CHILDREN
Write-Host "=== 3. CHILDREN ===" -ForegroundColor Yellow
$uri = "$baseUri/children?select=id,parent_id,student_id,name,grade,created_at&limit=10"
try {
    $children = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    Write-Host "Total: $($children.Count)" -ForegroundColor Green
} catch { Write-Host "  Error: $_" -ForegroundColor Red }
Write-Host ""

# 4. CONCEPTS
Write-Host "=== 4. CONCEPTS ===" -ForegroundColor Yellow
$uri = "$baseUri/concepts?select=id,code,primary_subject,grade,name_es,display_order&order=primary_subject,display_order&limit=30"
try {
    $concepts = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    Write-Host "Total: $($concepts.Count)" -ForegroundColor Green
    $currentSubject = ""
    foreach ($c in $concepts) {
        if ($c.primary_subject -ne $currentSubject) {
            Write-Host "  --- $($c.primary_subject) ---" -ForegroundColor Magenta
            $currentSubject = $c.primary_subject
        }
        Write-Host "    $($c.code) (G$($c.grade)): $($c.name_es)" -ForegroundColor White
    }
} catch { Write-Host "  Error: $_" -ForegroundColor Red }
Write-Host ""

# 5. EXERCISES
Write-Host "=== 5. EXERCISES ===" -ForegroundColor Yellow
$uri = "$baseUri/exercises?select=id,exercise_type,pedagogical_review_status&deleted_at=is.null"
try {
    $ex = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    $pending = ($ex | Where-Object { $_.pedagogical_review_status -eq 'pending' }).Count
    $approved = ($ex | Where-Object { $_.pedagogical_review_status -eq 'approved' }).Count
    $needs = ($ex | Where-Object { $_.pedagogical_review_status -eq 'needs_revision' }).Count
    Write-Host "Total: $($ex.Count)" -ForegroundColor Green
    Write-Host "  - Pending: $pending" -ForegroundColor Yellow
    Write-Host "  - Approved: $approved" -ForegroundColor Green
    Write-Host "  - Needs Revision: $needs" -ForegroundColor Red
} catch { Write-Host "  Error: $_" -ForegroundColor Red }
Write-Host ""

# 6. SESSIONS
Write-Host "=== 6. SESSIONS ===" -ForegroundColor Yellow
$uri = "$baseUri/sessions?select=id,student_id,island,created_at&order=created_at&limit=5"
try {
    $sessions = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    Write-Host "Total: $($sessions.Count)" -ForegroundColor Green
} catch { Write-Host "  Error: $_" -ForegroundColor Red }
Write-Host ""

# 7. ATTEMPTS
Write-Host "=== 7. ATTEMPTS ===" -ForegroundColor Yellow
$uri = "$baseUri/attempts?select=id,session_id,exercise_id,outcome,created_at&limit=5"
try {
    $attempts = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    Write-Host "Total: $($attempts.Count)" -ForegroundColor Green
} catch { Write-Host "  Error: $_" -ForegroundColor Red }
Write-Host ""

# 8. BADGES
Write-Host "=== 8. BADGES ===" -ForegroundColor Yellow
$uri = "$baseUri/badges?select=id,name,icon,description&limit=20"
try {
    $badges = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    Write-Host "Total: $($badges.Count)" -ForegroundColor Green
    foreach ($b in $badges) {
        Write-Host "  - $($b.name): $($b.description)" -ForegroundColor White
    }
} catch { Write-Host "  Error: $_" -ForegroundColor Red }
Write-Host ""

# 9. DATA ACCESS LOG
Write-Host "=== 9. DATA_ACCESS_LOG ===" -ForegroundColor Yellow
$uri = "$baseUri/data_access_log?select=id,action,user_email,created_at&order=created_at-desc&limit=5"
try {
    $logs = Invoke-RestMethod -Uri $uri -Method GET -Headers $headers
    Write-Host "Total: $($logs.Count)" -ForegroundColor Green
} catch { Write-Host "  Error: $_" -ForegroundColor Red }
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "          FIN DEL INFORME" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan