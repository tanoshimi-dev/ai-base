$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PythonScript = Join-Path $ScriptDir "copilot_tracking.py"

if (Get-Command py -ErrorAction SilentlyContinue) {
    $PythonCmd = @("py", "-3")
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
    $PythonCmd = @("python")
} else {
    throw "Python 3 is required."
}

$PythonArgs = @()
if ($PythonCmd.Length -gt 1) {
    $PythonArgs += $PythonCmd[1..($PythonCmd.Length - 1)]
}
$PythonArgs += @($PythonScript, "wrap")
$PythonArgs += $args

& $PythonCmd[0] @PythonArgs
exit $LASTEXITCODE
