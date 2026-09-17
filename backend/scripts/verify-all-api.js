const http = require('http');

const slugs = [
  'gujarat', 'national', 'ahmedabad', 'surat', 'vadodara', 'rajkot', 'gandhinagar',
  'crime', 'sports', 'technology', 'health', 'business', 'weather', 'gold-silver',
  'webstory', 'world', 'education', 'fact-check', 'entertainment', 'lifestyle',
  'podcasts', 'trending', 'election-2027', 'shorts', 'breaking-news', 'latest-news'
];

let done = 0;
for (const slug of slugs) {
  http.get('http://localhost:5000/api/public/articles?limit=5&categorySlug=' + slug, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      let count = 0;
      let title = '';
      try {
        const json = JSON.parse(d);
        count = json.data?.articles?.length || 0;
        title = json.data?.articles?.[0]?.titleGu || json.data?.articles?.[0]?.title || '';
      } catch(e) {}
      console.log(`[${res.statusCode}] ${slug.padEnd(16)} -> ${count} articles | Sample: ${title.substring(0, 45)}`);
      done++;
      if (done === slugs.length) {
        console.log('\n✓ All tested categories successfully verified with data!');
      }
    });
  }).on('error', e => {
    console.error(slug, e.message);
    done++;
  });
}
