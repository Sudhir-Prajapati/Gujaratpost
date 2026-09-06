import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany({
    include: { category: true }
  });

  const cityCounts: Record<string, number> = {
    'Ahmedabad (અમદાવાદ)': 0,
    'Gandhinagar (ગાંધીનગર)': 0,
    'Surat (સુરત)': 0,
    'Vadodara (વડોદરા)': 0,
    'Rajkot (રાજકોટ)': 0,
    'Other Cities & State (અન્ય શહેરો / રાજ્ય)': 0,
  };

  const detailedArticles: Record<string, Array<{ articleNumber: number | null; titleGu: string; location: string; category: string }>> = {
    'Ahmedabad (અમદાવાદ)': [],
    'Gandhinagar (ગાંધીનગર)': [],
    'Surat (સુરત)': [],
    'Vadodara (વડોદરા)': [],
    'Rajkot (રાજકોટ)': [],
    'Other Cities & State (અન્ય શહેરો / રાજ્ય)': [],
  };

  for (const post of posts) {
    const loc = (post.location || '').toLowerCase().trim();
    const cat = (post.category?.slug || '').toLowerCase().trim();
    const title = post.titleGu || post.title;
    const info = {
      articleNumber: post.articleNumber,
      titleGu: title,
      location: post.location || 'N/A',
      category: post.category?.nameGu || post.category?.name || 'General'
    };

    if (loc.includes('ahmedabad') || loc.includes('અમદાવાદ') || cat.includes('ahmedabad')) {
      cityCounts['Ahmedabad (અમદાવાદ)']++;
      detailedArticles['Ahmedabad (અમદાવાદ)'].push(info);
    } else if (loc.includes('gandhinagar') || loc.includes('ગાંધીનગર') || cat.includes('gandhinagar')) {
      cityCounts['Gandhinagar (ગાંધીનગર)']++;
      detailedArticles['Gandhinagar (ગાંધીનગર)'].push(info);
    } else if (loc.includes('surat') || loc.includes('સુરત') || cat.includes('surat')) {
      cityCounts['Surat (સુરત)']++;
      detailedArticles['Surat (સુરત)'].push(info);
    } else if (loc.includes('vadodara') || loc.includes('વડોદરા') || cat.includes('vadodara')) {
      cityCounts['Vadodara (વડોદરા)']++;
      detailedArticles['Vadodara (વડોદરા)'].push(info);
    } else if (loc.includes('rajkot') || loc.includes('રાજકોટ') || cat.includes('rajkot')) {
      cityCounts['Rajkot (રાજકોટ)']++;
      detailedArticles['Rajkot (રાજકોટ)'].push(info);
    } else {
      cityCounts['Other Cities & State (અન્ય શહેરો / રાજ્ય)']++;
      detailedArticles['Other Cities & State (અન્ય શહેરો / રાજ્ય)'].push(info);
    }
  }

  console.log('=== SUMMARY COUNTS ===');
  console.log(JSON.stringify(cityCounts, null, 2));
  console.log('Total articles in DB:', posts.length);

  console.log('\n=== ARTICLES BREAKDOWN BY CITY ===');
  for (const [key, list] of Object.entries(detailedArticles)) {
    console.log(`\n--- ${key} (${list.length} Articles) ---`);
    list.forEach((art, idx) => {
      console.log(`${idx + 1}. [#${art.articleNumber}] ${art.titleGu} (Location: ${art.location}, Category: ${art.category})`);
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
