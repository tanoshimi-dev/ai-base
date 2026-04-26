$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TargetScript = Join-Path $ScriptDir "copilot-track.ps1"

& $TargetScript @args
exit $LASTEXITCODE
