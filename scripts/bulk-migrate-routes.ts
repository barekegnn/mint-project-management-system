/**
 * Bulk migration script for API routes
 * 
 * This script migrates routes to use withErrorHandler by:
 * 1. Adding necessary imports
 * 2. Converting function declarations to const with withErrorHandler
 * 3. Removing try-catch blocks
 * 4. Adding timing and slow query logging
 */

import * as fs from 'fs';
import * as path from 'path';

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

function addImportsIfNeeded(content: string): string {
  let modified = content;
  
  // Check if imports already exist
  const hasWithErrorHandler = content.includes('withErrorHandler');
  const hasLogger = content.includes('from "@/lib/logger"') || content.includes("from '@/lib/logger'");
  const hasApiErrorHandler = content.includes('from "@/lib/api-error-handler"') || content.includes("from '@/lib/api-error-handler'");
  
  if (hasWithErrorHandler && hasLogger && hasApiErrorHandler) {
    return content;
  }

  // Find where to insert imports (after last existing import)
  const lines = modified.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import ') && !line.includes('type {')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex === -1) {
    // No imports found, add at the beginning
    const newImports: string[] = [];
    if (!hasApiErrorHandler) {
      newImports.push(`import { withErrorHandler } from '@/lib/api-error-handler';`);
    }
    if (!hasLogger) {
      newImports.push(`import { Logger } from '@/lib/logger';`);
    }
    return newImports.join('\n') + '\n\n' + content;
  }

  // Insert after last import
  const newImports: string[] = [];
  if (!hasApiErrorHandler) {
    newImports.push(`import { withErrorHandler } from '@/lib/api-error-handler';`);
  }
  if (!hasLogger) {
    newImports.push(`import { Logger } from '@/lib/logger';`);
  }

  if (newImports.length > 0) {
    lines.splice(lastImportIndex + 1, 0, ...newImports);
    modified = lines.join('\n');
  }

  return modified;
}

function migrateHandler(content: string, method: string): string {
  // Skip if already wrapped
  const alreadyWrapped = new RegExp(`export\\s+const\\s+${method}\\s*=\\s*withErrorHandler`, 'i');
  if (alreadyWrapped.test(content)) {
    return content;
  }

  // Pattern: export async function METHOD(...) { ... }
  const funcRegex = new RegExp(
    `export\\s+async\\s+function\\s+${method}\\s*\\(([^)]*)\\)\\s*\\{([\\s\\S]*?)\\n\\}(?=\\s*(?:export|$))`,
    'i'
  );

  const match = content.match(funcRegex);
  if (!match) {
    return content;
  }

  let params = match[1].trim();
  let body = match[2];

  // Default parameter if empty
  if (!params) {
    params = 'request: Request';
  }

  // Remove outer try-catch if present
  const tryCatchRegex = /^\s*try\s*\{([\s\S]*)\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*\}\s*$/;
  const tryCatchMatch = body.match(tryCatchRegex);
  if (tryCatchMatch) {
    body = tryCatchMatch[1];
  }

  // Add startTime if not present
  if (!body.includes('startTime')) {
    body = `\n  const startTime = Date.now();${body}`;
  }

  // Add slow query logging before the last return statement
  if (!body.includes('Logger.logSlowQuery')) {
    // Find the last return statement
    const returnRegex = /(return\s+NextResponse\.json\([^;]*\);)(?![\s\S]*return)/;
    body = body.replace(returnRegex, (match) => {
      return `\n  // Log slow query if needed\n  const duration = Date.now() - startTime;\n  Logger.logSlowQuery('${method} ${path.basename(process.cwd())}', duration);\n\n  ${match}`;
    });
  }

  // Replace console.error with Logger.error (if any remain)
  body = body.replace(/console\.error\(/g, 'Logger.error(');
  body = body.replace(/console\.log\(/g, 'Logger.info(');

  const newHandler = `export const ${method} = withErrorHandler(async (${params}) => {${body}\n});`;

  return content.replace(match[0], newHandler);
}

function migrateFile(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Skip if already using withErrorHandler
    if (content.includes('withErrorHandler')) {
      return false;
    }

    // Add imports
    content = addImportsIfNeeded(content);

    // Migrate each HTTP method
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    for (const method of methods) {
      content = migrateHandler(content, method);
    }

    // Check if anything changed
    if (content === originalContent) {
      return false;
    }

    // Write back
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error migrating ${filePath}:`, error);
    return false;
  }
}

function main() {
  console.log('\n=== Bulk Migration of API Routes ===\n');

  const routeFiles = findRouteFiles('src/app/api');
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of routeFiles) {
    try {
      const result = migrateFile(file);
      if (result) {
        console.log(`✅ ${file}`);
        updated++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`❌ ${file}`);
      errors++;
    }
  }

  console.log(`\n=== Migration Summary ===`);
  console.log(`Total routes: ${routeFiles.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already migrated): ${skipped}`);
  console.log(`Errors: ${errors}\n`);

  if (updated > 0) {
    console.log('✅ Migration complete! Please review the changes and run tests.\n');
  }
}

main();
