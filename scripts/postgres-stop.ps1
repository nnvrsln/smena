$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$pgCtl = Join-Path $projectRoot '.tools\postgresql-18.4\pgsql\bin\pg_ctl.exe'
$dataDir = Join-Path $projectRoot '.tools\postgres-data'

if (-not (Test-Path -LiteralPath $pgCtl) -or -not (Test-Path -LiteralPath $dataDir)) {
  Write-Output 'Local PostgreSQL is not prepared.'
  exit 0
}

& $pgCtl -D $dataDir status *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Output 'PostgreSQL is already stopped.'
  exit 0
}

& $pgCtl -D $dataDir stop -m fast
if ($LASTEXITCODE -ne 0) { throw 'Could not stop PostgreSQL.' }
