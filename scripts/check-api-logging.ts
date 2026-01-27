/**
 * Script to check which API routes are using withErrorHandler
 * and identify routes that need to be updated
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteInfo {
  path: string;
  usesWithErrorHandler: boolean;
  usesLogger: boolean;
  hasTryCatch: boolean;
  hasConsoleLog: boolean;
}

function findRouteFiles(dir: string): string[] {
  const files: string[] = [];
  
  function walk(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name === 'route.ts' || entry.name === 'route.tsx') {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function analyzeRoute(filePath: string): RouteInfo {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  return {
    path: filePath,
    usesWithErrorHandler: content.includes('withErrorHandler'),
    usesLogger: content.includes('Logger.'),
    hasTryCatch: /try\s*{/.test(content),
    hasConsoleLog: /console\.(log|error|warn)/.test(content),
  };
}

function main() {
  const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
  
  if (!fs.existsSync(apiDir)) {
    console.error('API directory not found:', apiDir);
    process.exit(1);
  }
  
  const routeFiles = findRouteFiles(apiDir);
  const routeInfos = routeFiles.map(analyzeRoute);
  
  // Categorize routes
  const withErrorHandler = routeInfos.filter(r => r.usesWithErrorHandler);
  const withoutErrorHandler = routeInfos.filter(r => !r.usesWithErrorHandler);
  const needsUpdate = withoutErrorHandler.filter(r => r.hasTryCatch);
  const withConsoleLog = routeInfos.filter(r => r.hasConsoleLog);
  
  console.log('\n=== API Route Logging Analysis ===\n');
  console.log(`Total routes: ${routeInfos.length}`);
  console.log(`Using withErrorHandler: ${withErrorHandler.length}`);
  console.log(`Not using withErrorHandler: ${withoutErrorHandler.length}`);
  console.log(`Need update (have try-catch): ${needsUpdate.length}`);
  console.log(`Using console.log: ${withConsoleLog.length}`);
  
  if (needsUpdate.length > 0) {
    console.log('\n=== Routes that need to be updated to use withErrorHandler ===\n');
    needsUpdate.forEach(route => {
      const relativePath = path.relative(process.cwd(), route.path);
      console.log(`  - ${relativePath}`);
    });
  }
  
  if (withConsoleLog.length > 0) {
    console.log('\n=== Routes using console.log (should use Logger) ===\n');
    withConsoleLog.forEach(route => {
      const relativePath = path.relative(process.cwd(), route.path);
      console.log(`  - ${relativePath}`);
    });
  }
  
  console.log('\n=== Routes already using withErrorHandler (✓) ===\n');
  withErrorHandler.forEach(route => {
    const relativePath = path.relative(process.cwd(), route.path);
    console.log(`  ✓ ${relativePath}`);
  });
  
  console.log('\n');
}

main();
