// This file contains the GUI installer template that will be embedded in the extractor
// It creates a modern browser-based installer interface

const GUI_TEMPLATE = `
// Global error handler - catch errors before anything else
(function() {
  try {
    const errorLogPath = require('path').join(require('os').tmpdir(), 'installer-error.txt');
    
    function logError(message, error) {
      try {
        const fs = require('fs');
        const timestamp = new Date().toISOString();
        const errorMsg = '[' + timestamp + '] ' + message + String.fromCharCode(10);
        const stackMsg = error && error.stack ? 'Stack: ' + error.stack + String.fromCharCode(10) : '';
        fs.appendFileSync(errorLogPath, errorMsg + stackMsg + String.fromCharCode(10));
      } catch (e) {
        // If we can't write to file, at least try console
        try { console.error(message, error); } catch (e2) {}
      }
    }
    
    // Log startup immediately
    logError('Installer starting...');
    
    // Catch uncaught exceptions
    process.on('uncaughtException', function(error) {
      logError('UNCAUGHT EXCEPTION: ' + error.message, error);
      setTimeout(() => process.exit(1), 10000);
    });
    
    // Catch unhandled rejections
    process.on('unhandledRejection', function(reason, promise) {
      logError('UNHANDLED REJECTION: ' + (reason && reason.message || String(reason)), reason);
      setTimeout(() => process.exit(1), 10000);
    });
  } catch (initError) {
    // Even if error handler fails, try to write to file
    try {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      fs.writeFileSync(path.join(os.tmpdir(), 'installer-error.txt'), 'Failed to initialize error handler: ' + initError.message);
    } catch (e) {}
  }
})();

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Embedded archive data
const embeddedArchiveBase64 = '{{ARCHIVE_BASE64}}';
const embeddedArchiveSize = {{ARCHIVE_SIZE}};
const appName = '{{APP_NAME}}';

let selectedPath = null;
let extractionComplete = false;

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showMessageBox(title, message, buttons) {
  if (process.platform !== 'win32') {
    console.log(title + ': ' + message);
    return 'OK';
  }
  try {
    // Use VBScript MsgBox - build message with proper newlines using vbCrLf
    const buttonCode = buttons === 'YesNo' ? '4' : '0'; // 4 = Yes/No, 0 = OK only
    const iconCode = '64'; // 64 = Information icon
    
    // Split message by newlines and join with vbCrLf
    const msgLines = message.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const msgParts = [];
    for (let i = 0; i < msgLines.length; i++) {
      if (i > 0) {
        msgParts.push(' & vbCrLf & ');
      }
      msgParts.push('"' + msgLines[i].replace(/"/g, '""') + '"');
    }
    const msgText = msgParts.join('');
    const titleText = title.replace(/"/g, '""');
    
    const vbsScript = 'result = MsgBox(' + msgText + ', ' + buttonCode + ' + ' + iconCode + ', "' + titleText + '")\nWScript.Echo result';
    
    const tempFile = path.join(os.tmpdir(), 'msgbox-' + Date.now() + '.vbs');
    fs.writeFileSync(tempFile, vbsScript, 'utf8');
    const result = execSync('cscript //nologo "' + tempFile + '"', { 
      encoding: 'utf8', 
      timeout: 300000
    }).trim();
    fs.unlinkSync(tempFile);
    
    // VBScript MsgBox returns: 1=OK, 2=Cancel, 4=Yes, 6=No
    if (buttons === 'YesNo') {
      return result === '6' ? 'No' : (result === '4' ? 'Yes' : 'OK');
    }
    return 'OK';
  } catch (e) {
    console.log(title + ': ' + message);
    return 'OK';
  }
}

function showErrorBox(title, message) {
  if (process.platform !== 'win32') {
    console.error(title + ': ' + message);
    return;
  }
  try {
    // Use VBScript MsgBox with error icon - build message with proper newlines
    const msgLines = message.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const msgParts = [];
    for (let i = 0; i < msgLines.length; i++) {
      if (i > 0) {
        msgParts.push(' & vbCrLf & ');
      }
      msgParts.push('"' + msgLines[i].replace(/"/g, '""') + '"');
    }
    const msgText = msgParts.join('');
    const titleText = title.replace(/"/g, '""');
    const vbsScript = 'MsgBox ' + msgText + ', 0 + 16, "' + titleText + '"';
    
    const tempFile = path.join(os.tmpdir(), 'errorbox-' + Date.now() + '.vbs');
    fs.writeFileSync(tempFile, vbsScript, 'utf8');
    execSync('cscript //nologo "' + tempFile + '"', { 
      encoding: 'utf8', 
      timeout: 300000
    });
    fs.unlinkSync(tempFile);
  } catch (e) {
    console.error(title + ': ' + message);
  }
}

function selectFolderNative() {
  if (process.platform !== 'win32') {
    return null;
  }
  const vbsScript = 'Set objShell = CreateObject("Shell.Application")' + String.fromCharCode(10) +
    'Set objFolder = objShell.BrowseForFolder(0, "Select installation directory:", 0)' + String.fromCharCode(10) +
    'If objFolder Is Nothing Then' + String.fromCharCode(10) +
    '    WScript.Echo ""' + String.fromCharCode(10) +
    'Else' + String.fromCharCode(10) +
    '    WScript.Echo objFolder.Self.Path' + String.fromCharCode(10) +
    'End If';
  
  try {
    const tempFile = path.join(os.tmpdir(), 'folder-' + Date.now() + '.vbs');
    fs.writeFileSync(tempFile, vbsScript);
    const result = execSync('cscript //nologo "' + tempFile + '"', { encoding: 'utf8', timeout: 60000 }).trim();
    fs.unlinkSync(tempFile);
    return result || null;
  } catch (e) {
    return null;
  }
}

// Removed - using generateGUIHTML directly in main flow

async function extractFiles(extractDir) {
  try {
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    
    // Check if archive data is valid - it should be base64, not the placeholder string
    // The placeholder would be exactly '{{ARCHIVE_BASE64}}', so check for that specific pattern
    const isPlaceholder = embeddedArchiveBase64 && (
      embeddedArchiveBase64 === '{{ARCHIVE_BASE64}}' ||
      (embeddedArchiveBase64.indexOf('{{') !== -1 && embeddedArchiveBase64.indexOf('ARCHIVE_BASE64}}') !== -1)
    );
    
    // Also check if it's a valid base64 string (should start with base64 characters, not placeholder text)
    const isValidBase64 = embeddedArchiveBase64 && embeddedArchiveBase64.length > 20 && 
      /^[A-Za-z0-9+\/]/.test(embeddedArchiveBase64);
    
    if (!embeddedArchiveBase64 || (isPlaceholder && !isValidBase64)) {
      console.error('ERROR: Archive data not embedded in installer!');
      return { success: false, error: 'Archive data not embedded in installer. The archive placeholder was not replaced during packaging.' };
    }
    
    const archiveBuffer = Buffer.from(embeddedArchiveBase64, 'base64');
    
    const tempArchive = path.join(os.tmpdir(), 'extract-' + Date.now() + '.zip');
    fs.writeFileSync(tempArchive, archiveBuffer);
    
    // Use PowerShell to extract
    const psPath = tempArchive.replace(/\\/g, '/');
    const psDest = extractDir.replace(/\\/g, '/');
    
    execSync('powershell -Command "Expand-Archive -Path \'' + psPath + '\' -DestinationPath \'' + psDest + '\' -Force"', { 
      timeout: 60000,
      stdio: 'ignore'
    });
    
    fs.unlinkSync(tempArchive);
    extractionComplete = true;
    
    return { success: true, extractionPath: extractDir };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Generate HTML for GUI window using mshta.exe
function generateGUIHTML() {
  return '<!DOCTYPE html>' + String.fromCharCode(10) +
'<html>' + String.fromCharCode(10) +
'<head>' + String.fromCharCode(10) +
'<meta charset="UTF-8">' + String.fromCharCode(10) +
'<title>' + appName + ' - Installer</title>' + String.fromCharCode(10) +
'<HTA:APPLICATION ID="Installer" APPLICATIONNAME="' + (appName || "Installer").replace(/"/g, "&quot;") + ' Installer" BORDER="thin" BORDERSTYLE="normal" CAPTION="yes" ICON="" MAXIMIZEBUTTON="no" MINIMIZEBUTTON="yes" SHOWINTASKBAR="yes" SINGLEINSTANCE="yes" SYSMENU="yes" VERSION="1.0" WINDOWSTATE="normal" SCROLL="no" ERROR="no" />' + String.fromCharCode(10) +
'<style>' + String.fromCharCode(10) +
'* { margin: 0; padding: 0; box-sizing: border-box; }' + String.fromCharCode(10) +
'body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; overflow: hidden; }' + String.fromCharCode(10) +
'.container { background: white; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); max-width: 600px; width: 100%; overflow: hidden; }' + String.fromCharCode(10) +
'.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }' + String.fromCharCode(10) +
'.header h1 { font-size: 2em; margin-bottom: 5px; }' + String.fromCharCode(10) +
'.subtitle { opacity: 0.9; }' + String.fromCharCode(10) +
'.content { padding: 40px; }' + String.fromCharCode(10) +
'.step { display: none; }' + String.fromCharCode(10) +
'.step.active { display: block; }' + String.fromCharCode(10) +
'.step h2 { margin-bottom: 20px; color: #333; }' + String.fromCharCode(10) +
'.step p { margin-bottom: 15px; color: #666; line-height: 1.6; }' + String.fromCharCode(10) +
'.input-group { display: flex; gap: 10px; margin: 20px 0; }' + String.fromCharCode(10) +
'.path-input { flex: 1; padding: 12px; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 1em; }' + String.fromCharCode(10) +
'.btn { padding: 12px 24px; border: none; border-radius: 6px; font-size: 1em; font-weight: 600; cursor: pointer; transition: all 0.3s; }' + String.fromCharCode(10) +
'.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }' + String.fromCharCode(10) +
'.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102,126,234,0.4); }' + String.fromCharCode(10) +
'.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }' + String.fromCharCode(10) +
'button.btn-primary { opacity: 1 !important; cursor: pointer !important; }' + String.fromCharCode(10) +
'.btn-secondary { background: #6c757d; color: white; }' + String.fromCharCode(10) +
'.btn-success { background: #28a745; color: white; }' + String.fromCharCode(10) +
'.button-group { display: flex; gap: 10px; margin-top: 30px; justify-content: space-between; }' + String.fromCharCode(10) +
'.progress-container { margin: 30px 0; }' + String.fromCharCode(10) +
'.progress-bar { width: 100%; height: 30px; background: #e0e0e0; border-radius: 15px; overflow: hidden; margin-bottom: 10px; }' + String.fromCharCode(10) +
'.progress-fill { height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); width: 0%; transition: width 0.3s; }' + String.fromCharCode(10) +
'.progress-text { text-align: center; color: #666; }' + String.fromCharCode(10) +
'.success-icon { font-size: 4em; text-align: center; margin: 20px 0; }' + String.fromCharCode(10) +
'.install-path { background: #f5f5f5; padding: 15px; border-radius: 6px; font-family: monospace; word-break: break-all; margin: 20px 0; }' + String.fromCharCode(10) +
'</style>' + String.fromCharCode(10) +
'</head>' + String.fromCharCode(10) +
'<body>' + String.fromCharCode(10) +
'<div class="container">' + String.fromCharCode(10) +
'<div class="header"><h1>📦 ' + (appName || "Package").replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</h1><p class="subtitle">Installation Wizard</p></div>' + String.fromCharCode(10) +
'<div class="content">' + String.fromCharCode(10) +
'<div id="welcome-step" class="step active"><h2>Welcome</h2><p>This wizard will guide you through the installation process.</p><p><strong>Application:</strong> ' + (appName || "Package").replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</p><p><strong>Package Size:</strong> <span id="packageSize">' + formatBytes(embeddedArchiveSize) + '</span></p><button class="btn btn-primary" id="welcomeNextBtn" onclick="nextStep()" style="cursor: pointer; opacity: 1;">Next →</button></div>' + String.fromCharCode(10) +
'<div id="directory-step" class="step"><h2>Choose Installation Location</h2><p>Select the folder where you want to install the files:</p><div class="input-group"><input type="text" id="installPath" class="path-input" placeholder="Select installation directory..." readonly><button class="btn btn-primary" id="browseBtn" onclick="selectFolder()">Browse</button></div><div class="button-group"><button class="btn btn-secondary" id="dirBackBtn" onclick="prevStep()">← Back</button><button class="btn btn-primary" id="nextBtn" onclick="nextStep()" disabled>Next →</button></div></div>' + String.fromCharCode(10) +
'<div id="installing-step" class="step"><h2>Installing</h2><p>Please wait while files are being extracted...</p><div class="progress-container"><div class="progress-bar"><div id="progressFill" class="progress-fill"></div></div><p id="progressText" class="progress-text">Preparing...</p></div></div>' + String.fromCharCode(10) +
'<div id="complete-step" class="step"><h2>Installation Complete!</h2><div class="success-icon">✅</div><p>Files have been successfully extracted to:</p><p class="install-path" id="finalPath"></p><button class="btn btn-success" onclick="openFolder()">Open Installation Folder</button><button class="btn btn-primary" onclick="closeInstaller()">Finish</button></div>' + String.fromCharCode(10) +
'<div id="error-step" class="step"><h2>Installation Failed</h2><div class="success-icon">❌</div><p id="errorMessage"></p><button class="btn btn-primary" onclick="showStep(1)">Try Again</button></div>' + String.fromCharCode(10) +
'</div></div></div>' + String.fromCharCode(10) +
'<script>' + String.fromCharCode(10) +
'window.onerror = function(msg, url, line) {' + String.fromCharCode(10) +
'  return true;' + String.fromCharCode(10) +
'};' + String.fromCharCode(10) +
'var currentStep = 0;' + String.fromCharCode(10) +
'var selectedPath = null;' + String.fromCharCode(10) +
'var finalExtractionPath = null;' + String.fromCharCode(10) +
'var archiveSize = ' + embeddedArchiveSize + ';' + String.fromCharCode(10) +
'var commFile = (function() {' + String.fromCharCode(10) +
'  try {' + String.fromCharCode(10) +
'    var fso = new ActiveXObject("Scripting.FileSystemObject");' + String.fromCharCode(10) +
'    var shell = new ActiveXObject("WScript.Shell");' + String.fromCharCode(10) +
'    var tmp = shell.ExpandEnvironmentStrings("%TEMP%");' + String.fromCharCode(10) +
'    if (!tmp || tmp === "%TEMP%") {' + String.fromCharCode(10) +
'      tmp = fso.GetSpecialFolder(2);' + String.fromCharCode(10) +
'    }' + String.fromCharCode(10) +
'    if (!tmp) {' + String.fromCharCode(10) +
'      tmp = "C:\\\\Windows\\\\Temp";' + String.fromCharCode(10) +
'    }' + String.fromCharCode(10) +
'    var bs = String.fromCharCode(92);' + String.fromCharCode(10) +
'    var result;' + String.fromCharCode(10) +
'    if (tmp.charAt(tmp.length - 1) === bs) {' + String.fromCharCode(10) +
'      result = tmp + "installer-comm.json";' + String.fromCharCode(10) +
'    } else {' + String.fromCharCode(10) +
'      result = tmp + bs + "installer-comm.json";' + String.fromCharCode(10) +
'    }' + String.fromCharCode(10) +
'    return result;' + String.fromCharCode(10) +
'  } catch (e) {' + String.fromCharCode(10) +
'    return "C:\\\\Windows\\\\Temp\\\\installer-comm.json";' + String.fromCharCode(10) +
'  }' + String.fromCharCode(10) +
'})();' + String.fromCharCode(10) +
'function formatBytes(bytes) {' + String.fromCharCode(10) +
'  if (bytes === 0) return "0 Bytes";' + String.fromCharCode(10) +
'  var k = 1024;' + String.fromCharCode(10) +
'  var sizes = ["Bytes", "KB", "MB", "GB"];' + String.fromCharCode(10) +
'  var i = Math.floor(Math.log(bytes) / Math.log(k));' + String.fromCharCode(10) +
'  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];' + String.fromCharCode(10) +
'}' + String.fromCharCode(10) +
'function showStep(stepIndex) {' + String.fromCharCode(10) +
'  try {' + String.fromCharCode(10) +
'    var steps = ["welcome-step", "directory-step", "installing-step", "complete-step", "error-step"];' + String.fromCharCode(10) +
'    for (var i = 0; i < steps.length; i++) {' + String.fromCharCode(10) +
'      var el = document.getElementById(steps[i]);' + String.fromCharCode(10) +
'      if (el) {' + String.fromCharCode(10) +
'        if (i === stepIndex) {' + String.fromCharCode(10) +
'          el.className = "step active";' + String.fromCharCode(10) +
'          el.style.display = "block";' + String.fromCharCode(10) +
'        } else {' + String.fromCharCode(10) +
'          el.className = "step";' + String.fromCharCode(10) +
'          el.style.display = "none";' + String.fromCharCode(10) +
'        }' + String.fromCharCode(10) +
'      }' + String.fromCharCode(10) +
'    }' + String.fromCharCode(10) +
'    currentStep = stepIndex;' + String.fromCharCode(10) +
'  } catch (e) {' + String.fromCharCode(10) +
'    alert("Error showing step: " + e.message);' + String.fromCharCode(10) +
'  }' + String.fromCharCode(10) +
'}' + String.fromCharCode(10) +
'function nextStep() {' + String.fromCharCode(10) +
'  try {' + String.fromCharCode(10) +
'    if (currentStep === 0) {' + String.fromCharCode(10) +
'      showStep(1);' + String.fromCharCode(10) +
'    } else if (currentStep === 1) {' + String.fromCharCode(10) +
'      if (!selectedPath) {' + String.fromCharCode(10) +
'        alert("Please select an installation directory first.");' + String.fromCharCode(10) +
'        return;' + String.fromCharCode(10) +
'      }' + String.fromCharCode(10) +
'      startExtraction();' + String.fromCharCode(10) +
'    } else {' + String.fromCharCode(10) +
'      showStep(currentStep + 1);' + String.fromCharCode(10) +
'    }' + String.fromCharCode(10) +
'  } catch (e) {' + String.fromCharCode(10) +
'    alert("Error in nextStep: " + e.message + "\\nStack: " + (e.stack || "no stack"));' + String.fromCharCode(10) +
'  }' + String.fromCharCode(10) +
'}' + String.fromCharCode(10) +
'function prevStep() {' + String.fromCharCode(10) +
'  if (currentStep > 0) showStep(currentStep - 1);' + String.fromCharCode(10) +
'}' + String.fromCharCode(10) +
'function selectFolder() {' + String.fromCharCode(10) +
'  var shell = new ActiveXObject("Shell.Application");' + String.fromCharCode(10) +
'  var folder = shell.BrowseForFolder(0, "Select installation directory:", 0);' + String.fromCharCode(10) +
'  if (folder) {' + String.fromCharCode(10) +
'    selectedPath = folder.Self.Path;' + String.fromCharCode(10) +
'    var pathEl = document.getElementById("installPath");' + String.fromCharCode(10) +
'    var btnEl = document.getElementById("nextBtn");' + String.fromCharCode(10) +
'    if (pathEl) pathEl.value = selectedPath;' + String.fromCharCode(10) +
'    if (btnEl) btnEl.disabled = false;' + String.fromCharCode(10) +
'  }' + String.fromCharCode(10) +
'}' + String.fromCharCode(10) +
'function startExtraction() {' + String.fromCharCode(10) +
'  try {' + String.fromCharCode(10) +
'    if (!selectedPath) {' + String.fromCharCode(10) +
'      alert("No folder selected!");' + String.fromCharCode(10) +
'      return;' + String.fromCharCode(10) +
'    }' + String.fromCharCode(10) +
'    if (!commFile || commFile === "undefined") {' + String.fromCharCode(10) +
'      alert("Communication file path is undefined!");' + String.fromCharCode(10) +
'      return;' + String.fromCharCode(10) +
'    }' + String.fromCharCode(10) +
'    showStep(2);' + String.fromCharCode(10) +
'    updateProgress(10, "Starting extraction...");' + String.fromCharCode(10) +
'    var fso = new ActiveXObject("Scripting.FileSystemObject");' + String.fromCharCode(10) +
'    var data = "EXTRACT|" + selectedPath;' + String.fromCharCode(10) +
'    var folder = fso.GetParentFolderName(commFile);' + String.fromCharCode(10) +
'    if (!fso.FolderExists(folder)) {' + String.fromCharCode(10) +
'      fso.CreateFolder(folder);' + String.fromCharCode(10) +
'    }' + String.fromCharCode(10) +
'    var file = fso.CreateTextFile(commFile, true);' + String.fromCharCode(10) +
'    file.Write(data);' + String.fromCharCode(10) +
'    file.Close();' + String.fromCharCode(10) +
'    updateProgress(20, "Extraction request sent to: " + commFile);' + String.fromCharCode(10) +
'  } catch (e) {' + String.fromCharCode(10) +
'    alert("Error writing to communication file: " + e.message + "\\nFile: " + (commFile || "undefined"));' + String.fromCharCode(10) +
'    updateProgress(0, "Error: " + e.message);' + String.fromCharCode(10) +
'  }' + String.fromCharCode(10) +
'}' + String.fromCharCode(10) +
'function updateProgress(percentage, text) {' + String.fromCharCode(10) +
'  var fillEl = document.getElementById("progressFill");' + String.fromCharCode(10) +
'  var textEl = document.getElementById("progressText");' + String.fromCharCode(10) +
'  if (fillEl) fillEl.style.width = percentage + "%";' + String.fromCharCode(10) +
'  if (textEl) textEl.textContent = text;' + String.fromCharCode(10) +
'}' + String.fromCharCode(10) +
'function checkExtractionStatus() {' + String.fromCharCode(10) +
'  try {' + String.fromCharCode(10) +
'    var fso = new ActiveXObject("Scripting.FileSystemObject");' + String.fromCharCode(10) +
'    if (fso.FileExists(commFile)) {' + String.fromCharCode(10) +
'      var file = fso.OpenTextFile(commFile, 1);' + String.fromCharCode(10) +
'      var content = file.ReadAll();' + String.fromCharCode(10) +
'      file.Close();' + String.fromCharCode(10) +
'      if (content.indexOf("EXTRACT|") === 0) {' + String.fromCharCode(10) +
'        updateProgress(30, "Extraction in progress...");' + String.fromCharCode(10) +
'        return;' + String.fromCharCode(10) +
'      }' + String.fromCharCode(10) +
'      if (content.indexOf("EXTRACT|") === 0) {' + String.fromCharCode(10) +
'        updateProgress(30, "Extraction in progress...");' + String.fromCharCode(10) +
'        return;' + String.fromCharCode(10) +
'      }' + String.fromCharCode(10) +
'      if (content.indexOf("COMPLETE|") === 0) {' + String.fromCharCode(10) +
'        var parts = content.split("|");' + String.fromCharCode(10) +
'        if (parts.length >= 3 && parts[2] === "SUCCESS") {' + String.fromCharCode(10) +
'          updateProgress(100, "Complete!");' + String.fromCharCode(10) +
'          finalExtractionPath = parts[1];' + String.fromCharCode(10) +
'          setTimeout(function() {' + String.fromCharCode(10) +
'            var pathEl = document.getElementById("finalPath");' + String.fromCharCode(10) +
'            if (pathEl) pathEl.textContent = finalExtractionPath;' + String.fromCharCode(10) +
'            showStep(3);' + String.fromCharCode(10) +
'          }, 500);' + String.fromCharCode(10) +
'        } else {' + String.fromCharCode(10) +
'          var errorEl = document.getElementById("errorMessage");' + String.fromCharCode(10) +
'          if (errorEl) errorEl.textContent = parts.length > 3 ? parts[3] : "Unknown error";' + String.fromCharCode(10) +
'          showStep(4);' + String.fromCharCode(10) +
'        }' + String.fromCharCode(10) +
'      } else if (content.indexOf("CLOSE") === 0) {' + String.fromCharCode(10) +
'        window.close();' + String.fromCharCode(10) +
'      }' + String.fromCharCode(10) +
'  }' + String.fromCharCode(10) +
'  } catch (e) {' + String.fromCharCode(10) +
'    // Silently handle errors' + String.fromCharCode(10) +
'  }' + String.fromCharCode(10) +
'}' + String.fromCharCode(10) +
'function openFolder() {' + String.fromCharCode(10) +
'  if (finalExtractionPath) {' + String.fromCharCode(10) +
'    var shell = new ActiveXObject("WScript.Shell");' + String.fromCharCode(10) +
'    shell.Run("explorer " + finalExtractionPath);' + String.fromCharCode(10) +
'  }' + String.fromCharCode(10) +
'}' + String.fromCharCode(10) +
'function closeInstaller() {' + String.fromCharCode(10) +
'  var fso = new ActiveXObject("Scripting.FileSystemObject");' + String.fromCharCode(10) +
'  var file = fso.CreateTextFile(commFile, true);' + String.fromCharCode(10) +
'  file.Write("CLOSE");' + String.fromCharCode(10) +
'  file.Close();' + String.fromCharCode(10) +
'  window.close();' + String.fromCharCode(10) +
'}' + String.fromCharCode(10) +
'function initGUI() {' + String.fromCharCode(10) +
'  try {' + String.fromCharCode(10) +
'    showStep(0);' + String.fromCharCode(10) +
'    setInterval(checkExtractionStatus, 500);' + String.fromCharCode(10) +
'  } catch (e) {' + String.fromCharCode(10) +
'    alert("Error initializing GUI: " + e.message);' + String.fromCharCode(10) +
'  }' + String.fromCharCode(10) +
'}' + String.fromCharCode(10) +
'setTimeout(function() {' + String.fromCharCode(10) +
'  try {' + String.fromCharCode(10) +
'    initGUI();' + String.fromCharCode(10) +
'  } catch (e) {' + String.fromCharCode(10) +
'    // Silently handle errors' + String.fromCharCode(10) +
'  }' + String.fromCharCode(10) +
'}, 100);' + String.fromCharCode(10) +
'</script>' + String.fromCharCode(10) +
'</body></html>';
}

// Validate critical data exists before starting
// Note: We check if the archive data looks valid (starts with base64 characters) instead of checking for placeholder
// This avoids pkg including the original template file due to string matching
try {
  const isEmpty = !embeddedArchiveBase64 || embeddedArchiveBase64.length === 0;
  // Check if archive data looks like base64 (starts with valid base64 chars, not placeholder text)
  const looksLikePlaceholder = embeddedArchiveBase64 && (
    embeddedArchiveBase64.indexOf('ARCHIVE_BASE64') !== -1 ||
    embeddedArchiveBase64.indexOf('{{') !== -1 ||
    embeddedArchiveBase64.length < 10
  );
  
  if (looksLikePlaceholder && embeddedArchiveSize > 0) {
    const errorMsg = 'ERROR: Archive data placeholder was not replaced during packaging!';
    try {
      fs.writeFileSync(path.join(os.tmpdir(), 'installer-error.txt'), errorMsg + String.fromCharCode(10) + 'This is a packaging error - the archive was not embedded.');
    } catch (e) {}
    console.error(errorMsg);
    // Don't exit - allow GUI to show so user can see the issue
  } else if (isEmpty && embeddedArchiveSize > 0) {
    // Archive size > 0 but base64 is empty - this is an error
    const errorMsg = 'ERROR: Archive data is missing even though archive size is ' + embeddedArchiveSize + ' bytes!';
    try {
      fs.writeFileSync(path.join(os.tmpdir(), 'installer-error.txt'), errorMsg);
    } catch (e) {}
    console.error(errorMsg);
  } else if (isEmpty && embeddedArchiveSize === 0) {
    // Both are 0 - archive is intentionally empty
    console.log('Note: Archive is empty (0 bytes). This installer contains no files to extract.');
  }
} catch (validationError) {
  console.warn('Validation warning:', validationError.message);
  // Don't exit on validation warning - let GUI show
}

// Allocate console window immediately on Windows  
if (typeof process !== 'undefined' && process.platform === 'win32') {
  try {
    require('child_process').execSync('cmd /c title Installer', { stdio: 'ignore', timeout: 1000 });
  } catch (e) {}
}

// Start the installer with native GUI window (mshta.exe)
(async () => {
  try {
    if (process.platform !== 'win32') {
      console.log('Native GUI is only supported on Windows. Using console interface.');
      // Fallback to console on non-Windows
      const extractPath = selectFolderNative();
      if (extractPath) {
        const result = await extractFiles(extractPath);
        if (result.success) {
          console.log('Installation complete! Files extracted to: ' + result.extractionPath);
        } else {
          console.error('Installation failed: ' + result.error);
          process.exit(1);
        }
      }
      process.exit(0);
    }
    
    // Create GUI window using mshta.exe (Windows HTML Application)
    // mshta.exe creates a native window (not a browser) that displays HTML/HTA content
    const htmlContent = generateGUIHTML();
    const tempHtmlFile = path.join(os.tmpdir(), 'installer-gui-' + Date.now() + '.hta');
    // Write with BOM to ensure proper encoding for HTA
    const BOM = '\uFEFF';
    fs.writeFileSync(tempHtmlFile, BOM + htmlContent, 'utf8');
    
    // Use mshta.exe to display HTA in a native window
    // Note: .hta extension is more appropriate for HTA applications
    const mshtaProcess = spawn('mshta.exe', [tempHtmlFile], {
      detached: true,
      stdio: 'ignore',
      windowsVerbatimArguments: false
    });
    
    // Unref the process so Node.js can exit when GUI closes
    mshtaProcess.unref();
    
    // Clean up HTML file when process exits
    mshtaProcess.on('exit', () => {
      try {
        if (fs.existsSync(tempHtmlFile)) {
          fs.unlinkSync(tempHtmlFile);
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      process.exit(0);
    });
    
    // Set up file-based communication for extraction
    const commFile = path.join(os.tmpdir(), 'installer-comm.json');
    
    // Ensure the file doesn't exist initially
    try {
      if (fs.existsSync(commFile)) {
        fs.unlinkSync(commFile);
      }
    } catch (e) {
      // Ignore
    }
    
    console.log('Waiting for extraction request...');
    console.log('Communication file:', commFile);
    
    // Poll for extraction request from GUI
    let pollCount = 0;
    const checkInterval = setInterval(() => {
      pollCount++;
      if (pollCount % 20 === 0) {
        console.log('Still waiting... (polled', pollCount, 'times)');
      }
      try {
        if (fs.existsSync(commFile)) {
          const content = fs.readFileSync(commFile, 'utf8').trim();
          
          if (content.indexOf('EXTRACT|') === 0) {
            const parts = content.split('|');
            if (parts.length >= 2) {
              clearInterval(checkInterval);
              const extractPath = parts[1];
              
              extractFiles(extractPath).then(result => {
                if (result.success) {
                  fs.writeFileSync(commFile, 'COMPLETE|' + result.extractionPath + '|SUCCESS', 'utf8');
                } else {
                  fs.writeFileSync(commFile, 'COMPLETE||FAIL|' + result.error, 'utf8');
                  setTimeout(() => process.exit(1), 2000);
                }
              }).catch(err => {
                fs.writeFileSync(commFile, 'COMPLETE||FAIL|' + err.message, 'utf8');
                setTimeout(() => process.exit(1), 2000);
              });
            }
          } else if (content === 'CLOSE') {
            clearInterval(checkInterval);
            try { fs.unlinkSync(commFile); } catch (e) {}
            try { fs.unlinkSync(tempHtmlFile); } catch (e) {}
            process.exit(0);
          }
        }
      } catch (e) {
        // Ignore read errors
      }
    }, 500);
    
    // Timeout after 10 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      try { fs.unlinkSync(commFile); } catch (e) {}
      try { fs.unlinkSync(tempHtmlFile); } catch (e) {}
      process.exit(0);
    }, 600000);
    
  } catch (error) {
    console.error(String.fromCharCode(10) + '❌ Failed to start installer:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    showErrorBox('Installer Error', 'An error occurred:' + String.fromCharCode(10) + String.fromCharCode(10) + error.message);
    
    setTimeout(() => {
      process.exit(1);
    }, 2000);
  }
})();
`;

module.exports = GUI_TEMPLATE;

