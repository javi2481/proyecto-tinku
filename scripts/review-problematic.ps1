$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"

$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "=== REVISANDO EJERCICIOS PROBLEMATICOS ===" -ForegroundColor Cyan

$uri = "$supabaseUri/exercises?pedagogical_review_status=eq.needs_revision&deleted_at=is.null&select=id,prompt_es,content,correct_answer,pedagogical_notes"
$exercises = Invoke-RestMethod -Uri $uri -Method GET -Headers $supabaseHeaders

Write-Host "Encontrados: $($exercises.Count)" -ForegroundColor Yellow

$counter = 1
foreach ($e in $exercises) {
    Write-Host "Procesando $counter / $($exercises.Count)..." -ForegroundColor Gray
    
    $options = ""
    if ($e.content.options) { 
        $options = " [" + ($e.content.options -join ", ") + "]" 
    }
    
    $prompt = "Ejercicio: " + $e.prompt_es + $options + " - Correcta: " + $e.correct_answer.value + ". Notas: " + $e.pedagogical_notes + ". Decide: approve o needs_revision. JSON:"

    $body = @{
        model = "meta-llama/llama-3.3-70b-instruct"
        messages = @(
            @{role = "system"; content = "Responde JSON solo"},
            @{role = "user"; content = $prompt}
        )
        max_tokens = 200
        temperature = 0.3
    } | ConvertTo-Json -Depth 4

    try {
        $resp = Invoke-RestMethod -Uri "$baseUrl/chat/completions" -Method POST -Headers @{
            'Authorization' = "Bearer $apiKey"
            'Content-Type' = 'application/json'
        } -Body $body -TimeoutSec 120

        $reply = $resp.choices[0].message.content

        if ($reply -match 'approved') {
            $newStatus = "approved"
        } else {
            $newStatus = "needs_revision"
        }
        
        $updateUri = "$supabaseUri/exercises?id=eq.$($e.id)"
        $updateBody = @{
            pedagogical_review_status = $newStatus
            pedagogical_notes = "AI review bulk"
        } | ConvertTo-Json

        Invoke-RestMethod -Uri $updateUri -Method PATCH -Headers $supabaseHeaders -Body $updateBody | Out-Null
        Write-Host "  -> $newStatus" -ForegroundColor Green
        
    } catch {
        Write-Host "  -> ERROR" -ForegroundColor Red
    }

    $counter++
    Start-Sleep -Seconds 1
}

Write-Host "=== COMPLETO ===" -ForegroundColor Cyan