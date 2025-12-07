#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Get all source files
function getAllFiles(dir, fileList = []) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'dist' && file !== 'coverage') {
        getAllFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Check if file is imported anywhere
function isFileImported(filePath, allFiles) {
  const fileBaseName = basename(filePath, extname(filePath));
  const relativePath = filePath.replace(projectRoot + '/', '');

  // Skip test files
  if (filePath.includes('__tests__') || filePath.includes('.test.') || filePath.includes('.spec.')) {
    return true; // Don't mark test files as unused
  }

  // Skip entry points
  if (fileBaseName === 'main' || fileBaseName === 'App' || fileBaseName === 'index') {
    return true;
  }

  // Skip config files
  if (filePath.includes('vite.config') || filePath.includes('tailwind.config') || filePath.includes('postcss.config')) {
    return true;
  }

  let importCount = 0;

  for (const otherFile of allFiles) {
    if (otherFile === filePath) continue;

    try {
      const content = readFileSync(otherFile, 'utf-8');

      // Check for various import patterns
      const patterns = [
        new RegExp(`from ['"].*/${fileBaseName}['"]`, 'g'),
        new RegExp(`from ['"].*/${fileBaseName}\\.tsx?['"]`, 'g'),
        new RegExp(`import.*${fileBaseName}.*from`, 'g'),
        new RegExp(`import\\s+${fileBaseName}\\s+from`, 'g'),
        new RegExp(`import\\s*{[^}]*${fileBaseName}[^}]*}`, 'g'),
      ];

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          importCount++;
          break;
        }
      }
    } catch (err) {
      // Skip files that can't be read
    }
  }

  return importCount > 0;
}

console.log('🔍 Scanning for unused files...\n');

const srcFiles = getAllFiles(join(projectRoot, 'src'));
const unusedFiles = [];

for (const file of srcFiles) {
  if (!isFileImported(file, srcFiles)) {
    unusedFiles.push(file.replace(projectRoot + '/', ''));
  }
}

if (unusedFiles.length === 0) {
  console.log('✅ No unused files found!');
} else {
  console.log(`❌ Found ${unusedFiles.length} potentially unused files:\n`);
  unusedFiles.forEach(file => {
    console.log(`  - ${file}`);
  });
}

console.log(`\n📊 Total files scanned: ${srcFiles.length}`);
