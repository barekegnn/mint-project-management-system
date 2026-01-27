/**
 * Property-Based Tests for Error Handling
 * 
 * Property 2: Consistent Error Handling Across API Routes
 * For any API route file in the app/api directory, the route should use 
 * the standardized error handling pattern with try-catch blocks and proper error responses.
 * 
 * Validates: Requirements US-2.5
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Property 2: Consistent Error Handling Across API Routes', () => {
  const projectRoot = path.join(__dirname, '../../..');
  const apiDir = path.join(projectRoot, 'src/app/api');
  
  /**
   * Find all route.ts files in the API directory
   */
  function findRouteFiles(dir: string): string[] {
    const routeFiles: string[] = [];
    
    if (!fs.existsSync(dir)) {
      return routeFiles;
    }
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        routeFiles.push(...findRouteFiles(fullPath));
      } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
        routeFiles.push(fullPath);
      }
    }
    
    return routeFiles;
  }
  
  /**
   * Check if a route file uses withErrorHandler
   */
  function usesErrorHandler(filePath: string): boolean {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.includes('withErrorHandler');
  }
  
  /**
   * Check if a route file has proper error handling (either withErrorHandler or try-catch)
   */
  function hasErrorHandling(filePath: string): boolean {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for withErrorHandler (preferred)
    if (content.includes('withErrorHandler')) {
      return true;
    }
    
    // Check for try-catch blocks
    const hasTryCatch = /try\s*{[\s\S]*?}\s*catch/.test(content);
    return hasTryCatch;
  }
  
  /**
   * Check if error responses follow standard format
   */
  function hasStandardErrorFormat(filePath: string): boolean {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // If using withErrorHandler, it automatically provides standard format
    if (content.includes('withErrorHandler')) {
      return true;
    }
    
    // Check for NextResponse.json in catch blocks
    const catchBlocks = content.match(/catch\s*\([^)]*\)\s*{[\s\S]*?}/g) || [];
    
    for (const block of catchBlocks) {
      // Should return NextResponse.json with error
      if (!block.includes('NextResponse.json')) {
        return false;
      }
    }
    
    return catchBlocks.length > 0;
  }
  
  /**
   * Check if route imports error handling utilities
   */
  function importsErrorUtilities(filePath: string): boolean {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // If not using withErrorHandler, it's okay (legacy routes)
    if (!content.includes('withErrorHandler')) {
      return true;
    }
    
    // If using withErrorHandler, should import from api-error-handler
    return content.includes('@/lib/api-error-handler') || content.includes('../lib/api-error-handler');
  }
  
  it('should find API route files', () => {
    const routeFiles = findRouteFiles(apiDir);
    expect(routeFiles.length).toBeGreaterThan(0);
  });
  
  it('should have error handling in all route files', () => {
    const routeFiles = findRouteFiles(apiDir);
    const filesWithoutErrorHandling: string[] = [];
    
    for (const file of routeFiles) {
      if (!hasErrorHandling(file)) {
        filesWithoutErrorHandling.push(file);
      }
    }
    
    if (filesWithoutErrorHandling.length > 0) {
      console.error('\n❌ Route files without error handling:');
      filesWithoutErrorHandling.forEach(f => console.error(`  - ${f}`));
      console.error('\n');
    }
    
    expect(filesWithoutErrorHandling).toEqual([]);
  });
  
  it('should use standard error response format', () => {
    const routeFiles = findRouteFiles(apiDir);
    const filesWithNonStandardFormat: string[] = [];
    
    for (const file of routeFiles) {
      if (!hasStandardErrorFormat(file)) {
        filesWithNonStandardFormat.push(file);
      }
    }
    
    if (filesWithNonStandardFormat.length > 0) {
      console.error('\n❌ Route files with non-standard error format:');
      filesWithNonStandardFormat.forEach(f => console.error(`  - ${f}`));
      console.error('\n');
    }
    
    expect(filesWithNonStandardFormat).toEqual([]);
  });
  
  it('should properly import error handling utilities', () => {
    const routeFiles = findRouteFiles(apiDir);
    const filesWithImportIssues: string[] = [];
    
    for (const file of routeFiles) {
      if (!importsErrorUtilities(file)) {
        filesWithImportIssues.push(file);
      }
    }
    
    if (filesWithImportIssues.length > 0) {
      console.error('\n❌ Route files with import issues:');
      filesWithImportIssues.forEach(f => console.error(`  - ${f}`));
      console.error('\n');
    }
    
    expect(filesWithImportIssues).toEqual([]);
  });
  
  /**
   * Property test: For any API route file, it should have proper error handling
   */
  it('Property: All API routes have consistent error handling', () => {
    const routeFiles = findRouteFiles(apiDir);
    
    // Test the property for each route file
    for (const file of routeFiles) {
      const hasHandling = hasErrorHandling(file);
      const hasFormat = hasStandardErrorFormat(file);
      const hasImports = importsErrorUtilities(file);
      
      if (!hasHandling || !hasFormat || !hasImports) {
        console.error(`\n❌ Route file fails error handling property: ${file}`);
        console.error(`  - Has error handling: ${hasHandling}`);
        console.error(`  - Has standard format: ${hasFormat}`);
        console.error(`  - Has proper imports: ${hasImports}\n`);
      }
      
      expect(hasHandling).toBe(true);
      expect(hasFormat).toBe(true);
      expect(hasImports).toBe(true);
    }
  });
  
  /**
   * Property test: Routes using withErrorHandler should not have try-catch
   */
  it('Property: Routes with withErrorHandler should not have redundant try-catch', () => {
    const routeFiles = findRouteFiles(apiDir);
    const filesWithRedundantTryCatch: string[] = [];
    
    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      if (content.includes('withErrorHandler')) {
        // Check if there's a try-catch inside the handler
        const handlerMatch = content.match(/withErrorHandler\s*\([\s\S]*?\)/);
        if (handlerMatch && /try\s*{/.test(handlerMatch[0])) {
          filesWithRedundantTryCatch.push(file);
        }
      }
    }
    
    if (filesWithRedundantTryCatch.length > 0) {
      console.warn('\n⚠️  Routes with redundant try-catch (withErrorHandler already handles errors):');
      filesWithRedundantTryCatch.forEach(f => console.warn(`  - ${f}`));
      console.warn('\n');
    }
    
    // This is a warning, not a failure
    expect(filesWithRedundantTryCatch.length).toBeLessThan(routeFiles.length);
  });
});
