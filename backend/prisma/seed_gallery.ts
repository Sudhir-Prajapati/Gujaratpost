import { PrismaClient } from '@prisma/client';
import process from 'node:process';

const prisma = new PrismaClient();

async function seed5Photos() {
  await prisma.galleryPhoto.deleteMany({});
  console.log('Deleted old photos');

  const items = [
    {
      src: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=90',
      alt: 'ધર્મ',
      caption: 'Ocean of Devotion: Pilgrims enthusiasm at Somnath Temple',
      captionGu: 'ભક્તિનો મહાસાગર ઉમટ્યો',
      captionHi: 'ભક્તિ નો મહાસાગર',
      photographer: 'Gujarat Post Team',
      copyright: '© Gujarat Post',
    },
    {
      src: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=90',
      alt: 'ધર્મ',
      caption: 'Stunning glimpse of Ahmedabad Flower Show 2025',
      captionGu: 'અહમદાબાદ ફલાવર શો 2025ની અદ્ભુત ઝલક',
      captionHi: 'અમદાવાદ ફ્લાવર શો 2025',
      photographer: 'Gujarat Post Team',
      copyright: '© Gujarat Post',
    },
    {
      src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=90',
      alt: 'પ્રવાસ',
      caption: 'Colorful Navratri preparations! See the excitement in pictures',
      captionGu: 'નવરાત્રિની રંગીન તૈયારીઓ! તસવીરોમાં જુઓ ધમાલ',
      captionHi: 'નવરાત્રી કી તૈયારીયાં',
      photographer: 'Gujarat Post Team',
      copyright: '© Gujarat Post',
    },
    {
      src: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=90',
      alt: 'ખેલ',
      caption: 'Girnar Lili Parikrama: Massive gathering of devotees',
      captionGu: 'ગિરનાર લીલી પરિક્રમા: ભક્તિનો મહાસાગર ઉમટ્યો',
      captionHi: 'ગિરનાર લીલી પરિક્રમા',
      photographer: 'Gujarat Post Team',
      copyright: '© Gujarat Post',
    },
    {
      src: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=90',
      alt: 'સંસ્કૃતિ',
      caption: 'Folk cultural celebration at Kutch Rann Utsav',
      captionGu: 'કચ્છના રણ ઉત્સવમાં લોકસંસ્કૃતિની રમઝટ',
      captionHi: 'કચ્છ રણ ઉત્સવ',
      photographer: 'Gujarat Post Team',
      copyright: '© Gujarat Post',
    },
  ];

  for (const item of items) {
    await prisma.galleryPhoto.create({ data: item });
  }

  console.log('Successfully seeded 5 gallery photos!');
}

seed5Photos()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
