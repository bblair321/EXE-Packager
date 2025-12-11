#!/usr/bin/env pwsh
# PowerShell wrapper for pack-files.js
# Makes it easy to run the file packager from PowerShell

param(
    [Parameter(Mandatory=$false)]
    [string]$Folder,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputName,
    
    [Parameter(Mandatory=$false)]
    [string]$AppName,
    
    [Parameter(Mandatory=$false)]
    [string]$Version = "1.0.0",
    
    [Parameter(Mandatory=$false)]
    [string]$Config,
    
    [Parameter(Mandatory=$false)]
    [switch]$SilentMode,
    
    [Parameter(Mandatory=$false)]
    [string]$ExtractPath
)

# Get the script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PackFilesScript = Join-Path $ScriptDir "pack-files.js"

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

# Check if pack-files.js exists
if (-not (Test-Path $PackFilesScript)) {
    Write-Error "pack-files.js not found at: $PackFilesScript"
    exit 1
}

# Build arguments array
$arguments = @()

if ($Folder) {
    $arguments += "--folder"
    $arguments += $Folder
}

if ($OutputName) {
    $arguments += "--output-name"
    $arguments += $OutputName
}

if ($AppName) {
    $arguments += "--app-name"
    $arguments += $AppName
}

if ($Version) {
    $arguments += "--version"
    $arguments += $Version
}

if ($Config) {
    $arguments += "--config"
    $arguments += $Config
}

if ($SilentMode) {
    $arguments += "--silent-mode"
}

if ($ExtractPath) {
    $arguments += "--extract-path"
    $arguments += $ExtractPath
}

# Run the Node.js script
try {
    Write-Host "📦 Running file packager..." -ForegroundColor Cyan
    node $PackFilesScript $arguments
    exit $LASTEXITCODE
} catch {
    Write-Error "Failed to run pack-files.js: $_"
    exit 1
}

