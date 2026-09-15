const fs = require('fs');
const path = require('path');

function getTsxFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getTsxFiles(fullPath));
    } else if (file.endsWith('.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getTsxFiles('src');
console.log(`Auditing ${files.length} TSX files for Accessibility & Mobile Responsive issues...\n`);

const issues = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(process.cwd(), file);

  // 1. Check for buttons without text or aria-label
  // Match <button ...> without text and without aria-label
  const buttonRegex = /<button\b([^>]*)>([\s\S]*?)<\/button>/g;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    const attrs = match[1];
    const inner = match[2].trim();
    const hasAriaLabel = /aria-label\s*=|aria-labelledby\s*=/i.test(attrs);
    const hasVisibleText = inner.replace(/<[^>]*>/g, '').trim().length > 0;
    
    if (!hasAriaLabel && !hasVisibleText) {
      issues.push({
        file: relPath,
        type: 'A11Y_EMPTY_BUTTON',
        desc: `Button has no visible text and no aria-label: ${match[0].substring(0, 100)}...`
      });
    }
  }

  // 2. Check for inputs without label or aria-label
  const inputRegex = /<input\b([^>]*)>/g;
  while ((match = inputRegex.exec(content)) !== null) {
    const attrs = match[1];
    const typeMatch = attrs.match(/type\s*=\s*["']([^"']+)["']/);
    const inputType = typeMatch ? typeMatch[1] : 'text';
    if (inputType === 'hidden') continue;

    const hasAriaLabel = /aria-label\s*=|aria-labelledby\s*=|id\s*=/i.test(attrs);
    if (!hasAriaLabel) {
      issues.push({
        file: relPath,
        type: 'A11Y_UNLABELED_INPUT',
        desc: `Input type="${inputType}" has no aria-label, aria-labelledby, or id: ${match[0]}`
      });
    }
  }

  // 3. Check for links <a> without text or aria-label
  const linkRegex = /<(?:a|Link)\b([^>]*)>([\s\S]*?)<\/(?:a|Link)>/g;
  while ((match = linkRegex.exec(content)) !== null) {
    const attrs = match[1];
    const inner = match[2].trim();
    const hasAriaLabel = /aria-label\s*=|aria-labelledby\s*=/i.test(attrs);
    const hasVisibleText = inner.replace(/<[^>]*>/g, '').trim().length > 0;
    const hasImgWithAlt = /<img\b[^>]*alt\s*=\s*["'][^"']+["']/i.test(inner);

    if (!hasAriaLabel && !hasVisibleText && !hasImgWithAlt) {
      issues.push({
        file: relPath,
        type: 'A11Y_EMPTY_LINK',
        desc: `Link has no text, no aria-label, and no image with alt: ${match[0].substring(0, 100)}...`
      });
    }
  }

  // 4. Check for nested interactive elements (button inside a, button inside button, etc.)
  const nestedButtonInA = /<(?:a|Link)\b[^>]*>[\s\S]*?<button\b/g;
  if (nestedButtonInA.test(content)) {
    issues.push({
      file: relPath,
      type: 'A11Y_NESTED_INTERACTIVE',
      desc: 'Found <button> nested inside <a> or <Link>!'
    });
  }

  // 5. Check for horizontal overflow risks (fixed pixel widths > 320px without max-w-full)
  const fixedWidthRegex = /className=["'][^"']*\bw-(\d+)\b[^"']*["']/g;
  // w-80 = 20rem = 320px, w-96 = 24rem = 384px (can overflow iPhone SE 375px if not max-w-full or inside flex/grid)
  const wideFixedRegex = /className=["'][^"']*\b(w-\[?\d{3,}px\]?|w-(?:80|96))\b[^"']*["']/g;
  let wMatch;
  while ((wMatch = wideFixedRegex.exec(content)) !== null) {
    const classStr = wMatch[0];
    if (!classStr.includes('max-w') && !classStr.includes('sm:') && !classStr.includes('md:') && !classStr.includes('overflow')) {
      // Potentially wide element on small screen
    }
  }
});

console.log(`Found ${issues.length} potential accessibility/responsive items:`);
issues.forEach((item, idx) => {
  console.log(`[${idx + 1}] [${item.type}] in ${item.file}:`);
  console.log(`    ${item.desc}`);
});
