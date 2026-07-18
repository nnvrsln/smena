$projectRoot = Split-Path -Parent $PSScriptRoot
$pgCtl = Join-Path $projectRoot '.tools\postgresql-18.4\pgsql\bin\pg_ctl.exe'
$dataDir = Join-Path $projectRoot '.tools\postgres-data'

if (-not (Test-Path -LiteralPath $pgCtl) -or -not (Test-Path -LiteralPath $dataDir)) {
  Write-Output 'PostgreSQL: not prepared.'
  exit 1
}

& $pgCtl -D $dataDir status
