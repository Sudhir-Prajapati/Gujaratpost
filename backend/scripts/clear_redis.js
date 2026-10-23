require('dotenv').config();
const { createClient } = require('redis');

async function clearRedis() {
  const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  console.log('Connecting to Redis...');
  
  const client = createClient({
    url,
    socket: {
      tls: url.startsWith('rediss://'),
      rejectUnauthorized: false
    }
  });

  client.on('error', (err) => console.error('Redis error:', err.message));

  await client.connect();
  console.log('Connected.');

  const beforeKeys = await client.keys('*');
  console.log(`Found ${beforeKeys.length} keys in Redis cache.`);

  await client.flushDb();
  console.log('✅ Redis database successfully cleared (FLUSHDB complete).');

  const afterKeys = await client.keys('*');
  console.log(`Keys remaining: ${afterKeys.length}`);

  await client.disconnect();
}

clearRedis().catch((err) => {
  console.error('Failed to clear Redis:', err);
  process.exit(1);
});
