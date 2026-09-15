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
let missingInputLabel = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(process.cwd(), file);
  const inputMatches = [...content.matchAll(/<input\b([^>]*)>/g)];

  inputMatches.forEach(m => {
    const attrs = m[1];
    const type = attrs.match(/type\s*=\s*["']([^"']+)["']/)?.[1] || 'text';
    if (type === 'hidden') return;
    const hasAria = /aria-label\s*=|aria-labelledby\s*=/i.test(attrs);
    const hasId = /\bid\s*=/i.test(attrs);

    if (!hasAria && !hasId) {
      missingInputLabel.push({
        file: rel,
        type,
        snippet: m[0].replace(/\s+/g, ' ')
      });
    }
  });
});

console.log(`Inputs missing accessible label: ${missingInputLabel.length}`);
missingInputLabel.forEach(i => {
  console.log(`  - in ${i.file} (type: ${i.type}) => ${i.snippet}`);
});
