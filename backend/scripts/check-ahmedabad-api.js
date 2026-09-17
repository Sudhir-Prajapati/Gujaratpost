const http = require('http');

http.get('http://localhost:5000/api/public/articles?limit=12&categorySlug=ahmedabad', (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const json = JSON.parse(data);
    const articles = json.data?.articles || [];
    console.log(`Returned ${articles.length} articles from API for ahmedabad:`);
    articles.forEach((a, i) => {
      console.log(`${i + 1}. [${a.id}] ${a.titleGu || a.title}`);
      console.log(`   Image: ${a.image || a.featuredImage}`);
      console.log(`   Category:`, a.category);
    });
  });
});
