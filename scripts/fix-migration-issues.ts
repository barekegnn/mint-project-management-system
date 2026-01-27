/**
 * Fix migration issues in API routes
 * Removes leftover try-catch blocks and fixes syntax errors
 */

import * as fs from 'fs';

const filesToFix = [
  'src/app/api/projects/[projectId]/tasks/route.ts',
  'src/app/api/team-member/achievements/route.ts',
  'src/app/api/team-member/notifications/route.ts',
  'src/app/api/team-members/route.ts',
  'src/app/api/users/create/route.ts',
];

function removeTryCatchBlocks(content: string): string {
  // Remove try-catch blocks that are inside withErrorHandler
  // Pattern: try { ... } catch (error) { ... }
  
  let modified = content;
  
  // Remove standalone try-catch blocks
  const tryCatchPattern = /try\s*\{([\s\S]*?)\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?\}/g;
  
  // This is a simplified approach - just remove the try-catch wrapper
  modified = modified.replace(tryCatchPattern, (match, body) => {
    // Keep the body, remove the try-catch wrapper
    return body;
  });
  
  return modified;
}

function fixFile(filePath: string): boolean {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    const originalContent = content;

    // Remove try-catch blocks
    content = removeTryCatchBlocks(content);

    if (content === originalContent) {
      console.log(`  ⚠ ${filePath} - No changes needed`);
      return false;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ ${filePath} - Fixed`);
    return true;
  } catch (error) {
    console.error(`  ❌ ${filePath} - Error: ${error}`);
    return false;
  }
}

function main() {
  console.log('\n=== Fixing Migration Issues ===\n');

  let fixed = 0;
  for (const file of filesToFix) {
    if (fixFile(file)) {
      fixed++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Fixed: ${fixed}/${filesToFix.length}\n`);
}

main();
