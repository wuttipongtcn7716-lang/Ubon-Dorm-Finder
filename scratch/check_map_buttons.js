const fs = require('fs');
const content = fs.readFileSync('src/components/MapComponent.tsx', 'utf8');

const btnMatches = [...content.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];
console.log('Total buttons in MapComponent.tsx:', btnMatches.length);

let emptyAria = [];
btnMatches.forEach((m, i) => {
  const attrs = m[1];
  const inner = m[2].trim();
  const text = inner.replace(/<[^>]*>/g, '').trim();
  const hasAria = /aria-label\s*=|aria-labelledby\s*=/i.test(attrs);
  const titleMatch = attrs.match(/title\s*=\s*["']([^"']+)["']/);
  const title = titleMatch ? titleMatch[1] : null;

  if (!hasAria && !text) {
    emptyAria.push({ index: i, title, snippet: m[0].substring(0, 120).replace(/\s+/g, ' ') });
  }
});

console.log('Buttons without visible text and without aria-label:', emptyAria.length);
emptyAria.forEach(b => console.log('  - Title:', b.title, '| Snippet:', b.snippet));
