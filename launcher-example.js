#!/usr/bin/env node

/**
 * Example of how to integrate the file packer into your launcher
 * This shows how to use the LauncherPacker API
 */

const LauncherPacker = require("./launcher-api.js");
const path = require("path");

async function exampleUsage() {
  const packer = new LauncherPacker();

  console.log("🚀 Launcher Integration Example");
  console.log("================================\n");

  // Example 1: Create a silent installer for any game/application
  console.log("📦 Creating silent installer...");

  // First, try to detect the game path
  const gamePath = packer.detectGamePath("My Game");
  const extractPath = gamePath || "C:\\Program Files\\MyApplication";

  const installerResult = await packer.createSilentInstaller({
    files: ["config.json", "readme.txt"],
    folders: ["assets/", "data/"],
    outputName: "MyInstaller",
    appName: "My Application Installer",
    extractPath: extractPath,
  });

  if (installerResult.success) {
    console.log("✅ Silent installer created successfully!");
    console.log(`📁 Executable: ${installerResult.executable}`);
    console.log(
      `📊 Size: ${(installerResult.size / 1024 / 1024).toFixed(2)} MB\n`
    );
  } else {
    console.log("❌ Failed to create installer:", installerResult.error);
  }

  // Example 2: Auto-detect game/application paths
  console.log("🔍 Auto-detecting configured paths...");
  const gamePaths = packer.getCommonGamePaths();

  for (const [platform, games] of Object.entries(gamePaths)) {
    if (platform !== "commonLocations" && games && Object.keys(games).length > 0) {
      console.log(`\n📂 ${platform.toUpperCase()} Applications/Games:`);
      for (const [game, gamePath] of Object.entries(games)) {
        const fs = require("fs");
        const exists = gamePath && fs.existsSync(gamePath);
        console.log(
          `  ${game}: ${exists ? "✅ Found" : "❌ Not found"} ${
            exists ? `(${gamePath})` : ""
          }`
        );
      }
    }
  }

  // Example 3: Add and detect custom game/application
  console.log("\n🎮 Adding custom game...");
  packer.addGamePath("My Custom Game", "C:\\Games\\MyGame", "custom");
  
  const customGamePath = packer.detectGamePath("My Custom Game");
  if (customGamePath) {
    console.log(`✅ Found custom game at: ${customGamePath}`);
  } else {
    console.log("❌ Custom game not found");
  }

  console.log("\n✨ Example completed!");
  console.log("\n💡 For your launcher integration:");
  console.log("1. Use createSilentInstaller() for automatic installation");
  console.log("2. Use detectGamePath() to find where games/applications are installed");
  console.log("3. Add custom paths with addGamePath() for any game/application");
  console.log("4. Configure game-paths.json for universal support");
  console.log("5. Works with any game, application, or file distribution");
}

// Run the example if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

module.exports = exampleUsage;
