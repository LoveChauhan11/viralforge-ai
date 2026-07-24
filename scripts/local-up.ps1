#Requires -Version 5.1
<#
.SYNOPSIS
  Boot ViralForge locally: install, infra, migrate/seed, optional checks, start services.

.EXAMPLE
  .\scripts\local-up.ps1

.EXAMPLE
  .\scripts\local-up.ps1 -SkipTests -NoStart

.EXAMPLE
  .\scripts\local-up.ps1 -SmokeOnly
#>
param(
  [switch]$SkipTests,
  [switch]$NoStart,
  [switch]$SmokeOnly,
  [switch]$ResetInfra
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Invoke-Pnpm {
  param(
    [Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)]
    [string[]]$PnpmArgs
  )
  Write-Host ("npx pnpm@9.15.9 " + ($PnpmArgs -join " ")) -ForegroundColor DarkGray
  & npx --yes pnpm@9.15.9 @PnpmArgs
  if ($LASTEXITCODE -ne 0) {
    throw "pnpm failed ($LASTEXITCODE): pnpm $($PnpmArgs -join ' ')"
  }
}

function Wait-HttpOk([string]$Url, [int]$TimeoutSec = 60) {
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    try {
      $res = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
      if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 300) {
        Write-Host "OK  $Url" -ForegroundColor Green
        return
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  }
  throw "Timed out waiting for $Url"
}

function Invoke-Smoke {
  Write-Step "Smoke checks"
  Wait-HttpOk "http://127.0.0.1:4000/health/live"
  Wait-HttpOk "http://127.0.0.1:4000/health/ready"
  Wait-HttpOk "http://127.0.0.1:3000/"
  Write-Host ""
  Write-Host "Local stack looks healthy." -ForegroundColor Green
  Write-Host "  Web:  http://localhost:3000"
  Write-Host "  API:  http://localhost:4000/health/ready"
  Write-Host "  MinIO console: http://localhost:9001 (minioadmin / minioadmin)"
  Write-Host ""
  Write-Host "Seed user email: local.dev@example.invalid"
  Write-Host "Re-print IDs:    npx pnpm@9.15.9 seed"
}

if ($SmokeOnly) {
  Invoke-Smoke
  exit 0
}

Write-Step "Check Node"
$nodeVersion = & node -v
Write-Host "Node $nodeVersion"
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker is required (Docker Desktop). Install/start it, then re-run."
}

Write-Step "Install dependencies"
Invoke-Pnpm install

if (-not (Test-Path (Join-Path $Root ".env"))) {
  Write-Step "Create .env from .env.example"
  Copy-Item (Join-Path $Root ".env.example") (Join-Path $Root ".env")
} else {
  Write-Host ".env already present"
}

if ($ResetInfra) {
  Write-Step "Reset local infra volumes (destructive)"
  Invoke-Pnpm infra:reset
}

Write-Step "Start Postgres / Redis / MinIO"
Invoke-Pnpm infra:up

Write-Step "Migrate + seed"
Invoke-Pnpm migrate
Invoke-Pnpm seed

if (-not $SkipTests) {
  Write-Step "Quality gate (lint / typecheck / test)"
  Invoke-Pnpm lint
  Invoke-Pnpm typecheck
  Invoke-Pnpm test
}

if (-not $NoStart) {
  Write-Step "Start API, scheduler, worker-general, web (new windows)"
  $services = @(
    @{ Name = "api"; Filter = "@viralforge/api" },
    @{ Name = "scheduler"; Filter = "@viralforge/scheduler" },
    @{ Name = "worker-general"; Filter = "@viralforge/worker-general" },
    @{ Name = "web"; Filter = "@viralforge/web" }
  )
  foreach ($svc in $services) {
    $cmd = "Set-Location `"$Root`"; npx --yes pnpm@9.15.9 --filter $($svc.Filter) dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd -WindowStyle Normal
    Write-Host "Started $($svc.Name)"
  }

  Write-Step "Wait for services"
  Start-Sleep -Seconds 5
  Invoke-Smoke
} else {
  Write-Host ""
  Write-Host "Infra + DB ready. Start services manually:" -ForegroundColor Yellow
  Write-Host '  npx pnpm@9.15.9 --filter @viralforge/api dev'
  Write-Host '  npx pnpm@9.15.9 --filter @viralforge/scheduler dev'
  Write-Host '  npx pnpm@9.15.9 --filter @viralforge/worker-general dev'
  Write-Host '  npx pnpm@9.15.9 --filter @viralforge/web dev'
  Write-Host "Then: .\scripts\local-up.ps1 -SmokeOnly"
}
