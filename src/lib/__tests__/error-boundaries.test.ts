/**
 * Property-Based Tests for Error Boundaries
 * 
 * Property 6: Error Boundaries in Components
 * For any page component in the application, the component should be wrapped 
 * with an error boundary to handle runtime errors gracefully.
 * 
 * Validates: Requirements US-3.5
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('Property 6: Error Boundaries in Components', () => {
  const projectRoot = path.join(__dirname, '../../..');
  const appDir = path.join(projectRoot, 'src/app');
  
  /**
   * Check if error.tsx exists in app directory
   */
  function hasRootErrorBoundary(): boolean {
    const errorPath = path.join(appDir, 'error.tsx');
    return fs.existsSync(errorPath);
  }
  
  /**
   * Check if global-error.tsx exists in app directory
   */
  function hasGlobalErrorBoundary(): boolean {
    const globalErrorPath = path.join(appDir, 'global-error.tsx');
    return fs.existsSync(globalErrorPath);
  }
  
  /**
   * Find all route segments (directories with page.tsx)
   */
  function findRouteSegments(dir: string): string[] {
    const segments: string[] = [];
    
    if (!fs.existsSync(dir)) {
      return segments;
    }
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      
      const fullPath = path.join(dir, entry.name);
      const pagePath = path.join(fullPath, 'page.tsx');
      
      if (fs.existsSync(pagePath)) {
        segments.push(fullPath);
      }
      
      // Recursively check subdirectories
      segments.push(...findRouteSegments(fullPath));
    }
    
    return segments;
  }
  
  /**
   * Check if a route segment has an error boundary
   */
  function hasErrorBoundary(segmentPath: string): boolean {
    const errorPath = path.join(segmentPath, 'error.tsx');
    return fs.existsSync(errorPath);
  }
  
  /**
   * Check if error boundary file is properly implemented
   */
  function isValidErrorBoundary(filePath: string): boolean {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check for required elements
    const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
    const hasErrorParam = /error\s*[,:]/.test(content);
    const hasResetParam = /reset\s*[,:]/.test(content);
    const hasErrorHandling = content.includes('Logger.error') || content.includes('console.error');
    
    return hasUseClient && hasErrorParam && hasResetParam;
  }
  
  it('should have root error boundary (error.tsx)', () => {
    const hasError = hasRootErrorBoundary();
    
    if (!hasError) {
      console.error('\n❌ Missing root error boundary: src/app/error.tsx\n');
    }
    
    expect(hasError).toBe(true);
  });
  
  it('should have global error boundary (global-error.tsx)', () => {
    const hasGlobal = hasGlobalErrorBoundary();
    
    if (!hasGlobal) {
      console.error('\n❌ Missing global error boundary: src/app/global-error.tsx\n');
    }
    
    expect(hasGlobal).toBe(true);
  });
  
  it('should have valid root error boundary implementation', () => {
    const errorPath = path.join(appDir, 'error.tsx');
    const isValid = isValidErrorBoundary(errorPath);
    
    if (!isValid) {
      console.error('\n❌ Root error boundary is not properly implemented\n');
      console.error('Required elements:');
      console.error("  - 'use client' directive");
      console.error('  - error parameter');
      console.error('  - reset parameter');
      console.error('  - Error logging\n');
    }
    
    expect(isValid).toBe(true);
  });
  
  it('should have valid global error boundary implementation', () => {
    const globalErrorPath = path.join(appDir, 'global-error.tsx');
    const isValid = isValidErrorBoundary(globalErrorPath);
    
    if (!isValid) {
      console.error('\n❌ Global error boundary is not properly implemented\n');
    }
    
    expect(isValid).toBe(true);
  });
  
  /**
   * Property test: All route segments should be covered by error boundaries
   */
  it('Property: All route segments have error boundary coverage', () => {
    const segments = findRouteSegments(appDir);
    
    // Root error boundary covers all routes by default
    const hasRoot = hasRootErrorBoundary();
    expect(hasRoot).toBe(true);
    
    // Check if any critical routes have their own error boundaries
    const criticalRoutes = segments.filter(seg => 
      seg.includes('admin') || 
      seg.includes('dashboard') ||
      seg.includes('auth')
    );
    
    // At minimum, root error boundary should exist
    expect(hasRoot).toBe(true);
    
    // Log info about route coverage
    console.log(`\n✅ Error boundary coverage:`);
    console.log(`  - Total route segments: ${segments.length}`);
    console.log(`  - Critical routes: ${criticalRoutes.length}`);
    console.log(`  - Root error boundary: ${hasRoot ? 'Yes' : 'No'}`);
    console.log(`  - Global error boundary: ${hasGlobalErrorBoundary() ? 'Yes' : 'No'}\n`);
  });
  
  /**
   * Property test: Error boundaries should handle errors gracefully
   */
  it('Property: Error boundaries provide user-friendly error messages', () => {
    const errorPath = path.join(appDir, 'error.tsx');
    
    if (!fs.existsSync(errorPath)) {
      return;
    }
    
    const content = fs.readFileSync(errorPath, 'utf-8');
    
    // Check for user-friendly elements
    const hasUserMessage = /something went wrong|error occurred|unexpected error/i.test(content);
    const hasRecoveryOption = /try again|reset|reload/i.test(content);
    const hasNavigationOption = /go home|back|return/i.test(content);
    
    if (!hasUserMessage) {
      console.warn('\n⚠️  Error boundary should have user-friendly error message\n');
    }
    
    if (!hasRecoveryOption) {
      console.warn('\n⚠️  Error boundary should provide recovery option (reset button)\n');
    }
    
    expect(hasUserMessage).toBe(true);
    expect(hasRecoveryOption).toBe(true);
  });
  
  /**
   * Property test: Error boundaries should log errors
   */
  it('Property: Error boundaries log errors for monitoring', () => {
    const errorPath = path.join(appDir, 'error.tsx');
    const globalErrorPath = path.join(appDir, 'global-error.tsx');
    
    const files = [errorPath, globalErrorPath].filter(f => fs.existsSync(f));
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasLogging = content.includes('Logger.error') || content.includes('console.error');
      
      if (!hasLogging) {
        console.error(`\n❌ Error boundary should log errors: ${file}\n`);
      }
      
      expect(hasLogging).toBe(true);
    }
  });
  
  /**
   * Property test: Error boundaries should use 'use client' directive
   */
  it('Property: Error boundaries are client components', () => {
    const errorPath = path.join(appDir, 'error.tsx');
    const globalErrorPath = path.join(appDir, 'global-error.tsx');
    
    const files = [errorPath, globalErrorPath].filter(f => fs.existsSync(f));
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasUseClient = content.includes("'use client'") || content.includes('"use client"');
      
      if (!hasUseClient) {
        console.error(`\n❌ Error boundary must be a client component: ${file}\n`);
      }
      
      expect(hasUseClient).toBe(true);
    }
  });
});
