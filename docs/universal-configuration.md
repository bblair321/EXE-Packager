# Universal Configuration Guide

This tool is designed to work with **any game or application**, not just specific ones. Here's how to configure it for your needs.

## Adding Custom Games

### Method 1: Edit `configs/game-paths.json`

Edit the `configs/game-paths.json` file to add your games:

```json
{
  "custom": {
    "games": {
      "My Game": "C:\\Games\\MyGame",
      "Another Game": "D:\\Steam\\steamapps\\common\\AnotherGame"
    }
  }
}
```

Use `%USERPROFILE%` for user home directory:
```json
{
  "custom": {
    "games": {
      "My Game": "%USERPROFILE%\\AppData\\Local\\MyGame"
    }
  }
}
```

### Method 2: Programmatically Add Games

```javascript
const LauncherPacker = require('./launcher-api.js');
const packer = new LauncherPacker();

// Add a custom game path
packer.addGamePath("My Custom Game", "C:\\Games\\MyGame", "custom");

// Now detect it
const gamePath = packer.detectGamePath("My Custom Game");
```

## Customizing Installer Messages

Make the installer messages specific to your use case:

```javascript
const FilePacker = require('./scripts/pack-files.js');

const packer = new FilePacker({
  appName: "My Application Installer",
  messages: {
    title: "My Application Installer",
    selectDirectory: "Please select where to install My Application.",
    directoryPlaceholder: "Enter the path to your application directory...",
    commonDirectories: "Common application directories:",
    desktopWarning: "Using Desktop is not recommended for applications."
  }
});
```

## Platform Support

The tool supports multiple platforms:

- **Steam** - Automatically detects Steam common directory
- **Epic Games** - Automatically detects Epic Games directory
- **GOG** - Automatically detects GOG directory
- **Custom** - Add any custom paths

## Examples for Different Use Cases

### Game Mod Installer
```powershell
.\pack-files.ps1 -Folder "mod-files" -AppName "Game Mod" -OutputName "GameModInstaller"
```

### Application Installer
```powershell
.\pack-files.ps1 -Folder "app-files" -AppName "My Application" -OutputName "AppInstaller"
```

### Configuration Package
```powershell
.\pack-files.ps1 -Folder "config-files" -AppName "Config Package" -OutputName "ConfigInstaller"
```

### Asset Package
```powershell
.\pack-files.ps1 -Folder "assets" -AppName "Asset Pack" -OutputName "AssetInstaller"
```

## Auto-Detection

The tool can auto-detect games from the configuration:

```javascript
const LauncherPacker = require('./launcher-api.js');
const packer = new LauncherPacker();

// Detect any configured game
const gamePath = packer.detectGamePath("My Game");

if (gamePath) {
  console.log(`Found at: ${gamePath}`);
} else {
  console.log("Game not found in configured paths");
}
```

## Universal Path Detection

The tool searches:
1. Configured game paths (from `game-paths.json`)
2. Common installation directories (Steam, Epic, GOG, etc.)
3. Custom paths you provide
4. Common game directories

This makes it work with **any game or application** without modification!

