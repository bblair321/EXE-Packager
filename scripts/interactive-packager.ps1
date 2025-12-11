#!/usr/bin/env pwsh
# PowerShell wrapper for interactive-file-packager.js
# Provides an interactive way to create installers

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$InteractiveScript = Join-Path $ScriptDir "interactive-file-packager.js"

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Node.js not found"
    }
} catch {
    Write-Error "Node.js is not installed or not in PATH. Please install Node.js first."
    exit 1
}

# Check if interactive-file-packager.js exists
if (-not (Test-Path $InteractiveScript)) {
    Write-Error "interactive-file-packager.js not found at: $InteractiveScript"
    exit 1
}

# Run the interactive script
try {
    Write-Host "📦 Starting interactive file packager..." -ForegroundColor Cyan
    node $InteractiveScript
    exit $LASTEXITCODE
} catch {
    Write-Error "Failed to run interactive-file-packager.js: $_"
    exit 1
}

