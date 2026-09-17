const fs = require('fs');
const content = fs.readFileSync('src/routes/public.routes.ts', 'utf8');
const regex = /router\.(get|post|put|delete)\s*\(\s*['"]([^'"]+)['"]/g;
let match;
console.log('--- Public Routes in public.routes.ts ---');
while ((match = regex.exec(content)) !== null) {
  console.log(match[1].toUpperCase(), '/api/public' + match[2]);
}

const indexContent = fs.readFileSync('src/index.ts', 'utf8');
console.log('\n--- Root app routes in index.ts ---');
const appRegex = /app\.use\s*\(\s*['"]([^'"]+)['"]/g;
while ((match = appRegex.exec(indexContent)) !== null) {
  console.log('USE', match[1]);
}
