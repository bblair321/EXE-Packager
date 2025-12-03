# Universal Single-File Installer Creator

This script creates a single executable installer with everything embedded. When users run the `.exe` file, they can choose where to extract the files. **No separate files needed - everything is in one .exe!**

Works for games, applications, mods, or any file distribution - completely universal!

## 🎯 How It Works

1. **Pack**: You specify a mod folder to package
2. **Create**: Script creates a ZIP archive and embeds it directly in the executable (base64 encoded)
3. **Extract**: Users run the `.exe`, choose a directory, and files are extracted there

## 📋 Usage Examples

### Simple Usage (Recommended)

```powershell
# Pack a mod folder - simplest way!
.\pack-files.ps1 -Folder "my-mod" -OutputName "MyMod"

# With version and app name
.\pack-files.ps1 -Folder "./mods/my-mod" -AppName "MyMod" -Version "1.0.0"

# Interactive mode (easiest)
.\scripts\interactive-file-packager.ps1
```

### Direct Node.js Usage

```bash
# Pack a mod folder
node scripts/pack-files.js --folder "./my-mod" --output-name "MyMod"

# With version
node scripts/pack-files.js --folder "./my-mod" --app-name "MyMod" --version "1.0.0"
```

## 🔧 Configuration File

Create a `pack-config.json` file:

```json
{
  "appName": "MyFilePackage",
  "version": "1.0.0",
  "outputDir": "./dist",
  "includeVersion": true,
  "files": [
    "./config.json",
    "./readme.txt",
    "./license.txt"
  ],
  "folders": [
    "./assets",
    "./data",
    "./templates"
  ]
}
```

## 🎮 Real-World Examples

### Game Mod Package
```powershell
.\pack-files.ps1 -Folder "my-mod" -AppName "GameMod" -OutputName "GameMod-v1.2"
```

### Application Package
```powershell
.\pack-files.ps1 -Folder "./my-app" -AppName "MyApplication" -OutputName "MyApp-Installer"
```

### Complete Package
```powershell
# Everything in the folder gets packaged
.\pack-files.ps1 -Folder "./my-package" -AppName "MyPackage" -Version "1.0.0"
```

## 📦 What Users Experience

1. **Download** your single `.exe` file (no other files needed!)
2. **Run** the executable
3. **Choose** where to extract files (folder picker dialog)
4. **Files are extracted** to their chosen location
5. **Done!** All files are now in their desired directory

## 🔍 Output

The script creates:
- **Single executable installer** in `./dist/` folder
- **Everything embedded** - archive is base64 encoded inside the .exe
- **Version number** included in filename (e.g., `MyApp-1.0.0.exe`)
- **User-friendly extraction** interface

## 💡 Perfect For

- **Game mods** - Package textures, scripts, configs
- **Software distributions** - Include docs, configs, assets
- **Configuration packages** - Settings, templates, examples
- **Asset packages** - Images, sounds, data files
- **Documentation bundles** - PDFs, guides, examples

## 🚀 For Your Projects

### Game Mod Installer
```powershell
.\pack-files.ps1 -Folder "my-mod" -AppName "MyMod" -OutputName "MyMod-v1.0"
```

### Application Installer
```powershell
.\pack-files.ps1 -Folder "./my-app" -AppName "MyApp" -Version "1.0.0"
```

### Complete Package
```powershell
# Everything in the folder gets packaged into a single installer
.\pack-files.ps1 -Folder "./my-package" -AppName "MyPackage"
```

### Custom Game Support
Add your own games to `configs/game-paths.json` for auto-detection:
```json
{
  "custom": {
    "games": {
      "My Custom Game": "C:\\Games\\MyGame"
    }
  }
}
```

The generated executable is a **true single file** - everything is embedded inside! Users just need to run the .exe file. No separate ZIP files, no dependencies, just one file to distribute!
