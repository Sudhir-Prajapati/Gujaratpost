const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Checking and resetting stale hero slots in MySQL database...');
  try {
    const updated = await prisma.heroSetting.updateMany({
      data: {
        slot1Id: null,
        slot2Id: null,
        slot3Id: null,
        heroGridMode: 'auto',
      },
    });
    console.log(`✅ Successfully cleared stale slots in ${updated.count} HeroSetting record(s).`);
    console.log('Now the mobile carousel and bottom cards will automatically display fresh, latest news!');
  } catch (err) {
    console.error('❌ Error updating hero slots:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
