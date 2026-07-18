$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$pgCtl = Join-Path $projectRoot '.tools\postgresql-18.4\pgsql\bin\pg_ctl.exe'
$dataDir = Join-Path $projectRoot '.tools\postgres-data'
$logFile = Join-Path $projectRoot '.tools\postgres.log'

if (-not (Test-Path -LiteralPath $pgCtl) -or -not (Test-Path -LiteralPath $dataDir)) {
  throw 'Local PostgreSQL is not prepared. See infra/postgres/README.md.'
}

& $pgCtl -D $dataDir status *> $null
if ($LASTEXITCODE -eq 0) {
  Write-Output 'PostgreSQL is already running on 127.0.0.1:55432.'
  exit 0
}

& $pgCtl -D $dataDir -l $logFile -o '-p 55432 -h 127.0.0.1' start
if ($LASTEXITCODE -ne 0) { throw 'Could not start PostgreSQL.' }
