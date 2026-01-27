/**
 * Property-Based Tests for Environment Variable Documentation
 * 
 * Property 9: Environment Variable Documentation Completeness
 * For any environment variable used in the codebase, the variable should be 
 * documented in .env.example with a descriptive comment.
 * 
 * Validates: Requirements US-7.2
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Property 9: Environment Variable Documentation Completeness', () => {
  const projectRoot = path.join(__dirname, '../../..');
  const envExamplePath = path.join(projectRoot, '.env.example');
  
  /**
   * Helper function to extract environment variables from source code
   */
  function extractEnvVariablesFromCode(): Set<string> {
    const envVars = new Set<string>();
    const srcDir = path.join(projectRoot, 'src');
    
    // Patterns to match environment variable usage
    const patterns = [
      /process\.env\.([A-Z_][A-Z0-9_]*)/g,
      /process\.env\[['"]([A-Z_][A-Z0-9_]*)['"]]/g,
    ];
    
    function scanDirectory(dir: string) {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Skip node_modules, .next, etc.
          if (!file.startsWith('.') && file !== 'node_modules') {
            scanDirectory(filePath);
          }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          
          for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
              envVars.add(match[1]);
            }
          }
        }
      }
    }
    
    scanDirectory(srcDir);
    return envVars;
  }
  
  /**
   * Helper function to extract documented variables from .env.example
   */
  function extractDocumentedVariables(): Set<string> {
    const documented = new Set<string>();
    
    if (!fs.existsSync(envExamplePath)) {
      return documented;
    }
    
    const content = fs.readFileSync(envExamplePath, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (trimmed.startsWith('#') || trimmed === '') {
        continue;
      }
      
      // Extract variable name from KEY=value format
      const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=/);
      if (match) {
        documented.add(match[1]);
      }
    }
    
    return documented;
  }
  
  /**
   * Helper function to check if a variable has a descriptive comment
   */
  function hasDescriptiveComment(varName: string): boolean {
    if (!fs.existsSync(envExamplePath)) {
      return false;
    }
    
    const content = fs.readFileSync(envExamplePath, 'utf-8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line defines the variable
      if (line.startsWith(`${varName}=`)) {
        // Check previous lines for comments
        for (let j = i - 1; j >= 0 && j >= i - 5; j--) {
          const prevLine = lines[j].trim();
          
          // Found a comment line
          if (prevLine.startsWith('#') && prevLine.length > 2) {
            return true;
          }
          
          // Stop if we hit a non-comment, non-empty line
          if (prevLine !== '' && !prevLine.startsWith('#')) {
            break;
          }
        }
        
        return false;
      }
    }
    
    return false;
  }
  
  it('should have .env.example file', () => {
    expect(fs.existsSync(envExamplePath)).toBe(true);
  });
  
  it('should document all environment variables used in codebase', () => {
    const usedVars = extractEnvVariablesFromCode();
    const documentedVars = extractDocumentedVariables();
    
    // Exclude some system variables that don't need documentation
    const systemVars = new Set([
      'NODE_ENV',
      'PORT',
      'VERCEL',
      'VERCEL_URL',
      'VERCEL_ENV',
      'VERCEL_ANALYTICS_ID',
    ]);
    
    const undocumented: string[] = [];
    
    for (const varName of usedVars) {
      if (!systemVars.has(varName) && !documentedVars.has(varName)) {
        undocumented.push(varName);
      }
    }
    
    if (undocumented.length > 0) {
      console.error('\n❌ Undocumented environment variables found:');
      undocumented.forEach(v => console.error(`  - ${v}`));
      console.error('\nPlease add these variables to .env.example with descriptive comments.\n');
    }
    
    expect(undocumented).toEqual([]);
  });
  
  it('should have descriptive comments for all documented variables', () => {
    const documentedVars = extractDocumentedVariables();
    const missingComments: string[] = [];
    
    for (const varName of documentedVars) {
      if (!hasDescriptiveComment(varName)) {
        missingComments.push(varName);
      }
    }
    
    if (missingComments.length > 0) {
      console.error('\n❌ Variables without descriptive comments:');
      missingComments.forEach(v => console.error(`  - ${v}`));
      console.error('\nPlease add descriptive comments above these variables in .env.example.\n');
    }
    
    expect(missingComments).toEqual([]);
  });
  
  it('should not have placeholder values in production', () => {
    // This test ensures .env.example has placeholder values, not real ones
    if (!fs.existsSync(envExamplePath)) {
      return;
    }
    
    const content = fs.readFileSync(envExamplePath, 'utf-8');
    const dangerousPatterns = [
      /\d{16}/,  // 16-digit app passwords (but not in connection strings)
    ];
    
    const issues: string[] = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip comment lines
      if (line.trim().startsWith('#')) {
        continue;
      }
      
      // Skip if it's clearly a placeholder
      if (line.includes('your-') || line.includes('example.com') || line.includes('placeholder')) {
        continue;
      }
      
      // Skip database connection string format (it's a template)
      if (line.includes('DATABASE_URL') && line.includes('ep-xxx-xxx')) {
        continue;
      }
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(line)) {
          issues.push(`Line ${i + 1}: Possible real credential in .env.example`);
        }
      }
    }
    
    if (issues.length > 0) {
      console.error('\n⚠️  Possible real credentials in .env.example:');
      issues.forEach(issue => console.error(`  - ${issue}`));
      console.error('\nPlease use placeholder values only.\n');
    }
    
    expect(issues).toEqual([]);
  });
  
  /**
   * Property-based test: For any environment variable in the codebase,
   * it should be documented in .env.example
   */
  it('Property: All used environment variables are documented', () => {
    const usedVars = Array.from(extractEnvVariablesFromCode());
    const documentedVars = extractDocumentedVariables();
    
    // System variables that don't need documentation
    const systemVars = new Set([
      'NODE_ENV',
      'PORT',
      'VERCEL',
      'VERCEL_URL',
      'VERCEL_ENV',
      'VERCEL_ANALYTICS_ID',
    ]);
    
    // Test the property for each used variable
    for (const varName of usedVars) {
      if (!systemVars.has(varName)) {
        expect(documentedVars.has(varName)).toBe(true);
      }
    }
  });
  
  /**
   * Property-based test: For any documented variable,
   * it should have a descriptive comment
   */
  it('Property: All documented variables have descriptive comments', () => {
    const documentedVars = Array.from(extractDocumentedVariables());
    
    // Test the property for each documented variable
    for (const varName of documentedVars) {
      const hasComment = hasDescriptiveComment(varName);
      
      if (!hasComment) {
        console.error(`Variable ${varName} is missing a descriptive comment`);
      }
      
      expect(hasComment).toBe(true);
    }
  });
});
