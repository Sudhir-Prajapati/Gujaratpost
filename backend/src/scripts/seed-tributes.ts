import { prisma } from '../config/prisma.js';
import { ensureTributesTableExists } from '../controllers/tribute.controller.js';

async function seed() {
  await ensureTributesTableExists();

  const bdayId = 'bday-demo-1';
  const shradhId = 'shradh-demo-1';

  await prisma.$executeRawUnsafe(
    `INSERT INTO \`tributes\` 
      (\`id\`, \`type\`, \`name\`, \`photo\`, \`date\`, \`info\`, \`templateId\`, \`isActive\`, \`order\`, \`createdAt\`, \`updatedAt\`)
     VALUES 
      (?, 'BIRTHDAY', 'શ્રી રાજેશભાઈ પટેલ', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300', 'આજે', 'જન્મદિવસની હાર્દિક શુભકામનાઓ! ભગવાન આપને દીર્ઘાયુષ્ય, ઉત્તમ સ્વાસ્થ્ય અને અવિરત ખુશીઓ બક્ષે.', 'golden', 1, 1, NOW(3), NOW(3)),
      (?, 'SHRADHANJALI', 'સ્વ. શાંતિલાલ કેશવલાલ મહેતા', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300', 'પુણ્યતિથિ સ્મરણ', 'પરમકૃપાળુ પરમાત્મા દિવંગત પુણ્યાત્માને પોતાના શ્રીચરણોમાં પરમ શાંતિ અર્પે એવી ભાવભરી પ્રાર્થના. ૐ શાંતિ.', 'shanti', 1, 2, NOW(3), NOW(3))
     ON DUPLICATE KEY UPDATE \`updatedAt\` = NOW(3)`,
    bdayId,
    shradhId
  );

  console.log('Sample tributes seeded successfully!');
  await prisma.$disconnect();
}

seed().catch(console.error);
