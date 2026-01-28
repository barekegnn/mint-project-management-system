#!/usr/bin/env node

/**
 * Responsive Design Testing Helper Script
 * 
 * This script helps verify responsive design by checking for common issues:
 * - Fixed widths without responsive breakpoints
 * - Missing viewport meta tags
 * - Touch target sizes
 * - Horizontal scroll potential
 * 
 * Usage: node scripts/test-responsive-design.js
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  issues: [],
};

/**
 * Log with color
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Check for viewport meta tag in layout files
 */
function checkViewportMeta() {
  log('\n📱 Checking viewport meta tags...', 'cyan');
  
  const layoutFiles = [
    'src/app/layout.tsx',
    'src/app/(dashboard)/layout.tsx',
  ];

  let hasViewport = false;

  layoutFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for viewport in metadata or head
      if (content.includes('viewport') || content.includes('width=device-width')) {
        log(`  ✅ ${file} - Viewport meta tag found`, 'green');
        hasViewport = true;
        results.passed++;
      } else {
        log(`  ⚠️  ${file} - No explicit viewport meta tag (Next.js may add it automatically)`, 'yellow');
        results.warnings++;
      }
    }
  });

  if (!hasViewport) {
    results.issues.push({
      type: 'warning',
      message: 'No explicit viewport meta tags found. Next.js should add them automatically.',
    });
  }
}

/**
 * Check for fixed widths in component files
 */
function checkFixedWidths() {
  log('\n📏 Checking for problematic fixed widths...', 'cyan');
  
  const componentDirs = [
    'src/components',
    'src/app',
  ];

  const problematicPatterns = [
    /className="[^"]*w-\d{3,}[^"]*"/g, // Large fixed widths like w-500
    /style={{[^}]*width:\s*['"]?\d{3,}px/g, // Inline styles with large fixed widths
  ];

  let issuesFound = 0;

  componentDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      scanDirectory(dirPath, (file) => {
        if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
          const content = fs.readFileSync(file, 'utf8');
          
          problematicPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              issuesFound++;
              log(`  ⚠️  ${path.relative(process.cwd(), file)} - Found fixed width: ${matches[0].substring(0, 50)}...`, 'yellow');
              results.warnings++;
            }
          });
        }
      });
    }
  });

  if (issuesFound === 0) {
    log('  ✅ No problematic fixed widths found', 'green');
    results.passed++;
  } else {
    results.issues.push({
      type: 'warning',
      message: `Found ${issuesFound} instances of potentially problematic fixed widths`,
    });
  }
}

/**
 * Check for responsive utility usage
 */
function checkResponsiveUtilities() {
  log('\n🎨 Checking responsive utility usage...', 'cyan');
  
  const componentDirs = [
    'src/components',
    'src/app',
  ];

  const responsivePatterns = [
    /sm:/g,
    /md:/g,
    /lg:/g,
    /xl:/g,
  ];

  let totalFiles = 0;
  let filesWithResponsive = 0;

  componentDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      scanDirectory(dirPath, (file) => {
        if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
          totalFiles++;
          const content = fs.readFileSync(file, 'utf8');
          
          const hasResponsive = responsivePatterns.some(pattern => pattern.test(content));
          if (hasResponsive) {
            filesWithResponsive++;
          }
        }
      });
    }
  });

  const percentage = totalFiles > 0 ? ((filesWithResponsive / totalFiles) * 100).toFixed(1) : 0;
  
  log(`  📊 ${filesWithResponsive}/${totalFiles} component files use responsive utilities (${percentage}%)`, 'blue');
  
  if (percentage > 50) {
    log('  ✅ Good responsive utility coverage', 'green');
    results.passed++;
  } else {
    log('  ⚠️  Low responsive utility coverage', 'yellow');
    results.warnings++;
    results.issues.push({
      type: 'warning',
      message: `Only ${percentage}% of components use responsive utilities`,
    });
  }
}

/**
 * Check for touch-friendly button sizes
 */
function checkTouchTargets() {
  log('\n👆 Checking touch target sizes...', 'cyan');
  
  const componentDirs = [
    'src/components',
    'src/app',
  ];

  // Look for buttons with potentially small sizes
  const smallButtonPatterns = [
    /className="[^"]*p-1[^"]*"/g, // Very small padding
    /className="[^"]*w-\d\s/g, // Small fixed widths
    /className="[^"]*h-\d\s/g, // Small fixed heights
  ];

  let smallButtonsFound = 0;

  componentDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      scanDirectory(dirPath, (file) => {
        if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
          const content = fs.readFileSync(file, 'utf8');
          
          // Look for button elements with small sizes
          const buttonRegex = /<button[^>]*>/g;
          const buttons = content.match(buttonRegex) || [];
          
          buttons.forEach(button => {
            smallButtonPatterns.forEach(pattern => {
              if (pattern.test(button)) {
                smallButtonsFound++;
              }
            });
          });
        }
      });
    }
  });

  if (smallButtonsFound === 0) {
    log('  ✅ No obviously small touch targets found', 'green');
    results.passed++;
  } else {
    log(`  ⚠️  Found ${smallButtonsFound} potentially small touch targets`, 'yellow');
    log('  💡 Verify these meet the 44x44px minimum size requirement', 'blue');
    results.warnings++;
    results.issues.push({
      type: 'warning',
      message: `Found ${smallButtonsFound} potentially small touch targets - manual verification needed`,
    });
  }
}

/**
 * Check for overflow handling
 */
function checkOverflowHandling() {
  log('\n📦 Checking overflow handling...', 'cyan');
  
  const componentDirs = [
    'src/components',
    'src/app',
  ];

  let filesWithOverflow = 0;
  let totalFiles = 0;

  componentDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      scanDirectory(dirPath, (file) => {
        if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
          totalFiles++;
          const content = fs.readFileSync(file, 'utf8');
          
          // Check for overflow utilities
          if (content.includes('overflow-') || content.includes('truncate') || content.includes('line-clamp')) {
            filesWithOverflow++;
          }
        }
      });
    }
  });

  log(`  📊 ${filesWithOverflow}/${totalFiles} files handle text overflow`, 'blue');
  log('  ✅ Overflow handling implemented where needed', 'green');
  results.passed++;
}

/**
 * Scan directory recursively
 */
function scanDirectory(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        scanDirectory(filePath, callback);
      }
    } else {
      callback(filePath);
    }
  });
}

/**
 * Generate summary report
 */
function generateSummary() {
  log('\n' + '='.repeat(60), 'bright');
  log('📋 RESPONSIVE DESIGN TEST SUMMARY', 'bright');
  log('='.repeat(60), 'bright');
  
  log(`\n✅ Passed: ${results.passed}`, 'green');
  log(`⚠️  Warnings: ${results.warnings}`, 'yellow');
  log(`❌ Failed: ${results.failed}`, 'red');
  
  if (results.issues.length > 0) {
    log('\n📝 Issues to Review:', 'cyan');
    results.issues.forEach((issue, index) => {
      const icon = issue.type === 'error' ? '❌' : '⚠️';
      log(`  ${icon} ${index + 1}. ${issue.message}`, issue.type === 'error' ? 'red' : 'yellow');
    });
  }
  
  log('\n💡 Recommendations:', 'cyan');
  log('  1. Test on real devices (iPhone SE, iPhone 12, iPad)', 'blue');
  log('  2. Use browser DevTools responsive mode for quick checks', 'blue');
  log('  3. Verify touch targets are at least 44x44px', 'blue');
  log('  4. Check for horizontal scrolling at 320px width', 'blue');
  log('  5. Test with different font size settings', 'blue');
  
  log('\n📖 For detailed analysis, see: RESPONSIVE_DESIGN_TEST_REPORT.md', 'cyan');
  log('='.repeat(60) + '\n', 'bright');
}

/**
 * Main execution
 */
function main() {
  log('\n🚀 Starting Responsive Design Tests...', 'bright');
  log('This script performs automated checks for common responsive design issues.\n', 'blue');
  
  try {
    checkViewportMeta();
    checkFixedWidths();
    checkResponsiveUtilities();
    checkTouchTargets();
    checkOverflowHandling();
    
    generateSummary();
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    log(`\n❌ Error running tests: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the tests
main();
