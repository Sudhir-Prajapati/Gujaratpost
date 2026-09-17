const { createClient } = require('redis');
require('dotenv').config();

async function flushRedis() {
  console.log('=== CLEARING ALL REDIS CACHES ===\n');

  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  console.log('Connecting to Redis at:', redisUrl.replace(/:[^:@]+@/, ':****@'));

  const isTls = redisUrl.startsWith('rediss://');
  const client = createClient({
    url: redisUrl,
    socket: {
      tls: isTls,
      rejectUnauthorized: false,
      connectTimeout: 5000,
    }
  });

  try {
    await client.connect();
    console.log('✓ Connected to Redis successfully.');

    const initialKeys = await client.keys('*');
    console.log(`Initial keys in Redis: ${initialKeys.length}`);
    if (initialKeys.length > 0) {
      console.log('Keys before flush:', initialKeys);
    }

    console.log('\nExecuting FLUSHALL...');
    await client.flushAll();
    console.log('✓ FLUSHALL executed successfully.');

    const remainingKeys = await client.keys('*');
    console.log(`\nRemaining keys in Redis: ${remainingKeys.length}`);
    if (remainingKeys.length === 0) {
      console.log('✓ All Redis caches have been completely cleared!');
    } else {
      console.warn('Warning: Some keys remain:', remainingKeys);
    }

    await client.disconnect();
    console.log('✓ Redis client disconnected cleanly.');
  } catch (err) {
    console.error('Redis error:', err.message);
    process.exit(1);
  }
}

flushRedis().catch(console.error);
