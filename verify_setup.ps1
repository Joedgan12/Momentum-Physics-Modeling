# Verify system setup
Write-Host "=== SYSTEM SETUP VERIFICATION ===" -ForegroundColor Cyan
Write-Host ""

# Check Flask
Write-Host "Flask API Status:" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri 'http://127.0.0.1:5000/api/health' -TimeoutSec 5
    Write-Host "  ✅ RUNNING on port 5000" -ForegroundColor Green
    Write-Host "  Status: $($health.data.status)"
    Write-Host "  NumPy: $($health.data.numpy)"
} catch {
    Write-Host "  ❌ NOT RESPONDING on port 5000" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)"
}
Write-Host ""

# Check Vite
Write-Host "Vite Frontend Status:" -ForegroundColor Yellow
try {
    $vite = Invoke-WebRequest -Uri 'http://localhost:5176/' -TimeoutSec 2 -ErrorAction Stop
    Write-Host "  ✅ RUNNING on port 5176" -ForegroundColor Green
} catch {
    $found = $false
    for ($port = 5173; $port -le 5180; $port++) {
        try {
            $test = Invoke-WebRequest -Uri "http://localhost:$port/" -TimeoutSec 1 -ErrorAction Stop
            Write-Host "  ✅ RUNNING on port $port" -ForegroundColor Green
            Write-Host "  Open: http://localhost:$port"
            $found = $true
            break
        } catch {}
    }
    if (-not $found) {
        Write-Host "  ⚠️  Not found on ports 5173-5180" -ForegroundColor Yellow
    }
}
Write-Host ""

# Quick simulation test
Write-Host "Simulation Test (20 iterations):" -ForegroundColor Yellow
$start = Get-Date
try {
    $body = @{
        formation='4-3-3'
        formation_b='4-4-2'
        tactic='balanced'
        tactic_b='balanced'
        iterations=20
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri 'http://127.0.0.1:5000/api/simulate' `
        -Method POST `
        -ContentType 'application/json' `
        -Body $body `
        -TimeoutSec 300

    $elapsed = ((Get-Date) - $start).TotalSeconds
    Write-Host "  ✅ SUCCESS (${elapsed}s)" -ForegroundColor Green
    Write-Host "  Avg PMU: $([Math]::Round($result.data.avgPMU, 2))"
    Write-Host "  Goal Probability: $([Math]::Round($result.data.goalProbability * 100, 1))%"
    Write-Host "  xG: $($result.data.xg)"
    Write-Host "  Top Player: $($result.data.playerMomentum[0].name) ($([Math]::Round($result.data.playerMomentum[0].pmu, 1)) PMU)"
} catch {
    Write-Host "  ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Cyan
