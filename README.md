# EXE Packager - Complete Solution

A comprehensive tool for creating self-extracting executables and application packages.

## 🎯 **What This Tool Does**

### **1. Universal Single-File Installer**

- Package any folder into a single executable installer
- Everything is embedded - just one .exe file to distribute
- Users get a UI dialog to choose installation directory
- Works for games, applications, mods, or any file distribution
- Configurable for any game or application

### **2. Application Packaging (App Packager)**

- Package Node.js, Electron, and Python applications into executables
- Create standalone applications that don't require runtime installation

## 🚀 **Quick Start**

### **GUI Application (Recommended - Easiest!)**

```powershell
# Start the GUI application
.\start-gui.ps1

# Or use npm
npm run gui
```

**Just 3 steps:**
1. Click "Browse" and select your folder
2. Enter app name and output name
3. Click "Create Installer"

### **Command Line Mode:**

```powershell
# Simple command line
.\scripts\pack-files.ps1 -Folder "my-mod" -OutputName "MyMod"

# With version
.\scripts\pack-files.ps1 -Folder "my-mod" -AppName "MyMod" -Version "1.0.0"
```

### **For Applications:**

```powershell
# Interactive mode
.\scripts\interactive-packager.ps1

# Command line mode
.\scripts\package.ps1 node --entry-point ./app.js --output-name myapp
```

## ✅ **Features**

- **🎨 Modern GUI Application** - Beautiful, easy-to-use graphical interface
- **Single-File Distribution** - One .exe file with everything embedded
- **Simple Creation** - Just point to a folder and get an installer
- **User-Friendly UI** - Interactive dialogs for directory selection
- **Auto-Detect Paths** - Configurable path detection for any game or application
- **Universal Support** - Works with any game, application, or file distribution
- **Large File Support** - Handles multi-GB archives without issues
- **Smart Fallbacks** - Always works, even with user errors
- **Version Support** - Automatic versioning in filenames

## 🛠️ **Installation**

```powershell
# Install Node.js dependencies
.\install.ps1

# Or manually
npm install
```
