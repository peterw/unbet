#!/usr/bin/env node
/* eslint-env node */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Files that trigger a full clean when changed
const CRITICAL_FILES = [
  'package.json',
  'babel.config.js',
  'metro.config.js',
  'app.json',
  'tsconfig.json',
  'ios/Podfile',
  'ios/Podfile.lock',
];

// Check if any critical files have been modified recently
function shouldClean() {
  const lastCleanFile = path.join(__dirname, '../.last-clean');
  
  // If no last clean record, we should clean
  if (!fs.existsSync(lastCleanFile)) {
    return true;
  }
  
  const lastCleanTime = fs.statSync(lastCleanFile).mtime;
  
  // Check if any critical files were modified after last clean
  for (const file of CRITICAL_FILES) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const fileTime = fs.statSync(filePath).mtime;
      if (fileTime > lastCleanTime) {
        console.log(`🧹 ${file} was modified - triggering clean build`);
        return true;
      }
    }
  }
  
  return false;
}

function markClean() {
  const lastCleanFile = path.join(__dirname, '../.last-clean');
  fs.writeFileSync(lastCleanFile, new Date().toISOString());
}

function runClean() {
  console.log('🚀 Starting smart clean...');
  
  try {
    // Clear Metro cache
    console.log('📦 Clearing Metro cache...');
    execSync('rm -rf node_modules/.cache/metro && rm -rf .expo', { stdio: 'inherit' });
    
    // Clear Watchman
    console.log('👁️  Clearing Watchman...');
    execSync('watchman watch-del-all 2>/dev/null || true', { stdio: 'inherit' });
    
    // Clear iOS build artifacts
    if (process.platform === 'darwin') {
      console.log('🍎 Clearing iOS build artifacts...');
      execSync('cd ios && rm -rf build Pods && cd ..', { stdio: 'inherit' });
      
      // Only clear DerivedData if really needed
      if (process.env.FULL_CLEAN === 'true') {
        console.log('🗑️  Clearing Xcode DerivedData...');
        execSync('rm -rf ~/Library/Developer/Xcode/DerivedData/*', { stdio: 'inherit' });
      }
    }
    
    markClean();
    console.log('✅ Clean complete!');
  } catch (error) {
    console.error('❌ Clean failed:', error.message);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  if (process.argv.includes('--force') || shouldClean()) {
    runClean();
  } else {
    console.log('✨ No critical changes detected - skipping clean');
  }
}

module.exports = { shouldClean, runClean };