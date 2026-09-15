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
console.log('Auditing mobile responsiveness & width constraints...');

const overflowRisks = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(process.cwd(), file);

  // Match class names with min-w-[...] > 320px or w-[...] > 320px without responsive prefix (sm:, md:, lg:)
  const regex = /(?:className|class)\s*=\s*["']([^"']+)["']/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const classNames = match[1].split(/\s+/);
    classNames.forEach(cls => {
      // Check for hardcoded min-w or w larger than 320px without breakpoint prefix
      if (!/^(sm:|md:|lg:|xl:|2xl:)/.test(cls)) {
        const customPx = cls.match(/^(?:min-)?w-\[(\d+)px\]$/);
        if (customPx && parseInt(customPx[1], 10) > 340) {
          overflowRisks.push({ file: rel, cls, line: match[0].substring(0, 80) });
        }
        if (/^(?:min-)?w-(?:80|96)$/.test(cls)) {
          // 80 = 320px, 96 = 384px
          // Check if parent has max-w-full or if it's responsive
          overflowRisks.push({ file: rel, cls, line: match[0].substring(0, 80) });
        }
      }
    });
  }
});

console.log(`Potential width risks without breakpoint: ${overflowRisks.length}`);
overflowRisks.forEach(r => console.log(`  - in ${r.file}: ${r.cls} => ${r.line}`));
