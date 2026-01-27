/**
 * Property-Based Tests for Credential Security
 * 
 * Property 1: No Hardcoded Credentials in Codebase
 * For any source code file in the project, the file should not contain 
 * hardcoded credentials, API keys, passwords, or sensitive tokens.
 * 
 * Validates: Requirements US-2.1
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Property 1: No Hardcoded Credentials in Codebase', () => {
  const projectRoot = path.join(__dirname, '../../..');
  
  // Patterns to detect potential credentials
  const CREDENTIAL_PATTERNS = [
    { pattern: /password\s*[:=]\s*["'](?!.*process\.env)[^"']{8,}["']/gi, type: 'Password' },
    { pattern: /api[_-]?key\s*[:=]\s*["'][^"']{16,}["']/gi, type: 'API Key' },
    { pattern: /secret\s*[:=]\s*["'](?!.*process\.env)[^"']{16,}["']/gi, type: 'Secret' },
    { pattern: /token\s*[:=]\s*["'][^"']{16,}["']/gi, type: 'Token' },
    { pattern: /postgresql:\/\/[^:]+:[^@]+@[^/]+/gi, type: 'Database URL' },
    { pattern: /mysql:\/\/[^:]+:[^@]+@[^/]+/gi, type: 'Database URL' },
    { pattern: /smtp[_-]?password\s*[:=]\s*["'][^"']{8,}["']/gi, type: 'SMTP Password' },
  ];
  
  // Files and directories to exclude
  const EXCLUDE_PATTERNS = [
    'node_modules',
    '.next',
    '.git',
    'dist',
    'build',
    '.env.example',
    'package-lock.json',
    '__tests__', // Exclude all test files
    '.test.ts', // Exclude test files
    '.test.js', // Exclude test files
    'scan-credentials.js', // Exclude the scanner itself
  ];
  
  // File extensions to scan
  const SCAN_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx'];
  
  /**
   * Check if a path should be excluded
   */
  function shouldExclude(filePath: string): boolean {
    return EXCLUDE_PATTERNS.some(pattern => filePath.includes(pattern));
  }
  
  /**
   * Check if a file should be scanned
   */
  function shouldScan(filePath: string): boolean {
    return SCAN_EXTENSIONS.some(ext => filePath.endsWith(ext));
  }
  
  /**
   * Scan a file for credentials
   */
  function scanFile(filePath: string): Array<{line: number, type: string, content: string}> {
    const findings: Array<{line: number, type: string, content: string}> = [];
    
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
          if (regex.test(line)) {
            // Skip if using process.env
            if (line.includes('process.env')) {
              continue;
            }
            
            // Skip placeholders
            if (line.includes('your-') || line.includes('example') || line.includes('placeholder')) {
              continue;
            }
            
            findings.push({
              line: lineNum + 1,
              type,
              content: line.trim(),
            });
          }
        }
      }
    } catch (error) {
      // Skip files that can't be read
    }
    
    return findings;
  }
  
  /**
   * Recursively scan directory
   */
  function scanDirectory(dirPath: string): Map<string, Array<{line: number, type: string, content: string}>> {
    const allFindings = new Map<string, Array<{line: number, type: string, content: string}>>();
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (shouldExclude(fullPath)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          const subFindings = scanDirectory(fullPath);
          subFindings.forEach((findings, file) => {
            allFindings.set(file, findings);
          });
        } else if (entry.isFile() && shouldScan(fullPath) && !shouldExclude(fullPath)) {
          const findings = scanFile(fullPath);
          if (findings.length > 0) {
            allFindings.set(fullPath, findings);
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
    
    return allFindings;
  }
  
  it('should not contain hardcoded credentials in source files', () => {
    const findings = scanDirectory(path.join(projectRoot, 'src'));
    
    if (findings.size > 0) {
      console.error('\n❌ Hardcoded credentials found:\n');
      findings.forEach((fileFindings, file) => {
        console.error(`\nFile: ${file}`);
        fileFindings.forEach(finding => {
          console.error(`  Line ${finding.line}: ${finding.type}`);
          console.error(`  Code: ${finding.content.substring(0, 80)}`);
        });
      });
      console.error('\n');
    }
    
    expect(findings.size).toBe(0);
  });
  
  it('should not contain hardcoded credentials in API routes', () => {
    const apiPath = path.join(projectRoot, 'src/app/api');
    
    if (!fs.existsSync(apiPath)) {
      return; // Skip if API directory doesn't exist
    }
    
    const findings = scanDirectory(apiPath);
    
    if (findings.size > 0) {
      console.error('\n❌ Hardcoded credentials found in API routes:\n');
      findings.forEach((fileFindings, file) => {
        console.error(`\nFile: ${file}`);
        fileFindings.forEach(finding => {
          console.error(`  Line ${finding.line}: ${finding.type}`);
        });
      });
      console.error('\n');
    }
    
    expect(findings.size).toBe(0);
  });
  
  it('should not contain hardcoded credentials in lib files', () => {
    const libPath = path.join(projectRoot, 'src/lib');
    
    if (!fs.existsSync(libPath)) {
      return; // Skip if lib directory doesn't exist
    }
    
    const findings = scanDirectory(libPath);
    
    if (findings.size > 0) {
      console.error('\n❌ Hardcoded credentials found in lib files:\n');
      findings.forEach((fileFindings, file) => {
        console.error(`\nFile: ${file}`);
        fileFindings.forEach(finding => {
          console.error(`  Line ${finding.line}: ${finding.type}`);
        });
      });
      console.error('\n');
    }
    
    expect(findings.size).toBe(0);
  });
  
  /**
   * Property test: For any TypeScript/JavaScript file in src/,
   * it should not contain hardcoded credentials
   */
  it('Property: All source files are free of hardcoded credentials', () => {
    const srcPath = path.join(projectRoot, 'src');
    const findings = scanDirectory(srcPath);
    
    // The property: No file should have credential findings
    findings.forEach((fileFindings, file) => {
      expect(fileFindings.length).toBe(0);
    });
    
    // Overall property: No findings at all
    expect(findings.size).toBe(0);
  });
});
