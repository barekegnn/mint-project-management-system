#!/usr/bin/env node

/**
 * Code Cleanup Utility
 * 
 * Identifies commented-out code blocks and provides cleanup recommendations.
 * 
 * Usage: node scripts/cleanup-code.js
 */

const fs = require('fs');
const path = require('path');

const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  '__tests__',
];

const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

class CodeCleanup {
  constructor() {
    this.commentedCodeBlocks = [];
    this.filesScanned = 0;
  }

  shouldExclude(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
  }

  shouldScan(filePath) {
    return SCAN_EXTENSIONS.some(ext => filePath.endsWith(ext));
  }

  /**
   * Detect if a comment line looks like commented-out code
   */
  isCommentedCode(line) {
    const trimmed = line.trim();
    
    // Skip documentation comments
    if (trimmed.startsWith('/**') || trimmed.startsWith('*') || trimmed.startsWith('*/')) {
      return false;
    }
    
    // Skip single-line explanatory comments
    if (trimmed.startsWith('//') && !trimmed.includes('=') && !trimmed.includes('(')) {
      return false;
    }
    
    // Detect commented code patterns
    const codePatterns = [
      /\/\/\s*(const|let|var|function|import|export|return|if|else|for|while)/,
      /\/\/\s*\w+\s*[:=]/,
      /\/\/\s*\w+\(/,
      /\/\/\s*<\w+/,  // JSX
    ];
    
    return codePatterns.some(pattern => pattern.test(trimmed));
  }

  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      let commentBlock = [];
      let blockStart = -1;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (this.isCommentedCode(line)) {
          if (commentBlock.length === 0) {
            blockStart = i + 1;
          }
          commentBlock.push(line.trim());
        } else if (commentBlock.length > 0) {
          // End of comment block
          if (commentBlock.length >= 2) {  // Only report blocks of 2+ lines
            this.commentedCodeBlocks.push({
              file: filePath,
              startLine: blockStart,
              endLine: i,
              lines: commentBlock.length,
              preview: commentBlock.slice(0, 3).join('\n'),
            });
          }
          commentBlock = [];
        }
      }
      
      this.filesScanned++;
    } catch (error) {
      // Skip files that can't be read
    }
  }

  scanDirectory(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (this.shouldExclude(fullPath)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          this.scanDirectory(fullPath);
        } else if (entry.isFile() && this.shouldScan(fullPath)) {
          this.scanFile(fullPath);
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('🧹 CODE CLEANUP REPORT');
    console.log('='.repeat(70) + '\n');
    
    console.log(`📊 Files Scanned: ${this.filesScanned}`);
    console.log(`📝 Commented Code Blocks Found: ${this.commentedCodeBlocks.length}\n`);
    
    if (this.commentedCodeBlocks.length === 0) {
      console.log('✅ No significant commented-out code blocks found!\n');
      return;
    }
    
    console.log('📋 COMMENTED CODE BLOCKS:\n');
    
    this.commentedCodeBlocks.forEach((block, index) => {
      console.log(`${index + 1}. ${block.file}`);
      console.log(`   Lines ${block.startLine}-${block.endLine} (${block.lines} lines)`);
      console.log(`   Preview:`);
      console.log(`   ${block.preview.split('\n').join('\n   ')}`);
      console.log('');
    });
    
    console.log('='.repeat(70));
    console.log('💡 RECOMMENDATIONS:');
    console.log('='.repeat(70) + '\n');
    console.log('1. Review each commented code block');
    console.log('2. Remove blocks that are no longer needed');
    console.log('3. Uncomment and fix blocks that should be active');
    console.log('4. Use version control (git) instead of commenting out code\n');
  }
}

function main() {
  const cleanup = new CodeCleanup();
  const projectRoot = path.join(__dirname, '..');
  
  console.log('🧹 Scanning for commented-out code...\n');
  
  cleanup.scanDirectory(path.join(projectRoot, 'src'));
  cleanup.generateReport();
}

main();
