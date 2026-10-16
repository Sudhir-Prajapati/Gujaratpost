const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    try {
      await prisma.$executeRawUnsafe("ALTER TABLE about_settings ADD COLUMN rulesTitle VARCHAR(255) DEFAULT 'અમારા અડગ નિયમો'");
      console.log('rulesTitle column added successfully');
    } catch (e) {
      console.log('rulesTitle column already exists or error:', e.message);
    }

    try {
      await prisma.$executeRawUnsafe("ALTER TABLE about_settings ADD COLUMN rulesJson LONGTEXT");
      console.log('rulesJson column added successfully');
    } catch (e) {
      console.log('rulesJson column already exists or error:', e.message);
    }

    const defaultRules = JSON.stringify([
      '૧૦૦% તથ્ય ચકાસણી (Fact Checked)',
      'કોઈપણ ફેક ન્યૂઝ સામે શૂન્ય સહિષ્ણુતા',
      'ગ્રાઉન્ડ રિયાલિટી રિપોર્ટિંગ',
      'વાચકોની પ્રાઈવસીનું સંપૂર્ણ સન્માન',
    ]);

    await prisma.$executeRawUnsafe(
      "UPDATE about_settings SET rulesTitle = 'અમારા અડગ નિયમો', rulesJson = ? WHERE id = 'default'",
      defaultRules
    );
    console.log('Default rules seeded successfully!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
