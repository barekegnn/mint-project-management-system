/**
 * Script to check which API routes are using withErrorHandler
 * and which ones need to be updated for task 9.4
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteStatus {
  path: string;
  hasWithErrorHandler: boolean;
  hasTryCatch: boolean;
  hasLogging: boolean;
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

function checkRoutes() {
  const routeFiles = findRouteFiles('src/app/api');

  const results: RouteStatus[] = [];
  const needsUpdate: string[] = [];
  const alreadyUpdated: string[] = [];

  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    
    const hasWithErrorHandler = content.includes('withErrorHandler');
    const hasTryCatch = /try\s*{/.test(content);
    const hasLogging = content.includes('Logger.');

    results.push({
      path: file,
      hasWithErrorHandler,
      hasTryCatch,
      hasLogging,
    });

    if (!hasWithErrorHandler) {
      needsUpdate.push(file);
    } else {
      alreadyUpdated.push(file);
    }
  }

  console.log('\n=== API Routes Logging Status ===\n');
  console.log(`Total routes: ${routeFiles.length}`);
  console.log(`Already using withErrorHandler: ${alreadyUpdated.length}`);
  console.log(`Need to be updated: ${needsUpdate.length}\n`);

  if (needsUpdate.length > 0) {
    console.log('Routes that need withErrorHandler:\n');
    needsUpdate.forEach(file => {
      const status = results.find(r => r.path === file);
      const info = [];
      if (status?.hasTryCatch) info.push('has try-catch');
      if (status?.hasLogging) info.push('has logging');
      console.log(`  - ${file}${info.length > 0 ? ` (${info.join(', ')})` : ''}`);
    });
  }

  console.log('\n');
}

checkRoutes();
