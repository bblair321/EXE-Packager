#!/usr/bin/env node

/**
 * Launcher API for the File Packer
 * This module provides a simple API for integrating the file packer into a launcher application
 */

const FilePacker = require("./scripts/pack-files.js");
const fs = require("fs");
const path = require("path");
const os = require("os");

class LauncherPacker {
  constructor(configPath = null) {
    this.packer = new FilePacker();
    this.gamePathsConfig = this.loadGamePathsConfig(configPath);
  }

  /**
   * Load game paths configuration from file
   * @param {string|null} configPath - Path to game-paths.json, or null for default
   * @returns {Object} - Game paths configuration
   */
  loadGamePathsConfig(configPath) {
    const defaultPath = path.join(__dirname, "configs", "game-paths.json");
    const configFile = configPath || defaultPath;

    try {
      if (fs.existsSync(configFile)) {
        const config = JSON.parse(fs.readFileSync(configFile, "utf8"));
        return this.expandPaths(config);
      }
    } catch (error) {
      console.warn(`Warning: Could not load game paths config: ${error.message}`);
    }

    // Return default empty config
    return {
      steam: { games: {} },
      epic: { games: {} },
      gog: { games: {} },
      custom: { games: {} },
      commonLocations: []
    };
  }

  /**
   * Expand environment variables in paths (e.g., %USERPROFILE%)
   * @param {Object} config - Configuration object
   * @returns {Object} - Configuration with expanded paths
   */
  expandPaths(config) {
    const userProfile = os.homedir();
    const expanded = JSON.parse(JSON.stringify(config)); // Deep clone

    const expandString = (str) => {
      if (typeof str !== "string") return str;
      return str.replace(/%USERPROFILE%/g, userProfile);
    };

    // Expand Steam games
    if (expanded.steam && expanded.steam.games) {
      for (const [game, gamePath] of Object.entries(expanded.steam.games)) {
        expanded.steam.games[game] = expandString(gamePath);
      }
    }

    // Expand Epic games
    if (expanded.epic && expanded.epic.games) {
      for (const [game, gamePath] of Object.entries(expanded.epic.games)) {
        expanded.epic.games[game] = expandString(gamePath);
      }
    }

    // Expand GOG games
    if (expanded.gog && expanded.gog.games) {
      for (const [game, gamePath] of Object.entries(expanded.gog.games)) {
        expanded.gog.games[game] = expandString(gamePath);
      }
    }

    // Expand custom games
    if (expanded.custom && expanded.custom.games) {
      for (const [game, gamePath] of Object.entries(expanded.custom.games)) {
        expanded.custom.games[game] = expandString(gamePath);
      }
    }

    // Expand common locations
    if (expanded.commonLocations) {
      expanded.commonLocations = expanded.commonLocations.map(expandString);
    }

    return expanded;
  }

  /**
   * Create a silent installer for launcher integration
   * @param {Object} options - Packing options
   * @param {Array} options.files - Array of file paths to include
   * @param {Array} options.folders - Array of folder paths to include
   * @param {string} options.outputName - Name for the output executable
   * @param {string} options.appName - Display name for the application
   * @param {string} options.extractPath - Path where files should be extracted (optional)
   * @returns {Promise<Object>} - Result object with executable path and metadata
   */
  async createSilentInstaller(options = {}) {
    const {
      files = [],
      folders = [],
      outputName,
      appName = "Mod Installer",
      extractPath = null,
    } = options;

    if (!outputName) {
      throw new Error("outputName is required");
    }

    try {
      const result = await this.packer.packFilesSilent(
        files,
        folders,
        outputName,
        extractPath
      );

      return {
        success: true,
        executable: result.executable,
        batchWrapper: result.batchWrapper,
        archive: result.archive,
        size: result.size,
        message: "Silent installer created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Failed to create silent installer",
      };
    }
  }

  /**
   * Create a regular installer (with user interaction)
   * @param {Object} options - Packing options
   * @returns {Promise<Object>} - Result object
   */
  async createInstaller(options = {}) {
    const {
      files = [],
      folders = [],
      outputName,
      appName = "Mod Installer",
    } = options;

    if (!outputName) {
      throw new Error("outputName is required");
    }

    try {
      const result = await this.packer.packFiles({
        files,
        folders,
        outputName,
        config: {
          appName,
          silentMode: false,
        },
      });

      return {
        success: true,
        executable: result.executable,
        batchWrapper: result.batchWrapper,
        archive: result.archive,
        size: result.size,
        message: "Installer created successfully",
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: "Failed to create installer",
      };
    }
  }

  /**
   * Get common game installation paths for auto-detection
   * Loads from config file for universal support
   * @returns {Object} - Object with common game paths organized by platform
   */
  getCommonGamePaths() {
    return {
      steam: this.gamePathsConfig.steam?.games || {},
      epic: this.gamePathsConfig.epic?.games || {},
      gog: this.gamePathsConfig.gog?.games || {},
      custom: this.gamePathsConfig.custom?.games || {},
      commonLocations: this.gamePathsConfig.commonLocations || []
    };
  }

  /**
   * Add a custom game path to the configuration
   * @param {string} gameName - Name of the game
   * @param {string} gamePath - Path to the game installation
   * @param {string} platform - Platform name (steam, epic, gog, custom)
   */
  addGamePath(gameName, gamePath, platform = "custom") {
    if (!this.gamePathsConfig[platform]) {
      this.gamePathsConfig[platform] = { games: {} };
    }
    if (!this.gamePathsConfig[platform].games) {
      this.gamePathsConfig[platform].games = {};
    }
    this.gamePathsConfig[platform].games[gameName] = gamePath;
  }

  /**
   * Detect if a game is installed at common locations
   * Searches all configured platforms and custom paths
   * @param {string} gameName - Name of the game to detect (case-insensitive partial match)
   * @param {string[]} additionalPaths - Additional paths to search (optional)
   * @returns {string|null} - Path if found, null if not found
   */
  detectGamePath(gameName, additionalPaths = []) {
    const paths = this.getCommonGamePaths();
    const searchName = gameName.toLowerCase();

    // Search all platforms
    const allPlatforms = {
      ...paths.steam,
      ...paths.epic,
      ...paths.gog,
      ...paths.custom
    };

    // Check configured game paths
    for (const [game, gamePath] of Object.entries(allPlatforms)) {
      if (
        game.toLowerCase().includes(searchName) &&
        gamePath &&
        fs.existsSync(gamePath)
      ) {
        return gamePath;
      }
    }

    // Check additional paths
    for (const additionalPath of additionalPaths) {
      if (fs.existsSync(additionalPath)) {
        return additionalPath;
      }
    }

    // Check common locations for game folders
    const commonLocations = paths.commonLocations || [];
    for (const location of commonLocations) {
      if (fs.existsSync(location)) {
        try {
          const entries = fs.readdirSync(location);
          for (const entry of entries) {
            if (entry.toLowerCase().includes(searchName)) {
              const fullPath = path.join(location, entry);
              if (fs.statSync(fullPath).isDirectory()) {
                return fullPath;
              }
            }
          }
        } catch (error) {
          // Skip locations we can't read
        }
      }
    }

    return null;
  }
}

module.exports = LauncherPacker;

// Example usage for launcher integration:
/*
const LauncherPacker = require('./launcher-api.js');
const packer = new LauncherPacker();

// Create a silent installer
const result = await packer.createSilentInstaller({
  files: ['mod.dll', 'config.json'],
  folders: ['mods/'],
  outputName: 'MyModInstaller',
  appName: 'My Awesome Mod',
  extractPath: 'C:\\Games\\MyGame\\Mods'
});

if (result.success) {
  console.log('Installer created:', result.executable);
  // The batch wrapper will be at result.batchWrapper
} else {
  console.error('Failed:', result.error);
}
*/
