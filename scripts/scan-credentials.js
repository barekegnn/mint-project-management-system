#!/usr/bin/env node

/**
 * Credential Scanning Utility
 * 
 * Scans the codebase for hardcoded credentials, API keys, passwords,
 * and other sensitive information that should be in environment variables.
 * 
 * Usage: node scripts/scan-credentials.js
 */

const fs = require('fs');
const path = require('path');

// Patterns to detect potential credentials
const CREDENTIAL_PATTERNS = [
  // Passwords
  { pattern: /password\s*[:=]\s*["'](?!.*process\.env)[^"']{8,}["']/gi, type: 'Password' },
  { pattern: /pwd\s*[:=]\s*["'][^"']{8,}["']/gi, type: 'Password' },
  
  // API Keys
  { pattern: /api[_-]?key\s*[:=]\s*["'][^"']{16,}["']/gi, type: 'API Key' },
  { pattern: /apikey\s*[:=]\s*["'][^"']{16,}["']/gi, type: 'API Key' },
  
  // Secrets and Tokens
  { pattern: /secret\s*[:=]\s*["'](?!.*process\.env)[^"']{16,}["']/gi, type: 'Secret' },
  { pattern: /token\s*[:=]\s*["'][^"']{16,}["']/gi, type: 'Token' },
  { pattern: /auth[_-]?token\s*[:=]\s*["'][^"']{16,}["']/gi, type: 'Auth Token' },
  
  // AWS Credentials
  { pattern: /aws[_-]?access[_-]?key[_-]?id\s*[:=]\s*["'][^"']+["']/gi, type: 'AWS Access Key' },
  { pattern: /aws[_-]?secret[_-]?access[_-]?key\s*[:=]\s*["'][^"']+["']/gi, type: 'AWS Secret Key' },
  
  // Database URLs with credentials
  { pattern: /postgresql:\/\/[^:]+:[^@]+@[^/]+/gi, type: 'Database URL' },
  { pattern: /mysql:\/\/[^:]+:[^@]+@[^/]+/gi, type: 'Database URL' },
  { pattern: /mongodb:\/\/[^:]+:[^@]+@[^/]+/gi, type: 'Database URL' },
  
  // Email credentials
  { pattern: /smtp[_-]?password\s*[:=]\s*["'][^"']{8,}["']/gi, type: 'SMTP Password' },
  { pattern: /email[_-]?password\s*[:=]\s*["'][^"']{8,}["']/gi, type: 'Email Password' },
  
  // Generic credentials
  { pattern: /credentials?\s*[:=]\s*["'][^"']{8,}["']/gi, type: 'Credentials' },
  { pattern: /private[_-]?key\s*[:=]\s*["'][^"']{16,}["']/gi, type: 'Private Key' },
];

// Files and directories to exclude from scanning
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  '.env.example',
  'package-lock.json',
  'yarn.lock',
  '.test.ts',
  '.test.js',
  '.spec.ts',
  '.spec.js',
  'scan-credentials.js', // Exclude this file itself
];

// File extensions to scan
const SCAN_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.json', '.env'];

class CredentialScanner {
  constructor() {
    this.findings = [];
    this.filesScanned = 0;
  }

  /**
   * Check if a path should be excluded from scanning
   */
  shouldExclude(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
  }

  /**
   * Check if a file should be scanned based on extension
   */
  shouldScan(filePath) {
    return SCAN_EXTENSIONS.some(ext => filePath.endsWith(ext));
  }

  /**
   * Scan a single file for credentials
   */
  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];

        // Skip comments
        if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
          continue;
        }

        // Check each pattern
        for (const { pattern, type } of CREDENTIAL_PATTERNS) {
          const regex = new RegExp(pattern);
          const matches = line.match(regex);

          if (matches) {
            // Additional check: skip if it's using process.env
            if (line.includes('process.env')) {
              continue;
            }

            // Additional check: skip if it's a placeholder
            if (line.includes('your-') || line.includes('example') || line.includes('placeholder')) {
              continue;
            }

            this.findings.push({
              file: filePath,
              line: lineNum + 1,
              type: type,
              content: line.trim(),
              severity: this.getSeverity(type),
            });
          }
        }
      }

      this.filesScanned++;
    } catch (error) {
      // Silently skip files that can't be read
    }
  }

  /**
   * Get severity level for a credential type
   */
  getSeverity(type) {
    const critical = ['Password', 'AWS Access Key', 'AWS Secret Key', 'Private Key'];
    const high = ['API Key', 'Secret', 'Token', 'Database URL', 'SMTP Password'];
    
    if (critical.includes(type)) return 'CRITICAL';
    if (high.includes(type)) return 'HIGH';
    return 'MEDIUM';
  }

  /**
   * Recursively scan a directory
   */
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
      // Silently skip directories that can't be read
    }
  }

  /**
   * Generate a report of findings
   */
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('🔍 CREDENTIAL SCAN REPORT');
    console.log('='.repeat(70) + '\n');

    console.log(`📊 Files Scanned: ${this.filesScanned}`);
    console.log(`🚨 Issues Found: ${this.findings.length}\n`);

    if (this.findings.length === 0) {
      console.log('✅ No hardcoded credentials found!\n');
      return { success: true, findings: [] };
    }

    // Group findings by severity
    const critical = this.findings.filter(f => f.severity === 'CRITICAL');
    const high = this.findings.filter(f => f.severity === 'HIGH');
    const medium = this.findings.filter(f => f.severity === 'MEDIUM');

    if (critical.length > 0) {
      console.log('🔴 CRITICAL ISSUES:\n');
      critical.forEach(finding => this.printFinding(finding));
    }

    if (high.length > 0) {
      console.log('\n🟠 HIGH PRIORITY ISSUES:\n');
      high.forEach(finding => this.printFinding(finding));
    }

    if (medium.length > 0) {
      console.log('\n🟡 MEDIUM PRIORITY ISSUES:\n');
      medium.forEach(finding => this.printFinding(finding));
    }

    console.log('\n' + '='.repeat(70));
    console.log('📝 RECOMMENDATIONS:');
    console.log('='.repeat(70) + '\n');
    console.log('1. Move all credentials to .env file');
    console.log('2. Use process.env.VARIABLE_NAME to access them');
    console.log('3. Ensure .env is in .gitignore');
    console.log('4. Never commit credentials to version control\n');

    return {
      success: false,
      findings: this.findings,
      summary: {
        critical: critical.length,
        high: high.length,
        medium: medium.length,
      },
    };
  }

  /**
   * Print a single finding
   */
  printFinding(finding) {
    console.log(`  File: ${finding.file}`);
    console.log(`  Line: ${finding.line}`);
    console.log(`  Type: ${finding.type}`);
    console.log(`  Code: ${finding.content.substring(0, 80)}${finding.content.length > 80 ? '...' : ''}`);
    console.log('');
  }
}

// Main execution
function main() {
  const scanner = new CredentialScanner();
  const projectRoot = path.join(__dirname, '..');

  console.log('🔍 Scanning codebase for hardcoded credentials...\n');
  console.log(`📂 Scanning directory: ${projectRoot}\n`);

  scanner.scanDirectory(projectRoot);
  const report = scanner.generateReport();

  // Exit with error code if issues found
  process.exit(report.success ? 0 : 1);
}

main();
