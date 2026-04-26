# claude-track.ps1 — thin wrapper around claude_tracking.py
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Script = Join-Path $ScriptDir "claude_tracking.py"
python $Script @args
exit $LASTEXITCODE
