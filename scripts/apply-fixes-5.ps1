# Apply fixes to 5 problematic exercises based on AI suggestions

$ErrorActionPreference = "Stop"

# Supabase config
$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
    'Prefer' = 'return=representation'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "=== APLICANDO CORRECCIONES A 5 EJERCICIOS ===" -ForegroundColor Cyan
Write-Host ""

# Get the 5 remaining exercises
$uri = "$supabaseUri/exercises?pedagogical_review_status=eq.needs_revision&select=id,prompt_es,content,correct_answer"
$exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

Write-Host "Ejercicios a corregir: $($exercises.Count)" -ForegroundColor Yellow
Write-Host ""

# Define fixes based on AI suggestions
$fixes = @{
    "eb6449f6-de15-4259-a8f7-f54732095a41" = @{old = "11"; new = "15"}
    "d7435636-9e3d-4ea9-9ad2-0a9b647342ff" = @{old = "29"; new = "25"}
    "9310326c-f8a1-49d7-9ddd-8884c41e35b2" = @{old = "12"; new = "10"}
    "a5382ad4-4a88-4c4e-adda-aa7ef62123df" = @{old = "77"; new = "70"}
    "b32c79e0-d0b4-4dd0-a91a-521fd9c085eb" = @{old = "7"; new = "5"}
}

foreach ($e in $exercises) {
    $shortId = if ($e.id.Length -gt 8) { $e.id.Substring(0, 8) } else { $e.id }
    Write-Host "Procesando: $shortId" -ForegroundColor White
    Write-Host "  Pregunta: $($e.prompt_es)" -ForegroundColor Gray
    Write-Host "  Opciones actuales: $($e.content.options -join ', ')" -ForegroundColor Gray
    Write-Host "  Correcta: $($e.correct_answer.value)" -ForegroundColor Gray
    
    $fix = $fixes[$e.id]
    if ($fix) {
        $oldVal = $fix.old
        $newVal = $fix.new
        # Replace old option with new option
        $newOptions = @()
        foreach ($opt in $e.content.options) {
            if ($opt -eq $oldVal) {
                $newOptions += $newVal
                Write-Host "  🔄 Cambiando '$oldVal' por '$newVal'" -ForegroundColor Cyan
            } else {
                $newOptions += $opt
            }
        }
        
        # Update in Supabase
        $updateUri = "$supabaseUri/exercises?id=eq.$($e.id)"
        $updateBody = @{
            content = @{
                options = $newOptions
                explanation = $e.content.explanation
            }
            pedagogical_review_status = "approved"
            pedagogical_notes = "AI: fixed distractor ±1. Changed $oldVal to $newVal"
            quality_score = 4
        } | ConvertTo-Json
        
        try {
            $null = Invoke-RestMethod -Uri $updateUri -Method PATCH -Headers $supabaseHeaders -Body $updateBody
            Write-Host "  ✅ Actualizado y aprobado!" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ⚠️ No hay fix definido para este ejercicio" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "=== VERIFICANDO ESTADO FINAL ===" -ForegroundColor Yellow
$uri = "$supabaseUri/exercises?pedagogical_review_status=eq.needs_revision&select=id"
$remaining = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders
Write-Host "Ejercicios restantes con needs_revision: $($remaining.Count)" -ForegroundColor White

$uri = "$supabaseUri/exercises?pedagogical_review_status=eq.approved&select=id"
$approved = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders
Write-Host "Ejercicios aprobados: $($approved.Count)" -ForegroundColor Green

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan