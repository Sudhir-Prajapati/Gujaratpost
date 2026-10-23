const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DUMP_PATH = 'c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/gujaratpost_newsgujrati_23OCT2026.sql.gz';

function parseNewsLine(line, onRow) {
  const valuesIdx = line.indexOf('VALUES ');
  if (valuesIdx === -1) return;
  const text = line.substring(valuesIdx + 7);
  
  let inString = false;
  let escape = false;
  let currentVal = '';
  let currentTuple = [];
  let inTuple = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (!inTuple) {
      if (ch === '(') {
        inTuple = true;
        currentTuple = [];
        currentVal = '';
        inString = false;
        escape = false;
      }
    } else {
      if (inString) {
        if (escape) {
          currentVal += ch;
          escape = false;
        } else if (ch === '\\') {
          escape = true;
        } else if (ch === "'") {
          if (text[i + 1] === "'") {
            currentVal += "'";
            i++;
          } else {
            inString = false;
          }
        } else {
          currentVal += ch;
        }
      } else {
        if (ch === "'") {
          inString = true;
        } else if (ch === ',') {
          currentTuple.push(currentVal.trim());
          currentVal = '';
        } else if (ch === ')') {
          currentTuple.push(currentVal.trim());
          onRow(currentTuple);
          inTuple = false;
          currentTuple = [];
          currentVal = '';
        } else {
          currentVal += ch;
        }
      }
    }
  }
}

function chooseBestPrimaryCatId(oldIds, oldIdToDbId) {
  // 1. City categories
  const cityId = oldIds.find(id => [22, 23, 24, 25, 26].includes(id));
  if (cityId && oldIdToDbId.has(cityId)) return oldIdToDbId.get(cityId);

  // 2. Specific topic categories
  const topicId = oldIds.find(id => [17, 18, 15, 28, 29, 30, 20, 21, 6, 7, 13, 14, 16].includes(id));
  if (topicId && oldIdToDbId.has(topicId)) return oldIdToDbId.get(topicId);

  // 3. Regional / National categories
  const regId = oldIds.find(id => [2, 4, 3, 11].includes(id));
  if (regId && oldIdToDbId.has(regId)) return oldIdToDbId.get(regId);

  // 4. Any other
  for (const id of oldIds) {
    if (oldIdToDbId.has(id)) return oldIdToDbId.get(id);
  }
  return null;
}

async function main() {
  console.log('=== MULTI-CATEGORY SYNC FROM DUMP ===');
  console.log('Loading database categories...');
  const dbCategories = await prisma.category.findMany();
  const dbBySlug = new Map();
  for (const c of dbCategories) {
    dbBySlug.set(c.slug.toLowerCase().trim(), c);
  }

  const oldIdToSlug = {
    1: 'news',
    2: 'gujarat',
    3: 'international',
    4: 'national',
    5: 'breaking-news',
    6: 'gujarat-election-2017',
    7: 'inflation',
    8: 'polls',
    9: 'jasadan-by-election',
    10: 'poll',
    11: 'india',
    12: 'testcategorues',
    13: 'election-five-states-results',
    14: 'election-2019-modi-loss-five-states',
    15: 'business',
    16: '2019-election-bjp-ram-mandir',
    17: 'politics',
    18: 'entertainment-life-style',
    19: 'popular-stories',
    20: 'gujarat-election-2022',
    21: 'loksabha-election',
    22: 'gandhinagar',
    23: 'ahmedabad',
    24: 'surat',
    25: 'vadodara',
    26: 'rajkot',
    27: 'others',
    28: 'lifestyle',
    29: 'entertainment',
    30: 'fact-check'
  };

  const oldIdToDbCategory = new Map();
  const oldIdToDbId = new Map();
  for (const [oldIdStr, slug] of Object.entries(oldIdToSlug)) {
    const oldId = parseInt(oldIdStr, 10);
    const cat = dbBySlug.get(slug.toLowerCase());
    if (cat) {
      oldIdToDbCategory.set(oldId, cat);
      oldIdToDbId.set(oldId, cat.id);
    }
  }

  console.log(`Mapped ${oldIdToDbCategory.size} old category IDs to DB categories.`);

  console.log('Loading all posts from DB...');
  const dbPosts = await prisma.post.findMany({
    select: { id: true, articleNumber: true, categoryId: true }
  });
  console.log(`Loaded ${dbPosts.length} posts from DB.`);

  const postsByArticleNumber = new Map();
  for (const p of dbPosts) {
    if (p.articleNumber != null) {
      postsByArticleNumber.set(p.articleNumber, p);
    }
  }

  // Pre-fetch or create tags for category names so we can also sync post_tags
  console.log('Syncing tags for category names...');
  const categoryTagMap = new Map(); // categoryId -> tagId
  for (const cat of dbCategories) {
    const tagSlug = cat.slug.toLowerCase().trim();
    const tag = await prisma.tag.upsert({
      where: { slug: tagSlug },
      update: {},
      create: {
        slug: tagSlug,
        name: cat.name,
        nameGu: cat.nameGu || cat.name,
        nameHi: cat.nameHi || cat.name,
      }
    });
    categoryTagMap.set(cat.id, tag.id);
  }

  console.log('Parsing dump file and collecting all category associations...');
  const fileStream = fs.createReadStream(DUMP_PATH, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const postCategoriesToInsert = [];
  const postTagsToInsert = [];
  const primaryCatUpdates = []; // { id, newCategoryId }
  const seenPostCategoryPairs = new Set();
  const seenPostTagPairs = new Set();

  let dumpRowCount = 0;
  let matchedPosts = 0;
  let multiCatArticles = 0;

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `news`')) {
      parseNewsLine(line, (r) => {
        dumpRowCount++;
        const newsId = parseInt(r[0], 10);
        const dbPost = postsByArticleNumber.get(newsId);
        if (!dbPost) return;

        matchedPosts++;

        const rawCat = r[11];
        const cat0 = parseInt(r[12], 10) || 0;
        const cat1 = parseInt(r[13], 10) || 0;
        const cat2 = parseInt(r[14], 10) || 0;

        const oldIds = [];
        if (rawCat) {
          rawCat.split(',').forEach(s => {
            const num = parseInt(s.trim(), 10);
            if (num && !oldIds.includes(num)) oldIds.push(num);
          });
        }
        if (cat0 && !oldIds.includes(cat0)) oldIds.push(cat0);
        if (cat1 && !oldIds.includes(cat1)) oldIds.push(cat1);
        if (cat2 && !oldIds.includes(cat2)) oldIds.push(cat2);

        // Collect all DB category IDs for this post
        const allDbCatIds = new Set();
        if (dbPost.categoryId) allDbCatIds.add(dbPost.categoryId);

        for (const oldId of oldIds) {
          if (oldIdToDbId.has(oldId)) {
            allDbCatIds.add(oldIdToDbId.get(oldId));
          }
        }

        if (allDbCatIds.size > 1) {
          multiCatArticles++;
        }

        // Check if primary category should be updated to a better specific one
        const bestPrimaryCatId = chooseBestPrimaryCatId(oldIds, oldIdToDbId);
        if (bestPrimaryCatId && bestPrimaryCatId !== dbPost.categoryId) {
          primaryCatUpdates.push({ id: dbPost.id, categoryId: bestPrimaryCatId });
        }

        // Queue post_categories
        for (const catId of allDbCatIds) {
          const pairKey = `${dbPost.id}_${catId}`;
          if (!seenPostCategoryPairs.has(pairKey)) {
            seenPostCategoryPairs.add(pairKey);
            postCategoriesToInsert.push({
              postId: dbPost.id,
              categoryId: catId,
            });
          }

          // Also queue post_tags for this category
          const tagId = categoryTagMap.get(catId);
          if (tagId) {
            const tagPairKey = `${dbPost.id}_${tagId}`;
            if (!seenPostTagPairs.has(tagPairKey)) {
              seenPostTagPairs.add(tagPairKey);
              postTagsToInsert.push({
                postId: dbPost.id,
                tagId: tagId,
              });
            }
          }
        }
      });
    }
  }

  console.log(`\nDump processing complete!`);
  console.log(`Total dump rows parsed: ${dumpRowCount}`);
  console.log(`Matched DB posts: ${matchedPosts}`);
  console.log(`Articles with multiple categories: ${multiCatArticles}`);
  console.log(`Total post_categories records to insert: ${postCategoriesToInsert.length}`);
  console.log(`Total post_tags records to insert: ${postTagsToInsert.length}`);
  console.log(`Primary category optimizations: ${primaryCatUpdates.length}`);

  // Insert post_categories in batches
  console.log('\nInserting into post_categories in batches...');
  const BATCH_SIZE = 5000;
  for (let i = 0; i < postCategoriesToInsert.length; i += BATCH_SIZE) {
    const chunk = postCategoriesToInsert.slice(i, i + BATCH_SIZE);
    await prisma.postCategory.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    console.log(`  Inserted post_categories batch ${i + 1} to ${Math.min(i + BATCH_SIZE, postCategoriesToInsert.length)}`);
  }

  // Insert post_tags in batches
  console.log('\nInserting into post_tags in batches...');
  for (let i = 0; i < postTagsToInsert.length; i += BATCH_SIZE) {
    const chunk = postTagsToInsert.slice(i, i + BATCH_SIZE);
    await prisma.postTag.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    console.log(`  Inserted post_tags batch ${i + 1} to ${Math.min(i + BATCH_SIZE, postTagsToInsert.length)}`);
  }

  // Primary category updates if any
  if (primaryCatUpdates.length > 0) {
    console.log(`\nUpdating ${primaryCatUpdates.length} posts with optimal primary category...`);
    // Run in parallel chunks of 100
    const CHUNK = 100;
    for (let i = 0; i < primaryCatUpdates.length; i += CHUNK) {
      const slice = primaryCatUpdates.slice(i, i + CHUNK);
      await Promise.all(slice.map(u => prisma.post.update({
        where: { id: u.id },
        data: { categoryId: u.categoryId }
      })));
      if ((i + CHUNK) % 2000 === 0 || i + CHUNK >= primaryCatUpdates.length) {
        console.log(`  Updated ${Math.min(i + CHUNK, primaryCatUpdates.length)} / ${primaryCatUpdates.length} primary categories.`);
      }
    }
  }

  console.log('\n=== SUCCESS: ALL POSTS NOW HAVE ALL THEIR CATEGORIES ASSOCIATED! ===');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error during multi-category sync:', err);
  process.exit(1);
});
