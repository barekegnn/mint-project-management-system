/**
 * Automated script to migrate API routes to use withErrorHandler
 * 
 * This handles the most common patterns:
 * 1. export async function METHOD() { try { ... } catch { ... } }
 * 2. export const METHOD = async () => { try { ... } catch { ... } }
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

function migrateRouteFile(filePath: string): boolean {
  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Skip if already using withErrorHandler
  if (content.includes('withErrorHandler')) {
    return false;
  }

  // Add imports if not present
  if (!content.includes('withErrorHandler')) {
    // Find the last import line
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, `import { withErrorHandler } from '@/lib/api-error-handler';`);
      lines.splice(lastImportIndex + 2, 0, `import { Logger } from '@/lib/logger';`);
      content = lines.join('\n');
    }
  }

  // Migrate each HTTP method
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  
  for (const method of methods) {
    // Pattern 1: export async function METHOD(...)
    const funcPattern = new RegExp(
      `export\\s+async\\s+function\\s+${method}\\s*\\(([^)]*)\\)\\s*\\{([\\s\\S]*?)^\\}`,
      'gm'
    );

    content = content.replace(funcPattern, (match, params, body) => {
      // Add startTime tracking
      let newBody = body;
      
      // Remove try-catch wrapper if present
      const tryCatchMatch = newBody.match(/^\s*try\s*\{([\s\S]*)\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*\}\s*$/);
      if (tryCatchMatch) {
        newBody = tryCatchMatch[1];
      }

      // Add startTime if not present
      if (!newBody.includes('startTime')) {
        newBody = `\n  const startTime = Date.now();${newBody}`;
      }

      // Add slow query logging before return statements
      newBody = newBody.replace(
        /(return\s+NextResponse\.json\([^;]+\);)/g,
        (returnMatch) => {
          if (!newBody.includes('Logger.logSlowQuery')) {
            return `\n  // Log slow query if needed\n  const duration = Date.now() - startTime;\n  Logger.logSlowQuery('${method} request', duration);\n\n  ${returnMatch}`;
          }
          return returnMatch;
        }
      );

      return `export const ${method} = withErrorHandler(async (${params || 'request: Request'}) => {${newBody}\n});`;
    });
  }

  // Check if content changed
  if (content === originalContent) {
    return false;
  }

  // Write back
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
}

function main() {
  console.log('\n=== Auto-migrating API Routes ===\n');

  const routeFiles = findRouteFiles('src/app/api');
  let updated = 0;
  let skipped = 0;

  for (const file of routeFiles) {
    try {
      const result = migrateRouteFile(file);
      if (result) {
        console.log(`✅ ${file}`);
        updated++;
      } else {
        skipped++;
      }
    } catch (error) {
      console.error(`❌ ${file}: ${error}`);
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Total: ${routeFiles.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}\n`);
}

main();
