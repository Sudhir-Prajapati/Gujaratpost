const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_PAGES = [
  {
    id: 'privacy-policy',
    pageTitle: 'Privacy Policy',
    lastUpdated: 'Last Updated: October 2026',
    introText:
      'This Privacy Policy describes how Gujarat Post ("we", "our", or "Gujarat Post") collects, uses, stores, and protects user information when you use our website, mobile applications, and other services (collectively, the "Services"). By using our Services, you agree to the collection and use of information in accordance with this policy.\n\nThis policy is in accordance with applicable data protection laws. We may update this policy from time to time. Users are advised to review it periodically.\n\nOur Services may include third-party links or integrations. We are not responsible for the privacy practices of such third parties, and users are encouraged to review their policies separately.',
    sections: [
      {
        id: 'sec-1',
        title: '1. Consent of the User',
        content:
          'By using our Services, you consent to the collection, use, storage, and sharing of your information as described in this Privacy Policy.\n\nUsers may choose to sign in using third-party platforms (such as Google, Facebook, etc.). In such cases, we may receive certain profile information as permitted by those platforms. Users can disconnect such accounts at any time.',
      },
      {
        id: 'sec-2',
        title: '2. Information We Collect',
        content:
          'We may collect the following types of information:\n\n• **Personal Information:** Name, email address, phone number, profile picture, gender, age, location, etc.\n• **Usage Data:** Log data, device information, browser type, IP address, pages visited, time spent.\n• **Information Provided by User:** Data submitted during registration, surveys, contests, or support requests.',
      },
      {
        id: 'sec-3',
        title: '3. How We Use Your Information',
        content:
          'We use the collected information for the following verified journalistic and service purposes:\n\n• To deliver authentic digital news reporting and hyperlocal coverage.\n• To personalize your news feed based on your district, language, and interests.\n• To send breaking news alerts, newsletters, or respond to your inquiries.\n• To monitor site security, detect fraudulent activities, and maintain platform integrity.',
      },
      {
        id: 'sec-4',
        title: '4. Cookies and Web Analytics',
        content:
          'Gujarat Post uses essential and analytical cookies to remember user preferences, maintain session security, and understand reading habits across different categories.\n\n• **Essential Cookies:** Required for basic site navigation, account authentication, and e-paper access.\n• **Analytics Cookies:** Help our editorial staff understand readership trends without compromising personal privacy.',
      },
      {
        id: 'sec-5',
        title: '5. Data Protection and Retention',
        content:
          'We employ enterprise-grade technical and organizational safeguards to protect your personal information against unauthorized disclosure, alteration, or theft. We retain your information only as long as necessary to provide Services or satisfy legal requirements.',
      },
      {
        id: 'sec-6',
        title: '6. Grievance Redressal and Contact Details',
        content:
          'In accordance with Information Technology rules, if you have any questions, concerns, or grievances regarding this Privacy Policy, please contact our Grievance Redressal Officer:\n\n• **Officer:** Mahesh Patel (Grievance Redressal Officer)\n• **Email:** grievance@gujaratpost.in & contact@gujaratpost.in\n• **Phone:** +91 99099 07237\n• **Address:** Gujarat Post Bhavan, S.G. Highway, Prahlad Nagar, Vastrapur, Ahmedabad, Gujarat 380015',
      },
    ],
  },
  {
    id: 'terms-of-use',
    pageTitle: 'Terms of Use',
    lastUpdated: 'Last Updated: October 2026',
    introText:
      'Welcome to Gujarat Post. These Terms of Use ("Terms") govern your access to and use of Gujarat Post websites, applications, e-papers, video portals, and digital services (collectively, the "Services").\n\nPlease read these Terms carefully. By accessing or using Gujarat Post, you acknowledge that you have read, understood, and agreed to be bound by these Terms. If you do not accept these Terms, please do not use the Services.',
    sections: [
      {
        id: 'sec-1',
        title: '1. Acceptance and Eligibility',
        content:
          'By accessing Gujarat Post, you confirm that you are legally competent to enter into a binding agreement in India or your jurisdiction of residence, and agree to abide by all local, state, and national laws.',
      },
      {
        id: 'sec-2',
        title: '2. Intellectual Property Rights',
        content:
          'All content published on Gujarat Post—including articles, breaking news, photos, infographics, videos, audio, trademarks, layouts, and software—is the exclusive intellectual property of Gujarat Post and protected under Indian Copyright and Intellectual Property laws.\n\n• **Permitted Use:** You may view, read, and share links to articles for non-commercial, personal use.\n• **Prohibited Use:** Reproduction, scraping, republishing, translation, or broadcasting without express written consent from Gujarat Post is strictly prohibited.',
      },
      {
        id: 'sec-3',
        title: '3. User Conduct and Reader Comments',
        content:
          'When interacting on our platform or submitting news tips:\n\n• Do not submit illegal, defamatory, abusive, threatening, or obscene material.\n• Do not spread false rumors, communal disharmony, or unverified claims.\n• Do not upload viruses, malware, or spam links.\n• Gujarat Post reserves the right to remove any comment and block accounts violating these standards.',
      },
      {
        id: 'sec-4',
        title: '4. E-Paper and Digital Subscriptions',
        content:
          'Certain premium editorial features, archived editions, and downloadable PDF papers may require registration.\n\n• Accounts are for single-user personal access and must not be distributed.\n• Subscription fees, if applicable, are non-refundable unless stated in writing.',
      },
      {
        id: 'sec-5',
        title: '5. Limitation of Liability',
        content:
          'Gujarat Post makes reasonable efforts to verify news, but shall not be liable for any indirect, consequential, or incidental damages resulting from your use of or reliance on any reports, articles, or market rates published on the platform.',
      },
      {
        id: 'sec-6',
        title: '6. Governing Law and Jurisdiction',
        content:
          'These Terms are governed by and construed in accordance with the laws of India. Any legal dispute or proceeding arising out of or related to these Terms shall be subject to the exclusive jurisdiction of the courts in Ahmedabad, Gujarat.',
      },
    ],
  },
  {
    id: 'disclaimer',
    pageTitle: 'Disclaimer',
    lastUpdated: 'Last Updated: October 2026',
    introText:
      'The information provided on Gujarat Post (www.gujaratpost.in) is published in good faith for general news reporting, public interest, and informational awareness only. While our editorial team makes diligent efforts to verify facts, Gujarat Post makes no representations or warranties of any kind regarding completeness, accuracy, or suitability.',
    sections: [
      {
        id: 'sec-1',
        title: '1. Fast-Breaking News and Ground Reality',
        content:
          'During fast-breaking news, developing stories, and natural disasters, initial reports may change rapidly as official government releases and emergency agencies provide confirmed updates. Readers should consult official authorities for critical personal decisions.',
      },
      {
        id: 'sec-2',
        title: '2. Opinions, Editorials, and Columnists',
        content:
          'The opinions, analyses, and views expressed in opinion pieces, guest columns, and letters to the editor belong entirely to the respective authors and do not necessarily represent the official stance or editorial policy of Gujarat Post or its management.',
      },
      {
        id: 'sec-3',
        title: '3. Financial, Market, and Health Content',
        content:
          'Content relating to stock markets, commodity rates (Gold/Silver), business updates, astrological forecasts, and health tips is published solely for informational purposes.\n\n• **Financial & Investment:** None of our content constitutes investment advice. Always consult certified financial advisors.\n• **Medical & Health:** Articles are not a substitute for professional medical advice, diagnosis, or treatment.',
      },
      {
        id: 'sec-4',
        title: '4. Advertisements and External Links',
        content:
          'Our platform contains third-party advertisements, sponsored content, and hyperlinks to third-party websites. Gujarat Post does not verify, endorse, or guarantee the claims, offers, products, or safety of any external website or advertiser.',
      },
      {
        id: 'sec-5',
        title: '5. Copyright and Fair Use Inquiries',
        content:
          'If you believe that any image, text, or video on our website infringes upon your copyright, please contact our editorial desk with proof of ownership for prompt review and resolution:\n\n• **Editorial Contact:** editorial@gujaratpost.in\n• **Direct Phone:** +91 99099 07237',
      },
    ],
  },
];

async function main() {
  console.log('Ensuring legal_pages table exists...');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS legal_pages (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      pageTitle VARCHAR(255) NOT NULL,
      lastUpdated VARCHAR(191) NULL,
      introText LONGTEXT NULL,
      sectionsJson LONGTEXT NULL,
      contentHtml LONGTEXT NULL,
      updatedAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  `);

  console.log('Seeding default legal pages (Privacy Policy, Terms of Use, Disclaimer)...');
  for (const page of DEFAULT_PAGES) {
    const existing = await prisma.$queryRawUnsafe(
      'SELECT id FROM legal_pages WHERE id = ? LIMIT 1',
      page.id
    );

    const sectionsJson = JSON.stringify(page.sections);
    if (!existing || existing.length === 0) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO legal_pages (id, pageTitle, lastUpdated, introText, sectionsJson) VALUES (?, ?, ?, ?, ?)`,
        page.id,
        page.pageTitle,
        page.lastUpdated,
        page.introText,
        sectionsJson
      );
      console.log(`Inserted default ${page.pageTitle} (${page.id})`);
    } else {
      console.log(`Page ${page.id} already exists, skipping overwrite.`);
    }
  }

  console.log('legal_pages table and seed data ready.');
}

main()
  .catch((e) => {
    console.error('Error initializing legal pages:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
