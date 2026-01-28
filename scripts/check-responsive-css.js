/**
 * Check Responsive CSS Patterns
 * 
 * This script analyzes CSS and component files to identify potential
 * responsive design issues without requiring a browser.
 * 
 * Requirements: US-8.6
 */

const fs = require('fs');
const path = require('path');

/**
 * Simple glob implementation using fs
 */
function findFiles(dir, extensions, results = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    // Skip node_modules, .next, dist
    if (file.isDirectory()) {
      if (!['node_modules', '.next', 'dist', '.git'].includes(file.name)) {
        findFiles(filePath, extensions, results);
      }
    } else {
      const ext = path.extname(file.name);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  }

  return results;
}

// Patterns that might cause responsive issues
const ISSUE_PATTERNS = {
  fixedWidth: {
    pattern: /width:\s*\d{4,}px/g,
    description: 'Fixed width over 1000px may cause horizontal scroll',
    severity: 'high',
  },
  fixedMinWidth: {
    pattern: /min-width:\s*\d{4,}px/g,
    description: 'Fixed min-width over 1000px may cause horizontal scroll',
    severity: 'high',
  },
  smallTouchTargets: {
    pattern: /(width|height|min-width|min-height):\s*([1-3]?\d)px/g,
    description: 'Touch target may be too small (< 44px)',
    severity: 'medium',
  },
  smallFontSize: {
    pattern: /font-size:\s*(1[0-5]|[0-9])px/g,
    description: 'Font size may be too small for mobile (< 16px)',
    severity: 'medium',
  },
  noMaxWidth: {
    pattern: /width:\s*\d+px(?!.*max-width)/g,
    description: 'Fixed width without max-width constraint',
    severity: 'low',
  },
};

// Good patterns to look for
const GOOD_PATTERNS = {
  responsiveWidth: /max-width:\s*(100%|100vw)/g,
  responsiveImage: /max-width:\s*100%/g,
  mediaQuery: /@media\s*\(/g,
  flexbox: /display:\s*flex/g,
  grid: /display:\s*grid/g,
  tailwindResponsive: /(sm:|md:|lg:|xl:|2xl:)/g,
};

class ResponsiveCSSChecker {
  constructor() {
    this.issues = [];
    this.goodPatterns = [];
    this.filesChecked = 0;
  }

  /**
   * Check a single file for responsive issues
   */
  checkFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileIssues = [];
      const fileGoodPatterns = [];

      // Check for issues
      Object.entries(ISSUE_PATTERNS).forEach(([name, config]) => {
        const matches = content.match(config.pattern);
        if (matches) {
          matches.forEach((match) => {
            fileIssues.push({
              file: filePath,
              type: name,
              match,
              description: config.description,
              severity: config.severity,
            });
          });
        }
      });

      // Check for good patterns
      Object.entries(GOOD_PATTERNS).forEach(([name, pattern]) => {
        const matches = content.match(pattern);
        if (matches) {
          fileGoodPatterns.push({
            file: filePath,
            type: name,
            count: matches.length,
          });
        }
      });

      this.issues.push(...fileIssues);
      this.goodPatterns.push(...fileGoodPatterns);
      this.filesChecked++;

      return { issues: fileIssues, goodPatterns: fileGoodPatterns };
    } catch (error) {
      console.error(`Error checking file ${filePath}:`, error.message);
      return { issues: [], goodPatterns: [] };
    }
  }

  /**
   * Check all CSS and component files
   */
  checkAllFiles() {
    console.log('🔍 Checking responsive CSS patterns...\n');

    // Find all relevant files
    const extensions = ['.css', '.tsx', '.jsx', '.ts', '.js'];
    const files = findFiles('src', extensions);

    console.log(`📁 Found ${files.length} files to check\n`);

    // Check each file
    for (const file of files) {
      this.checkFile(file);
    }

    return this.generateReport();
  }

  /**
   * Generate report
   */
  generateReport() {
    const highSeverity = this.issues.filter((i) => i.severity === 'high');
    const mediumSeverity = this.issues.filter((i) => i.severity === 'medium');
    const lowSeverity = this.issues.filter((i) => i.severity === 'low');

    const report = {
      filesChecked: this.filesChecked,
      totalIssues: this.issues.length,
      issuesBySeverity: {
        high: highSeverity.length,
        medium: mediumSeverity.length,
        low: lowSeverity.length,
      },
      issues: this.issues,
      goodPatterns: this.goodPatterns,
      summary: {
        hasMediaQueries: this.goodPatterns.some((p) => p.type === 'mediaQuery'),
        usesTailwindResponsive: this.goodPatterns.some((p) => p.type === 'tailwindResponsive'),
        usesFlexbox: this.goodPatterns.some((p) => p.type === 'flexbox'),
        usesGrid: this.goodPatterns.some((p) => p.type === 'grid'),
      },
    };

    return report;
  }

  /**
   * Print report to console
   */
  printReport(report) {
    console.log('='.repeat(80));
    console.log('📊 RESPONSIVE CSS CHECK REPORT');
    console.log('='.repeat(80));
    console.log(`\n📁 Files Checked: ${report.filesChecked}`);
    console.log(`⚠️  Total Issues Found: ${report.totalIssues}`);
    console.log(`\n📈 Issues by Severity:`);
    console.log(`   🔴 High: ${report.issuesBySeverity.high}`);
    console.log(`   🟡 Medium: ${report.issuesBySeverity.medium}`);
    console.log(`   🟢 Low: ${report.issuesBySeverity.low}`);

    console.log(`\n✅ Good Patterns Found:`);
    console.log(`   - Media Queries: ${report.summary.hasMediaQueries ? '✓' : '✗'}`);
    console.log(`   - Tailwind Responsive: ${report.summary.usesTailwindResponsive ? '✓' : '✗'}`);
    console.log(`   - Flexbox: ${report.summary.usesFlexbox ? '✓' : '✗'}`);
    console.log(`   - Grid: ${report.summary.usesGrid ? '✓' : '✗'}`);

    if (report.issuesBySeverity.high > 0) {
      console.log(`\n🔴 High Severity Issues:\n`);
      const highIssues = report.issues.filter((i) => i.severity === 'high');
      const grouped = this.groupIssuesByFile(highIssues);
      Object.entries(grouped).forEach(([file, issues]) => {
        console.log(`  ${file}`);
        issues.forEach((issue) => {
          console.log(`    ⚠️  ${issue.description}`);
          console.log(`       Found: ${issue.match}`);
        });
      });
    }

    if (report.issuesBySeverity.medium > 0) {
      console.log(`\n🟡 Medium Severity Issues:\n`);
      const mediumIssues = report.issues.filter((i) => i.severity === 'medium');
      const grouped = this.groupIssuesByFile(mediumIssues);
      Object.entries(grouped).slice(0, 5).forEach(([file, issues]) => {
        console.log(`  ${file}`);
        issues.slice(0, 3).forEach((issue) => {
          console.log(`    ⚠️  ${issue.description}`);
          console.log(`       Found: ${issue.match}`);
        });
        if (issues.length > 3) {
          console.log(`    ... and ${issues.length - 3} more`);
        }
      });
      if (Object.keys(grouped).length > 5) {
        console.log(`  ... and ${Object.keys(grouped).length - 5} more files`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n💡 Recommendations:');
    console.log('   1. Use Tailwind responsive classes (sm:, md:, lg:, xl:)');
    console.log('   2. Ensure touch targets are at least 44x44px');
    console.log('   3. Use minimum font size of 16px for body text');
    console.log('   4. Avoid fixed widths over 768px');
    console.log('   5. Use max-width: 100% for responsive containers');
    console.log('   6. Test manually in browser DevTools at 320px, 375px, 768px');
    console.log('\n📖 See docs/RESPONSIVE_DESIGN_TESTING.md for detailed testing guide');
    console.log('='.repeat(80));
  }

  /**
   * Group issues by file
   */
  groupIssuesByFile(issues) {
    return issues.reduce((acc, issue) => {
      if (!acc[issue.file]) {
        acc[issue.file] = [];
      }
      acc[issue.file].push(issue);
      return acc;
    }, {});
  }

  /**
   * Save report to file
   */
  saveReport(report, filename = 'responsive-css-report.json') {
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved to ${filename}`);
  }
}

// Main execution
function main() {
  const checker = new ResponsiveCSSChecker();

  try {
    const report = checker.checkAllFiles();
    checker.printReport(report);
    checker.saveReport(report);

    // Exit with error code if high severity issues found
    process.exit(report.issuesBySeverity.high > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { ResponsiveCSSChecker };
