const http = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data.substring(0, 100) });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('===============================================================');
  console.log('    TESTING LIVE API ENDPOINTS ON PORT 5000 (PORT 3307 DB)     ');
  console.log('===============================================================');

  const tests = [
    { name: 'Articles (General)', url: 'http://localhost:5000/api/public/articles?limit=5' },
    { name: 'Articles (Gujarat)', url: 'http://localhost:5000/api/public/articles?categorySlug=gujarat&limit=5' },
    { name: 'Articles (National)', url: 'http://localhost:5000/api/public/articles?categorySlug=national&limit=5' },
    { name: 'Articles (Entertainment)', url: 'http://localhost:5000/api/public/articles?categorySlug=entertainment&limit=5' },
    { name: 'Articles (Sports)', url: 'http://localhost:5000/api/public/articles?categorySlug=sports&limit=5' },
    { name: 'Categories List', url: 'http://localhost:5000/api/public/categories' },
    { name: 'Breaking Tickers', url: 'http://localhost:5000/api/public/tickers' },
    { name: 'Videos', url: 'http://localhost:5000/api/public/videos?limit=5' },
    { name: 'Gallery Photos', url: 'http://localhost:5000/api/public/gallery?limit=5' },
  ];

  let sampleSlug = '';

  for (const t of tests) {
    try {
      const res = await fetchJson(t.url);
      const data = res.data?.data || res.data;
      const count = Array.isArray(data)
        ? data.length
        : (data?.articles ? data.articles.length : (data?.categories ? data.categories.length : 'OK'));

      console.log(`✓ ${t.name.padEnd(25)} -> Status ${res.status} | Count/Data: ${count}`);

      if (t.name === 'Articles (General)' && data?.articles?.length > 0) {
        sampleSlug = data.articles[0].slug;
        console.log(`   Sample article featuredImage: ${data.articles[0].featuredImage}`);
      }
    } catch (e) {
      console.log(`✗ ${t.name.padEnd(25)} -> Error: ${e.message}`);
    }
  }

  if (sampleSlug) {
    console.log(`\nTesting Article Detail for slug: "${sampleSlug}"...`);
    try {
      const detailRes = await fetchJson(`http://localhost:5000/api/public/articles/${encodeURIComponent(sampleSlug)}`);
      const art = detailRes.data?.data || detailRes.data?.article || detailRes.data;
      console.log(`✓ Article Detail -> Status ${detailRes.status} | Title: ${art?.titleGu || art?.title}`);
      console.log(`  Featured Image: ${art?.featuredImage}`);
      console.log(`  Content length: ${art?.contentGu?.length || art?.content?.length} chars`);
    } catch (e) {
      console.log(`✗ Article Detail -> Error: ${e.message}`);
    }
  }

  // Test Uploads fallback route
  console.log('\nTesting /uploads fallback redirect...');
  const redirectRes = await new Promise((resolve) => {
    http.get('http://localhost:5000/uploads/test-image-123.jpg', (res) => {
      resolve({ status: res.statusCode, location: res.headers.location });
    });
  });
  console.log(`✓ /uploads fallback -> Status ${redirectRes.status} | Redirects to: ${redirectRes.location}`);

  console.log('\n===============================================================');
  console.log('                     ALL TESTS COMPLETED                       ');
  console.log('===============================================================');
}

runTests().catch(console.error);
