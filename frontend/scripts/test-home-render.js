const http = require('http');

http.get('http://localhost:3000', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Homepage HTTP Status:', res.statusCode);
    console.log('Has 33824 title?:', data.includes('ઓર્ગેનિકના દાવાઓ'));
    console.log('Has 341 title?:', data.includes('ગુજરાતની શાળાઓમાં ડિજિટલ'));
    console.log('Has onrender.com?:', data.includes('onrender.com'));
    const imgMatches = data.match(/https?:\/\/[^\s"'<>]+\.(jpg|jpeg|png|webp)/gi) || [];
    console.log('Sample rendered image URLs:');
    console.log(imgMatches.slice(0, 5));
  });
}).on('error', e => console.error(e.message));
