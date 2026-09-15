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
console.log(`Checking buttons across all ${files.length} TSX files...`);

let totalButtons = 0;
let missingAccessibleName = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(process.cwd(), file);
  const btnMatches = [...content.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
  totalButtons += btnMatches.length;

  btnMatches.forEach((m, idx) => {
    const attrs = m[1];
    const inner = m[2].trim();
    const hasAria = /aria-label\s*=|aria-labelledby\s*=/i.test(attrs);
    const visibleText = inner.replace(/<[^>]*>/g, '').trim();

    if (!hasAria && !visibleText) {
      const titleMatch = attrs.match(/title\s*=\s*["']([^"']+)["']/);
      missingAccessibleName.push({
        file: rel,
        title: titleMatch ? titleMatch[1] : null,
        snippet: m[0].substring(0, 100).replace(/\s+/g, ' ')
      });
    }
  });
});

console.log(`Audited ${totalButtons} buttons in total.`);
console.log(`Buttons missing accessible name: ${missingAccessibleName.length}`);
missingAccessibleName.forEach(b => {
  console.log(`  - in ${b.file}: (title: ${b.title}) => ${b.snippet}`);
});
