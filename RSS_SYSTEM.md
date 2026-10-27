# GujaratPost RSS Feed System — Architecture & Documentation

## 1. Overview
The GujaratPost RSS Feed System is a high-performance, production-ready system providing two core capabilities:
1. **Dynamic Public RSS 2.0 Feeds**: Publishes valid, UTF-8 compliant XML feeds with Gujarati Unicode support, media attachments (`enclosure` and `media:content`), author information, and ETag / Last-Modified conditional caching (`304 Not Modified`).
2. **Admin External Feed Management & Ingestion**: Allows authorized staff (`SUPER_ADMIN` and `EDITOR`) to configure external RSS/Atom sources, validate them with SSRF defense, preview stories, automatically deduplicate entries, and review/edit them before publishing them as official GujaratPost articles.

---

## 2. Public RSS Feed Endpoints

All public feeds return `Content-Type: application/rss+xml; charset=utf-8` and support conditional HTTP requests with `If-None-Match` and `If-Modified-Since`.

| Route | Method | Description |
| :--- | :--- | :--- |
| `/rss.xml` | `GET` | Main public RSS feed containing latest published news articles. |
| `/rss/home.xml` | `GET` | Home news feed (all stories). |
| `/rss/:category.xml` | `GET` | Category-specific RSS feed (e.g. `/rss/gujarat.xml`, `/rss/politics.xml`, `/rss/national.xml`, `/rss/world.xml`, `/rss/health.xml`, `/rss/technology.xml`, `/rss/crime.xml`). |
| `/rss/photos.xml` | `GET` | Dynamic photo gallery RSS feed generated from GalleryPhoto records. |
| `/rss/videos.xml` | `GET` | Dynamic video news RSS feed generated from Video records with YouTube media enclosure. |
| `/rss/instagram.xml` | `GET` | Dynamic visual reels RSS feed generated from Reel records. |
| `/rss-feed-politics.php?name=:name` | `GET` | Legacy PHP endpoint for Dailyhunt. Maps `name` parameter to modern feeds. |
| `/rss-feed-gallery.php` | `GET` | Legacy PHP photo gallery endpoint for Dailyhunt. Maps to `/rss/photos.xml`. |
| `/api/public/rss` | `GET` | Direct backend API endpoint for all published articles. Supports `?limit=50`. |
| `/api/public/rss/:category` | `GET` | Direct backend API endpoint for category articles. Supports both `:category` and `:category.xml`. |


### Key XML Specifications:
- **Encoding**: UTF-8 with clean Gujarati Unicode characters.
- **Namespaces**:
  - `xmlns:atom="http://www.w3.org/2005/Atom"`
  - `xmlns:media="http://search.yahoo.com/mrss/"`
  - `xmlns:dc="http://purl.org/dc/elements/1.1/"`
- **Fields Provided**:
  - Channel: `title`, `link`, `description`, `language` (`gu-IN`), `lastBuildDate`, `atom:link`
  - Item: `title` (CDATA), `link` (canonical URL `${SITE_URL}/news/${slug}`), `guid` (`isPermaLink="true"`), `description` (clean excerpt in CDATA), `category` (CDATA), `pubDate` (RFC 822 format), `dc:creator` (author name in CDATA), `author`, `enclosure` (image URL, MIME, length), `media:content` (image URL, medium, title).

---

## 3. Admin External Feed Ingestion Workflow

### Role Access & Permissions:
- Restricted to `SUPER_ADMIN` and `EDITOR` roles via `requireAuth` and `requireRole([Role.SUPER_ADMIN, Role.EDITOR])`.
- Accessible in the admin portal at `/admin/rss`.

### Workflow Stages:
1. **Source Registration**:
   - Authorized editors submit a feed URL, name, target category, and polling frequency.
   - The server performs immediate SSRF validation against private/loopback IP addresses.
2. **Safe Fetching & Parsing**:
   - `safeFetchFeed` enforces a 10-second timeout, 5 MB maximum response size, and validates each redirect destination.
   - `fast-xml-parser` parses RSS 2.0, Atom 1.0, or RDF feeds without entity expansion or external DTD resolution.
3. **Normalization & Deduplication**:
   - HTML tags are stripped from excerpts; content is sanitized to remove dangerous `<script>`, `<iframe>`, and inline event handlers.
   - Incoming items are checked against existing `guid` and normalized `sourceUrl` values to prevent duplicate imports.
4. **Moderation Queue**:
   - Items are stored with status `PENDING`.
   - Editors can preview stories, modify titles/excerpts, change the target category, or reject unwanted stories.
   - When an editor clicks **Publish**, the story is converted into a full `Post` record (generating slug, assigning an article number, linking category/author), and the imported item is marked as `PUBLISHED`.
5. **Automated Background Polling**:
   - Active sources are checked on a scheduled interval (every 10 minutes) in `backend/src/index.ts`.
   - Uses HTTP conditional requests (`ETag` and `Last-Modified`) to skip unchanged feeds (`304 Not Modified`).

---

## 4. Security Architecture

1. **SSRF Defense**:
   - Prohibits all protocols except `http:` and `https:`.
   - Hostnames are resolved via Node DNS before connecting.
   - Blocks private/loopback/link-local address ranges:
     - `127.0.0.0/8` (Loopback)
     - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (Private RFC 1918)
     - `169.254.0.0/16` (Link-local & Cloud Metadata `169.254.169.254`)
     - `0.0.0.0/8`, `224.0.0.0/4`, `240.0.0.0/4`
     - IPv6 `::1`, `fe80::/10`, `fc00::/7`, `::ffff:0:0/96`
   - Redirects are validated manually (max 3 hops), re-checking the destination IP on every hop.
2. **XXE Protection**:
   - `fast-xml-parser` disables DTD parsing and external entity resolution by default.
3. **HTML Sanitization**:
   - `sanitizeHtmlContent` removes `<script>`, `<iframe>`, `<style>`, `<embed>`, `<object>`, `<form>`, and `on*` attributes.
4. **Rate Limiting**:
   - Public RSS endpoints protected by `publicApiRateLimiter` (5,000 req/min).
   - Admin management routes protected by `adminApiRateLimiter` (300 req/min).

---

## 5. Database Models

Added in `backend/prisma/schema.prisma`:
- `RssSource`: Stores configured external feed URLs, polling interval, ETag/LastModified, and status.
- `RssItem`: Stores imported feed entries with moderation status (`PENDING`, `APPROVED`, `REJECTED`, `PUBLISHED`).
- `RssFetchLog`: Records fetch history, item counts, duration, and error diagnostics.

---

## 6. Verification and Testing

Run the automated test suite:
```bash
cd backend
npm run test:rss
```
This suite verifies:
- XML escaping and CDATA wrapping.
- Gujarati Unicode character integrity.
- HTML tag stripping and XSS/HTML sanitization.
- SSRF blocking on localhost, private IPs, and cloud metadata endpoints.
- Parsing of RSS 2.0 and Atom feeds.
- Dynamic feed generation, category filtering, ETag headers, and conditional 304 handling.
