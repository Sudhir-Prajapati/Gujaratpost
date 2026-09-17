const https = require('https');

https.get('https://gujaratpost.in', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Fetched homepage, length:', data.length);
    const regex = /<img[^>]+src=["']([^"']+)["']/gi;
    const matches = [];
    let match;
    while ((match = regex.exec(data)) !== null) {
      matches.push(match[1]);
    }
    console.log('Found image count:', matches.length);
    const unique = [...new Set(matches)];
    console.log('Sample image URLs:');
    console.log(unique.slice(0, 30));
  });
}).on('error', console.error);
