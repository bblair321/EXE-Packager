#!/usr/bin/env node

/**
 * Interactive File Packager Script
 * Prompts user for file/folder information and creates self-extracting archives
 */

const readline = require("readline");
const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

class InteractiveFilePackager {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    this.config = {
      appName: "",
      version: "1.0.0",
      outputDir: "./dist",
      includeVersion: true,
      files: [],
      folders: [],
      outputName: "",
    };
  }

  async run() {
    console.log("📦 Interactive File Packager");
    console.log("============================");
    console.log("Create self-extracting archives from loose files and folders");
    console.log("");

    try {
      await this.getBasicInfo();
      await this.getFilesAndFolders();
      await this.confirmAndPackage();
    } catch (error) {
      console.error("❌ Error:", error.message);
    } finally {
      this.rl.close();
    }
  }

  async getBasicInfo() {
    console.log("📋 Basic Information");
    console.log("===================");

    this.config.appName = await this.question("Package name: ", "MyPackage");
    this.config.version = await this.question(
      "Version (default: 1.0.0, or press Enter to skip): ",
      "1.0.0"
    );
    this.config.outputDir = "./dist"; // Always use ./dist
    this.config.includeVersion = true; // Always include version

    this.config.outputName = await this.question(
      "Output executable name: ",
      this.config.appName
    );

    console.log("");
  }

  async getFilesAndFolders() {
    console.log("📁 Mod Folder to Package");
    console.log("=========================");
    console.log("");
    console.log("Enter the path to your mod folder. Everything in this folder will be packaged.");
    console.log("Example: ./my-mod or C:\\Users\\You\\mods\\my-mod");
    console.log("");

    const modFolder = await this.question("Mod folder path: ");

    if (!modFolder.trim()) {
      throw new Error("Mod folder path is required.");
    }

    // Check if folder exists
    if (fs.existsSync(modFolder.trim()) && fs.statSync(modFolder.trim()).isDirectory()) {
      this.config.folders = [modFolder.trim()];
      this.config.files = [];
      console.log(`✅ Mod folder: ${modFolder.trim()}`);
    } else {
      throw new Error(`Folder not found: ${modFolder.trim()}`);
    }

    console.log("");
  }

  async confirmAndPackage() {
    console.log("📋 Packaging Summary");
    console.log("===================");
    console.log(`Package Name: ${this.config.appName}`);
    console.log(`Version: ${this.config.version}`);
    console.log(`Output Name: ${this.config.outputName}`);
    console.log("");

    if (this.config.folders.length > 0) {
      console.log("Mod folder to package:");
      this.config.folders.forEach((folder) => {
        console.log(`  📁 ${folder}`);
      });
      console.log("");
    }

    const confirm = await this.question("Proceed with packaging? (y/n): ");

    if (!confirm.toLowerCase().startsWith("y")) {
      console.log("❌ Packaging cancelled.");
      return;
    }

    console.log("");
    console.log("🚀 Starting file packaging process...");
    console.log("");

    await this.executePackaging();
  }

  async executePackaging() {
    try {
      // Create the command arguments for pack-files.js
      const commandArgs = [];

      // Add mod folder (simplified option)
      if (this.config.folders.length > 0) {
        commandArgs.push("--folder");
        commandArgs.push(this.config.folders[0]);
      }

      // Add other options
      if (this.config.outputName) {
        commandArgs.push("--output-name");
        commandArgs.push(this.config.outputName);
      }

      commandArgs.push("--app-name");
      commandArgs.push(this.config.appName);

      commandArgs.push("--version");
      commandArgs.push(this.config.version);

      // Create a temporary config file
      const configFile = path.join(__dirname, "temp-file-config.json");
      const configData = {
        appName: this.config.appName,
        version: this.config.version,
        outputDir: this.config.outputDir,
        includeVersion: this.config.includeVersion,
        files: this.config.files,
        folders: this.config.folders,
      };

      fs.writeFileSync(configFile, JSON.stringify(configData, null, 2));
      commandArgs.push("--config");
      commandArgs.push(configFile);

      console.log(`Running: node pack-files.js ${commandArgs.join(" ")}`);
      console.log("");

      // Execute the file packaging script
      const packFilesPath = path.join(__dirname, "pack-files.js");

      if (!fs.existsSync(packFilesPath)) {
        throw new Error(`pack-files.js not found at ${packFilesPath}`);
      }

      const result = spawn("node", [packFilesPath, ...commandArgs], {
        stdio: "inherit",
        cwd: __dirname,
      });

      result.on("close", (code) => {
        // Cleanup temp config file
        if (fs.existsSync(configFile)) {
          fs.unlinkSync(configFile);
        }

        if (code === 0) {
          console.log("");
          console.log("✅ Single-file installer created successfully!");
          console.log(
            `📁 Check the ${this.config.outputDir} folder for your installer.`
          );
          console.log("");
          console.log("🎯 The installer is a single .exe file with everything embedded!");
          console.log("How users will use it:");
          console.log("1. Run the .exe file");
          console.log("2. Choose where to extract the files");
          console.log("3. All files will be extracted to their chosen directory");
        } else {
          console.log("");
          console.log(`❌ File packaging failed with exit code ${code}`);
        }
      });
    } catch (error) {
      console.error("❌ Error during file packaging:", error.message);
    }
  }

  question(prompt, defaultValue = "") {
    return new Promise((resolve) => {
      const fullPrompt = defaultValue ? `${prompt}[${defaultValue}] ` : prompt;
      this.rl.question(fullPrompt, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }
}

// Run the interactive file packager
if (require.main === module) {
  const packager = new InteractiveFilePackager();
  packager.run().catch(console.error);
}

module.exports = InteractiveFilePackager;
