const fs = require('fs');
const dorms = JSON.parse(fs.readFileSync('src/data/dorms.json', 'utf8'));

async function verifyAll() {
  console.log('=== START VERIFICATION: IMAGES & LAST-UPDATED METADATA ===\n');
  let failures = 0;

  // 1. Verify Image HTTP responses
  console.log('--- 1. Image HTTP Accessibility Audit ---');
  const criticalImages = [
    '/cover.jpg',
    '/Picture/default-dorm.jpg',
    '/icon.svg',
  ];
  
  // Sample dorm images including those with spaces
  const spaceDorms = dorms.filter(d => d.image && d.image.includes(' '));
  const normalDorms = dorms.filter(d => d.image && !d.image.includes(' ')).slice(0, 5);
  const testImages = [...criticalImages, ...spaceDorms.map(d => encodeURI(d.image)), ...normalDorms.map(d => encodeURI(d.image))];

  for (const imgPath of testImages) {
    const url = 'http://localhost:3000' + imgPath;
    try {
      const res = await fetch(url);
      if (res.status === 200) {
        console.log(`[PASS] ${imgPath} => 200 OK (${res.headers.get('content-type')})`);
      } else {
        console.error(`[FAIL] ${imgPath} => Status: ${res.status}`);
        failures++;
      }
    } catch (e) {
      console.error(`[ERROR] ${imgPath} =>`, e.message);
      failures++;
    }
  }

  // 2. Verify Dorm Detail Page Metadata & Structured Data
  console.log('\n--- 2. Metadata & Structured Data Audit ---');
  const sampleIds = [1, 24, 48]; // One from 5 พ.ค., one from 6 พ.ค., one from 7 พ.ค.

  for (const id of sampleIds) {
    const dorm = dorms.find(d => d.id === id);
    const url = `http://localhost:3000/dorm/${id}`;
    console.log(`\nTesting Dorm #${id}: ${dorm.name} (Evaluation Date: ${dorm.evaluationDate})`);

    try {
      const res = await fetch(url);
      const html = await res.text();

      // Check Alt Text
      const hasDescriptiveAlt = html.includes(`alt="ภาพถ่ายอาคารหอพัก ${dorm.name}"`);
      console.log(`  - Descriptive Alt Text: ${hasDescriptiveAlt ? 'PASS' : 'FAIL'}`);
      if (!hasDescriptiveAlt) failures++;

      // Check JSON-LD: find the ApartmentComplex script
      const allJsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
      const apartmentScript = allJsonLd.find(m => m[1].includes('"ApartmentComplex"'));

      if (apartmentScript) {
        try {
          const jsonLd = JSON.parse(apartmentScript[1]);
          const hasDateModified = Boolean(jsonLd.dateModified);
          const hasDatePublished = Boolean(jsonLd.datePublished);
          const hasProperty = jsonLd.additionalProperty && jsonLd.additionalProperty.some(p => p.name === 'วันที่ตรวจประเมินมาตรฐานหอพัก');
          
          console.log(`  - JSON-LD dateModified: ${hasDateModified ? 'PASS (' + jsonLd.dateModified + ')' : 'FAIL'}`);
          console.log(`  - JSON-LD datePublished: ${hasDatePublished ? 'PASS (' + jsonLd.datePublished + ')' : 'FAIL'}`);
          console.log(`  - JSON-LD additionalProperty (ตรวจประเมิน): ${hasProperty ? 'PASS' : 'FAIL'}`);

          if (!hasDateModified || !hasDatePublished || !hasProperty) failures++;
        } catch (e) {
          console.error('  - JSON-LD parse error:', e.message);
          failures++;
        }
      } else {
        console.error('  - ApartmentComplex JSON-LD script not found!');
        failures++;
      }

      // Check OpenGraph / article:modified_time
      const hasOgModified = html.includes('article:modified_time') || html.includes('modified_time');
      console.log(`  - OpenGraph / Meta modified_time: ${hasOgModified ? 'PASS' : 'FAIL'}`);
      if (!hasOgModified) failures++;

      // Check DOM <time dateTime="...">
      const hasTimeTag = html.includes('<time dateTime="2026-05-');
      console.log(`  - DOM <time dateTime="..."> element: ${hasTimeTag ? 'PASS' : 'FAIL'}`);
      if (!hasTimeTag) failures++;

    } catch (e) {
      console.error(`[ERROR] ${url} =>`, e.message);
      failures++;
    }
  }

  // 3. Verify Sitemap.xml
  console.log('\n--- 3. Sitemap XML Audit ---');
  try {
    const sitemapRes = await fetch('http://localhost:3000/sitemap.xml');
    const sitemapXml = await sitemapRes.text();
    const has2026Date = sitemapXml.includes('2026-05-05') || sitemapXml.includes('2026-05-06') || sitemapXml.includes('2026-05-07');
    console.log(`  - Sitemap returns status: ${sitemapRes.status}`);
    console.log(`  - Sitemap contains real evaluation lastmod (2026-05-XX): ${has2026Date ? 'PASS' : 'FAIL'}`);
    if (sitemapRes.status !== 200 || !has2026Date) failures++;
  } catch (e) {
    console.error('  - Error fetching sitemap:', e.message);
    failures++;
  }

  // 4. Verify Welcome Screen Component and Homepage Metadata
  console.log('\n--- 4. Welcome Screen & OpenGraph Audit ---');
  try {
    const welcomeSrc = fs.readFileSync('src/components/WelcomeScreen.tsx', 'utf8');
    const hasWelcomeAlt = welcomeSrc.includes('alt="ภาพหน้าปกแนะนำแอปพลิเคชัน Dormie UBU ค้นหาหอพัก มหาวิทยาลัยอุบลราชธานี"');
    const hasPriority = welcomeSrc.includes('fetchPriority="high"');
    console.log(`  - WelcomeScreen.tsx descriptive alt: ${hasWelcomeAlt ? 'PASS' : 'FAIL'}`);
    console.log(`  - WelcomeScreen.tsx fetchPriority="high": ${hasPriority ? 'PASS' : 'FAIL'}`);
    if (!hasWelcomeAlt || !hasPriority) failures++;

    const homeRes = await fetch('http://localhost:3000/');
    const homeHtml = await homeRes.text();
    const hasOgCover = homeHtml.includes('/cover.jpg');
    const hasOgAlt = homeHtml.includes('ภาพปกแนะนำแอปพลิเคชันค้นหาหอพัก');
    console.log(`  - Homepage OpenGraph image (/cover.jpg): ${hasOgCover ? 'PASS' : 'FAIL'}`);
    console.log(`  - Homepage OpenGraph image alt text: ${hasOgAlt ? 'PASS' : 'FAIL'}`);
    if (!hasOgCover || !hasOgAlt) failures++;
  } catch (e) {
    console.error('  - Error verifying Welcome & OG:', e.message);
    failures++;
  }

  console.log(`\n=== FINAL RESULT: ${failures === 0 ? 'ALL VERIFICATIONS PASSED (0 ERRORS)' : failures + ' ERRORS FOUND'} ===`);
  process.exit(failures === 0 ? 0 : 1);
}

verifyAll();
