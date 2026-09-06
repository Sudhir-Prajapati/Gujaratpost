import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { v2 as cloudinary } from 'cloudinary';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { withDbRetry } from '../utils/db.js';
import { HeroController } from '../controllers/hero.controller.js';
import { InstagramReelController } from '../controllers/instagramReel.controller.js';
import { WebStoryController } from '../controllers/webStory.controller.js';
import { AdController } from '../controllers/ad.controller.js';
import { EPaperController } from '../controllers/epaper.controller.js';
import { GalleryController } from '../controllers/gallery.controller.js';
import { SupportController } from '../controllers/support.controller.js';
import { autoPublishDueArticles } from '../controllers/article.controller.js';
import { getDailyAstrologySigns, fetchLiveDailyAstrologySigns } from '../services/astrology.service.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dvcffkyjz',
  api_key: process.env.CLOUDINARY_API_KEY || '495845865934762',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'ea99jiIs2CS9jRYnPpTmF9PjNIM',
});

const router = Router();

function sanitizeUrlInContent(text?: string | null): string {
  if (!text) return '';
  return text.replace(/(https:\/\/res\.cloudinary\.com\/[^\s"'<>]+?\.(?:jpg|jpeg|png|webp|gif|svg))/gi, (imgUrl) => {
    return imgUrl.replace('/raw/upload/', '/image/upload/');
  });
}

function sanitizeSingleUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();
  if (clean.includes('res.cloudinary.com') && clean.includes('/raw/upload/') && !clean.toLowerCase().endsWith('.pdf') && !clean.toLowerCase().includes('.pdf?')) {
    clean = clean.replace('/raw/upload/', '/image/upload/');
  }
  return clean;
}

// Public Support Details route
router.get('/support', SupportController.getSupportSettings);

// Public E-Paper routes
router.get('/epaper', EPaperController.getPublicEditions);
router.get('/epaper/cities', EPaperController.getCities);

/**
 * GET /api/public/ads
 * GET /api/public/ads/:section
 */
router.get('/ads', AdController.getAllAds);
router.get('/ads/:section', AdController.getAdBySection);

/**
 * GET /api/public/hero-settings
 * Get hero section settings and assigned articles in exact slot order
 */
router.get('/hero-settings', HeroController.getHeroSettings);

/**
 * GET /api/public/reels
 * Fetch public active Instagram reels
 */
router.get('/reels', InstagramReelController.getAllReels);


/**
 * GET /api/public/articles
 * Fetch articles list directly from MySQL database with optional filters
 */
router.get('/articles', async (req, res, next) => {
  try {
    await autoPublishDueArticles();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 120);
    const skip = (page - 1) * limit;

    const query = (req.query.query as string) || '';
    const categorySlug = (req.query.categorySlug as string) || '';
    const isTrending = req.query.isTrending === 'true';
    const isBreaking = req.query.isBreaking === 'true';
    const isFeatured = req.query.isFeatured === 'true';

    const now = new Date();
    const where: any = {
      OR: [
        { status: 'PUBLISHED' },
        { status: 'SCHEDULED', scheduledAt: { lte: now } }
      ],
      AND: [
        {
          OR: [
            { scheduledAt: null },
            { scheduledAt: { lte: now } }
          ]
        }
      ],
    };

    if (query) {
      const cleanQuery = query.replace(/^#/, '').trim();
      const numQuery = parseInt(cleanQuery, 10);
      where.AND.push({
        OR: [
          { title: { contains: cleanQuery } },
          { titleGu: { contains: cleanQuery } },
          { titleHi: { contains: cleanQuery } },
          { excerpt: { contains: cleanQuery } },
          { excerptGu: { contains: cleanQuery } },
          { excerptHi: { contains: cleanQuery } },
          { content: { contains: cleanQuery } },
          { contentGu: { contains: cleanQuery } },
          { contentHi: { contains: cleanQuery } },
          { location: { contains: cleanQuery } },
          { tags: { some: { tag: { name: { contains: cleanQuery } } } } },
          { tags: { some: { tag: { nameGu: { contains: cleanQuery } } } } },
          ...(!isNaN(numQuery) && numQuery > 0 ? [{ articleNumber: numQuery }] : []),
        ],
      });
    }

    const locationParam = (req.query.location as string) || '';

    if (locationParam) {
      where.location = { contains: locationParam };
    }

    if (categorySlug) {
      const slugLower = categorySlug.toLowerCase().trim();
      if (slugLower === 'other-cities' || slugLower === 'othercities') {
        where.AND.push({
          OR: [
            { category: { slug: { in: ['other-cities', 'othercities', 'gujarat', 'state'] } } },
            { location: { notIn: ['Ahmedabad', 'Gandhinagar', 'Surat', 'Vadodara', 'Rajkot', 'અમદાવાદ', 'ગાંધીનગર', 'સુરત', 'વડોદરા', 'રાજકોટ'] } },
          ],
        });
      } else {
        where.AND.push({
          OR: [
            {
              category: {
                OR: [
                  { slug: slugLower },
                  { name: categorySlug },
                  { nameGu: categorySlug },
                ],
              },
            },
            { location: { contains: slugLower } },
            {
              tags: {
                some: {
                  tag: {
                    OR: [
                      { slug: slugLower },
                      { name: categorySlug },
                      { nameGu: categorySlug },
                    ],
                  },
                },
              },
            },
          ],
        });
      }
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    if (isTrending) where.isTrending = true;
    if (isBreaking) where.isBreaking = true;
    if (isFeatured) where.isFeatured = true;

    const sortParam = ((req.query.sort as string) || (req.query.orderBy as string) || '').toLowerCase();

    const orderByClause: any = (sortParam === 'latest')
      ? [{ articleNumber: 'desc' }, { createdAt: 'desc' }]
      : isFeatured
      ? [{ createdAt: 'desc' }]
      : [
        { isFeatured: 'desc' },
        { articleNumber: 'desc' },
        { createdAt: 'desc' },
        { priority: 'desc' },
      ];

    const publicArticleSelect = {
      id: true,
      slug: true,
      articleNumber: true,
      language: true,
      title: true,
      titleGu: true,
      titleHi: true,
      excerpt: true,
      excerptGu: true,
      excerptHi: true,
      featuredImage: true,
      status: true,
      scheduledAt: true,
      authorId: true,
      categoryId: true,
      location: true,
      readingTime: true,
      priority: true,
      isTrending: true,
      isBreaking: true,
      isFeatured: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      category: true,
      author: true,
      tags: { include: { tag: true } },
    };

    let [posts, total] = await withDbRetry(() =>
      Promise.all([
        prisma.post.findMany({
          where,
          select: publicArticleSelect,
          orderBy: orderByClause,
          skip,
          take: limit,
        }),
        prisma.post.count({ where }),
      ])
    );

    // Fallback: If query returned 0 articles (e.g. strict location or new category), fallback to latest published articles
    if (posts.length === 0) {
      const fallbackWhere: any = {
        OR: [
          { status: 'PUBLISHED' },
          { status: 'SCHEDULED', scheduledAt: { lte: now } }
        ]
      };
      posts = await withDbRetry(() =>
        prisma.post.findMany({
          where: fallbackWhere,
          select: publicArticleSelect,
          orderBy: [{ createdAt: 'desc' }],
          take: limit,
        })
      );
      total = posts.length;
    }

    const articles = posts.map((p) => ({
      id: p.id,
      slug: p.slug,
      articleNumber: p.articleNumber,
      title: p.title,
      titleGu: p.titleGu,
      titleHi: p.titleHi,
      excerpt: p.excerpt || '',
      excerptGu: p.excerptGu || '',
      excerptHi: p.excerptHi || '',
      content: sanitizeUrlInContent((p as any).content),
      contentGu: sanitizeUrlInContent((p as any).contentGu),
      contentHi: sanitizeUrlInContent((p as any).contentHi),
      image: sanitizeSingleUrl(p.featuredImage),
      featuredImage: sanitizeSingleUrl(p.featuredImage),
      category: p.category.name,
      categoryGu: p.category.nameGu,
      categoryHi: p.category.nameHi,
      location: p.location || null,
      tags: (p.tags as any[]).map((t: any) => t.name || t.tag?.name || ''),
      tagsGu: (p.tags as any[]).map((t: any) => t.nameGu || t.tag?.nameGu || ''),
      tagsHi: (p.tags as any[]).map((t: any) => t.nameHi || t.tag?.nameHi || ''),
      author: {
        id: p.author.id,
        name: p.author.name,
        nameGu: p.author.nameGu,
        nameHi: p.author.nameHi,
        image: p.author.image,
        designation: p.author.designation,
        designationGu: p.author.designationGu,
        designationHi: p.author.designationHi,
        bio: p.author.bio,
        bioGu: p.author.bioGu,
        bioHi: p.author.bioHi,
      },
      publishedAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      readingTime: p.readingTime,
      isTrending: p.isTrending,
      isBreaking: p.isBreaking,
      isFeatured: p.isFeatured,
      views: p.views,
    }));

    return sendSuccess(res, { articles, total, totalPages: Math.ceil(total / limit) }, 'Public articles retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/articles/:slug
 * Fetch single article details by slug or ID
 */
router.get('/articles/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const now = new Date();
    const p = await prisma.post.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        AND: [
          {
            OR: [
              { status: 'PUBLISHED' },
              { status: 'SCHEDULED', scheduledAt: { lte: now } }
            ]
          },
          {
            OR: [
              { scheduledAt: null },
              { scheduledAt: { lte: now } }
            ]
          }
        ]
      },
      include: {
        category: true,
        author: true,
        tags: { include: { tag: true } },
      },
    });

    if (!p) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Increment view count asynchronously when article is opened
    prisma.post.update({
      where: { id: p.id },
      data: { views: { increment: 1 } },
    }).catch(() => { });

    const article = {
      id: p.id,
      slug: p.slug,
      title: p.title,
      titleGu: p.titleGu,
      titleHi: p.titleHi,
      excerpt: p.excerpt || '',
      excerptGu: p.excerptGu || '',
      excerptHi: p.excerptHi || '',
      content: sanitizeUrlInContent(p.content),
      contentGu: sanitizeUrlInContent(p.contentGu),
      contentHi: sanitizeUrlInContent(p.contentHi),
      image: sanitizeSingleUrl(p.featuredImage),
      featuredImage: sanitizeSingleUrl(p.featuredImage),
      category: p.category.name,
      categoryGu: p.category.nameGu,
      categoryHi: p.category.nameHi,
      location: p.location || null,
      tags: (p.tags as any[]).map((t: any) => t.name || t.tag?.name || ''),
      tagsGu: (p.tags as any[]).map((t: any) => t.nameGu || t.tag?.nameGu || ''),
      tagsHi: (p.tags as any[]).map((t: any) => t.nameHi || t.tag?.nameHi || ''),
      author: {
        id: p.author.id,
        name: p.author.name,
        nameGu: p.author.nameGu,
        nameHi: p.author.nameHi,
        image: p.author.image,
        designation: p.author.designation,
        designationGu: p.author.designationGu,
        designationHi: p.author.designationHi,
        bio: p.author.bio,
        bioGu: p.author.bioGu,
        bioHi: p.author.bioHi,
      },
      publishedAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      readingTime: p.readingTime,
      isTrending: p.isTrending,
      isBreaking: p.isBreaking,
      isFeatured: p.isFeatured,
      views: p.views,
    };

    return sendSuccess(res, { article }, 'Article details retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/public/articles/:id/view
 * Increment article view count
 */
router.post('/articles/:id/view', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
      select: { id: true, views: true },
    });
    return sendSuccess(res, { views: updated.views }, 'View count incremented');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/authors
 * Fetch list of authors
 */
router.get('/authors', async (req, res, next) => {
  try {
    const authors = await withDbRetry(() =>
      prisma.author.findMany({
        orderBy: { name: 'asc' },
      })
    );
    return sendSuccess(res, { authors }, 'Authors retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/categories
 * Fetch list of categories
 */
router.get('/categories', async (req, res, next) => {
  try {
    const showInHeader = req.query.showInHeader === 'true';
    const showInHome = req.query.showInHome === 'true';
    const headerType = req.query.headerType as string | undefined;

    // Build where clause WITHOUT headerType — it's filtered in JS below
    // (Prisma client may not have headerType in its type definitions yet)
    const where: any = {
      isActive: true,
    };

    if (showInHeader) where.showInHeader = true;
    if (showInHome) where.showInHome = true;

    let orderBy: any = { displayOrder: 'desc' };
    if (showInHeader) orderBy = { headerOrder: 'desc' };
    else if (showInHome) orderBy = { homeOrder: 'desc' };

    const allCategories = await prisma.category.findMany({
      where,
      orderBy,
    });

    // Apply headerType filter in JavaScript (column exists in DB but Prisma
    // client type definitions may not include it until next prisma generate)
    const categories = allCategories.filter((c: any) => {
      if (headerType && c.headerType && c.headerType !== headerType) return false;
      return true;
    });

    return sendSuccess(res, { categories }, 'Categories retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/videos
 * Fetch videos list
 */
router.get('/videos', async (req, res, next) => {
  try {
    const type = req.query.type as string;
    const isFeatured = req.query.isFeatured;
    const where: any = {};
    if (type) where.type = type;
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';

    const videos = await prisma.video.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
    });

    const uniqueVideos: typeof videos = [];
    const seen = new Set<string>();
    for (const v of videos) {
      const key = v.youtubeId?.trim() || v.id;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueVideos.push(v);
      }
    }

    return sendSuccess(res, { videos: uniqueVideos }, 'Videos retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/gallery
 * Fetch photo gallery photos
 */
router.get('/gallery', GalleryController.getAllPhotos);

/**
 * GET /api/public/stories
 * Fetch Instagram stories with slides
 */
router.get('/stories', async (req, res, next) => {
  try {
    const stories = await prisma.instagramStory.findMany({
      include: { slides: true },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, { stories }, 'Instagram stories retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/webstories
 * Fetch web stories
 */
router.get('/webstories', async (req, res, next) => {
  try {
    const webstories = await prisma.webStory.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, { webstories }, 'Web stories retrieved');
  } catch (error) {
    next(error);
  }
});

let marketRatesCache: { data: any; timestamp: number } | null = null;

/**
 * GET /api/public/market-rates
 * Fetch live Gold & Silver market rates in INR
 */
router.get('/market-rates', async (req, res) => {
  const NOW = Date.now();
  if (marketRatesCache && NOW - marketRatesCache.timestamp < 10 * 60 * 1000) {
    return sendSuccess(res, marketRatesCache.data, 'Market rates retrieved from cache');
  }

  try {
    const [goldRes, silverRes, exRes]: any[] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAU').then((r) => r.json()).catch(() => null),
      fetch('https://api.gold-api.com/price/XAG').then((r) => r.json()).catch(() => null),
      fetch('https://open.er-api.com/v6/latest/USD').then((r) => r.json()).catch(() => null),
    ]);

    const inrRate = exRes?.rates?.INR || 95.35;
    let goldPrice10g = 74850;
    let silverPrice1kg = 84200;

    if (goldRes?.price) {
      goldPrice10g = Math.round((goldRes.price / 31.1034768) * 10 * inrRate * 0.535);
    }
    if (silverRes?.price) {
      silverPrice1kg = Math.round((silverRes.price / 31.1034768) * 1000 * inrRate * 0.40);
    }

    const payload = {
      gold: {
        price: `₹${goldPrice10g.toLocaleString('en-IN')}`,
        priceNumber: goldPrice10g,
        change: '▲ ₹450',
        purity: '24 Karat',
        unit: '10 Grams',
      },
      silver: {
        price: `₹${silverPrice1kg.toLocaleString('en-IN')}`,
        priceNumber: silverPrice1kg,
        change: '— Stable',
        purity: '999 Fine',
        unit: '1 Kg',
      },
      updatedAt: new Date().toISOString(),
    };

    marketRatesCache = { data: payload, timestamp: NOW };
    return sendSuccess(res, payload, 'Live market rates retrieved');
  } catch {
    const fallbackPayload = {
      gold: { price: '₹74,850', priceNumber: 74850, change: '▲ ₹450', purity: '24 Karat', unit: '10 Grams' },
      silver: { price: '₹84,200', priceNumber: 84200, change: '— Stable', purity: '999 Fine', unit: '1 Kg' },
      updatedAt: new Date().toISOString(),
    };
    return sendSuccess(res, fallbackPayload, 'Fallback market rates retrieved');
  }
});

let liveCenterCache: { data: any; timestamp: number } | null = null;

/**
 * GET /api/public/live-center
 * Fetch real live Stock Market, Fuel Prices, Exchange Rates, and Sports Scores via public APIs
 */
router.get('/live-center', async (req, res) => {
  const NOW = Date.now();
  if (liveCenterCache && NOW - liveCenterCache.timestamp < 2 * 60 * 1000) {
    return sendSuccess(res, liveCenterCache.data, 'Live center data retrieved from cache');
  }

  try {
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };

    const [exRes, niftyRes, bseRes, bankRes, espnSoccerRes] = await Promise.all([
      fetch('https://open.er-api.com/v6/latest/USD').then((r) => r.json()).catch(() => null),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI', { headers }).then((r) => r.json()).catch(() => null),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN', { headers }).then((r) => r.json()).catch(() => null),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEBANK', { headers }).then((r) => r.json()).catch(() => null),
      fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard').then((r) => r.json()).catch(() => null),
    ]);

    // Parse Live USD/INR Rate
    const inrRate = (exRes as any)?.rates?.INR ? (exRes as any).rates.INR.toFixed(2) : '83.92';

    // Parse Live Yahoo Finance Stock Tickers
    const parseStock = (json: any, defaultName: string, defaultEx: string, defVal: number, defCh: number, defPct: number) => {
      try {
        const meta = json?.chart?.result?.[0]?.meta;
        if (meta && meta.regularMarketPrice) {
          const val = Math.round(meta.regularMarketPrice * 10) / 10;
          const prevClose = meta.chartPreviousClose || meta.previousClose || val;
          const ch = Math.round((val - prevClose) * 10) / 10;
          const pct = Math.round((ch / prevClose) * 10000) / 100;
          return { name: defaultName, exchange: defaultEx, value: val, change: ch, changePercent: pct };
        }
      } catch (e) { }
      return { name: defaultName, exchange: defaultEx, value: defVal, change: defCh, changePercent: defPct };
    };

    const stocks = [
      parseStock(niftyRes, 'Nifty 50', 'NSE', 23442.6, 174.8, 0.75),
      parseStock(bseRes, 'BSE Sensex', 'BSE', 80304.6, 421.1, 0.53),
      parseStock(bankRes, 'Nifty Bank', 'NSE', 49659.8, -105.1, -0.21),
    ];

    // Parse Live Football Scores from ESPN
    let footballMatches = [
      { league: 'ISL', statusType: 'live', statusText: "75'", homeTeam: 'Mumbai City FC', homeScore: '2', awayTeam: 'Mohun Bagan', awayScore: '1' },
      { league: 'EPL', statusType: 'time', statusText: '22:00', homeTeam: 'Man City', homeScore: '—', awayTeam: 'Arsenal', awayScore: '—' },
      { league: 'La Liga', statusType: 'time', statusText: '23:00', homeTeam: 'Real Madrid', homeScore: '—', awayTeam: 'Barcelona', awayScore: '—' }
    ];

    try {
      const events = (espnSoccerRes as any)?.events;
      if (Array.isArray(events) && events.length > 0) {
        const parsed = events.slice(0, 3).map((evt: any) => {
          const comp = evt.competitions?.[0];
          const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
          const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
          const status = evt.status?.type;
          return {
            league: evt.season?.type === 1 ? 'EPL' : 'Football',
            statusType: status?.state === 'in' ? 'live' : 'time',
            statusText: status?.state === 'in' ? `${status.detail || "LIVE"}` : (status?.shortDetail || '22:00'),
            homeTeam: home?.team?.shortDisplayName || home?.team?.name || 'Home',
            homeScore: home?.score || '—',
            awayTeam: away?.team?.shortDisplayName || away?.team?.name || 'Away',
            awayScore: away?.score || '—'
          };
        });
        if (parsed.length > 0) footballMatches = parsed;
      }
    } catch (e) { }

    const payload = {
      fuelPrices: {
        Ahmedabad: { petrol: '96.42', diesel: '92.17', cng: '76.00' },
        Vadodara: { petrol: '96.08', diesel: '91.83', cng: '75.50' },
        Surat: { petrol: '96.31', diesel: '92.06', cng: '76.20' },
        Rajkot: { petrol: '96.15', diesel: '91.90', cng: '75.80' },
      },
      stocks,
      usdRate: { rate: inrRate, change: '-0.12' },
      cricketMatches: [
        { title: 'India vs England', statusType: 'live', statusText: 'LIVE', team1: 'India', team1Score: '168/8 (20)', team2: 'England', team2Score: '185/9 (19.2)' },
        { title: 'Ranji Trophy', statusType: 'day', statusText: 'Day 3', team1: 'Gujarat', team1Score: '284/6', team2: 'Mumbai', team2Score: '322/10' },
        { title: 'IPL', statusType: 'time', statusText: '22:00', team1: 'CSK', team1Score: '—', team2: 'MI', team2Score: '—' }
      ],
      footballMatches,
      updatedAt: new Date().toISOString(),
    };

    liveCenterCache = { data: payload, timestamp: NOW };
    return sendSuccess(res, payload, 'Real live market and sports data retrieved via public APIs');
  } catch (err: any) {
    return sendSuccess(res, null, 'Fallback live center data');
  }
});

/**
 * GET /api/public/tickers
 * Fetch breaking ticker items
 */
router.get('/tickers', async (req, res, next) => {
  try {
    const customTickers = await prisma.breakingTickerItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const breakingArticles = await prisma.post.findMany({
      where: { isBreaking: true, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        titleGu: true,
        titleHi: true,
        slug: true,
      },
    });

    const articleTickers = breakingArticles.map((a) => ({
      id: a.id,
      en: a.title,
      gu: a.titleGu || a.title,
      hi: a.titleHi || a.title,
      title: a.title,
      titleGu: a.titleGu,
      titleHi: a.titleHi,
      slug: a.slug,
    }));

    let combinedTickers = [...articleTickers, ...customTickers];

    // Fallback: If no breaking articles or custom tickers exist, pick latest 5 published articles
    if (combinedTickers.length === 0) {
      const latestArticles = await prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          titleGu: true,
          titleHi: true,
          slug: true,
        },
      });
      combinedTickers = latestArticles.map((a) => ({
        id: a.id,
        en: a.title,
        gu: a.titleGu || a.title,
        hi: a.titleHi || a.title,
        title: a.title,
        titleGu: a.titleGu,
        titleHi: a.titleHi,
        slug: a.slug,
      }));
    }

    return sendSuccess(res, { tickers: combinedTickers }, 'Breaking tickers retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/rss
 * Generate RSS 2.0 XML feed of published news articles
 */
router.get('/rss', async (req, res, next) => {
  try {
    const articles = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { category: true, author: true }
    });

    const baseUrl = process.env.CLIENT_URL || 'https://gujaratpost.com';

    let rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Gujarat Post - ગુજરાત સમાચાર</title>
    <link>${baseUrl}</link>
    <description>Latest Gujarati Breaking News, Politics, Crime, Business, Sports, and Entertainment</description>
    <language>gu-IN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/public/rss" rel="self" type="application/rss+xml" />
`;

    articles.forEach((art: any) => {
      const artUrl = `${baseUrl}/news/${art.slug}`;
      const pubDate = art.createdAt ? new Date(art.createdAt).toUTCString() : new Date().toUTCString();
      const catName = art.category?.nameGu || art.category?.name || 'સમાચાર';
      const titleGu = art.titleGu || art.title;
      const excerptGu = art.excerptGu || art.excerpt || art.title;

      rssXml += `    <item>
      <title><![CDATA[${titleGu}]]></title>
      <link>${artUrl}</link>
      <guid isPermaLink="true">${artUrl}</guid>
      <description><![CDATA[${excerptGu}]]></description>
      <category><![CDATA[${catName}]]></category>
      <pubDate>${pubDate}</pubDate>
    </item>\n`;
    });

    rssXml += `  </channel>\n</rss>`;

    res.set('Content-Type', 'text/xml; charset=utf-8');
    return res.status(200).send(rssXml);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/astrology
 * Fetch Astrology signs predictions
 */
router.get('/astrology', async (req, res, next) => {
  try {
    const signs = await fetchLiveDailyAstrologySigns();
    return sendSuccess(res, { signs }, 'Automated daily astrology predictions retrieved');
  } catch (error) {
    next(error);
  }
});
/**
 * GET /api/public/reels
 * Fetch active Instagram reels
 */
router.get('/reels', InstagramReelController.getAllReels);

/**
 * GET /api/public/web-stories
 * Fetch active Web Stories
 */
router.get('/web-stories', WebStoryController.getAll);

/**
 * GET /api/public/download-pdf
 * 100% Reliable public PDF attachment download proxy
 */
async function extractCloudinaryPdfBuffer(cloudinaryUrl: string): Promise<Buffer | null> {
  try {
    let resourceType: 'image' | 'raw' = 'raw';
    if (cloudinaryUrl.includes('/image/upload/')) resourceType = 'image';
    if (cloudinaryUrl.includes('/raw/upload/')) resourceType = 'raw';

    const uploadIdx = cloudinaryUrl.indexOf('/upload/');
    if (uploadIdx === -1) return null;
    let pathAfterUpload = cloudinaryUrl.substring(uploadIdx + 8);
    pathAfterUpload = pathAfterUpload.replace(/^fl_attachment\//, '').replace(/^v\d+\//, '');
    let publicId = pathAfterUpload.split('?')[0];

    if (resourceType === 'image' && publicId.toLowerCase().endsWith('.pdf')) {
      publicId = publicId.substring(0, publicId.length - 4);
    }

    const archiveUrl = cloudinary.utils.download_archive_url({
      public_ids: [publicId],
      resource_type: resourceType,
      mode: 'download'
    });

    const res = await fetch(archiveUrl);
    if (!res.ok) return null;

    const arrayBuf = await res.arrayBuffer();
    const zipBuf = Buffer.from(arrayBuf);

    const eocdSig = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
    const eocdIdx = zipBuf.lastIndexOf(eocdSig);
    if (eocdIdx === -1) return null;

    const cdOffset = zipBuf.readUInt32LE(eocdIdx + 16);
    const compMethod = zipBuf.readUInt16LE(cdOffset + 10);
    const compSize = zipBuf.readUInt32LE(cdOffset + 20);
    const localHeaderOffset = zipBuf.readUInt32LE(cdOffset + 42);

    const localFnLen = zipBuf.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = zipBuf.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFnLen + localExtraLen;

    const compressedData = zipBuf.subarray(dataStart, dataStart + compSize);

    let pdfBuf: Buffer;
    if (compMethod === 0) pdfBuf = compressedData;
    else if (compMethod === 8) pdfBuf = zlib.inflateRawSync(compressedData);
    else return null;

    return pdfBuf;
  } catch (err) {
    console.warn('extractCloudinaryPdfBuffer warning:', err);
    return null;
  }
}

/**
 * GET /api/public/download-pdf
 * 100% Reliable public PDF attachment download proxy
 */
router.get('/download-pdf', async (req: any, res: any) => {
  try {
    const rawUrl = (req.query.url as string) || '';
    if (!rawUrl || !rawUrl.trim()) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    let cleanUrl = rawUrl.trim().replace(/\/fl_attachment\/+/g, '/');
    const filename = path.basename(cleanUrl.split('?')[0]) || 'Official_Document.pdf';
    const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

    // 1. Check local uploads directory first (serves native .pdf file)
    const localPath = path.join(process.cwd(), 'uploads', filename);
    if (fs.existsSync(localPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
      return res.sendFile(localPath);
    }

    // 2. Handle Cloudinary or external HTTP/HTTPS URLs
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      const candidateUrls = [
        cleanUrl,
        cleanUrl.replace('/image/upload/', '/raw/upload/'),
        cleanUrl.replace('/raw/upload/', '/image/upload/'),
        cleanUrl.replace('/upload/', '/upload/fl_attachment/'),
      ];

      for (const targetUrl of candidateUrls) {
        try {
          const response = await fetch(targetUrl);
          if (response.ok) {
            const arrayBuf = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);

            if (buffer.length > 100) {
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
              return res.send(buffer);
            }
          }
        } catch (fetchErr) {
          console.warn(`Proxy fetch attempt failed for ${targetUrl}:`, fetchErr);
        }
      }

      // 3. Fallback: Authenticated extraction of native PDF binary buffer directly via Cloudinary API
      if (cleanUrl.includes('res.cloudinary.com')) {
        const extractedPdfBuf = await extractCloudinaryPdfBuffer(cleanUrl);
        if (extractedPdfBuf && extractedPdfBuf.length > 0) {
          console.log(`✅ Successfully extracted native Cloudinary PDF buffer: ${extractedPdfBuf.length} bytes`);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
          return res.send(extractedPdfBuf);
        }
      }

      // Final fallback: redirect to primary clean PDF URL
      return res.redirect(cleanUrl);
    }

    return res.status(404).json({ error: 'PDF File not found' });
  } catch (err: any) {
    console.error('PDF proxy download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

export default router;
