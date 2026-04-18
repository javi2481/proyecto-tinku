# Batch review using OpenRouter API - Fixed format

$apiKey = "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"
$baseUrl = "https://openrouter.ai/api/v1"

$supabaseHeaders = @{
    'apikey' = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpaGJrYW5ldnhsdmlzYW5sdnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjQ0NDI3NCwiZXhwIjoyMDkyMDIwMjc0fQ.d6fGESlO8JLCPO3Q8Kn7wmyZHrZK_zLb2d-JXidYdus'
    'Content-Type' = 'application/json'
}
$supabaseUri = 'https://rihbkanevxlvisanlvsn.supabase.co/rest/v1'

Write-Host "=== OPENROUTER BATCH REVIEW ===" -ForegroundColor Cyan

# Test with simple prompt - using a different model
Write-Host "Testing with google/gemini-2.0-flash-exp..." -ForegroundColor Yellow

$body = @{
    model = "google/gemini-2.0-flash-exp"
    messages = @(
        @{role = "user"; content = "Say 'OK' if you understand"}
    )
    max_tokens = 50
} | ConvertTo-Json -Depth 3

try {
    $resp = Invoke-RestMethod -Uri "$baseUrl/chat/completions" -Method POST -Headers @{
        'Authorization' = "Bearer $apiKey"
        'Content-Type' = 'application/json'
    } -Body $body

    Write-Host "✅ Model works! Response: $($resp.choices[0].message.content)" -ForegroundColor Green

} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red

    # Try another model
    Write-Host "Trying with meta-llama/llama-3.3-70b-instruct..." -ForegroundColor Yellow
    $body = @{
        model = "meta-llama/llama-3.3-70b-instruct"
        messages = @(
            @{role = "user"; content = "Say 'OK' if you understand"}
        )
        max_tokens = 50
    } | ConvertTo-Json -Depth 3

    try {
        $resp2 = Invoke-RestMethod -Uri "$baseUrl/chat/completions" -Method POST -Headers @{
            'Authorization' = "Bearer $apiKey"
            'Content-Type' = 'application/json'
        } -Body $body
        Write-Host "✅ Llama works! Response: $($resp2.choices[0].message.content)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Llama failed too: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan