const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDb() {
  const page = {
    id: 'cookie-policy',
    pageTitle: 'Cookie Policy',
    lastUpdated: 'Last Updated: October 2026',
    introText:
      'This Cookie Policy explains how Gujarat Post ("we", "our", or "Gujarat Post") utilizes cookies, local browser storage, and related web technologies across our web portal, mobile web views, and digital services. In strict compliance with India’s Digital Personal Data Protection Act, 2023 (DPDPA) and the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, we are committed to complete transparency regarding the data we store and respect your fundamental right to control your digital privacy.',
    sections: [
      {
        id: 'sec-1',
        title: '1. What are Cookies and Browser Storage?',
        content:
          'Cookies are small text identifiers placed on your browser or device when you visit a website. In addition to HTTP cookies, modern web applications utilize Browser Storage (such as LocalStorage and SessionStorage) to store preferences locally on your client device without sending that data with every network request to our servers.\n\nGujarat Post strictly distinguishes essential technical storage needed for platform security and news delivery from optional reader preferences and third-party media integrations.',
      },
      {
        id: 'sec-2',
        title: '2. Legal Basis and User Consent (DPDPA 2023 Compliance)',
        content:
          'Under the Digital Personal Data Protection Act, 2023 (DPDPA):\n\n• **Strictly Necessary Storage:** Essential for website operation, user authentication, and cybersecurity. These do not require prior affirmative consent as they are necessary for providing requested digital news services.\n• **Optional Storage & Third-Party Embeds:** Analytics, preference cookies, and third-party embeds (such as YouTube videos and interactive Google Maps) require your affirmative consent.\n• **Freedom to Withdraw:** You retain the unconditional right to modify or withdraw your consent at any time without affecting your ability to read our news reports.',
      },
      {
        id: 'sec-3',
        title: '3. Strictly Necessary Storage and Cookies',
        content:
          'These identifiers are indispensable for the core functioning, session integrity, and security of Gujarat Post:\n\n• **gp_cookie_consent:** Stores your explicit cookie preferences (essential, functional, analytics, marketing) for 365 days so you do not receive repetitive banners on every visit.\n• **access_token & refresh_token:** Secure, HttpOnly, SameSite=Lax credentials used solely to authenticate administrative, reporter, and registered subscriber sessions.\n• **Security & CSRF Tokens:** Protect user submissions, comment forms, and feedback mechanisms against cross-site request forgery and automated bot spam.',
      },
      {
        id: 'sec-4',
        title: '4. Functional and Reader Preferences',
        content:
          'Functional storage enhances your personalized reading experience without cross-site tracking or commercial profiling. All preference values remain localized to your device:\n\n• **gp-theme & gp-apk-theme:** Saves your visual preference between Dark Mode and Light Mode.\n• **gp-fs-level:** Stores font size scaling preferences (Small, Standard, Large, Extra Large) for optimal Gujarati typography readability.\n• **gp-selected-city:** Remembers your chosen home district or city (e.g., Ahmedabad, Surat, Rajkot, Vadodara) to prioritize hyperlocal news.\n• **gp-saved-articles:** Stores offline bookmarks and reading lists directly in your browser without synchronizing to external advertising profiles.',
      },
      {
        id: 'sec-5',
        title: '5. First-Party Advertisements vs. Third-Party Tracking',
        content:
          'Gujarat Post operates under a strict privacy-first advertising philosophy:\n\n• **First-Party Direct Advertising:** All commercial banners and sponsor notices published across Gujarat Post are served directly from our own infrastructure. We do not sell, rent, or trade your browsing habits to third-party ad networks.\n• **No Third-Party Ad Pixels:** We do not install invasive tracking pixels or cross-site tracking beacons that monitor your web activity across the broader internet.',
      },
      {
        id: 'sec-6',
        title: '6. Third-Party Media Integrations & Consent Gating',
        content:
          'To enrich our journalistic coverage, articles may include embedded media from external service providers:\n\n• **YouTube Videos & Shorts:** Embedded video reports are consent-gated. If you have not granted marketing consent, external embeds remain inactive behind a privacy notice.\n• **Interactive Google Maps:** Hyperlocal incident locations and event maps remain inactive until you authorize external third-party content.\n• **Third-Party Privacy:** Once you consent to load external embeds, their respective privacy and cookie policies govern data collected directly by those platforms.',
      },
      {
        id: 'sec-7',
        title: '7. Managing, Customizing, and Withdrawing Consent',
        content:
          'You have full control over your cookie settings at all times:\n\n• **Cookie Settings Modal:** Click the "Cookie Settings" link located in the footer of every page or visit our dedicated /cookie-settings route to review and adjust your preferences.\n• **Browser-Level Controls:** Most modern web browsers allow you to view, manage, and delete stored cookies and site data via your browser settings menu (Settings > Privacy & Security > Cookies).\n• **Impact of Disabling:** Disabling functional preferences may reset your preferred theme, font size, or localized district on subsequent visits.',
      },
      {
        id: 'sec-8',
        title: '8. Grievance Redressal Officer and Contact Details',
        content:
          'In compliance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, if you have any questions, grievances, or requests regarding this Cookie Policy or your data rights, please contact our Grievance Redressal Officer:\n\n• **Grievance Redressal Officer:** Mahesh Patel\n• **Entity:** Gujarat Post Digital Media Network\n• **Email:** grievance@gujaratpost.in & privacy@gujaratpost.in\n• **Phone:** +91 99099 07237\n• **Registered Address:** Gujarat Post Bhavan, S.G. Highway, Prahlad Nagar, Vastrapur, Ahmedabad, Gujarat 380015\n• **Response Window:** All inquiries and grievance notices will be acknowledged within 24 hours and addressed within 15 working days as mandated by applicable law.',
      },
    ],
  };

  const sectionsJson = JSON.stringify(page.sections);
  await prisma.$executeRawUnsafe(
    `UPDATE legal_pages
     SET pageTitle = ?, lastUpdated = ?, introText = ?, sectionsJson = ?, updatedAt = NOW(3)
     WHERE id = ?`,
    page.pageTitle,
    page.lastUpdated,
    page.introText,
    sectionsJson,
    page.id
  );
  console.log('Successfully updated cookie-policy in legal_pages with 8 comprehensive sections.');
}

updateDb().catch(console.error).finally(() => prisma.$disconnect());
