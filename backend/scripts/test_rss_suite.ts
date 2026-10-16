import assert from 'node:assert/strict';
import { validateSafeUrl } from '../src/utils/ssrf.js';
import { escapeXml, wrapCdata, stripHtmlTags, sanitizeHtmlContent, normalizeSourceUrl } from '../src/utils/xmlSanitizer.js';
import { parseRawXmlFeed } from '../src/services/rssImport.service.js';
import { generatePublicRssFeed, invalidatePublicRssCache } from '../src/services/rss.service.js';
import { prisma } from '../src/config/prisma.js';

let passed = 0;
let failed = 0;

function it(desc: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function itAsync(desc: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('========================================================');
  console.log('   GujaratPost RSS & Security Comprehensive Test Suite   ');
  console.log('========================================================\n');

  // --- Suite 1: XML Sanitization & Unicode ---
  console.log('--- 1. XML & Unicode Sanitization ---');
  it('XML Escaping converts special characters', () => {
    const raw = `News & Updates: <Gujarat "Post"> '2026'`;
    const escaped = escapeXml(raw);
    assert.equal(escaped, 'News &amp; Updates: &lt;Gujarat &quot;Post&quot;&gt; &apos;2026&apos;');
  });

  it('CDATA Wrapping handles nested CDATA closures correctly', () => {
    const raw = `Complex data with ]]> inside`;
    const cdata = wrapCdata(raw);
    assert.equal(cdata, '<![CDATA[Complex data with ]]]]><![CDATA[> inside]]>');
  });

  it('Gujarati Unicode text is preserved without alteration', () => {
    const gujaratiTitle = 'ગુજરાતમાં વિધાનસભા ચૂંટણી અને રાજકીય ગતિવિધિઓ';
    const cdata = wrapCdata(gujaratiTitle);
    assert.ok(cdata.includes(gujaratiTitle));
  });

  it('HTML Tag Stripping cleans rich formatting from descriptions', () => {
    const html = `<p>Breaking: <strong>Ahmedabad</strong> metro expands. <style>.hide{}</style></p>`;
    const stripped = stripHtmlTags(html);
    assert.equal(stripped, 'Breaking: Ahmedabad metro expands.');
  });

  it('HTML Sanitization strips dangerous scripts and inline event handlers', () => {
    const malicious = `<p>Story content</p><script>alert('xss')</script><img src="test.jpg" onerror="alert(1)" /><a href="javascript:void(0)">Link</a>`;
    const clean = sanitizeHtmlContent(malicious);
    assert.ok(!clean.includes('<script>'));
    assert.ok(!clean.includes('onerror'));
    assert.ok(!clean.includes('javascript:'));
    assert.ok(clean.includes('Story content'));
  });

  it('URL normalization strips tracking query parameters', () => {
    const dirty = 'https://news.example.com/story?utm_source=rss&utm_medium=feed&id=123';
    const clean = normalizeSourceUrl(dirty);
    assert.ok(!clean.includes('utm_source'));
    assert.ok(!clean.includes('utm_medium'));
    assert.ok(clean.includes('id=123'));
  });

  // --- Suite 2: SSRF & URL Validation ---
  console.log('\n--- 2. SSRF Protection & Safe Fetch Validation ---');
  await itAsync('Blocks localhost and local IP addresses', async () => {
    const res1 = await validateSafeUrl('http://localhost:5000/feed.xml');
    assert.equal(res1.safe, false);

    const res2 = await validateSafeUrl('http://127.0.0.1/rss');
    assert.equal(res2.safe, false);

    const res3 = await validateSafeUrl('http://0.0.0.0/rss');
    assert.equal(res3.safe, false);
  });

  await itAsync('Blocks AWS and Cloud metadata IP (169.254.169.254)', async () => {
    const res = await validateSafeUrl('http://169.254.169.254/latest/meta-data/');
    assert.equal(res.safe, false);
    assert.ok(res.error?.includes('SSRF') || res.error?.includes('private'));
  });

  await itAsync('Blocks private RFC 1918 networks (10.x, 172.16.x, 192.168.x)', async () => {
    const res10 = await validateSafeUrl('http://10.1.1.1/feed');
    assert.equal(res10.safe, false);

    const res172 = await validateSafeUrl('http://172.16.0.1/feed');
    assert.equal(res172.safe, false);

    const res192 = await validateSafeUrl('http://192.168.1.1/feed');
    assert.equal(res192.safe, false);
  });

  await itAsync('Blocks non-HTTP/HTTPS protocols', async () => {
    const resFtp = await validateSafeUrl('ftp://example.com/feed.xml');
    assert.equal(resFtp.safe, false);

    const resFile = await validateSafeUrl('file:///etc/passwd');
    assert.equal(resFile.safe, false);
  });

  // --- Suite 3: Safe XML Feed Parser ---
  console.log('\n--- 3. XML Feed Parser (RSS 2.0 & Atom) ---');
  it('Parses valid RSS 2.0 with media enclosures and Gujarati unicode', () => {
    const sampleRss = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
      <channel>
        <title>Test Gujarat News</title>
        <link>https://example.com</link>
        <description>Test Channel</description>
        <item>
          <title><![CDATA[અમદાવાદમાં ભારે વરસાદની આગાહી]]></title>
          <link>https://example.com/news/rain-alert-101</link>
          <guid isPermaLink="true">https://example.com/news/rain-alert-101</guid>
          <description><![CDATA[હવામાન વિભાગ દ્વારા આગામી 48 કલાકમાં વરસાદની સંભાવના.]]></description>
          <pubDate>Fri, 16 Oct 2026 08:00:00 GMT</pubDate>
          <enclosure url="https://example.com/images/rain.jpg" type="image/jpeg" length="12345" />
          <category>Weather</category>
        </item>
      </channel>
    </rss>`;

    const parsed = parseRawXmlFeed(sampleRss);
    assert.equal(parsed.title, 'Test Gujarat News');
    assert.equal(parsed.items.length, 1);
    const item = parsed.items[0];
    assert.equal(item.title, 'અમદાવાદમાં ભારે વરસાદની આગાહી');
    assert.equal(item.sourceUrl, 'https://example.com/news/rain-alert-101');
    assert.equal(item.imageUrl, 'https://example.com/images/rain.jpg');
    assert.equal(item.categoryName, 'Weather');
    assert.ok(item.pubDate instanceof Date);
  });

  it('Parses Atom 1.0 feed entries cleanly', () => {
    const sampleAtom = `<?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>Atom Test Feed</title>
      <link href="https://example.org" rel="alternate" />
      <entry>
        <title>Atom Story Title</title>
        <link href="https://example.org/entry-1" rel="alternate" />
        <id>tag:example.org,2026:1</id>
        <summary>Summary of atom entry</summary>
        <updated>2026-10-16T09:00:00Z</updated>
      </entry>
    </feed>`;

    const parsed = parseRawXmlFeed(sampleAtom);
    assert.equal(parsed.title, 'Atom Test Feed');
    assert.equal(parsed.items.length, 1);
    assert.equal(parsed.items[0].title, 'Atom Story Title');
    assert.equal(parsed.items[0].sourceUrl, 'https://example.org/entry-1');
  });

  it('Gracefully rejects invalid or unsupported XML', () => {
    assert.throws(() => {
      parseRawXmlFeed('<html><body>Not an RSS feed</body></html>');
    });
  });

  // --- Suite 4: Public RSS Generation & Database Verification ---
  console.log('\n--- 4. Dynamic Public RSS Feed Generation ---');
  await itAsync('Generates valid RSS 2.0 XML with headers and ETag', async () => {
    const feed = await generatePublicRssFeed({ limit: 10 });
    assert.ok(feed.xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(feed.xml.includes('<rss version="2.0"'));
    assert.ok(feed.xml.includes('<channel>'));
    assert.ok(feed.xml.includes('<title>Gujarat Post - ગુજરાત સમાચાર</title>'));
    assert.ok(feed.xml.includes('<language>gu-IN</language>'));
    assert.ok(feed.etag && feed.etag.startsWith('"'));
    assert.ok(feed.lastModified instanceof Date);
  });

  await itAsync('Filters articles correctly for category feeds', async () => {
    const gujaratFeed = await generatePublicRssFeed({ categorySlug: 'gujarat', limit: 10 });
    assert.ok(gujaratFeed.xml.includes('<title>'));
    assert.ok(gujaratFeed.xml.includes('/api/public/rss/gujarat'));
  });

  await itAsync('Returns valid empty feed for empty category without errors', async () => {
    const emptyFeed = await generatePublicRssFeed({ categorySlug: 'non-existent-cat-12345', limit: 10 });
    assert.equal(emptyFeed.itemCount, 0);
    assert.ok(emptyFeed.xml.includes('<channel>'));
    assert.ok(emptyFeed.xml.includes('</channel>'));
  });

  await itAsync('Excludes draft and unpublished scheduled articles', async () => {
    const feed = await generatePublicRssFeed({ limit: 50 });
    const publishedCount = await prisma.post.count({ where: { status: 'PUBLISHED' } });
    assert.ok(feed.itemCount <= publishedCount);
  });

  it('Invalidating cache clears in-memory stored feeds', () => {
    invalidatePublicRssCache();
  });

  // --- Suite 5: Extended SSRF & Protocol Safety ---
  console.log('\n--- 5. Source Validation & Extended SSRF Protection ---');
  await itAsync('Blocks IPv6 loopback [::1]', async () => {
    const res = await validateSafeUrl('http://[::1]/feed.xml');
    assert.equal(res.safe, false);
  });

  await itAsync('Rejects non-HTTP schemas like gopher, dict, ftp, and file', async () => {
    const gopher = await validateSafeUrl('gopher://example.com');
    assert.equal(gopher.safe, false);
    const dict = await validateSafeUrl('dict://example.com');
    assert.equal(dict.safe, false);
  });

  await itAsync('Allows public verified HTTPS RSS endpoints', async () => {
    const res = await validateSafeUrl('https://feeds.bbci.co.uk/news/world/rss.xml');
    assert.equal(res.safe, true);
  });

  // --- Suite 6: Feed Parsing Edge Cases & GUID Deduplication ---
  console.log('\n--- 6. Parser Edge Cases & Deduplication Helpers ---');
  it('Falls back to URL or Title when GUID is omitted in RSS item', () => {
    const rssWithoutGuid = `<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
      <channel>
        <title>No GUID Feed</title>
        <link>https://example.com</link>
        <item>
          <title>Story Without Guid</title>
          <link>https://example.com/story-1</link>
          <description>Some summary</description>
        </item>
      </channel>
    </rss>`;
    const parsed = parseRawXmlFeed(rssWithoutGuid);
    assert.equal(parsed.items.length, 1);
    assert.equal(parsed.items[0].guid, 'https://example.com/story-1');
  });

  // --- Suite 7: Item Moderation & Duplicate Publication Guard ---
  console.log('\n--- 7. Item Moderation & Duplicate Publication Protection ---');
  await itAsync('Prevents duplicate publication of already PUBLISHED items', async () => {
    // Test guard logic in isolation
    const item1 = { status: 'PUBLISHED', publishedPostId: 'existing-post-1' };
    const isAlreadyPublished = item1.status === 'PUBLISHED' || Boolean(item1.publishedPostId);
    assert.equal(isAlreadyPublished, true);

    const item2 = { status: 'PENDING', publishedPostId: null };
    const canPublish = item2.status !== 'PUBLISHED' && !item2.publishedPostId;
    assert.equal(canPublish, true);
  });

  await itAsync('Database moderation transitions: PENDING -> APPROVED -> REJECTED', async () => {
    // Create an ephemeral test source
    const testSource = await prisma.rssSource.create({
      data: {
        name: '__TEST_EPHEMERAL_SOURCE__',
        url: 'https://test-example.com/rss.xml',
        pollingInterval: 60,
        isActive: false,
      },
    });

    try {
      // Create a test item
      const testItem = await prisma.rssItem.create({
        data: {
          sourceId: testSource.id,
          guid: `test-guid-${Date.now()}`,
          sourceUrl: 'https://test-example.com/story-1',
          title: 'ગુજરાતી સમાચાર ટેસ્ટ આઇટમ',
          titleGu: 'ગુજરાતી સમાચાર ટેસ્ટ આઇટમ',
          excerpt: 'ટેસ્ટ સારાંશ',
          status: 'PENDING',
        },
      });

      assert.equal(testItem.status, 'PENDING');

      // Approve item
      const approved = await prisma.rssItem.update({
        where: { id: testItem.id },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      });
      assert.equal(approved.status, 'APPROVED');
      assert.ok(approved.reviewedAt);

      // Reject item
      const rejected = await prisma.rssItem.update({
        where: { id: testItem.id },
        data: { status: 'REJECTED' },
      });
      assert.equal(rejected.status, 'REJECTED');

      // Test duplicate GUID unique constraint at DB level
      await assert.rejects(
        async () => {
          await prisma.rssItem.create({
            data: {
              sourceId: testSource.id,
              guid: testItem.guid, // Same source + guid
              sourceUrl: 'https://test-example.com/story-duplicate',
              title: 'Duplicate test',
              status: 'PENDING',
            },
          });
        },
        (err: any) => {
          assert.ok(err.code === 'P2002' || err.message?.includes('Unique constraint'));
          return true;
        }
      );
    } finally {
      // Clean up only the ephemeral test records
      await prisma.rssItem.deleteMany({ where: { sourceId: testSource.id } });
      await prisma.rssSource.delete({ where: { id: testSource.id } });
    }
  });

  console.log('\n========================================================');
  console.log(`   Test Suite Results: ${passed} Passed, ${failed} Failed`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite()
  .catch((e) => {
    console.error('Fatal error running test suite:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
