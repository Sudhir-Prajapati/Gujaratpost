const http = require('http');

http.get('http://localhost:3000', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const idx = data.indexOf('onrender.com');
    if (idx !== -1) {
      console.log('Context of onrender.com in HTML:');
      console.log(data.substring(Math.max(0, idx - 150), Math.min(data.length, idx + 250)));
    } else {
      console.log('onrender.com NOT found in HTML!');
    }
  });
});
