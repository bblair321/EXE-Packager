# GUI Application Guide

## 🎨 Using the Graphical Interface

The GUI application provides a modern, user-friendly interface for creating installers without needing to use command line or scripts.

## 🚀 Starting the GUI

### Option 1: PowerShell Script (Recommended)
```powershell
.\start-gui.ps1
```

### Option 2: Batch File
```cmd
.\start-gui.bat
```

### Option 3: NPM Command
```bash
npm run gui
```

The GUI will launch in a new window.

## 📖 Using the GUI

### Step 1: Select Folder
1. Click the **"Browse"** button
2. Navigate to and select the folder you want to package
3. The selected folder path will appear in the text box

### Step 2: Configure Installer
Fill in the following fields:
- **Application Name** - Display name for your installer
- **Output Executable Name** - Name for the .exe file (optional - defaults to app name)
- **Version** - Version number (default: 1.0.0)
- **Output Directory** - Where to save the installer (default: ./dist)
- **Include Version in Filename** - Checkbox to add version to filename

### Step 3: Create Installer
1. Click the **"Create Installer"** button
2. Watch the progress bar as your installer is created
3. When complete, you'll see a success message
4. Click **"Open Output Folder"** to view your installer

## 🎯 Features

- **Visual Progress** - See real-time progress as your installer is created
- **Error Handling** - Clear error messages if something goes wrong
- **Open Output** - Quick access to your created installer
- **Clean Interface** - Modern, professional design

## 💡 Tips

- The GUI uses the same backend as the command line tools
- All installers are single-file executables with everything embedded
- The GUI works with any folder - games, applications, mods, etc.

## 🔧 Troubleshooting

### GUI Won't Start
1. Make sure Node.js is installed: `node --version`
2. Install dependencies: `npm install`
3. Install Electron: `npm install electron`

### Installer Creation Fails
- Check that the selected folder exists and is accessible
- Make sure you have write permissions to the output directory
- Check the error message for specific details

## 🚀 That's It!

The GUI makes creating installers as simple as clicking a few buttons. No command line knowledge required!

