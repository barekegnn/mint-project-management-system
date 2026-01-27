const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Files to fix with their param names
const filesToFix = [
  { file: 'src/app/api/team-members/[memberId]/tasks/route.ts', params: ['memberId'] },
  { file: 'src/app/api/team-member/tasks/[taskId]/route.ts', params: ['taskId'] },
  { file: 'src/app/api/reports/[reportId]/review.ts', params: ['reportId'] },
  { file: 'src/app/api/tasks/[taskId]/attachments/[attachmentId]/route.ts', params: ['taskId', 'attachmentId'] },
  { file: 'src/app/api/tasks/[taskId]/attachments/route.ts', params: ['taskId'] },
  { file: 'src/app/api/projects/[projectId]/team-members/[userId]/route.ts', params: ['projectId', 'userId'] },
  { file: 'src/app/api/projects/[projectId]/team-members/route.ts', params: ['projectId'] },
  { file: 'src/app/api/projects/[projectId]/tasks/route.ts', params: ['projectId'] },
  { file: 'src/app/api/projects/[projectId]/available-team-members/route.ts', params: ['projectId'] },
  { file: 'src/app/api/projects/by-holder/[holderId]/route.ts', params: ['holderId'] },
  { file: 'src/app/api/tasks/[taskId]/comments/route.ts', params: ['taskId'] },
  { file: 'src/app/api/team-members/[memberId]/route.ts', params: ['memberId'] },
  { file: 'src/app/api/project-managers/[id]/route.ts', params: ['id'] },
];

function fixFile(filePath, paramNames) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Build the param type string
    const paramType = paramNames.map(name => `${name}: string`).join('; ');
    const destructure = paramNames.length === 1 
      ? `const { ${paramNames[0]} } = await params;`
      : `const { ${paramNames.join(', ')} } = await params;`;
    
    // Pattern to match: { params }: { params: { id: string } }
    const oldPattern = new RegExp(
      `\\{ params \\}: \\{ params: \\{ ${paramType.replace(/;/g, ';?')} \\} \\}`,
      'g'
    );
    
    // Replace with Promise version
    const newPattern = `{ params }: { params: Promise<{ ${paramType} }> }`;
    
    // First, replace the type signature
    content = content.replace(oldPattern, newPattern);
    
    // Then, add await params destructuring after each function signature
    // Find all function declarations with the new params type
    const functionPattern = /export async function (GET|POST|PUT|PATCH|DELETE)\(\s*request: Request,\s*\{ params \}: \{ params: Promise<\{[^}]+\}> \}\s*\)\s*\{/g;
    
    content = content.replace(functionPattern, (match) => {
      // Check if destructuring already exists right after
      const afterMatch = content.substring(content.indexOf(match) + match.length, content.indexOf(match) + match.length + 100);
      if (afterMatch.trim().startsWith('const {') && afterMatch.includes('await params')) {
        return match; // Already fixed
      }
      return match + '\n  ' + destructure;
    });
    
    // Replace all params.paramName with just paramName
    paramNames.forEach(paramName => {
      const paramUsagePattern = new RegExp(`params\\.${paramName}`, 'g');
      content = content.replace(paramUsagePattern, paramName);
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`✗ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

console.log('Fixing async params in route files...\n');

let fixed = 0;
let failed = 0;

filesToFix.forEach(({ file, params }) => {
  if (fs.existsSync(file)) {
    if (fixFile(file, params)) {
      fixed++;
    } else {
      failed++;
    }
  } else {
    console.log(`⚠ File not found: ${file}`);
  }
});

console.log(`\nDone! Fixed: ${fixed}, Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
