import express from 'express';
import http from 'http';
import { RssController } from '../src/controllers/rss.controller.js';
import { XMLParser } from 'fast-xml-parser';

async function runTests() {
  const app = express();

  // Mount routes exactly as in backend/src/index.ts and public.routes.ts
  app.get('/rss-feed-politics.php', RssController.getLegacyPoliticsRss);
  app.get('/rss-feed-gallery.php', RssController.getLegacyGalleryRss);
  app.get('/api/public/rss-feed-politics.php', RssController.getLegacyPoliticsRss);
  app.get('/api/public/rss-feed-gallery.php', RssController.getLegacyGalleryRss);
  app.get('/rss.xml', RssController.getPublicRss);
  app.get('/rss/:category.xml', RssController.getPublicRss);
  app.get('/rss/:category', RssController.getPublicRss);
  app.get('/api/public/rss', RssController.getPublicRss);
  app.get('/api/public/rss/:category', RssController.getPublicRss);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5099, '127.0.0.1', () => resolve()));
  const baseUrl = 'http://127.0.0.1:5099';

  const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const legacyUrls = [
    '/rss-feed-politics.php?name=news',
    '/rss-feed-politics.php?name=gujarat',
    '/rss-feed-politics.php?name=gandhinagar',
    '/rss-feed-politics.php?name=ahmedabad',
    '/rss-feed-politics.php?name=surat',
    '/rss-feed-politics.php?name=vadodara',
    '/rss-feed-politics.php?name=rajkot',
    '/rss-feed-politics.php?name=others',
    '/rss-feed-politics.php?name=national',
    '/rss-feed-politics.php?name=international',
    '/rss-feed-politics.php?name=entertainment-life-style',
    '/rss-feed-politics.php?name=popular-stories',
    '/rss-feed-gallery.php',
    '/rss-feed-politics.php?name=politics',
    '/rss-feed-politics.php?name=fact-check',
    '/rss-feed-politics.php', // default without query param
  ];

  const currentAndNewUrls = [
    '/rss.xml',
    '/rss/home.xml',
    '/rss/gujarat.xml',
    '/rss/gandhinagar.xml',
    '/rss/ahmedabad.xml',
    '/rss/surat.xml',
    '/rss/vadodara.xml',
    '/rss/rajkot.xml',
    '/rss/other-cities.xml',
    '/rss/national.xml',
    '/rss/world.xml',
    '/rss/trending.xml',
    '/rss/photos.xml',
    '/rss/politics.xml',
    '/rss/fact-check.xml',
    '/rss/videos.xml',
    '/rss/video.xml',
    '/rss/instagram.xml',
    '/rss/health.xml',
    '/rss/technology.xml',
    '/rss/crime.xml',
  ];

  console.log('\n======================================================');
  console.log('   Testing 1: Legacy Dailyhunt PHP RSS Endpoints');
  console.log('======================================================');

  let passed = 0;
  let failed = 0;

  for (const urlPath of legacyUrls) {
    try {
      const res = await fetch(`${baseUrl}${urlPath}`);
      const contentType = res.headers.get('content-type') || '';
      const etag = res.headers.get('etag') || '';
      const text = await res.text();

      if (res.status !== 200) {
        console.error(`❌ FAIL [${res.status}]: ${urlPath}`);
        failed++;
        continue;
      }

      if (!contentType.includes('application/rss+xml')) {
        console.error(`❌ FAIL [Content-Type]: ${urlPath} -> ${contentType}`);
        failed++;
        continue;
      }

      const parsed = xmlParser.parse(text);
      const channel = parsed?.rss?.channel;
      if (!channel) {
        console.error(`❌ FAIL [Invalid XML]: ${urlPath}`);
        failed++;
        continue;
      }

      const items = Array.isArray(channel.item)
        ? channel.item
        : channel.item
        ? [channel.item]
        : [];

      console.log(
        `✅ PASS 200: ${urlPath.padEnd(52)} | Items: ${String(items.length).padStart(2)} | Title: "${channel.title}" | ETag: ${etag.slice(0, 10)}...`
      );
      passed++;
    } catch (err: any) {
      console.error(`❌ ERROR: ${urlPath} -> ${err.message}`);
      failed++;
    }
  }

  console.log('\n======================================================');
  console.log('   Testing 2: Current & New RSS 2.0 Endpoints');
  console.log('======================================================');

  for (const urlPath of currentAndNewUrls) {
    try {
      const res = await fetch(`${baseUrl}${urlPath}`);
      const contentType = res.headers.get('content-type') || '';
      const etag = res.headers.get('etag') || '';
      const text = await res.text();

      if (res.status !== 200) {
        console.error(`❌ FAIL [${res.status}]: ${urlPath}`);
        failed++;
        continue;
      }

      if (!contentType.includes('application/rss+xml')) {
        console.error(`❌ FAIL [Content-Type]: ${urlPath} -> ${contentType}`);
        failed++;
        continue;
      }

      const parsed = xmlParser.parse(text);
      const channel = parsed?.rss?.channel;
      if (!channel) {
        console.error(`❌ FAIL [Invalid XML]: ${urlPath}`);
        failed++;
        continue;
      }

      const items = Array.isArray(channel.item)
        ? channel.item
        : channel.item
        ? [channel.item]
        : [];

      console.log(
        `✅ PASS 200: ${urlPath.padEnd(28)} | Items: ${String(items.length).padStart(2)} | Title: "${channel.title}" | ETag: ${etag.slice(0, 10)}...`
      );
      passed++;
    } catch (err: any) {
      console.error(`❌ ERROR: ${urlPath} -> ${err.message}`);
      failed++;
    }
  }

  console.log('\n======================================================');
  console.log(`   Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  server.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
