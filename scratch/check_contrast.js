const fs = require('fs');
const path = require('path');

function getTsxFiles(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(getTsxFiles(fullPath));
    } else if (file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getTsxFiles('src');
console.log('Scanning for potentially low contrast text classes...\n');

// Look for text-slate-300, text-gray-300, text-amber-200/300 on white backgrounds
const potentialIssues = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(process.cwd(), file);
  
  // Find lines with light text
  const lines = content.split('\n');
  lines.forEach((line, lineNum) => {
    if (/\btext-(?:slate|gray|zinc)-(?:300|400)\b/.test(line)) {
      // Check if it's readable small text or placeholder
      if (!line.includes('placeholder:') && !line.includes('dark:') && !line.includes('bg-') && !line.includes('stroke') && !line.includes('Icon')) {
        // Just flag for review
      }
    }
    // Check for amber-300 or amber-400 text on white bg
    if (/\btext-amber-(?:200|300|400)\b/.test(line) && /\bbg-white\b/.test(line)) {
      potentialIssues.push({
        file: rel,
        line: lineNum + 1,
        content: line.trim()
      });
    }
  });
});

console.log(`Found ${potentialIssues.length} instances of yellow/amber text directly on bg-white:`);
potentialIssues.forEach(p => console.log(`  - [${p.file}:${p.line}] ${p.content.substring(0, 100)}`));
