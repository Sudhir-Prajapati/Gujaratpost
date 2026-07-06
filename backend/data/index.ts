import { Article, Author, NavItem, Photo, Video, Language } from "@/types";

export const SITE_URL = "https://gujaratpost.example.com";

export const AUTHORS: Author[] = [
  {
    id: "a1",
    name: "Rajesh Patel",
    nameGu: "રાજેશ પટેલ",
    nameHi: "राजेश पटेल",
    image: "https://i.pravatar.cc/100?img=11",
    designation: "Senior Editor",
    designationGu: "વરિષ્ઠ સંપાદક",
    designationHi: "वरिष्ठ संपादक",
    bio: "Senior journalist covering Gujarat politics and civic affairs for 15 years.",
    bioGu: "ગુજરાતની રાજનીતિ અને નાગરિક મુદ્દાઓ પર 15 વર્ષથી રિપોર્ટિંગ કરતા વરિષ્ઠ પત્રકાર.",
    bioHi: "गुजरात की राजनीति और नागरिक मुद्दों पर 15 वर्षों से रिपोर्टिंग करने वाले वरिष्ठ पत्रकार.",
  },
  {
    id: "a2",
    name: "Priya Shah",
    nameGu: "પ્રિયા શાહ",
    nameHi: "પ્રિયા શાહ",
    image: "https://i.pravatar.cc/100?img=32",
    designation: "Crime Reporter",
    designationGu: "ક્રાઇમ રિપોર્ટર",
    designationHi: "क्राइम रिपोर्टर",
    bio: "Investigative reporter focused on policing, courts and public safety.",
    bioGu: "પોલીસ, કોર્ટ અને જાહેર સુરક્ષા પર કેન્દ્રિત તપાસ પત્રકાર.",
    bioHi: "पुलिस, अदालत और सार्वजनिक सुरक्षा पर केंद्रित खोजी पत्रकार.",
  },
  {
    id: "a3",
    name: "Amit Desai",
    nameGu: "અમિત દેસાઈ",
    nameHi: "अमित देसाई",
    image: "https://i.pravatar.cc/100?img=12",
    designation: "Business Correspondent",
    designationGu: "બિઝનેસ સંવાદદાતા",
    designationHi: "बिजनेस संवाददाता",
    bio: "Tracks Gujarat industry, startups, markets and infrastructure.",
    bioGu: "ગુજરાતના ઉદ્યોગ, સ્ટાર્ટઅપ, બજાર અને ઈન્ફ્રાસ્ટ્રક્ચર પર નજર રાખે છે.",
    bioHi: "गुजरात के उद्योग, स्टार्टअप, बाजार और इन्फ्रास्ट्रक्चर पर नजर रखते हैं.",
  },
  {
    id: "a4",
    name: "Meera Joshi",
    nameGu: "મીરા જોશી",
    nameHi: "मीरा जोशी",
    image: "https://i.pravatar.cc/100?img=47",
    designation: "Sports Reporter",
    designationGu: "સ્પોર્ટ્સ રિપોર્ટર",
    designationHi: "स्पोर्ट्स रिपोर्टर",
    bio: "Covers cricket, kabaddi and emerging sports talent from Gujarat.",
    bioGu: "ગુજરાતના ક્રિકેટ, કબડ્ડી અને ઊભરતી રમત પ્રતિભાઓને આવરી લે છે.",
    bioHi: "गुजरात के क्रिकेट, कबड्डी और उभरती खेल प्रतिभाओं को कवर करती हैं.",
  },
  {
    id: "a5",
    name: "Suresh Trivedi",
    nameGu: "સુરેશ ત્રિવેદી",
    nameHi: "सुरेश त्रिवेदी",
    image: "https://i.pravatar.cc/100?img=52",
    designation: "Political Editor",
    designationGu: "રાજકીય સંપાદક",
    designationHi: "राजनीतिक संपादक",
    bio: "Political analyst with deep coverage of Gujarat elections and policy.",
    bioGu: "ગુજરાત ચૂંટણી અને નીતિ વિષયક ઊંડાણપૂર્વકનું કવરેજ ધરાવતા રાજકીય વિશ્લેષક.",
    bioHi: "गुजरात चुनाव और नीति पर गहरी पकड़ रखने वाले राजनीतिक विश्लेषक.",
  },
];

export const CATEGORY_META = {
  state: { name: "State", gu: "રાજ્ય સમાચાર", hi: "राज्य समाचार" },
  national: { name: "National", gu: "રાષ્ટ્રીય", hi: "राष्ट्रीय" },
  ahmedabad: { name: "Ahmedabad", gu: "અમદાવાદ", hi: "अहमदाबाद" },
  rajkot: { name: "Rajkot", gu: "રાજકોટ", hi: "राजकोट" },
  surat: { name: "Surat", gu: "સુરત", hi: "सूरत" },
  vadodara: { name: "Vadodara", gu: "વડોદરા", hi: "वडोदरा" },
  crime: { name: "Crime", gu: "ક્રાઇમ", hi: "क्राइम" },
  politics: { name: "Politics", gu: "રાજકારણ", hi: "राजनीति" },
  business: { name: "Business", gu: "બિઝનેસ", hi: "बिजनेस" },
  sports: { name: "Sports", gu: "રમતગમત", hi: "खेल" },
  entertainment: { name: "Entertainment", gu: "મનોરંજન", hi: "मनोरंजन" },
  technology: { name: "Technology", gu: "ટેકનોલોજી", hi: "टेक्नोलॉजी" },
  lifestyle: { name: "Lifestyle", gu: "લાઇફસ્ટાઇલ", hi: "लाइफस्टाइल" },
  education: { name: "Education", gu: "શિક્ષણ", hi: "शिक्षा" },
  world: { name: "World", gu: "વિશ્વ", hi: "विश्व" },
  "election-2027": { name: "Gujarat Election 2027", gu: "ગુજરાત ચૂંટણી 2027", hi: "गुजरात चुनाव 2027" },
  videos: { name: "Videos", gu: "વીડિયો", hi: "वीडियो" },
  shorts: { name: "Shorts", gu: "શોર્ટ્સ", hi: "शॉर्ट्स" },
  podcasts: { name: "Podcasts", gu: "પોડકાસ્ટ", hi: "पॉडकास्ट" },
};

type CategorySlug = keyof typeof CATEGORY_META;

export const categorySlugMapping: Record<string, CategorySlug> = {
  gujarat: "state",
  state: "state",
  national: "national",
  ahmedabad: "ahmedabad",
  rajkot: "rajkot",
  surat: "surat",
  vadodara: "vadodara",
  crime: "crime",
  politics: "politics",
  business: "business",
  sports: "sports",
  entertainment: "entertainment",
  technology: "technology",
  lifestyle: "lifestyle",
  education: "education",
  world: "world",
  "election-2027": "election-2027",
  videos: "videos",
  shorts: "shorts",
  podcasts: "podcasts",
  
  // Title-cased mappings to lowercase slug
  Gujarat: "state",
  Ahmedabad: "ahmedabad",
  Rajkot: "rajkot",
  Surat: "surat",
  Vadodara: "vadodara",
  Crime: "crime",
  Politics: "politics",
  Business: "business",
  Sports: "sports",
  Entertainment: "entertainment",
  Technology: "technology",
  Lifestyle: "lifestyle",
  Education: "education",
  World: "world",
};

const IMG: Record<string, string[]> = {
  gujarat: [
    "https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=800&q=80",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80",
    "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80",
    "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80",
    "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&q=80",
    "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800&q=80",
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80",
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80",
    "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&q=80",
    "https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=800&q=80",
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80",
    "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=800&q=80",
  ],
  politics: [
    "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&q=80",
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80",
    "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&q=80",
    "https://images.unsplash.com/photo-1555848962-6e79363ec58f?w=800&q=80",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    "https://images.unsplash.com/photo-1575320181282-9afab399332c?w=800&q=80",
    "https://images.unsplash.com/photo-1569025591-b0a08fb07b98?w=800&q=80",
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&q=80",
    "https://images.unsplash.com/photo-1560439514-4e9645039924?w=800&q=80",
    "https://images.unsplash.com/photo-1494172961521-33799ddd43a5?w=800&q=80",
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80",
    "https://images.unsplash.com/photo-1608096299210-db7e38487075?w=800&q=80",
  ],
  crime: [
    "https://images.unsplash.com/photo-1589578527966-fdac0f44566c?w=800&q=80",
    "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
    "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&q=80",
    "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&q=80",
    "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&q=80",
    "https://images.unsplash.com/photo-1604881991720-f91add269bed?w=800&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=800&q=80",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&q=80",
  ],
  business: [
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80",
    "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80",
    "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80",
    "https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&q=80",
    "https://images.unsplash.com/photo-1559526324-593bc073d938?w=800&q=80",
    "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&q=80",
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
    "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=800&q=80",
  ],
  sports: [
    "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
    "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80",
    "https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=800&q=80",
    "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80",
    "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80",
    "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
    "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
    "https://images.unsplash.com/photo-1504016798967-7a461b8b79fd?w=800&q=80",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
    "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&q=80",
    "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80",
  ],
  entertainment: [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80",
    "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=800&q=80",
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800&q=80",
    "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&q=80",
    "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80",
    "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&q=80",
  ],
  technology: [
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
    "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80",
    "https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?w=800&q=80",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80",
    "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80",
    "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80",
    "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
    "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80",
  ],
  world: [
    "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?w=800&q=80",
    "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=800&q=80",
    "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
    "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&q=80",
    "https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=800&q=80",
    "https://images.unsplash.com/photo-1474631245212-32dc3c8310c6?w=800&q=80",
    "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&q=80",
    "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=800&q=80",
    "https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=800&q=80",
    "https://images.unsplash.com/photo-1467912407355-245f30185020?w=800&q=80",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
    "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80",
  ],
  lifestyle: [
    "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80",
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
    "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80",
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80",
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
    "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&q=80",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  ],
  education: [
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80",
    "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",
    "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800&q=80",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80",
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80",
    "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
    "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&q=80",
    "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=800&q=80",
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80",
    "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800&q=80",
    "https://images.unsplash.com/photo-1565728744382-61accd4aa148?w=800&q=80",
  ],
};

const baseStories = [
  // Gujarat
  ["gujarat", "Ahmedabad receives heavy rain alert as riverfront gates opened", "અમદાવાદમાં ભારે વરસાદનું એલર્ટ, રિવરફ્રન્ટના ગેટ ખોલાયા", "अहमदाबाद में भारी बारिश का अलर्ट, रिवरफ्रंट के गेट खुले"],
  ["gujarat", "Rajkot international airport gets new domestic routes", "રાજકોટ ઇન્ટરનેશનલ એરપોર્ટને નવા ડોમેસ્ટિક રૂટ મળ્યા", "राजकोट अंतरराष्ट्रीय एयरपोर्ट को नए घरेलू रूट मिले"],
  ["gujarat", "Vadodara heritage corridor work enters final phase", "વડોદરા હેરિટેજ કોરિડોરનું કામ અંતિમ તબક્કામાં", "वडोदरा हेरिटेज कॉरिडोर का काम अंतिम चरण में"],
  ["gujarat", "New expressway to connect Surat and Navsari by 2028", "સુરત-નવસારીને જોડતો નવો એક્સપ્રેસવે 2028 સુધીમાં", "सूरत-नवसारी को जोड़ने वाला नया एक्सप्रेसवे 2028 तक"],
  ["gujarat", "Gujarat gets record FDI inflow this quarter", "આ ત્રિમાસિકમાં ગુજરાતને રેકોર્ડ FDI પ્રવાહ", "इस तिमाही गुजरात को रिकॉर्ड FDI प्रवाह"],
  ["gujarat", "Solar power targets set for all major Gujarat cities", "ગુજરાતના મોટા શહેરો માટે સોલાર પાવર લક્ષ્યાંક", "गुजरात के प्रमुख शहरों के लिए सौर ऊर्जा लक्ष्य"],
  // Business
  ["business", "Surat diamond units announce new export recovery plan", "સુરતના ડાયમંડ ઉદ્યોગે નિકાસ સુધારણા યોજના જાહેર કરી", "सूरत डायमंड उद्योग ने निर्यात सुधार योजना घोषित की"],

  ["business", "Gujarat SMEs benefit from new RBI credit scheme", "ગુજરાત SMEsને RBIની નવી ક્રેડિટ સ્કીમ ફાયદો", "गुजरात SME को RBI की नई क्रेडिट स्कीम का फायदा"],
  ["business", "Stock market rally: Gujarat-based stocks outperform index", "શેરબજાર રેલી: ગુજરાત આધારિત શેરો ઇન્ડેક્સ કરતા આગળ", "शेयर बाजार रैली: गुजरात आधारित शेयर सूचकांक से आगे"],
  // Politics
  ["politics", "Gujarat Election 2027 preparations intensify across districts", "ગુજરાત ચૂંટણી 2027 માટે જિલ્લાઓમાં તૈયારીઓ તેજ", "गुजरात चुनाव 2027 की तैयारियां जिलों में तेज"],
  ["politics", "CM holds review meeting for development projects", "CM એ વિકાસ પ્રોજેક્ટ માટે સમીક્ષા બેઠક યોજી", "CM ने विकास परियोजनाओं के लिए समीक्षा बैठक की"],
  ["politics", "Congress announces campaign strategy for Gujarat 2027", "કોંગ્રેસે ગુજરાત 2027 ચૂંટણી ઝુંબેશ વ્યૂહ જાહેર કર્યો", "कांग्रेस ने गुजरात 2027 चुनाव अभियान रणनीति घोषित की"],
  ["politics", "AAP expands grassroot network in Gujarat rural areas", "AAPએ ગ્રામ્ય ગુજરાતમાં ભૂ-સ્તરીય નેટવર્ક વિસ્તાર્યું", "AAP ने ग्रामीण गुजरात में जमीनी नेटवर्क का विस्तार किया"],
  ["politics", "New cabinet reshuffle expected in Gujarat government", "ગુજરાત સરકારમાં નવો કેબિનેટ ફેરફાર અપેક્ષિત", "गुजरात सरकार में नया कैबिनेट फेरबदल अपेक्षित"],
  ["politics", "Panchayat elections dates finalised for three districts", "ત્રણ જિલ્લાઓ માટે પંચાયત ચૂંટણીની તારીખ નક્કી", "तीन जिलों के लिए पंचायत चुनाव की तारीखें तय"],
  // National
  ["national", "Parliament passes historic bill on digital privacy", "સંસદે ડિજિટલ પ્રાઇવસી પર ઐતિહાસિક બિલ પાસ કર્યું", "संसद ने डिजिटल गोपनीयता पर ऐतिहासिक विधेयक पारित किया"],
  ["national", "New national highway expansion projects approved by center", "કેન્દ્ર દ્વારા નવા રાષ્ટ્રીય ધોરીમાર્ગ વિસ્તરણ પ્રોજેક્ટ્સને મંજૂરી", "केंद्र द्वारा नए राष्ट्रीय राजमार्ग विस्तार परियोजनाओं को मंजूरी"],
  ["national", "ISRO announces next lunar exploration mission timeline", "ISRO એ આગામી ચંદ્ર સંશોધન મિશનની સમયરેખા જાહેર કરી", "इसरो ने अगले चंद्र अन्वेषण मिशन की समय-सीमा की घोषणा की"],
  ["national", "Monsoon covers entire country ahead of schedule, says IMD", "ચોમાસું સમય પહેલાં સમગ્ર દેશને આવરી લે છે, IMD", "मानसून समय से पहले पूरे देश में पहुंचा, आईएमडी ने कहा"],
  // Crime
  ["crime", "Cyber cell busts fake investment app network in Ahmedabad", "અમદાવાદમાં ફેક ઇન્વેસ્ટમેન્ટ એપ નેટવર્કનો પર્દાફાશ", "अहमदाबाद में फेक निवेश ऐप नेटवर्क का खुलासा"],
  ["crime", "Surat police seize contraband worth crores in joint raid", "સુરત પોલીસની સંયુક્ત રેડમાં કરોડોની કિંમતનો મુદ્દામાલ જપ્ત", "सूरत पुलिस की संयुक्त छापेमारी में करोड़ों का माल जब्त"],
  ["crime", "Kidnapping racket busted in Rajkot; five arrested", "રાજકોટમાં અપહરણ ગેંગ ઉઘાડી; પાંચ ધરપકડ", "राजकोट में अपहरण गिरोह का भंडाफोड़; पांच गिरफ्तार"],
  ["crime", "ATM skimming gang caught after months of investigation", "ATM સ્કીમિંગ ગેંગ મહિનાઓ ની તપાસ બાદ ઝડપાઈ", "ATM स्किमिंग गैंग महीनों की जांच के बाद पकड़ी गई"],
  ["crime", "Land fraud case: Senior official arrested in Vadodara", "જમીન ફ્રોડ કેસ: વડોદરામાં વરિષ્ઠ અધિકારી ધરપકડ", "भूमि धोखाधड़ी मामला: वडोदरा में वरिष्ठ अधिकारी गिरफ्तार"],
  ["crime", "Drug trafficking route from Pakistan via Gujarat busted", "પાકિસ્તાનથી ગુજરાત થઈ ડ્રગ ટ્રાફિકિંગ રૂટ ઝડપ્યો", "पाकिस्तान से गुजरात के रास्ते ड्रग तस्करी रूट का भंडाफोड़"],
  // Sports
  ["sports", "Gujarat Titans begin pre-season camp in Ahmedabad", "ગુજરાત ટાઇટન્સે અમદાવાદમાં પ્રી-સીઝન કેમ્પ શરૂ કર્યો", "गुजरात टाइटन्स ने अहमदाबाद में प्री-सीजन कैंप शुरू किया"],
  ["sports", "Hardik Pandya trains with Gujarat U-19 academy squad", "હાર્દિક પંડ્યાએ ગુજરાત U-19 એકેડેમી સ્ક્વૉડ સાથે પ્રેક્ટિસ કરી", "हार्दिक पंड्या ने गुजरात U-19 अकादमी दल के साथ अभ्यास किया"],
  ["sports", "Saurashtra cricket team wins Ranji Trophy semi-final", "સૌરાષ્ટ્ર ક્રિકેટ ટીમ રણજી ટ્રોફી સેમી-ફાઇનલ જીતી", "सौराष्ट्र क्रिकेट टीम रणजी ट्रॉफी सेमीफाइनल जीती"],
  ["sports", "Kabaddi league: Gujarat team enters knockout round", "કબડ્ડી લીગ: ગુજરાત ટીમ નૉકઆઉટ રાઉન્ડમાં", "कबड्डी लीग: गुजरात टीम नॉकआउट राउंड में"],
  ["sports", "National chess champion hails from Surat; city celebrates", "રાષ્ટ્રીય ચેસ ચેમ્પિયન સુરતના; શહેર ઉત્સવ", "राष्ट्रीय शतरंज चैंपियन सूरत का; शहर में जश्न"],
  ["sports", "Gujarat marathon records highest participation this year", "ગુજરાત મેરેથોનમાં આ વર્ષ સૌથી વધુ સહભાગ", "गुजरात मैराथन में इस साल सबसे अधिक भागीदारी"],
  ["sports", "Tennis star from Ahmedabad selected for Davis Cup team", "અમદાવાદના ટેનિસ સ્ટારને ડેવિસ કપ ટીમ માટે સ્થાન", "अहमदाबाद के टेनिस स्टार को डेविस कप टीम में जगह"],
  // Entertainment
  ["entertainment", "Navratri 2027 garba events announce premium safety plan", "નવરાત્રી 2027 ગરબા માટે પ્રીમિયમ સેફ્ટી પ્લાન જાહેર", "नवरात्रि 2027 गरबा के लिए प्रीमियम सुरक्षा योजना घोषित"],
  ["entertainment", "Gujarati film industry sets record box office this quarter", "ગુજરાતી ફિલ્મ ઉદ્યોગ આ ક્વાર્ટરમાં બૉક્સ ઑફિસ રેકોર્ડ", "गुजराती फिल्म उद्योग ने इस तिमाही बॉक्स ऑफिस रिकॉर्ड बनाया"],
  ["entertainment", "Singer Falguni Pathak announces 50-city Navratri tour", "ગાયિકા ફાલ્ગુની પાઠકે 50 શહેરોના નવરાત્રી ટૂરની જાહેરાત", "गायिका फाल्गुनी पाठक ने 50 शहरों के नवरात्रि दौरे की घोषणा"],
  ["entertainment", "New Gujarati OTT platform launches with 100+ shows", "નવો ગુજરાતી OTT પ્લૅટફૉર્મ 100+ શોઝ સાથે લૉન્ચ", "नया गुजराती OTT प्लेटफॉर्म 100+ शो के साथ लॉन्च"],
  ["entertainment", "Bollywood superstar shoots in Ahmedabad old city lanes", "અમદાવાદના જૂના શહેરની ગલીઓમાં બૉલીવૂડ સ્ટારની શૂટિંગ", "अहमदाबाद की पुरानी शहर की गलियों में बॉलीवुड स्टार की शूटिंग"],
  ["entertainment", "Comedy festival in Surat draws crowd of 10,000", "સુરતના કૉમેડી ફેસ્ટિવલમાં 10,000 ની ભીડ", "सूरत के कॉमेडी फेस्टिवल में 10,000 की भीड़"],
  ["entertainment", "Dandiya World Record attempt set in Vadodara", "વડોદરામાં ડાંડિયા વર્લ્ડ રેકોર્ડ પ્રયાસ", "वडोदरा में डांडिया विश्व रिकॉर्ड का प्रयास"],
  // Technology
  ["technology", "Ahmedabad startups launch AI tools for Gujarati businesses", "અમદાવાદ સ્ટાર્ટઅપ્સે ગુજરાતી બિઝનેસ માટે AI ટૂલ્સ લોન્ચ કર્યા", "अहमदाबाद स्टार्टअप्स ने गुजराती कारोबार के लिए AI टूल लॉन्च किए"],
  ["technology", "ISRO satellite launch backed by Gujarat aerospace firm", "ગુજરાત એરોસ્પેસ ફર્મ દ્વારા ISRO સેટેલાઇટ પ્રક્ષેપણ", "गुजरात एयरोस्पेस फर्म द्वारा ISRO उपग्रह प्रक्षेपण"],
  ["technology", "5G rollout reaches 50 more Gujarat towns this month", "5G આ માસ ગુજરાતના 50 વધુ કસ્બાઓ સુધી", "इस महीने 5G गुजरात के 50 और कस्बों तक पहुंचा"],
  ["technology", "Drone delivery pilots launch in three Gujarat cities", "ત્રણ ગુજરાત શહેરોમાં ડ્રોન ડિલિવરી પ્રોજેક્ટ શરૂ", "तीन गुजरात शहरों में ड्रोन डिलीवरी पायलट शुरू"],
  ["technology", "Semiconductor plant proposed near Sanand industrial zone", "સાણંદ ઔદ્યોગિક ક્ષેત્ર પાસે સેમિકન્ડક્ટર પ્લાન્ટ પ્રસ્તાવ", "साणंद औद्योगिक क्षेत्र के पास सेमीकंडक्टर प्लांट का प्रस्ताव"],
  ["technology", "Cybersecurity summit held at IIT Gandhinagar", "IIT ગાંધીનગર ખાતે સાઇબર સિક્યુરિટી સમિટ", "IIT गांधीनगर में साइबर सुरक्षा शिखर सम्मेलन"],
  // World
  ["world", "Global climate summit adopts new clean energy targets", "વૈશ્વિક આબોહવા પરિષદમાં ક્લીન એનર્જીના લક્ષ્યાંકો નક્કી", "वैश्विक जलवायु शिखर सम्मेलन में स्वच्छ ऊर्जा लक्ष्य"],
  ["world", "US tech giants expand investments in AI data centers", "યુએસ ટેક કંપનીઓએ AI ડેટા સેન્ટર્સમાં રોકાણ વધાર્યું", "अमेरिकी टेक दिग्गजों ने एआई डेटा सेंटरों में निवेश बढ़ाया"],
  ["world", "India trade talks may benefit Gujarat textile exporters", "ભારતની ટ્રેડ વાટાઘાટોથી ગુજરાત ટેક્સટાઇલ નિકાસકારોને લાભ", "भारत व्यापार वार्ता से गुजरात टेक्सटाइल निर्यातकों को लाभ"],
  ["world", "Global markets surge on positive economic indicator reports", "હકારાત્મક આર્થિક સંકેતો વચ્ચે વૈશ્વિક બજારોમાં ઉછાળો", "सकारात्मक आर्थिक संकेतों से वैश्विक बाजारों में उछाल"],
  ["world", "G20 nations agree on AI regulation framework", "G20 દેશો AI નિયમન ફ્રેમવર્ક પર સહમત", "G20 देश AI विनियमन ढांचे पर सहमत"],
  ["world", "Middle East ceasefire talks gain momentum at UN", "UN ખાતે મધ્ય-પૂર્વ સીઝ-ફાયર ચર્ચામાં ગતિ", "संयुक्त राष्ट्र में मध्य-पूर्व युद्धविराम वार्ता में गति"],
  // Lifestyle
  ["lifestyle", "Doctors issue heat and hydration advisory for urban Gujarat", "શહેરી ગુજરાત માટે ડૉક્ટર્સની હીટ અને હાઇડ્રેશન એડવાઇઝરી", "शहरी गुजरात के लिए डॉक्टरों की हीट और हाइड्रेशन सलाह"],
  ["lifestyle", "Ahmedabad yoga centre sets participation record", "અમદાવાદ યોગ કેન્દ્રે ભાગ-નોંધણી રેકોર્ડ", "अहमदाबाद योग केंद्र ने भागीदारी रिकॉर्ड बनाया"],
  ["lifestyle", "Gujarat food startups take traditional recipes global", "ગુજરાત ફૂડ સ્ટાર્ટઅપ્સ પરંપરાગત રેસિપી ગ્લોબલ", "गुजरात फूड स्टार्टअप्स ने पारंपरिक व्यंजनों को वैश्विक बनाया"],
  ["lifestyle", "Eco-friendly Ganesh Chaturthi trend grows across Gujarat", "ઇકો-ફ્રેન્ડ્લી ગણેશ ચતુર્થી ટ્રેન્ડ ગુજરાત ભરમાં", "गुजरात भर में इको-फ्रेंडली गणेश चतुर्थी का चलन बढ़ा"],
  ["lifestyle", "Wellness tourism boom: Gujarat spas see record bookings", "વેલનેસ ટૂરિઝમ: ગુજરાત સ્પામાં રેકોર્ડ બુકિંગ", "वेलनेस टूरिज्म बूम: गुजरात स्पा में रिकॉर्ड बुकिंग"],
  ["lifestyle", "Traditional Gujarati thali making a comeback in metros", "મેટ્રો શહેરોમાં ફરી ટ્રેડિશનલ ગુજરાતી થાળી ધૂમ", "मेट्रो शहरों में पारंपरिक गुजराती थाली की वापसी"],
  // Education
  ["education", "Gujarat board announces new digital assessment system", "ગુજરાત બોર્ડે નવી ડિજિટલ મૂલ્યાંકન સિસ્ટમ જાહેર કરી", "गुजरात बोर्ड ने नई डिजिटल मूल्यांकन प्रणाली घोषित की"],
  ["education", "IIM Ahmedabad ranked best management institute in India", "IIM અમદાવાદ ભારતના શ્રેષ્ઠ MBA ઇન્સ્ટિટ્યૂટ", "IIM अहमदाबाद भारत का सर्वश्रेष्ठ MBA संस्थान"],
  ["education", "New engineering colleges to open in Saurashtra region", "સૌરાષ્ટ્ર ક્ષેત્રમાં નવી એન્જિનિયરિંગ કૉલેજો ખૂલશે", "सौराष्ट्र क्षेत्र में नई इंजीनियरिंग कॉलेजें खुलेंगी"],
  ["education", "Scholarship scheme for rural Gujarat girls expanded", "ગ્રામ્ય ગુજરાતની છોકરીઓ માટે સ્કૉલરશિપ યોજના વિસ્તૃત", "ग्रामीण गुजरात की लड़कियों के लिए छात्रवृत्ति योजना का विस्तार"],
  ["education", "Gujarati medium schools get digital smart boards", "ગુજરાતી માધ્યમ શાળાઓને ડિજિટલ સ્માર્ટ બૉર્ડ", "गुजराती माध्यम स्कूलों को डिजिटल स्मार्ट बोर्ड मिले"],
  ["education", "State university starts Gujarati language AI research lab", "રાજ્ય યુનિ. ગુજરાત ભાષા AI સંશોધન લૅબ શરૂ", "राज्य विश्वविद्यालय ने गुजराती भाषा AI अनुसंधान लैब शुरू की"],
];

const cityStories = [
  ["ahmedabad", "Ahmedabad metro extension trial run completed successfully", "અમદાવાદ મેટ્રો એક્સ્ટેન્શનનો ટ્રાયલ રન સફળ", "अहमदाबाद मेट्रो विस्तार का ट्रायल रन सफल"],
  ["rajkot", "Rajkot civic body approves smart traffic command centre", "રાજકોટમાં સ્માર્ટ ટ્રાફિક કમાન્ડ સેન્ટરને મંજૂરી", "राजकोट में स्मार्ट ट्रैफिक कमांड सेंटर को मंजूरी"],
  ["surat", "Surat textile market records festive season demand spike", "સુરત ટેક્સટાઇલ માર્કેટમાં તહેવારી માંગમાં વધારો", "सूरत टेक्सटाइल बाजार में त्योहारों की मांग बढ़ी"],
  ["vadodara", "Vadodara lakefront redevelopment opens for public review", "વડોદરા લેકફ્રન્ટ રીડેવલપમેન્ટ જાહેર સમીક્ષા માટે ખુલ્યું", "वडोदरा हेरिटेज कॉरिडोर का काम अंतिम चरण में"],
];

const storyPool = [...baseStories, ...cityStories];

const excerptGu = "ગુજરાત પોસ્ટની ખાસ રિપોર્ટ પ્રમાણે આ નિર્ણયથી સ્થાનિક લોકો, વેપાર અને વહીવટી વ્યવસ્થામાં સીધી અસર પડશે.";
const excerptHi = "गुजरात पोस्ट की विशेष रिपोर्ट के अनुसार इस फैसले से स्थानीय लोगों, कारोबार और प्रशासन पर सीधा असर पड़ेगा.";
const excerptEn = "A Gujarat Post special report explains how the development could affect residents, businesses and public administration.";

const contentGu = [
  "સ્થાનિક અધિકારીઓએ જણાવ્યું કે તાજેતરના નિર્ણય બાદ વિસ્તૃત આયોજન શરૂ કરી દેવામાં આવ્યું છે. લોકો સુધી જરૂરી માહિતી ઝડપથી પહોંચે તે માટે અલગ ટીમો કાર્યરત છે.",
  "વિભાગો વચ્ચે સંકલન વધારવા માટે કંટ્રોલ રૂમ અને ડિજિટલ મોનિટરિંગ વ્યવસ્થા તૈયાર કરવામાં આવી છે. નાગરિકોને સત્તાવાર સૂચનાઓનું પાલન કરવામાં આવી છે.",
  "વિશેષજ્ઞોના મતે આ પગલું લાંબા ગાળે ગુજરાતના વિકાસ, સુરક્ષા અને નાગરિક સુવિધાઓ માટે મહત્વપૂર્ણ સાબિત થઈ શકે છે.",
];

const contentHi = [
  "स्थानीय अधिकारियों ने बताया कि ताजा फैसले के बाद विस्तृत योजना पर काम शुरू कर दिया गया है. लोगों तक जरूरी जानकारी तेजी से पहुंचाने के लिए अलग टीमें सक्रिय हैं.",
  "विभागों के बीच तालमेल बढ़ाने के लिए कंट्रोल रूम और डिजिटल मॉनिटरिंग व्यवस्था तैयार की गई है. नागरिकों से आधिकारिक निर्देशों का पालन करने की अपील की गई है.",
  "विशेषज्ञों के अनुसार यह कदम लंबे समय में गुजरात के विकास, सुरक्षा और नागरिक सुविधाओं के लिए अहम साबित हो सकता है.",
];

const contentEn = [
  "Officials said detailed planning began soon after the latest decision. Dedicated teams are working to ensure timely public updates and smooth coordination.",
  "A control room and digital monitoring system have been prepared to improve coordination between departments. Citizens have been asked to follow official advisories.",
  "Experts believe the move could prove significant for Gujarat's long-term development, public safety and civic infrastructure.",
];

const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const hashString = (str: string) => {
  let hash = 0;
  for (let idx = 0; idx < str.length; idx++) {
    hash = str.charCodeAt(idx) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const imageFor = (category: string, i: number, title: string) => {
  const mapped = categorySlugMapping[category] || "politics";
  const key = mapped === "state" || mapped === "ahmedabad" || mapped === "rajkot" || mapped === "surat" || mapped === "vadodara" ? "gujarat" : mapped;
  const images = IMG[key] || IMG.gujarat;
  const hash = hashString(title) + i;
  return images[hash % images.length];
};

export const ARTICLES: Article[] = Array.from({ length: 120 }, (_, i) => {
  const story = storyPool[i % storyPool.length];
  const rawCategorySlug = story[0] as string;
  const categorySlug = (categorySlugMapping[rawCategorySlug] || "politics") as CategorySlug;
  const meta = CATEGORY_META[categorySlug];
  const day = String(10 - (i % 10)).padStart(2, "0");
  const hour = String(6 + (i % 14)).padStart(2, "0");
  const titleSuffix = i >= storyPool.length ? `: ગ્રાઉન્ડ રિપોર્ટ ${i + 1}` : "";
  const titleSuffixHi = i >= storyPool.length ? `: ग्राउंड रिपोर्ट ${i + 1}` : "";
  const titleSuffixEn = i >= storyPool.length ? `: Ground Report ${i + 1}` : "";

  return {
    id: String(i + 1),
    slug: slugify(`${story[1]} ${i + 1}`),
    title: `${story[1]}${titleSuffixEn}`,
    titleGu: `${story[2]}${titleSuffix}`,
    titleHi: `${story[3]}${titleSuffixHi}`,
    excerpt: excerptEn,
    excerptGu,
    excerptHi,
    content: contentEn.join("\n\n"),
    contentGu: contentGu.join("\n\n"),
    contentHi: contentHi.join("\n\n"),
    image: imageFor(categorySlug, i, story[1]),
    category: meta.name,
    categoryGu: meta.gu,
    categoryHi: meta.hi,
    tags: [meta.name, "Gujarat", i % 2 === 0 ? "Breaking" : "Update"],
    tagsGu: [meta.gu, "ગુજરાત", i % 2 === 0 ? "બ્રેકિંગ" : "અપડેટ"],
    tagsHi: [meta.hi, "गुजरात", i % 2 === 0 ? "ब्रेकिंग" : "अपडेट"],
    author: AUTHORS[i % AUTHORS.length],
    publishedAt: `2026-06-${day}T${hour}:00:00+05:30`,
    updatedAt: `2026-06-${day}T${hour}:45:00+05:30`,
    readingTime: 3 + (i % 5),
    isTrending: i < 10 || i % 7 === 0,
    isBreaking: i % 9 === 0,
    isFeatured: i < 24,
    views: 8200 + i * 3150,
  };
});

export const VIDEOS: Video[] = [
  ["v1", "Prime Time: Gujarat Election 2027 strategy", "પ્રાઇમ ટાઇમ: ગુજરાત ચૂંટણી 2027 વ્યૂહરચના", "प्राइम टाइम: गुजरात चुनाव 2027 रणनीति", "video", "45:23", 82000],
  ["v2", "Ahmedabad rain live ground report", "અમદાવાદ વરસાદ લાઇવ ગ્રાઉન્ડ રિપોર્ટ", "अहमदाबाद बारिश लाइव ग्राउंड रिपोर्ट", "video", "12:05", 98000],
  ["v3", "GIFT City growth explained", "GIFT સિટીની વૃદ્ધિ સરળ ભાષામાં", "GIFT सिटी की वृद्धि आसान भाषा में", "video", "18:45", 62000],
  ["v4", "Crime bulletin from major Gujarat cities", "ગુજરાતના મુખ્ય શહેરોની ક્રાઇમ બુલેટિન", "गुजरात के प्रमुख शहरों की क्राइम बुलेटिन", "video", "22:10", 54000],
  ["v5", "Sports spotlight: Rising stars of Gujarat", "સ્પોર્ટ્સ સ્પોટલાઇટ: ગુજરાતના ઉભરતા સિતારાઓ", "स्पोर्ट्स स्पॉटलाइट: गुजरात के उभरते सितारे", "video", "15:40", 72000],
  ["v6", "Gandhinagar IT Hub: The Silicon Valley of Gujarat?", "ગાંધીનગર IT હબ: ગુજરાતની સિલિકોન વેલી?", "गांधीनगर आईटी हब: गुजरात की सिलिकॉन वैली?", "video", "20:15", 68000],
  ["s1", "Rain alert in 60 seconds", "60 સેકન્ડમાં વરસાદ એલર્ટ", "60 सेकंड में बारिश अलर्ट", "short", "0:58", 185000],
  ["s2", "Gujarat Titans training moment", "ગુજરાત ટાઇટન્સ ટ્રેનિંગ મોમેન્ટ", "गुजरात टाइटन्स ट्रेनिंग मोमेंट", "short", "0:45", 210000],
  ["s3", "Navratri safety checklist", "નવરાત્રી સેફ્ટી ચેકલિસ્ટ", "नवरात्रि सेफ्टी checklist", "short", "0:59", 146000],
  ["s4", "Surat market quick update", "સુરત માર્કેટ ક્વિક અપડેટ", "सूरत मार्केट क्विक अपडेट", "short", "0:52", 118000],
  ["p1", "Podcast: Gujarat economy next decade", "પોડકાસ્ટ: ગુજરાત અર્થતંત્રનો આગામી દાયક", "पॉडकास्ट: गुजरात अर्थव्यवस्था का अगला दशक", "podcast", "55:00", 36000],
  ["p2", "Podcast: Politics and youth vote", "પોડકાસ્ટ: રાજકારણ અને યુવા મતદાર", "पॉडकास्ट: राजनीति और युवा मतदाता", "podcast", "48:30", 28000],
  ["i1", "Exclusive interview with civic commissioner", "મ્યુનિસિપલ કમિશનર સાથે ખાસ મુલાકાત", "नगर आयुक्त से खास बातचीत", "interview", "32:15", 59000],
  ["i2", "Startup founder on Gujarati AI tools", "ગુજરાતી AI ટૂલ્સ પર સ્ટાર્ટઅપ ફાઉન્ડર", "गुजराती AI टूल्स पर स्टार्टअप फाउंडर", "interview", "28:00", 41000],
].map(([id, title, titleGu, titleHi, type, duration, views], i) => ({
  id: id as string,
  title: title as string,
  titleGu: titleGu as string,
  titleHi: titleHi as string,
  thumbnail: imageFor(["politics", "gujarat", "business", "crime", "sports", "entertainment"][i % 6], i, title as string),
  youtubeId: "dQw4w9WgXcQ",
  duration: duration as string,
  type: type as Video["type"],
  publishedAt: `2026-06-${String(10 - (i % 7)).padStart(2, "0")}T${String(8 + i).padStart(2, "0")}:00:00+05:30`,
  views: views as number,
}));

export const PHOTOS: Photo[] = [
  { id: "ph1", src: "https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?w=800&q=80", alt: "Ahmedabad Riverfront", caption: "Sabarmati Riverfront development continues in Ahmedabad", captionGu: "અમદાવાદમાં સાબરમતી રિવરફ્રન્ટ વિકાસ કાર્ય ચાલુ છે", captionHi: "अहमदाबाद में साबरमती रिवरफ्रंट विकास कार्य जारी है" },
  { id: "ph2", src: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&q=80", alt: "Cricket Practice", caption: "Gujarat domestic cricket squad trains for the upcoming tournament", captionGu: "ગુજરાત ડોમેસ્ટિક ક્રિકેટ ટીમ આગામી ટૂર્નામેન્ટ માટે પ્રેક્ટિસ કરી રહી છે", captionHi: "गुजरात घरेलू क्रिकेट टीम आगामी टूर्नामेंट के लिए अभ्यास कर रही है" },
  { id: "ph3", src: "https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&q=80", alt: "Political Rally", caption: "Massive political rally organized ahead of local elections", captionGu: "સ્થાનિક ચૂંટણીઓ પહેલાં આયોજિત વિશાળ રાજકીય સભા", captionHi: "स्थानीय चुनावों से पहले आयोजित विशाल राजनीतिक रैली" },
  { id: "ph4", src: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80", alt: "Garba Dance", caption: "Vibrant Navratri garba night celebrations across cities", captionGu: "શહેરોમાં વાઇબ્રન્ટ નવરાત્રી ગરબા નાઇટની ઉજવણી", captionHi: "शहरों में जीवंत नवरात्रि गरबा नाइट का जश्न" },
  { id: "ph5", src: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80", alt: "GIFT City Skyline", caption: "GIFT City emerging as a major global financial hub", captionGu: "GIFT સિટી વૈશ્વિક નાણાકીય હબ તરીકે ઉભરી રહ્યું છે", captionHi: "गिफ्ट सिटी वैश्विक वित्तीय हब के रूप में उभर रहा है" },
  { id: "ph6", src: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80", alt: "Digital Classroom", caption: "Smart digital classrooms introduced in primary schools", captionGu: "પ્રાથમિક શાળાઓમાં સ્માર્ટ ડિજિટલ ક્લાસરૂમ શરૂ કરાયા", captionHi: "प्राथमिक स्कूलों में स्मार्ट डिजिटल क्लासरूम शुरू किए गए" },
  { id: "ph7", src: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&q=80", alt: "Heritage Stepwell", caption: "Gujarat historic stepwells attract tourists worldwide", captionGu: "ગુજરાતના ઐતિહાસિક વાવ પ્રવાસીઓને આકર્ષિત કરે છે", captionHi: "गुजरात की ऐतिहासिक बावड़ियाँ पर्यटकों को आकर्षित कर रही हैं" },
  { id: "ph8", src: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80", alt: "Industrial Unit", caption: "Gujarat manufacturing sector registers solid growth", captionGu: "ગુજરાતના ઉત્પાદન ક્ષેત્રે મજબૂત વૃદ્ધિ નોંધાવી", captionHi: "गुजरात के विनिर्माण क्षेत्र ने मजबूत विकास दर्ज किया" },
  { id: "ph9", src: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80", alt: "Marathon Run", caption: "Ahmedabad annual marathon sees record participation", captionGu: "અમદાવાદ વાર્ષિક મેરેથોનમાં રેકોર્ડ ભાગીદારી જોવા મળી", captionHi: "अहमदाबाद वार्षिक मैराथन में रिकॉर्ड भागीदारी देखी गई" },
  { id: "ph10", src: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=800&q=80", alt: "Gujarati Cinema", caption: "Regional Gujarati cinema reaches new box office milestones", captionGu: "પ્રાદેશિક ગુજરાતી સિનેમા બોક્સ ઓફિસ પર નવી સિદ્ધિઓ સર કરી રહ્યું છે", captionHi: "क्षेत्रीय गुजराती सिनेमा बॉक्स ऑफिस पर नए आयाम छू रहा है" },
  { id: "ph11", src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80", alt: "IT Tech Hub", caption: "Gandhinagar tech parks attract major IT companies", captionGu: "ગાંધીનગર ટેક પાર્ક્સ મોટી IT કંપનીઓને આકર્ષિત કરે છે", captionHi: "गांधीनगर टेक पार्क बड़ी आईटी कंपनियों को आकर्षित कर रहे हैं" },
  { id: "ph12", src: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80", alt: "Yoga & Wellness", caption: "Wellness and yoga retreats gain popularity in Gujarat", captionGu: "ગુજરાતમાં વેલનેસ અને યોગા રીટ્રીટ્સ લોકપ્રિય થઈ રહ્યા છે", captionHi: "गुजरात में वेलनेस और योग रिट्रीट लोकप्रिय हो रहे हैं" }
];

export const BREAKING_TICKER = [
  {
    en: "BREAKING: Heavy rain alert in Ahmedabad, riverfront gates opened",
    gu: "અમદાવાદમાં ભારે વરસાદનું એલર્ટ, રિવરફ્રન્ટના ગેટ ખોલાયા",
    hi: "अहमदाबाद में भारी बारिश का अलर्ट, रिवरफ्रंट के गेट खुले",
    slug: "ahmedabad-receives-heavy-rain-alert-as-riverfront-gates-opened-1"
  },
  {
    en: "GUJARAT ELECTION 2027: District preparations intensify",
    gu: "ગુજરાત ચૂંટણી 2027 અપડેટ: મુખ્ય પક્ષોની બેઠક",
    hi: "गुजरात चुनाव 2027: जिलों में तैयारियां तेज",
    slug: "gujarat-election-2027-preparations-intensify-across-districts-5"
  },
  {
    en: "CRIME ALERT: Cyber cell busts fake investment app network",
    gu: "ક્રાઇમ બ્રેકિંગ: સાયબર સેલનો મોટો પર્દાફાશ",
    hi: "क्राइम ब्रेकिंग: साइबर सेल का बड़ा खुलासा",
    slug: "cyber-cell-busts-fake-investment-app-network-in-ahmedabad-6"
  },
  {
    en: "SURAT DIAMOND: Industry relief package discussed",
    gu: "સુરત ડાયમંડ ઉદ્યોગ માટે રાહત પેકેજની ચર્ચા",
    hi: "सूरत हीरा उद्योग के लिए राहत पैकेज पर चर्चा",
    slug: "surat-diamond-units-announce-new-export-recovery-plan-2"
  },
  {
    en: "RAJKOT AIRPORT: New domestic flight routes announced",
    gu: "રાજકોટ એરપોર્ટ પર નવા રૂટની જાહેરાત",
    hi: "राजकोट एयरपोर्ट पर नए घरेलू मार्गों की घोषणा",
    slug: "rajkot-international-airport-gets-new-domestic-routes-3"
  },
  {
    en: "GIFT CITY: Fintech hub attracts five global firms",
    gu: "GIFT સિટીમાં ફિનટેક કંપનીઓનું રોકાણ",
    hi: "गिफ्ट सिटी: फिनटेक हब ने पांच वैश्विक कंपनियों को आकर्षित किया",
    slug: "gift-city-fintech-hub-attracts-five-global-firms-8"
  }
];

export const NAV_ITEMS: NavItem[] = [
  ["Home", "હોમ", "होम", "/"],
  ["State News", "રાજ્ય સમાચાર", "राज्य समाचार", "/category/state"],
  ["National", "રાષ્ટ્રીય", "राष्ट्रीय", "/category/national"],
  ["Ahmedabad", "અમદાવાદ", "अहमदाबाद", "/category/ahmedabad"],
  ["Rajkot", "રાજકોટ", "राजकोट", "/category/rajkot"],
  ["Surat", "સુરત", "सूरत", "/category/surat"],
  ["Vadodara", "વડોદરા", "वडोदरा", "/category/vadodara"],
  ["Crime", "ક્રાઇમ", "क्राइम", "/category/crime"],
  ["Politics", "રાજકારણ", "राजनीति", "/category/politics"],
  ["Business", "બિઝનેસ", "बिजनेस", "/category/business"],
  ["Sports", "રમતગમત", "खेल", "/category/sports"],
  ["Entertainment", "મનોરંજન", "मनोरंजन", "/category/entertainment"],
  ["Technology", "ટેકનોલોજી", "टेक्नोलॉजी", "/category/technology"],
  ["Lifestyle", "લાઇફસ્ટાઇલ", "लाइफस्टाइल", "/category/lifestyle"],
  ["Education", "શિક્ષણ", "शिक्षा", "/category/education"],
  ["World", "વિશ્વ", "विश्व", "/category/world"],
  ["Gujarat Election 2027", "ગુજરાત ચૂંટણી 2027", "गुजरात चुनाव 2027", "/category/election-2027"],
  ["Videos", "વીડિયો", "वीडियो", "/videos"],
  ["Watch Never Ends", "વોચ ક્યારેય અટકતું નથી", "देखना कभी खत्म नहीं होता", "/watch"],
  ["Shorts", "શોર્ટ્સ", "शॉर्ट्स", "/shorts"],
  ["Podcasts", "પોડકાસ્ટ", "पॉडकास्ट", "/videos?tab=podcast"],
  ["E-paper", "ઈ-પેપર", "ई-पेपर", "/epaper"],
].map(([label, labelGu, labelHi, href]) => ({ label, labelGu, labelHi, href }));

export const getLocalized = (language: Language, values: { en: string; gu: string; hi: string }) => {
  if (language === "en") return values.en;
  if (language === "hi") return values.hi;
  return values.gu;
};

export const getArticleTitle = (article: Article, language: Language) =>
  getLocalized(language, { en: article.title, gu: article.titleGu, hi: article.titleHi });

export const getArticleExcerpt = (article: Article, language: Language) =>
  getLocalized(language, { en: article.excerpt, gu: article.excerptGu, hi: article.excerptHi });

export const getArticleContent = (article: Article, language: Language) =>
  getLocalized(language, { en: article.content, gu: article.contentGu, hi: article.contentHi });

export const getCategoryLabel = (article: Article, language: Language) =>
  getLocalized(language, { en: article.category, gu: article.categoryGu, hi: article.categoryHi });

export const getArticlesByCategory = (cat: string) => {
  const normalized = cat.toLowerCase();
  const meta = Object.values(CATEGORY_META).find((item) => item.name.toLowerCase() === normalized);
  if (meta?.name === "Gujarat") {
    return ARTICLES.filter((article) => ["Gujarat", "Ahmedabad", "Rajkot", "Surat", "Vadodara"].includes(article.category));
  }
  return ARTICLES.filter((article) => article.category.toLowerCase() === normalized);
};

export const getTrendingArticles = () => ARTICLES.filter((article) => article.isTrending).slice(0, 10);
export const getFeaturedArticles = () => ARTICLES.filter((article) => article.isFeatured).slice(0, 24);
export const getRelatedArticles = (article: Article) =>
  ARTICLES.filter((item) => item.category === article.category && item.id !== article.id).slice(0, 4);

export const searchArticles = (query: string) => {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return ARTICLES.filter((article) => {
    const searchable = [article.title, article.titleGu, article.titleHi, article.excerpt, article.excerptGu, article.excerptHi, article.content, article.contentGu, article.contentHi, article.category, article.categoryGu, article.categoryHi, ...article.tags, ...article.tagsGu, ...article.tagsHi, article.author.name, article.author.nameGu, article.author.nameHi].join(' ').toLocaleLowerCase();
    return terms.every((term) => searchable.includes(term));
  }).sort((a, b) => Number(b.isBreaking) - Number(a.isBreaking) || new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
};

export const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
};

export const formatTime = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

export const formatViews = (value: number): string => {
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(value);
};
