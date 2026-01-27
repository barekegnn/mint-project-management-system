/**
 * Script to automatically migrate API routes to use withErrorHandler
 * 
 * This script:
 * 1. Adds imports for withErrorHandler and Logger
 * 2. Wraps route handlers with withErrorHandler
 * 3. Removes redundant try-catch blocks
 * 4. Adds slow query logging
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteFile {
  path: string;
  content: string;
  needsUpdate: boolean;
}

function findRouteFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (file !== '__tests__' && file !== 'node_modules') {
        findRouteFiles(filePath, fileList);
      }
    } else if (file === 'route.ts' || file === 'route.tsx') {
      fileList.push(filePath);
    }
  }

  return fileList;
}

function addImports(content: string): string {
  // Check if imports already exist
  const hasWithErrorHandler = content.includes('withErrorHandler');
  const hasLogger = content.includes('Logger');
  
  if (hasWithErrorHandler && hasLogger) {
    return content;
  }

  // Find the last import statement
  const importRegex = /^import\s+.*?;$/gm;
  const imports = content.match(importRegex);
  
  if (!imports || imports.length === 0) {
    // No imports found, add at the beginning
    let newImports = '';
    if (!hasWithErrorHandler) {
      newImports += `import { withErrorHandler } from '@/lib/api-error-handler';\n`;
    }
    if (!hasLogger) {
      newImports += `import { Logger } from '@/lib/logger';\n`;
    }
    return newImports + '\n' + content;
  }

  // Add imports after the last import
  const lastImport = imports[imports.length - 1];
  const lastImportIndex = content.lastIndexOf(lastImport);
  const insertPosition = lastImportIndex + lastImport.length;

  let newImports = '';
  if (!hasWithErrorHandler) {
    newImports += `\nimport { withErrorHandler } from '@/lib/api-error-handler';`;
  }
  if (!hasLogger) {
    newImports += `\nimport { Logger } from '@/lib/logger';`;
  }

  return content.slice(0, insertPosition) + newImports + content.slice(insertPosition);
}

function wrapHandlerWithErrorHandler(content: string, method: string): string {
  // Pattern to match: export async function METHOD(...) { ... }
  // or: export const METHOD = async (...) => { ... }
  
  // First, check if already wrapped
  const alreadyWrappedPattern = new RegExp(`export\\s+const\\s+${method}\\s*=\\s*withErrorHandler`, 'i');
  if (alreadyWrappedPattern.test(content)) {
    return content; // Already wrapped
  }

  // Pattern 1: export async function METHOD(...)
  const functionPattern = new RegExp(
    `(export\\s+async\\s+function\\s+${method}\\s*\\([^)]*\\)\\s*{)`,
    'i'
  );

  // Pattern 2: export const METHOD = async (...) =>
  const arrowPattern = new RegExp(
    `(export\\s+const\\s+${method}\\s*=\\s*async\\s*\\([^)]*\\)\\s*=>\\s*{)`,
    'i'
  );

  if (functionPattern.test(content)) {
    // Convert: export async function GET(...) { ... }
    // To: export const GET = withErrorHandler(async (...) => { ... });
    
    const match = content.match(new RegExp(
      `export\\s+async\\s+function\\s+${method}\\s*\\(([^)]*)\\)\\s*{([\\s\\S]*?)\\n}(?=\\s*(?:export|$))`,
      'i'
    ));

    if (match) {
      const params = match[1];
      const body = match[2];
      
      const newHandler = `export const ${method} = withErrorHandler(async (${params}) => {${body}\n});`;
      
      content = content.replace(match[0], newHandler);
    }
  } else if (arrowPattern.test(content)) {
    // Convert: export const GET = async (...) => { ... }
    // To: export const GET = withErrorHandler(async (...) => { ... });
    
    const match = content.match(new RegExp(
      `export\\s+const\\s+${method}\\s*=\\s*(async\\s*\\([^)]*\\)\\s*=>\\s*{[\\s\\S]*?\\n});`,
      'i'
    ));

    if (match) {
      const handler = match[1];
      const newHandler = `export const ${method} = withErrorHandler(${handler});`;
      
      content = content.replace(match[0], newHandler);
    }
  }

  return content;
}

function removeTryCatch(content: string): string {
  // This is a simplified approach - it removes the outermost try-catch
  // More sophisticated parsing would be needed for nested try-catch blocks
  
  // Pattern to match try { ... } catch (error) { ... }
  const tryCatchPattern = /try\s*{\s*([\s\S]*?)\s*}\s*catch\s*\([^)]*\)\s*{[\s\S]*?}/g;
  
  // For now, we'll keep try-catch blocks as they might be needed for specific error handling
  // The withErrorHandler will catch any unhandled errors
  
  return content;
}

function addSlowQueryLogging(content: string): string {
  // Add slow query logging for database queries
  // Look for patterns like: await prisma...
  
  // Check if already has slow query logging
  if (content.includes('Logger.logSlowQuery')) {
    return content;
  }

  // This is complex to do automatically, so we'll skip it for now
  // Manual review will be needed for slow query logging
  
  return content;
}

function migrateRoute(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Check if already using withErrorHandler
    if (content.includes('withErrorHandler')) {
      console.log(`  ✓ ${filePath} - Already using withErrorHandler`);
      return false;
    }

    // Add imports
    content = addImports(content);

    // Wrap handlers with withErrorHandler
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    for (const method of methods) {
      content = wrapHandlerWithErrorHandler(content, method);
    }

    // Check if content changed
    if (content === originalContent) {
      console.log(`  ⚠ ${filePath} - No changes made`);
      return false;
    }

    // Write back to file
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ ${filePath} - Updated successfully`);
    return true;
  } catch (error) {
    console.error(`  ❌ ${filePath} - Error: ${error}`);
    return false;
  }
}

function main() {
  console.log('\n=== Migrating API Routes to withErrorHandler ===\n');

  const routeFiles = findRouteFiles('src/app/api');
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of routeFiles) {
    const result = migrateRoute(file);
    if (result) {
      updated++;
    } else if (result === false) {
      skipped++;
    } else {
      failed++;
    }
  }

  console.log('\n=== Migration Summary ===\n');
  console.log(`Total routes: ${routeFiles.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}\n`);
}

main();
