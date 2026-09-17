const http = require('http');

const endpoints = [
  { name: 'Articles (Latest 60)', path: '/api/public/articles?limit=60&sort=latest' },
  { name: 'Hero Settings', path: '/api/public/hero-settings' },
  { name: 'Categories (Home)', path: '/api/public/categories?showInHome=true' },
  { name: 'Categories (Header)', path: '/api/public/categories?showInHeader=true' },
  { name: 'Breaking Tickers', path: '/api/public/tickers' },
  { name: 'Live Center Data', path: '/api/public/live-center' },
  { name: 'Market Rates (Gold/Silver)', path: '/api/public/market-rates' },
  { name: 'Videos (Portal)', path: '/api/public/videos?type=video' },
  { name: 'Shorts (Portal)', path: '/api/public/videos?type=short' },
  { name: 'Gallery Photos', path: '/api/public/gallery' },
  { name: 'Astrology Signs', path: '/api/public/astrology' },
  { name: 'Instagram Reels', path: '/api/public/reels?isActive=true&limit=50' },
  { name: 'Public Ads', path: '/api/public/ads' },
  { name: 'Tributes (Birthday/Shradh)', path: '/api/public/tributes' },
  { name: 'Public Support Details', path: '/api/public/support' },
  { name: 'Authors List', path: '/api/public/authors' },
  { name: 'Web Stories', path: '/api/public/web-stories' },
  { name: 'Epaper Editions', path: '/api/public/epaper' },
  { name: 'Epaper Cities', path: '/api/public/epaper/cities' },
  { name: 'Category: Gujarat', path: '/api/public/articles?limit=5&categorySlug=gujarat' },
  { name: 'Category: National', path: '/api/public/articles?limit=5&categorySlug=national' },
  { name: 'Category: Ahmedabad', path: '/api/public/articles?limit=5&categorySlug=ahmedabad' },
  { name: 'Category: Surat', path: '/api/public/articles?limit=5&categorySlug=surat' },
  { name: 'Category: Vadodara', path: '/api/public/articles?limit=5&categorySlug=vadodara' },
  { name: 'Category: Rajkot', path: '/api/public/articles?limit=5&categorySlug=rajkot' },
  { name: 'Category: Crime', path: '/api/public/articles?limit=5&categorySlug=crime' },
  { name: 'Category: Technology', path: '/api/public/articles?limit=5&categorySlug=technology' },
  { name: 'Category: Sports', path: '/api/public/articles?limit=5&categorySlug=sports' },
  { name: 'Category: Health', path: '/api/public/articles?limit=5&categorySlug=health' },
  { name: 'Category: Business', path: '/api/public/articles?limit=5&categorySlug=business' },
  { name: 'Category: Fact Check', path: '/api/public/articles?limit=5&categorySlug=fact-check' },
  { name: 'Category: Weather', path: '/api/public/articles?limit=5&categorySlug=weather' },
  { name: 'Category: Manoranjan', path: '/api/public/articles?limit=5&categorySlug=manoranjan' },
  { name: 'Category: Loksabha Election', path: '/api/public/articles?limit=5&categorySlug=loksabha-election' },
];

async function testAll() {
  console.log('========================================================================');
  console.log('             FULL WEBSITE PUBLIC API HEALTH & DATA AUDIT                ');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    const start = Date.now();
    await new Promise((resolve) => {
      http.get(`http://localhost:5000${ep.path}`, (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          const duration = Date.now() - start;
          const ok = res.statusCode === 200;
          let summary = '';
          try {
            const json = JSON.parse(d);
            if (json.data?.articles) summary = `${json.data.articles.length} articles (total in db: ${json.data.total})`;
            else if (json.data?.categories) summary = `${json.data.categories.length} categories`;
            else if (json.data?.videos) summary = `${json.data.videos.length} videos`;
            else if (json.data?.photos) summary = `${json.data.photos.length} photos`;
            else if (json.data?.tickers) summary = `${json.data.tickers.length} tickers`;
            else if (json.data?.signs) summary = `${json.data.signs.length} astrology signs`;
            else if (json.data?.reels) summary = `${json.data.reels.length} reels`;
            else if (json.data?.ads) summary = `${json.data.ads.length} ads`;
            else if (Array.isArray(json.data)) summary = `${json.data.length} items`;
            else if (json.data) summary = Object.keys(json.data).join(', ');
          } catch(e) {
            summary = d.substring(0, 30);
          }

          if (ok) {
            passed++;
            console.log(`✓ [${res.statusCode}] ${ep.name.padEnd(28)} (${duration}ms) -> ${summary}`);
          } else {
            failed++;
            console.log(`✗ [${res.statusCode}] ${ep.name.padEnd(28)} (${duration}ms) -> ERROR`);
          }
          resolve();
        });
      }).on('error', (err) => {
        failed++;
        console.log(`✗ [ERR] ${ep.name.padEnd(28)} -> ${err.message}`);
        resolve();
      });
    });
  }

  console.log('\n========================================================================');
  console.log(`Result: ${passed}/${endpoints.length} APIs OK (${failed} failed)`);
  console.log('========================================================================');
}

testAll().catch(console.error);
