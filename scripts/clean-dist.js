#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const distDirs = ['dist', 'dist-gui'];

distDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  
  if (!fs.existsSync(dirPath)) {
    console.log(`Directory ${dir} does not exist, skipping...`);
    return;
  }
  
  try {
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true });
          console.log(`Deleted directory: ${path.join(dir, file)}`);
        } else {
          fs.unlinkSync(filePath);
          console.log(`Deleted file: ${path.join(dir, file)}`);
        }
      } catch (err) {
        console.error(`Error deleting ${filePath}:`, err.message);
      }
    });
    
    console.log(`✓ Cleaned ${dir}/`);
  } catch (err) {
    console.error(`Error cleaning ${dir}:`, err.message);
  }
});

console.log('\n✓ Cleanup complete!');

