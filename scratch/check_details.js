async function checkDetails() {
  const dormHtml = await (await fetch('http://localhost:3000/dorm/1')).text();
  const allJsonLd = [...dormHtml.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (allJsonLd[1]) {
    console.log('Script 2 JSON-LD:');
    console.log(JSON.stringify(JSON.parse(allJsonLd[1][1]), null, 2));
  }

  const homeHtml = await (await fetch('http://localhost:3000/')).text();
  // Find where cover.jpg appears in homeHtml
  const idx = homeHtml.indexOf('cover.jpg');
  if (idx !== -1) {
    console.log('\nSnippet around cover.jpg in homeHtml:');
    console.log(homeHtml.substring(Math.max(0, idx - 100), Math.min(homeHtml.length, idx + 200)));
  }
}
checkDetails();
