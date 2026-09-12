import { PrismaClient, PostStatus } from '@prisma/client';

const prisma = new PrismaClient();

const FACT_CHECK_ARTICLES = [
  {
    slug: 'fact-check-free-smartphone-distribution-scheme-whatsapp-link-fake',
    title: 'Fact Check: Viral Link Offering Free Smartphones under Government Scheme is Fake Phishing Scam',
    titleGu: 'ફેક્ટ ચેક: ફ્રી સ્માર્ટફોન યોજનાના નામે વોટ્સએપ પર વાયરલ લિંક તદ્દન નકલી અને સાયબર ફ્રોડ છે',
    titleHi: 'फैक्ट चेक: मुफ्त स्मार्टफोन योजना के नाम पर व्हाट्सएप पर वायरल लिंक पूरी तरह से फर्जी और साइबर फ्रॉड है',
    excerpt: 'Viral WhatsApp message promising free smartphones to college students via registration link is a malicious phishing scam stealing personal data.',
    excerptGu: 'કોલેજ વિદ્યાર્થીઓને ફ્રી સ્માર્ટફોન આપવાની લાલચ આપતો વોટ્સએપ મેસેજ નકલી છે. તેના પર ક્લિક કરવાથી બેંક વિગતો ચોરાઈ શકે છે.',
    excerptHi: 'कॉलेज छात्रों को मुफ्त स्मार्टफोन देने वाला व्हाट्सएप मैसेज फर्जी है। लिंक पर क्लिक करने से बैंक विवरण चोरी हो सकता है।',
    featuredImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&q=80',
    content: `<p><strong>Claim:</strong> A viral WhatsApp message claims that the Gujarat Government is distributing free 5G smartphones to all college students. Users are asked to register via an unverified website link.</p>
<h2>Fact Check Analysis & Verification</h2>
<p>Gujarat Post Fact Check team investigated the link and contacted state IT and Education department officials. Departmental spokespersons confirmed that no such scheme with external WhatsApp registration exists.</p>
<ul>
<li>The link leads to a suspicious third-party domain (<em>.xyz</em>) attempting to extract personal and banking credentials.</li>
<li>Official government schemes are announced exclusively via official portals ending in <strong>.gov.in</strong> or <strong>.gujarat.gov.in</strong>.</li>
</ul>
<blockquote>"Verdict: ❌ FAKE & MALICIOUS PHISHING LINK. Citizens are advised not to click or forward such links."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> સોશિયલ મીડિયા અને વોટ્સએપ પર એક લિંક વાયરલ થઈ રહી છે જેમાં દાવો કરવામાં આવ્યો છે કે ગુજરાત સરકાર તમામ કોલેજ વિદ્યાર્થીઓને મફતમાં 5G સ્માર્ટફોન આપી રહી છે અને લિંક પર ક્લિક કરી નોંધણી કરવાની રહેશે.</p>
<h2>ફેક્ટ ચેક તપાસ અને સત્યતા</h2>
<p>ગુજરાત પોસ્ટ ફેક્ટ ચેક ટીમે આ લિંકની ટેકનિકલ તપાસ કરી અને શિક્ષણ વિભાગના અધિકારીઓનો સંપર્ક કર્યો. અધિકારીઓએ સ્પષ્ટતા કરી કે આવી કોઈ ઓનલાઇન વોટ્સએપ રજીસ્ટ્રેશન યોજના ચાલુ નથી.</p>
<ul>
<li>વાયરલ લિંક એક શંકાસ્પદ થર્ડ-પાર્ટી ડોમેન (<em>.xyz</em>) પર લઈ જાય છે જે યુઝર્સનો ડેટા ચોરવાનો પ્રયાસ છે.</li>
<li>સરકારની તમામ સત્તાવાર યોજનાઓ માત્ર <strong>.gov.in</strong> સરકારી વેબસાઇટ પર જ જાહેર કરવામાં આવે છે.</li>
</ul>
<blockquote>"ચુકાદો: ❌ તદ્દન નકલી અને જોખમી લિંક. આ લિંક પર ક્લિક ન કરવા કે અન્ય ગ્રુપમાં ફોરવર્ડ ન કરવા વિનંતી."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> व्हाट्सएप पर एक मैसेज वायरल हो रहा है जिसमें दावा किया गया है कि गुजरात सरकार छात्रों को मुफ्त 5G स्मार्टफोन दे रही है।</p>
<h2>फैक्ट चेक जांच</h2>
<p>शिक्षा विभाग के अधिकारियों ने पुष्टि की है कि ऐसी कोई योजना व्हाट्सएप लिंक के जरिए नहीं चलाई जा रही है।</p>
<ul>
<li>वायरल लिंक एक फर्जी वेबसाइट का है जो व्यक्तिगत डेटा चोरी करने का प्रयास करती है।</li>
<li>सरकारी योजनाएं केवल <strong>.gov.in</strong> पोर्टल पर ही उपलब्ध होती हैं।</li>
</ul>
<blockquote>"फैसला: ❌ फर्जी मैसेज। इस लिंक पर क्लिक न करें।"</blockquote>`,
    readingTime: 3,
    priority: 95,
    isTrending: true,
    isBreaking: true,
    isFeatured: true,
    views: 41200,
  },
  {
    slug: 'fact-check-rs-2000-note-reintroduction-satellite-chip-rumor',
    title: 'Fact Check: RBI Re-introducing Rs 2000 Currency Notes with Nano-GPS Chip is False',
    titleGu: 'ફેક્ટ ચેક: ₹૨૦૦૦ની ચલણી નોટો નેનો જીપીએસ ચિપ સાથે ફરી ચલણમાં આવશે તેવો દાવો તદ્દન પાયાવિહોણો',
    titleHi: 'फैक्ट चेक: नैनो जीपीएस चिप के साथ ₹2000 के नोट फिर से चलन में आएंगे, दावा पूरी तरह गलत है',
    excerpt: 'Social media posts claiming Reserve Bank of India is bringing back Rs 2000 notes equipped with GPS microchips are completely fabricated.',
    excerptGu: 'આરબીઆઈ ૨૦૦૦ની નોટો જીપીએસ ચિપ સાથે ફરી બહાર પાડશે તેવા સોશિયલ મીડિયા પર વાયરલ દાવાઓ તદ્દન બનાવટી અને અફવા છે.',
    excerptHi: 'आरबीआई 2000 रुपये के नोटों को जीपीएस चिप के साथ वापस ला रहा है, यह सोशल मीडिया दावा पूरी तरह से फर्जी है।',
    featuredImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&q=80',
    content: `<p><strong>Claim:</strong> Social media posts state that the Reserve Bank of India (RBI) is preparing to reissue Rs 2000 currency notes embedded with satellite tracking microchips in 2026.</p>
<h2>Fact Check Analysis</h2>
<p>Our fact-checking unit reviewed RBI press releases and official circulars. RBI withdrawn Rs 2000 notes from circulation under Clean Note Policy and has issued no decision to reintroduce them.</p>
<ul>
<li>RBI officials confirmed no currency note in the world contains satellite tracking microchips.</li>
<li>Old viral hoaxes from 2016 are being reshared with new dates.</li>
</ul>
<blockquote>"Verdict: ❌ FALSE RUMOR. No Rs 2000 notes are being re-issued."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> સોશિયલ મીડિયા પર એવો દાવો વાયરલ થયો છે કે રિઝર્વ બેંક ઓફ ઇન્ડિયા (RBI) ૨૦૨૬માં સેટેલાઇટ જીપીએસ ચિપ ધરાવતી ₹૨૦૦૦ની નોટો ફરી ચલણમાં મૂકવા જઈ રહી છે.</p>
<h2>તપાસ અને સાચું તથ્ય</h2>
<p>અમારી ફેક્ટ ચેક ટીમે RBIની અધિકૃત વેબસાઇટ અને પબ્લિક રિલેશન્સ વિભાગ દ્વારા જારી કરાયેલ પરિપત્રો તપાસ્યા. RBI એ ક્લીન નોટ પોલિસી હેઠળ ૨૦૦૦ની નોટો ચલણમાંથી પાછી ખેંચી લીધી હતી અને તેને ફરી શરૂ કરવાનો કોઈ નિર્ણય લેવાયો નથી.</p>
<ul>
<li>RBI એ સ્પષ્ટ કર્યું છે કે ચલણી નોટોમાં કોઈ જીપીએસ ચિપ મૂકવાની ટેકનોલોજી અસ્તિત્વમાં નથી.</li>
<li>૨૦૧૬ની જૂની અફવાઓને નવા વર્ષની તારીખો સાથે સોશિયલ મીડિયા પર ફરી વાયરલ કરવામાં આવી રહી છે.</li>
</ul>
<blockquote>"ચુકાદો: ❌ તદ્દન ખોટો દાવો અને પાયાવિહોણી અફવા."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> सोशल मीडिया पर कहा जा रहा है कि आरबीआई जीपीएस चिप वाले ₹2000 के नोट फिर जारी करने जा रहा है।</p>
<h2>जांच और सच्चाई</h2>
<p>आरबीआई ने स्पष्ट किया है कि नोटों को वापस लाने का कोई प्रस्ताव नहीं है और जीपीएस चिप की बात पूरी तरह से मनगढ़ंत है।</p>
<blockquote>"फैसला: ❌ असत्य दावा।"</blockquote>`,
    readingTime: 3,
    priority: 88,
    isTrending: false,
    isBreaking: false,
    isFeatured: true,
    views: 35600,
  },
  {
    slug: 'fact-check-compulsory-4-day-work-week-in-india-misleading',
    title: 'Fact Check: Mandatory 4-Day Work Week for All Private Companies in India is Misleading',
    titleGu: 'ફેક્ટ ચેક: ખાનગી કંપનીઓમાં ફરજિયાત ૪ દિવસનું વર્ક વીક લાગુ થવા અંગેના સમાચાર ગેરમાર્ગે દોરનારા',
    titleHi: 'फैक्ट चेक: निजी कंपनियों में अनिवार्य 4-दिवसीय कार्य सप्ताह लागू होने की खबर भ्रामक है',
    excerpt: 'Reports claiming Central Labor Ministry made 4-day work week compulsory across India are misleading; Labour Codes offer flexible options, not mandates.',
    excerptGu: 'કેન્દ્ર સરકારે તમામ કંપનીઓ માટે સપ્તાહમાં ૪ દિવસ કામ ફરજિયાત બનાવ્યું હોવાના સમાચાર અડધી માહિતી અને ગેરમાર્ગે દોરનારા છે.',
    excerptHi: 'केंद्र सरकार ने सभी कंपनियों के लिए सप्ताह में 4 दिन का काम अनिवार्य कर दिया है, यह खबर भ्रामक है।',
    featuredImage: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1200&q=80',
    content: `<p><strong>Claim:</strong> News posts on social platforms state that the Union Labour Ministry has mandated a 4-day work week for all private and public sector employees starting next month.</p>
<h2>Fact Check Analysis</h2>
<p>Under the proposed Labour Codes framework, employers are given an option to implement flexible 48-hour working schedules over 4, 5, or 6 days, provided daily working hour limits and employee consent are met. It is not mandatory for companies to switch to 4 working days.</p>
<ul>
<li>The 48-hour total weekly work limit remains unchanged. A 4-day schedule requires 12 hours of work per day.</li>
<li>Implementation depends entirely on individual company policies and state rules.</li>
</ul>
<blockquote>"Verdict: ⚠️ MISLEADING. Flexible option provided, but NOT mandatory for all firms."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> આગામી મહિનાથી દેશની તમામ પ્રાઇવેટ અને સરકારી કંપનીઓમાં સપ્તાહમાં ફરજિયાત ૪ દિવસનું વર્ક વીક લાગુ થઈ રહ્યું હોવાનો દાવો વાયરલ થયો છે.</p>
<h2>તપાસ અને તથ્ય</h2>
<p>નવા લેબર કોડ પ્રોટોકોલ મુજબ કંપનીઓને અઠવાડિયામાં ૪૮ કલાકનું કામ ૪, ૫ કે ૬ દિવસમાં વહેંચવાની ફ્લેક્સિબલ મંજૂરી આપવામાં આવી છે. પરંતુ તમામ કંપનીઓ માટે ૪ દિવસ કામ ફરજિયાત કરવામાં આવ્યું નથી.</p>
<ul>
<li>અઠવાડિયાના કુલ ૪૮ કલાક કામનો નિયમ યથાવત છે, એટલે કે ૪ દિવસ વર્ક વીકમાં દૈનિક ૧૨ કલાક કામ કરવું પડે.</li>
<li>આ ફેરફાર કંપનીઓની આંતરિક નીતિ અને કર્મચારીઓની સંમતિ પર આધારિત છે.</li>
</ul>
<blockquote>"ચુકાદો: ⚠️ અડધી માહિતી અને ગેરમાર્ગે દોરનારો દાવો."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> अगले महीने से सभी कंपनियों में 4 दिन का काम अनिवार्य होने वाला है।</p>
<h2>सच्चाई</h2>
<p>श्रम मंत्रालय ने केवल विकल्प दिया है, अनिवार्य नियम लागू नहीं किया है। कुल 48 घंटे का साप्ताहिक समय सीमा समान रहेगी।</p>
<blockquote>"फैसला: ⚠️ भ्रामक जानकारी।"</blockquote>`,
    readingTime: 3,
    priority: 82,
    isTrending: true,
    isBreaking: false,
    isFeatured: true,
    views: 29400,
  },
  {
    slug: 'fact-check-gujarat-board-ssc-hsc-exam-paper-leak-fake-letter',
    title: 'Fact Check: Viral Circular Claiming GSEB Board Question Paper Leak is Fabricated',
    titleGu: 'ફેક્ટ ચેક: ગુજરાત માધ્યમિક બોર્ડ (GSEB) ની ધોરણ ૧૦ અને ૧૨ની પરીક્ષાના પેપર લીક અંગેનો પરિપત્ર નકલી',
    titleHi: 'फैक्ट चेक: गुजरात बोर्ड (GSEB) 10वीं और 12वीं की परीक्षा के पेपर लीक होने का परिपत्र फर्जी है',
    excerpt: 'GSEB officially clarifies that viral Telegram circulars claiming board exam question paper leaks are completely fake and forged.',
    excerptGu: 'ગુજરાત માધ્યમિક અને ઉચ્ચતર માધ્યમિક શિક્ષણ બોર્ડે સ્પષ્ટ કર્યું છે કે પેપર લીકના નામે વાયરલ થયેલો લેટર પેડ પત્ર તદ્દન બોગસ છે.',
    excerptHi: 'गुजरात माध्यमिक और उच्चतर माध्यमिक शिक्षा बोर्ड ने स्पष्ट किया है कि पेपर लीक के नाम से वायरल हुआ पत्र पूरी तरह से फर्जी है।',
    featuredImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80',
    content: `<p><strong>Claim:</strong> A letter carrying GSEB logo on Telegram claims Board Exam SSC & HSC question papers were leaked and exams will be rescheduled.</p>
<h2>Fact Check Analysis</h2>
<p>GSEB Board Chairman and examination controllers confirmed no paper leak has occurred. Cyber crime branch has registered an FIR against unauthorized Telegram channels circulating fake letters to extort students.</p>
<ul>
<li>Official exam schedules remain fully unchanged.</li>
<li>Students are advised to trust only official notifications on <em>gseb.org</em>.</li>
</ul>
<blockquote>"Verdict: ❌ FABRICATED & FORGED LETTER. Cyber police taking legal action against scammers."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> ટેલિગ્રામ અને વોટ્સએપ પર GSEBના લોગો વાળો એક પરિપત્ર વાયરલ થયો છે જેમાં દાવો કરાયો છે કે ધોરણ ૧૦ અને ૧૨ના પેપર લીક થઈ ગયા છે અને પરીક્ષાઓ રદ કરવામાં આવી છે.</p>
<h2>તપાસ અને સાચું તથ્ય</h2>
<p>શિક્ષણ બોર્ડના અધ્યક્ષ અને પરીક્ષા સચિવે સ્પષ્ટતા કરી છે કે કોઈપણ પેપર લીક થયું નથી અને પરીક્ષાઓ નિર્ધારિત ટાઇમટેબલ મુજબ જ યોજાશે. વાયરલ પરિપત્ર તદ્દન બોગસ અને એડિટ કરેલો છે.</p>
<ul>
<li>વિદ્યાર્થીઓ અને વાલીઓને માત્ર <strong>gseb.org</strong> સત્તાવાર પોર્ટલ પર વિશ્વાસ રાખવા અપીલ કરાઈ છે.</li>
<li>અફવા ફેલાવનાર બોગસ ટેલિગ્રામ ચેનલો સામે સાયબર ક્રાઇમમાં ગુનો નોંધવામાં આવ્યો છે.</li>
</ul>
<blockquote>"ચુકાદો: ❌ તદ્દન નકલી અને બોગસ પત્ર."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> बोर्ड परीक्षाएं रद्द होने और पेपर लीक होने का पत्र वायरल हो रहा है।</p>
<h2>सच्चाई</h2>
<p>गुजरात बोर्ड ने इस पत्र को फर्जी घोषित किया है और परीक्षाएं अपने निर्धारित समय पर ही होंगी।</p>
<blockquote>"फैसला: ❌ फर्जी अफवाह।"</blockquote>`,
    readingTime: 3,
    priority: 91,
    isTrending: false,
    isBreaking: true,
    isFeatured: true,
    views: 38900,
  },
  {
    slug: 'fact-check-underwater-metro-in-sabarmati-river-edited-photo',
    title: 'Fact Check: Viral Image of Underwater Metro Tunnel under Sabarmati River is Computer Generated',
    titleGu: 'ફેક્ટ ચેક: અમદાવાદમાં સાબરમતી નદી નીચે અંડરવોટર મેટ્રો ટનલ શરૂ થયાનું વાયરલ ચિત્ર AI એડિટેડ છે',
    titleHi: 'फैक्ट चेक: साबरमती नदी के नीचे अंडरवाटर मेट्रो सुरंग शुरू होने की वायरल तस्वीर एआई एडिटेड है',
    excerpt: 'Viral photographs claiming Ahmedabad Metro started underwater glass-tunnel services under Sabarmati river are digital artwork and not real.',
    excerptGu: 'સાબરમતી નદીના કાચની અંડરવોટર ટનલમાંથી પસાર થતી મેટ્રો ટ્રેનનું દ્રશ્ય વાસ્તવિક નથી પરંતુ ડિજિટલ આર્ટવર્ક છે.',
    excerptHi: 'साबरमती नदी के कांच की टनल से गुजरती मेट्रो की तस्वीर वास्तविक नहीं बल्कि डिजिटल आर्टवर्क है।',
    featuredImage: 'https://images.unsplash.com/photo-1517649763962-0c623266010b?w=1200&q=80',
    content: `<p><strong>Claim:</strong> Social media posts share high-definition photos claiming Ahmedabad Metro opened India's underwater glass tunnel line under the Sabarmati Riverfront.</p>
<h2>Fact Check Analysis</h2>
<p>Ahmedabad Metro Rail Project Phase 1 & Phase 2 operate via elevated viaducts and underground sections across the city. None of the lines pass through a glass underwater tunnel beneath the river.</p>
<ul>
<li>Digital forensic inspection confirms the image was generated using Midjourney AI software.</li>
<li>India's actual underwater metro tunnel passes under the Hooghly River in Kolkata, which is a standard concrete tunnel, not transparent glass.</li>
</ul>
<blockquote>"Verdict: 🖼️ EDITED AI ARTWORK. Not an actual photograph of Ahmedabad Metro."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> અમદાવાદમાં સાબરમતી રિવરફ્રન્ટ નીચે કાચની અંડરવોટર મેટ્રો ટનલમાંથી પસાર થતી મેટ્રો ટ્રેનનો ફોટો સોશિયલ મીડિયા પર ભારે વાયરલ થઈ રહ્યો છે.</p>
<h2>તપાસ અને તથ્ય</h2>
<p>ગુજરાત પોસ્ટ ફેક્ટ ચેક ટીમે ગુજરાત મેટ્રો રેલ કોર્પોરેશન (GMRC) નો સંપર્ક કર્યો હતો. અધિકારીઓએ બતાવ્યું કે સાબરમતી નદી નીચે આવી કોઈ કાચની ટનલ બનાવવામાં આવી નથી.</p>
<ul>
<li>ઇમેજ ફોરેન્સિક એનાલિસિસ દ્વારા સાબિત થયું છે કે આ ચિત્ર AI ઇમેજ જનરેટર સૉફ્ટવેર દ્વારા બનાવવામાં આવ્યું છે.</li>
<li>દેશમાં અંડરવોટર મેટ્રો કોલકાતામાં હુગલી નદી નીચે છે, જે કોંક્રીટ ટનલ છે કાચની નહીં.</li>
</ul>
<blockquote>"ચુકાદો: 🖼️ ડીજીટલ રીતે એડિટ કરેલું AI ચિત્ર."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> साबरमती नदी के नीचे कांच की सुरंग में मेट्रो चलने की तस्वीर वायरल हो रही है।</p>
<h2>सच्चाई</h2>
<p>मेट्रो रेल कॉर्पोरेशन ने स्पष्ट किया है कि ऐसी कोई कांच की सुरंग नहीं बनाई गई है, यह तस्वीर एआई द्वारा तैयार की गई है।</p>
<blockquote>"फैसला: 🖼️ एआई निर्मित फर्जी फोटो।"</blockquote>`,
    readingTime: 3,
    priority: 80,
    isTrending: false,
    isBreaking: false,
    isFeatured: true,
    views: 27100,
  },
  {
    slug: 'fact-check-ai-replacing-90-percent-it-jobs-misleading-report',
    title: 'Fact Check: Claim that AI will Replace 90% Software Engineers by End of Year Misquotes Report',
    titleGu: 'ફેક્ટ ચેક: ચાલુ વર્ષે AI ૯૦% સોફ્ટવેર એન્જિનિયરોની નોકરીઓ છીનવી લેશે તેવો દાવો ભ્રામક',
    titleHi: 'फैक्ट चेक: इस साल एआई 90% सॉफ्टवेयर इंजीनियरों की नौकरियां छीन लेगा, यह दावा भ्रामक है',
    excerpt: 'Viral posts citing NASSCOM report claim 90% IT software engineers will lose jobs to AI; original study emphasizes skill evolution, not mass layoffs.',
    excerptGu: 'નેસ્કોમના રિપોર્ટને ટાંકીને AI થી ૯૦ ટકા નોકરીઓ ખતમ થવાના વાયરલ દાવાઓ મૂળ રિપોર્ટના ખોટા અર્થઘટન પર આધારિત છે.',
    excerptHi: 'नासकॉम रिपोर्ट का हवाला देकर 90% नौकरियां खत्म होने का दावा रिपोर्ट के गलत अर्थ पर आधारित है।',
    featuredImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80',
    content: `<p><strong>Claim:</strong> Social media headlines state that NASSCOM released a report stating AI tools will replace 90% of IT developers and software programmers by the end of 2026.</p>
<h2>Fact Check Analysis</h2>
<p>We examined the full NASSCOM Tech Skills Report. The report states that 90% of developers will use AI coding assistants to increase productivity, not that 90% of workforce will be laid off.</p>
<ul>
<li>Industry experts highlight that AI automates repetitive tasks while creating new roles in AI engineering, prompt design, and system architecture.</li>
<li>NASSCOM issued a statement clarifying their findings were misinterpreted by clickbait headlines.</li>
</ul>
<blockquote>"Verdict: ⚠️ MISLEADING & OUT OF CONTEXT. Report highlights AI adoption, not job destruction."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> સોશિયલ મીડિયા હેડલાઇન્સમાં દાવો કરાઈ રહ્યો છે કે નેસ્કોમના તાજેતરના રિપોર્ટ મુજબ આર્ટિફિશિયલ ઇન્ટેલિજન્સ આ વર્ષના અંત સુધીમાં ૯૦% IT સોફ્ટવેર એન્જિનિયરોની નોકરીઓ નાબૂદ કરી દેશે.</p>
<h2>તપાસ અને તથ્ય</h2>
<p>અમારી ટીમે નેસ્કોમના ટેક સ્કીલ્સ રિપોર્ટનું વિશ્લેષણ કર્યું. રિપોર્ટમાં લખ્યું છે કે ૯૦% ડેવલપર્સ કોડિંગ માટે AI ટૂલ્સનો ઉપયોગ કરશે જેથી કામ ઝડપી બને, નોકરીઓ છીનવાઈ જવાની વાત નથી.</p>
<ul>
<li>આઇટી નિષ્ણાતો જણાવે છે કે AI ના કારણે ડેટા એન્જિનિયરિંગ અને AI સિસ્ટમ ડિઝાઇન જેવા નવા ક્ષેત્રોમાં માંગ વધી રહી છે.</li>
<li>નેસ્કોમે સ્પષ્ટતા કરી છે કે તેમના સંશોધનને સોશિયલ મીડિયા પર ખોટી રીતે રજૂ કરવામાં આવ્યું છે.</li>
</ul>
<blockquote>"ચુકાદો: ⚠️ ભ્રામક અને ખોટા સંદર્ભમાં વાયરલ થયેલી માહિતી."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> एआई इस साल 90% सॉफ्टवेयर इंजीनियरों की नौकरियां खत्म कर देगा।</p>
<h2>सच्चाई</h2>
<p>नासकॉम की रिपोर्ट में कहा गया है कि 90% डेवलपर्स उत्पादकता बढ़ाने के लिए एआई का उपयोग करेंगे, न कि नौकरियां खोएंगे।</p>
<blockquote>"फैसला: ⚠️ भ्रामक जानकारी।"</blockquote>`,
    readingTime: 4,
    priority: 85,
    isTrending: true,
    isBreaking: false,
    isFeatured: true,
    views: 31800,
  },
  {
    slug: 'fact-check-boiled-lemon-water-cancer-cure-health-myth',
    title: 'Fact Check: Viral Claim that Drinking Boiled Lemon Water Cures Cancer is Unproven Myth',
    titleGu: 'ફેક્ટ ચેક: ઉકાળેલું લીંબુ પાણી પીવાથી કેન્સર મટી જાય છે તેવો વોટ્સએપ દાવો તબીબી રીતે ખોટો અને જોખમી',
    titleHi: 'फैक्ट चेक: उबला नींबू पानी पीने से कैंसर ठीक होता है, यह दावा चिकित्सीय रूप से गलत और खतरनाक है',
    excerpt: 'Medical experts and WHO debunk widely circulated social media claims that hot lemon water is 10,000 times stronger than chemotherapy.',
    excerptGu: 'ગરમ લીંબુ પાણી કીમોથેરાપી કરતાં ૧૦,૦૦૦ ગણું વધુ અસરકારક હોવાના દાવાને તબીબોએ તદ્દન ભ્રામક અને અજ્ઞાનતાપૂર્ણ ગણાવ્યો છે.',
    excerptHi: 'गर्म नींबू पानी कीमोथेरेपी से 10,000 गुना अधिक प्रभावी होने का दावा डॉक्टरों द्वारा पूरी तरह खारिज कर दिया गया है।',
    featuredImage: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1200&q=80',
    content: `<p><strong>Claim:</strong> A forwarded WhatsApp text claims boiling lemon slices in hot water destroys all cancer cells and is 10,000 times more powerful than medical chemotherapy.</p>
<h2>Fact Check Analysis</h2>
<p>Oncologists and World Health Organization (WHO) medical panels emphasize that while lemons contain Vitamin C and antioxidants supporting immunity, there is zero scientific evidence that lemon water cures cancer.</p>
<ul>
<li>Delaying evidence-based medical treatment like chemotherapy or surgery for home remedies can prove fatal.</li>
<li>Prominent health agencies have repeatedly classified this claim as a dangerous medical myth.</li>
</ul>
<blockquote>"Verdict: 🚫 DANGEROUS HEALTH MYTH. Always consult certified oncologists for medical advice."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> વોટ્સએપ પર એક મેસેજ વાયરલ થઈ રહ્યો છે જેમાં દાવો કરાયો છે કે ગરમ પાણીમાં લીંબુ ઉકાળીને પીવાથી કેન્સરના તમામ કોષો નાશ પામે છે અને તે કીમોથેરાપી કરતા ૧૦,૦૦૦ ગણું વધુ શક્તિશાળી છે.</p>
<h2>તપાસ અને તબીબી તથ્ય</h2>
<p>કેન્સર નિષ્ણાત તબીબો અને વિશ્વ આરોગ્ય સંસ્થા (WHO) ના રિપોર્ટ અનુસાર, લીંબુમાં વિટામિન સી અને એન્ટીઓક્સીડન્ટ્સ હોય છે જે રોગપ્રતિકારક શક્તિ વધારે છે, પરંતુ તે કેન્સર મટાડવાનો ઇલાજ નથી.</p>
<ul>
<li>કીમોથેરાપી કે સર્જરી જેવા વૈજ્ઞાનિક ઉપચારો છોડીને ઘરેલુ નુસખા પર નિર્ભર રહેવું જીવલેણ સાબિત થઈ શકે છે.</li>
<li>તબીબી જગતે આ દાવાને તદ્દન પાયાવિહોણો અને જોખમી જાહેર કર્યો છે.</li>
</ul>
<blockquote>"ચુકાદો: 🚫 જોખમી આરોગ્ય અફવા. ગંભીર બીમારીમાં સર્ટિફાઇડ તબીબની જ સલાહ લો."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> उबला हुआ नींबू पानी कैंसर को 10,000 गुना तेजी से ठीक कर सकता है।</p>
<h2>सच्चाई</h2>
<p>कैंसर विशेषज्ञों ने इसे खतरनाक अफवाह करार दिया है। नींबू पानी प्रतिरक्षा बढ़ा सकता है लेकिन कैंसर का इलाज नहीं है।</p>
<blockquote>"फैसला: 🚫 खतरनाक स्वास्थ्य भ्रम।"</blockquote>`,
    readingTime: 3,
    priority: 89,
    isTrending: false,
    isBreaking: false,
    isFeatured: true,
    views: 34200,
  },
  {
    slug: 'fact-check-senior-citizen-highway-toll-fee-waiver-fake-notice',
    title: 'Fact Check: NHAI Clarifies Notice Claiming Toll Plaza Exemption for Senior Citizens is Fake',
    titleGu: 'ફેક્ટ ચેક: સીનિયર સીટીઝન્સ માટે નેશનલ હાઇવે ટોલ ટેક્સ માફી અંગેનો વાયરલ પરિપત્ર નકલી',
    titleHi: 'फैक्ट चेक: वरिष्ठ नागरिकों के लिए हाईवे टोल टैक्स छूट का वायरल नोटिस पूरी तरह फर्जी है',
    excerpt: 'National Highways Authority of India (NHAI) denies viral messages stating Aadhaar-holding senior citizens exempt from paying toll tax.',
    excerptGu: 'ભારતીય રાષ્ટ્રીય રાજમાર્ગ પ્રાધિકરણે (NHAI) સ્પષ્ટતા કરી છે કે આધાર કાર્ડ ધરાવતા વરિષ્ઠ નાગરિકો માટે ટોલ માફીનો વાયરલ મેસેજ ખોટો છે.',
    excerptHi: 'भारतीय राष्ट्रीय राजमार्ग प्राधिकरण (NHAI) ने स्पष्ट किया है कि वरिष्ठ नागरिकों के लिए टोल टैक्स छूट का मैसेज फर्जी है।',
    featuredImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1200&q=80',
    content: `<p><strong>Claim:</strong> Posts on Facebook and WhatsApp claim that NHAI has exempted all senior citizens above 60 years from paying highway toll tax upon showing Aadhaar cards.</p>
<h2>Fact Check Analysis</h2>
<p>NHAI officials issued a statement confirming no such blanket toll exemption policy exists for senior citizens under National Highways Fee Rules.</p>
<ul>
<li>Exemptions apply exclusively to designated emergency vehicles, defense personnel, and specified dignitaries as per government rules.</li>
<li>FASTag charges apply normally across all vehicle categories.</li>
</ul>
<blockquote>"Verdict: ❌ FAKE NOTICE. No toll fee waiver has been issued for senior citizens."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> ફેસબુક અને વોટ્સએપ પર વાયરલ થઈ રહેલા મેસેજમાં દાવો કરાયો છે કે NHAI એ ૬૦ વર્ષથી વધુ ઉંમરના વરિષ્ઠ નાગરિકોને આધાર કાર્ડ બતાવવા પર ટોલ પ્લાઝા પર 100% ટેક્સ માફી આપી છે.</p>
<h2>તપાસ અને તથ્ય</h2>
<p>નેશનલ હાઇવે ઓથોરિટી ઓફ ઇન્ડિયા (NHAI) ના સત્તાવાર સૂત્રોએ સ્પષ્ટ કર્યું છે કે વરિષ્ઠ નાગરિકો માટે ટોલ ટેક્સ માફ કરવાની કોઈ યોજના કે નિયમ બહાર પાડવામાં આવ્યો નથી.</p>
<ul>
<li>ટોલ નિયમો મુજબ માત્ર ઇમરજન્સી વાહનો અને નિર્ધારિત સરકારી વાહનોને જ છૂટછાટ મળે છે.</li>
<li>તમામ વાહનો માટે સામાન્ય FASTag નિયમો લાગુ રહે છે.</li>
</ul>
<blockquote>"ચુકાદો: ❌ તદ્દન નકલી સૂચના."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> 60 साल से अधिक उम्र के बुजुर्गों को हाईवे टोल टैक्स में पूरी छूट दी गई है।</p>
<h2>सच्चाई</h2>
<p>NHAI ने इस खबर को खारिज करते हुए कहा है कि वरिष्ठ नागरिकों के लिए टोल छूट का कोई नियम नहीं है।</p>
<blockquote>"फैसला: ❌ फर्जी खबर।"</blockquote>`,
    readingTime: 3,
    priority: 81,
    isTrending: false,
    isBreaking: false,
    isFeatured: true,
    views: 28300,
  },
  {
    slug: 'fact-check-lpg-cylinder-price-reduced-to-300-exaggerated-claim',
    title: 'Fact Check: Claim that Government Cut LPG Cylinder Rates to Rs 300 for Everyone is Misleading',
    titleGu: 'ફેક્ટ ચેક: સરકારે તમામ ગેસ કનેક્શનધારકો માટે ગેસ સિલિન્ડરનો ભાવ ₹૩૦૦ કર્યો હોવાનો વાયરલ દાવો ભ્રામક',
    titleHi: 'फैक्ट चेक: सरकार ने सभी के लिए एलपीजी सिलेंडर के दाम ₹300 कर दिए, यह दावा भ्रामक है',
    excerpt: 'Social media posts claiming LPG cylinder prices reduced to Rs 300 across India misinterpret targeted PM Ujjwala Scheme subsidies.',
    excerptGu: 'એલપીજી ગેસ સિલિન્ડરના ભાવ ₹૩૦૦ થઈ ગયા હોવાના સોશિયલ મીડિયા દાવા માત્ર પીએમ ઉજ્જવલા યોજનાના લક્ષિત સબસીડી લાભો પર આધારિત છે.',
    excerptHi: 'गैस सिलेंडर के दाम ₹300 होने की खबरें केवल पीएम उज्ज्वला योजना की सब्सिडी से संबंधित हैं, सभी के लिए नहीं।',
    featuredImage: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1200&q=80',
    content: `<p><strong>Claim:</strong> Viral videos claim the Central Government slashed domestic LPG gas cylinder prices to Rs 300 for all households starting this week.</p>
<h2>Fact Check Analysis</h2>
<p>Press Information Bureau (PIB) Fact Check confirmed that commercial and standard domestic LPG cylinder prices remain unchanged. The price benefit refers to effective costs calculated after PM Ujjwala Yojana subsidies for specific eligible beneficiaries.</p>
<ul>
<li>General consumer domestic LPG rates continue as per monthly oil marketing company revisions.</li>
<li>The video misleads viewers by omitting eligibility conditions of Ujjwala beneficiaries.</li>
</ul>
<blockquote>"Verdict: ⚠️ MISLEADING & EXAGGERATED. Subsidy applies only to PM Ujjwala beneficiaries."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> સોશિયલ મીડિયા વીડિયોમાં દાવો કરાઈ રહ્યો છે કે કેન્દ્ર સરકારે તમામ ગૃહિણીઓ માટે રાંધણ ગેસ સિલિન્ડરનો ભાવ ઘટાડીને ₹૩૦૦ કરી દીધો છે.</p>
<h2>તપાસ અને તથ્ય</h2>
<p>પીઆઈબી ફેક્ટ ચેક ટીમે સ્પષ્ટ કર્યું છે કે સામાન્ય ઘરેલું ગેસ સિલિન્ડરના ભાવમાં આવો કોઈ સીધો ઘટાડો કરાયો નથી. આ વાત માત્ર પીએમ ઉજ્જવલા યોજનાના લાભાર્થીઓને મળતી બેંક ટ્રાન્સફર સબસીડી ગણતરી પર આધારિત છે.</p>
<ul>
<li>સામાન્ય ગ્રાહકો માટે ગેસ કંપનીઓના નિયમિત દરો જ લાગુ રહેશે.</li>
<li>વાયરલ વીડિયોમાં જરૂરી શરતો છુપાવીને ભ્રામક દાવો કરવામાં આવ્યો છે.</li>
</ul>
<blockquote>"ચુકાદો: ⚠️ અતિશયોક્તિભર્યો અને ગેરમાર્ગે દોરનારો દાવો."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> रसोई गैस सिलेंडर की कीमत सभी के लिए ₹300 कर दी गई है।</p>
<h2>सच्चाई</h2>
<p>पीआईबी ने स्पष्ट किया कि यह राहत केवल पीएम उज्ज्वला योजना के लाभार्थियों के लिए ही प्रभावी है।</p>
<blockquote>"फैसला: ⚠️ भ्रामक दावा।"</blockquote>`,
    readingTime: 3,
    priority: 84,
    isTrending: true,
    isBreaking: false,
    isFeatured: true,
    views: 30100,
  },
  {
    slug: 'fact-check-electricity-disconnection-sms-phishing-scam-alert',
    title: 'Fact Check: SMS Warning Power Cut Tonight Due to Unpaid Bill is Dangerous Banking Fraud',
    titleGu: 'ફેક્ટ ચેક: "આજે રાત્રે ૯:૩૦ વાગ્યે વીજળી કાપી નાખવામાં આવશે" તેવો મેસેજ ફ્રોડ સાયબર કૌભાંડ છે',
    titleHi: 'फैक्ट चेक: "आज रात बिजली काट दी जाएगी" वाला मैसेज खतरनाक साइबर ठगी का प्रयास है',
    excerpt: 'Power discoms DGVCL, UGVCL & Torrent Power issue warning against fake SMS demanding bill payment via personal numbers.',
    excerptGu: 'વીજ કંપનીઓએ સ્પષ્ટતા કરી છે કે અજાણ્યા વ્યક્તિગત નંબરો પરથી આવતા લાઈટ બિલ બાકી હોવાના મેસેજ સાયબર ઠગાઈ માટે મોકલવામાં આવે છે.',
    excerptHi: 'बिजली कंपनियों ने चेतावनी दी है कि अज्ञात नंबरों से आने वाले बिजली कटने के मैसेज ठगी के लिए भेजे जाते हैं।',
    featuredImage: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80',
    content: `<p><strong>Claim:</strong> Citizens receive SMS stating: <em>"Dear consumer, your electricity will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Immediately contact Electricity Officer on 98XXXXXXXX."</em></p>
<h2>Fact Check Analysis</h2>
<p>Gujarat State Electricity Distribution Companies (UGVCL, DGVCL, PGVCL, MGVCL) and Torrent Power have confirmed they NEVER send SMS from personal 10-digit mobile numbers or demand APK downloads.</p>
<ul>
<li>Cyber criminals ask victims to install remote access apps (like AnyDesk/TeamViewer) to wipe out bank balances.</li>
<li>Official discom messages bear official sender IDs such as <strong>UGVCLP</strong> or <strong>TORRNT</strong>.</li>
</ul>
<blockquote>"Verdict: ⚠️ CYBER PHISHING FRAUD. Do NOT call the number or install any app."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> મોબાઈલ પર મેસેજ આવે છે: <em>"પ્રિય ગ્રાહક, તમારું ગયા મહિનાનું લાઈટ બિલ અપડેટ થયું નથી તેથી આજે રાત્રે ૯:૩૦ કલાકે વીજ જોડાણ કાપી નાખવામાં આવશે. તાત્કાલિક અમારા અધિકારીના નંબર 98XXXXXXXX પર સંપર્ક કરો."</em></p>
<h2>તપાસ અને સાચું તથ્ય</h2>
<p>ગુજરાતની સરકારી વીજ કંપનીઓ (UGVCL, DGVCL, PGVCL, MGVCL) અને ટોર્ચર પાવરે જાહેરાત કરી છે કે કંપની ક્યારેય વ્યક્તિગત ૧૦ અંકના મોબાઈલ નંબર પરથી કનેક્શન કાપવાનો મેસેજ મોકલતી નથી.</p>
<ul>
<li>આ સાયબર ઠગો છે જે ફોનમાં રિમોટ એકસેસ એપ ડાઉનલોડ કરાવી બેંક ખાતામાંથી પૈસા ઉપાડી લે છે.</li>
<li>સત્તાવાર મેસેજ માત્ર હેડર આઈડી જેમ કે <strong>UGVCLP</strong> કે <strong>DGVCLP</strong> પરથી જ આવે છે.</li>
</ul>
<blockquote>"ચુકાદો: ⚠️ સાયબર ફ્રોડ અને ઠગાઈની જાળ. આ નંબર પર ક્યારેય કોલ ન કરવો."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> बिजली बिल न भरने पर आज रात बिजली कटने का मैसेज आ रहा है।</p>
<h2>सच्चाई</h2>
<p>बिजली कंपनियों ने इसे साइबर ठगी करार दिया है और ऐसे नंबरों पर फोन न करने की सख्त सलाह दी है।</p>
<blockquote>"फैसला: ⚠️ साइबर फ्रॉड।"</blockquote>`,
    readingTime: 3,
    priority: 93,
    isTrending: true,
    isBreaking: true,
    isFeatured: true,
    views: 42500,
  },
  {
    slug: 'fact-check-pm-surya-ghar-100-percent-free-solar-rooftop-claim',
    title: 'Fact Check: Video Claiming PM Surya Ghar Scheme Gives 100% Free Solar Setup is Misleading',
    titleGu: 'ફેક્ટ ચેક: પીએમ સૂર્ય ઘર યોજના હેઠળ ૧૦૦% મફત સોલર રૂફટોપ ફિટિંગના વાયરલ દાવા ભ્રામક',
    titleHi: 'फैक्ट चेक: पीएम सूर्य घर योजना के तहत 100% मुफ्त सोलर रूफटॉप लगने का दावा भ्रामक है',
    excerpt: 'PM Surya Ghar Muft Bijli Yojana provides Central subsidies up to Rs 78,000, not completely free installations without consumer investment.',
    excerptGu: 'પીએમ સૂર્ય ઘર યોજનામાં સરકાર ₹૭૮,૦૦૦ સુધીની સબસીડી આપે છે, પરંતુ કોઈ પણ પ્રકારના ખર્ચ વગર ૧૦૦% મફતમાં રૂફટોપ નથી લાગતું.',
    excerptHi: 'पीएम सूर्य घर योजना में सरकार ₹78,000 तक की सब्सिडी देती है, बिना किसी लागत के 100% मुफ्त इंस्टॉलेशन नहीं होता।',
    featuredImage: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200&q=80',
    content: `<p><strong>Claim:</strong> Social media posts claim the Central Government is installing 3kW rooftop solar systems completely free of charge without any application or hardware cost under PM Surya Ghar Yojana.</p>
<h2>Fact Check Analysis</h2>
<p>Energy Department guidelines specify that PM Surya Ghar Muft Bijli Yojana offers up to Rs 78,000 direct financial subsidy for 3kW capacity systems. The balance investment is borne by the beneficiary or via low-interest bank loans.</p>
<ul>
<li>Up to 300 units of free solar electricity is generated monthly, offsetting grid power bills.</li>
<li>Viral claims calling it "zero investment 100% free setup" misrepresent the financial subsidy structure.</li>
</ul>
<blockquote>"Verdict: ⚠️ MISLEADING. Capital subsidy provided, but total setup is not zero cost."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> સોશિયલ મીડિયા પર વાયરલ મેસેજમાં કહેવાયું છે કે પીએમ સૂર્ય ઘર યોજના હેઠળ સરકાર એક પણ રૂપિયો લીધા વગર ઘરની છત પર ૩ કેડબલ્યુનો સોલર પ્લાન્ટ ૧૦૦% ફ્રીમાં લગાવી આપે છે.</p>
<h2>તપાસ અને સાચું તથ્ય</h2>
<p>ઉર્જા વિભાગના સત્તાવાર નિયમો અનુસાર પીએમ સૂર્ય ઘર મુફ્ત બીજલી યોજનામાં ૩ કેડબલ્યુ સિસ્ટમ માટે સરકાર ₹૭૮,૦૦૦ સુધીની સીધી સબસીડી આપે છે. બાકીની રકમ લાભાર્થીએ કે બેંક લોન દ્વારા ભરવાની રહે છે.</p>
<ul>
<li>પ્લાન્ટમાંથી દર મહિને ૩૦૦ યુનિટ સુધી મફત વીજળી મળે છે.</li>
<li>"એક પણ રૂપિયો આપ્યા વગર તદ્દન ફ્રી" વાળો વાયરલ દાવો ભ્રામક છે.</li>
</ul>
<blockquote>"ચુકાદો: ⚠️ ભ્રામક દાવો. સરકાર સબસીડી આપે છે, પૂરો પ્લાન્ટ ફ્રી નથી."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> पीएम सूर्य घर योजना के तहत बिना किसी पैसे के 100% मुफ्त सोलर पैनल लग रहे हैं।</p>
<h2>सच्चाई</h2>
<p>सरकार ₹78,000 तक सब्सिडी देती है, बाकी लागत उपभोक्ता को देनी होती है।</p>
<blockquote>"फैसला: ⚠️ भ्रामक जानकारी।"</blockquote>`,
    readingTime: 3,
    priority: 83,
    isTrending: false,
    isBreaking: false,
    isFeatured: true,
    views: 31200,
  },
  {
    slug: 'fact-check-atm-cash-withdrawal-limit-reduced-to-2000-fake',
    title: 'Fact Check: Indian Banks Association Denies Rumors of Reducing ATM Cash Limit to Rs 2000',
    titleGu: 'ફેક્ટ ચેક: બેંકો દ્વારા ATM માંથી દૈનિક ઉપાડ મર્યાદા ઘટાડી ₹૨૦૦૦ કરાયાના સમાચાર તદ્દન અફવા',
    titleHi: 'फैक्ट चेक: बैंकों द्वारा एटीएम से दैनिक निकासी सीमा घटाकर ₹2000 करने की खबर पूरी तरह अफवाह है',
    excerpt: 'Indian Banks Association (IBA) and RBI confirm no changes have been made to daily ATM cash withdrawal limits.',
    excerptGu: 'ઇન્ડિયન બેંક્સ એસોસિએશન અને ભારતીય રિઝર્વ બેંકે સ્પષ્ટ કર્યું છે કે એટીએમ રોકડ ઉપાડ મર્યાદા ઘટાડવા અંગેનો નિયમ પાયાવિહોણો છે.',
    excerptHi: 'इंडियन बैंक्स एसोसिएशन और आरबीआई ने स्पष्ट किया है कि एटीएम निकासी सीमा घटाने का कोई फैसला नहीं लिया गया है।',
    featuredImage: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1200&q=80',
    content: `<p><strong>Claim:</strong> Messages circulated on instant messaging apps state that starting next week, all public and private banks in India will cap daily ATM cash withdrawals to Rs 2000 per card.</p>
<h2>Fact Check Analysis</h2>
<p>The Indian Banks Association (IBA) and major banks (SBI, HDFC, ICICI, Bank of Baroda) released statements denying any reduction in daily ATM withdrawal limits.</p>
<ul>
<li>Daily limits continue to range between Rs 20,000 and Rs 1,00,000 depending on individual bank card variants.</li>
<li>The message is a recycled fake news piece designed to panic consumers.</li>
</ul>
<blockquote>"Verdict: ❌ FALSE RUMOR. No reduction in ATM withdrawal limits."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> વોટ્સએપ પર વાયરલ થઈ રહેલા મેસેજમાં એવો દાવો કરાયો છે કે આવતા અઠવાડિયાથી ભારતની તમામ બેંકો એટીએમ કાર્ડમાંથી દૈનિક રોકડ ઉપાડની મર્યાદા ઘટાડીને માત્ર ₹૨૦૦૦ કરી રહી છે.</p>
<h2>તપાસ અને તથ્ય</h2>
<p>ઇન્ડિયન બેંક્સ એસોસિએશન (IBA) અને સ્ટેટ બેંક ઓફ ઇન્ડિયા (SBI) સહિતની અગ્રણી બેંકોએ સત્તાવાર સ્પષ્ટતા કરી છે કે એટીએમ ઉપાડ મર્યાદા ઘટાડવાનો કોઈ નિર્ણય લેવાયો નથી.</p>
<ul>
<li>કાર્ડના પ્રકાર મુજબ દૈનિક ₹૨૦,૦૦૦ થી ₹૧,૦૦,૦૦૦ સુધીનો ઉપાડ યથાવત છે.</li>
<li>આ લોકોમાં ભય ફેલાવવા વાયરલ કરાયેલી નકલી અફવા છે.</li>
</ul>
<blockquote>"ચુકાદો: ❌ તદ્દન ખોટી અને પાયાવિહોણી અફવા."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> एटीएम से एक दिन में केवल ₹2000 ही निकाले जा सकेंगे।</p>
<h2>सच्चाई</h2>
<p>भारतीय बैंक संघ (IBA) ने इस खबर का खंडन किया है। नियम यथावत हैं।</p>
<blockquote>"फैसला: ❌ असत्य अफवाह।"</blockquote>`,
    readingTime: 3,
    priority: 86,
    isTrending: false,
    isBreaking: false,
    isFeatured: true,
    views: 29800,
  },
  {
    slug: 'fact-check-gujarat-sunday-lockdown-reimposition-fake-news',
    title: 'Fact Check: Gujarat Home Department Denies Viral Rumor of Sunday Curfew Reimposition',
    titleGu: 'ફેક્ટ ચેક: ગુજરાતમાં રવિવારે સપ્તાહાંત કરફ્યુ લાગુ થવા અંગેના વાયરલ મેસેજ તદ્દન ફેક ન્યૂઝ છે',
    titleHi: 'फैक्ट चेक: गुजरात में रविवार को वीकेंड कर्फ्यू लागू होने के वायरल मैसेज पूरी तरह से फर्जी हैं',
    excerpt: 'Gujarat Home Department confirms no Sunday lockdown or night curfew guidelines have been issued by state authorities.',
    excerptGu: 'ગુજરાત ગૃહ વિભાગે સ્પષ્ટતા કરી છે કે રાજ્યમાં રવિવારનો કોઈ લોકડાઉન કે કરફ્યુ લાગુ કરવાનો નિર્ણય લેવાયો નથી.',
    excerptHi: 'गुजरात गृह विभाग ने स्पष्ट किया है कि राज्य में कोई रविवार लॉकडाउन या कर्फ्यू का नियम लागू नहीं किया गया है।',
    featuredImage: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?w=1200&q=80',
    content: `<p><strong>Claim:</strong> Social media graphics claiming to represent Gujarat Government notifications state that a strict Sunday lockdown will be enforced across major cities from this weekend.</p>
<h2>Fact Check Analysis</h2>
<p>Gujarat State Home Department spokespersons confirmed that the graphic is a fabricated edit of old 2021 pandemic advisories. No curfews or movement restrictions are in place.</p>
<ul>
<li>Markets, offices, public transport, and commercial establishments will remain open as normal.</li>
<li>Legal action has been initiated against social media handles spreading outdated lockdown circulars.</li>
</ul>
<blockquote>"Verdict: ❌ FAKE NEWS. No Sunday lockdown in Gujarat."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> સોશિયલ મીડિયા પર ગુજરાત સરકારના પરિપત્ર જેવો જણાતો એક ગ્રાફિક વાયરલ થઈ રહ્યો છે જેમાં કહેવાયું છે કે આ રવિવારથી રાજ્યના તમામ મોટા શહેરોમાં સખત રવિવાર લોકડાઉન લાગુ થશે.</p>
<h2>તપાસ અને સાચું તથ્ય</h2>
<p>ગુજરાત રાજ્ય ગૃહ વિભાગે સ્પષ્ટ કર્યુ છે કે આ વાયરલ ગ્રાફિક ૨૦૨૧ના જૂના રોગચાળા સમયના નોટિફિકેશનનું બોગસ એડિટિંગ છે. રાજ્યમાં આવી કોઈ પાબંદી નથી.</p>
<ul>
<li>તમામ બજારો, સરકારી-ખાનગી ઓફિસો અને ટ્રાન્સપોર્ટ સામાન્ય રીતે ચાલુ રહેશે.</li>
<li>અફવા ફેલાવનાર સોશિયલ મીડિયા એકાઉન્ટ્સ સામે કાર્યવાહી શરૂ કરાઈ છે.</li>
</ul>
<blockquote>"ચુકાદો: ❌ તદ્દન ખોટા સમાચાર અને અફવા."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> गुजरात के शहरों में फिर से संडे लॉकडाउन लागू होने जा रहा है।</p>
<h2>सच्चाई</h2>
<p>गृह विभाग ने इसे 2021 का पुराना एडिटेड मैसेज बताया है और किसी भी प्रकार का कर्फ्यू नहीं है।</p>
<blockquote>"फैसला: ❌ फर्जी खबर।"</blockquote>`,
    readingTime: 3,
    priority: 92,
    isTrending: true,
    isBreaking: true,
    isFeatured: true,
    views: 39600,
  },
  {
    slug: 'fact-check-5-year-education-loan-moratorium-forged-circular',
    title: 'Fact Check: Ministry of Education Clarifies Forged Circular on 5-Year Student Loan Moratorium',
    titleGu: 'ફેક્ટ ચેક: એજ્યુકેશન લોન પર ૫ વર્ષ સુધી વ્યાજ માફી અને ઇએમઆઈ વિલંબ અંગેનો વાયરલ પરિપત્ર નકલી',
    titleHi: 'फैक्ट चेक: एजुकेशन लोन पर 5 साल के लिए ईएमआई छूट का वायरल सर्कुलर फर्जी है',
    excerpt: 'PIB Fact Check confirms circular promising 5-year repayment moratorium and complete interest waiver for student loans is forged.',
    excerptGu: 'પીઆઈબી ફેક્ટ ચેકે પુષ્ટિ કરી છે કે શિક્ષણ મંત્રાલયના નામે વાયરલ થયેલો એજ્યુકેશન લોન વ્યાજ માફીનો પત્ર બોગસ છે.',
    excerptHi: 'पीआईबी फैक्ट चेक ने पुष्टि की है कि शिक्षा मंत्रालय के नाम से वायरल स्टूडेंट लोन माफी का पत्र फर्जी है।',
    featuredImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80',
    content: `<p><strong>Claim:</strong> A circular carrying Union Ministry of Education letterhead states that all student education loans will receive an automatic 5-year repayment moratorium with 100% interest waiver.</p>
<h2>Fact Check Analysis</h2>
<p>PIB Fact Check and Higher Education Ministry officials confirmed the letterhead is counterfeit. Existing education loan subsidy schemes (like CSIS) continue under standard guidelines without broad 5-year blanket waivers.</p>
<ul>
<li>Students should verify educational financial aid only via official portals like <strong>vidyalakshmi.co.in</strong>.</li>
<li>Forged documents are frequently used by fraudulent agents offering false loan settlement promises.</li>
</ul>
<blockquote>"Verdict: 📄 FORGED DOCUMENT. No 5-year universal loan waiver issued."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> શિક્ષણ મંત્રાલયના બોગસ સહી-સિક્કા વાળો એક પરિપત્ર વાયરલ થયો છે જેમાં લખ્યું છે કે તમામ વિદ્યાર્થીઓની એજ્યુકેશન લોનના હપ્તા ૫ વર્ષ માટે સ્થગિત કરી વ્યાજ ૧૦૦% માફ કરવામાં આવ્યું છે.</p>
<h2>તપાસ અને તથ્ય</h2>
<p>પીઆઈબી ફેક્ટ ચેક અને શિક્ષણ મંત્રાલયે આ પત્રને બનાવટી અને નકલી જાહેર કર્યો છે. સરકારી યોજનાઓ હેઠળ મળતી સામાન્ય વ્યાજ સબસીડી સિવાય આવી કોઈ ૫ વર્ષની સામૂહિક માફી જાહેર કરાઈ નથી.</p>
<ul>
<li>વિદ્યાર્થીઓએ શૈક્ષણિક લોન અંગેની માહિતી માત્ર સત્તાવાર <strong>vidyalakshmi.co.in</strong> પોર્ટલ પરથી લેવી.</li>
<li>આવા બોગસ પરિપત્રો બનાવીને એજન્ટો વિદ્યાર્થીઓ પાસે પૈસા પડાવવાનો પ્રયાસ કરે છે.</li>
</ul>
<blockquote>"ચુકાદો: 📄 બનાવટી અને નકલી પરિપત્ર."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> एजुकेशन लोन का भुगतान 5 साल तक टाल दिया गया है और ब्याज माफ हो गया है।</p>
<h2>सच्चाई</h2>
<p>शिक्षा मंत्रालय ने इस पत्र को पूरी तरह से फर्जी करार दिया है।</p>
<blockquote>"फैसला: 📄 जाली दस्तावेज।"</blockquote>`,
    readingTime: 3,
    priority: 87,
    isTrending: false,
    isBreaking: false,
    isFeatured: true,
    views: 30500,
  },
  {
    slug: 'fact-check-traffic-helmet-fine-5000-direct-bank-debit-fake',
    title: 'Fact Check: Claim of Rs 5000 Automatic Bank Debit for No-Helmet Traffic E-Challan is Misleading',
    titleGu: 'ફેક્ટ ચેક: હેલ્મેટ વગર ડ્રાઇવિંગ કરવા બદલ ₹૫૦૦૦ દંડ બેંક ખાતામાંથી આપોઆપ કપાવાનો દાવો ખોટો',
    titleHi: 'फैक्ट चेक: बिना हेलमेट गाड़ी चलाने पर ₹5000 का ऑटोमैटिक बैंक चालान कटने का दावा गलत है',
    excerpt: 'Gujarat Traffic Police clarifies standard helmet fine remains Rs 500 and no automated direct bank account debit system exists.',
    excerptGu: 'ગુજરાત ટ્રાફિક પોલીસે સ્પષ્ટ કર્યું છે કે હેલ્મેટ વગર દંડ ₹૫૦૦ છે અને ખાતામાંથી સીધા પૈસા કાપવાનો કોઈ નિયમ નથી.',
    excerptHi: 'गुजरात ट्रैफिक पुलिस ने स्पष्ट किया कि बिना हेलमेट जुर्माना ₹500 है और बैंक से सीधे पैसे कटने का कोई नियम नहीं है।',
    featuredImage: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&q=80',
    content: `<p><strong>Claim:</strong> Social media posts state that new AI traffic cameras across Gujarat will automatically issue Rs 5000 e-challans directly debited from the vehicle owner's bank account for driving without a helmet.</p>
<h2>Fact Check Analysis</h2>
<p>State Traffic Police authorities clarified that while smart cameras detect traffic violations, helmet fines in Gujarat are set at Rs 500 under the Motor Vehicles Rules. Fines are never debited automatically from personal bank accounts.</p>
<ul>
<li>E-challans are sent via SMS or official digital traffic portals where payment is completed manually by the citizen.</li>
<li>The viral posts exaggerate fine amounts and invent non-existent automated bank debit mechanisms.</li>
</ul>
<blockquote>"Verdict: ⚠️ MISLEADING. Helmet fine is Rs 500, no direct bank account debits."</blockquote>`,
    contentGu: `<p><strong>દાવો:</strong> સોશિયલ મીડિયા પર વાયરલ મેસેજમાં કહેવાયું છે કે ગુજરાતમાં નવા AI ટ્રાફિક કેમેરાથી હેલ્મેટ વગર ગાડી ચલાવવા બદલ ₹૫૦૦૦ નો દંડ સીધો બેંક એકાઉન્ટમાંથી ઓટોમેટિક કપાઈ જશે.</p>
<h2>તપાસ અને તથ્ય</h2>
<p>રાજ્ય ટ્રાફિક પોલીસ વિભાગે સ્પષ્ટતા કરી છે કે ગુજરાતમાં મોટર વ્હીકલ એક્ટ હેઠળ હેલ્મેટ ન પહેરવાનો નિયમિત દંડ ₹૫૦૦ જ છે. કોઈપણ બેંક ખાતામાંથી સીધો દંડ કાપવાની સિસ્ટમ અસ્તિત્વમાં નથી.</p>
<ul>
<li>ઈ-ચલાન એસએમએસ અથવા સત્તાવાર <strong>echallan.gujarat.gov.in</strong> પોર્ટલ પર જ જનરેટ થાય છે જેનું નાગરિકે પોતે ચુકવણું કરવાનું હોય છે.</li>
<li>આ દાવો લોકોને ડરાવવા માટે વધારી-ચઢાવીને વાયરલ કરાયો છે.</li>
</ul>
<blockquote>"ચુકાદો: ⚠️ ભ્રામક દાવો. હેલ્મેટ દંડ ₹૫૦૦ છે, ખાતામાંથી સીધા પૈસા કપાતા નથી."</blockquote>`,
    contentHi: `<p><strong>दावा:</strong> बिना हेलमेट चालान कटने पर बैंक खाते से ₹5000 सीधे कट जाएंगे।</p>
<h2>सच्चाई</h2>
<p>गुजरात पुलिस के अनुसार जुर्माना ₹500 है और बैंक से ऑटोमैटिक पैसे कटने की कोई व्यवस्था नहीं है।</p>
<blockquote>"फैसला: ⚠️ भ्रामक सूचना।"</blockquote>`,
    readingTime: 3,
    priority: 84,
    isTrending: false,
    isBreaking: false,
    isFeatured: true,
    views: 28900,
  },
];

async function main() {
  console.log('🚀 Adding 15 new Fact Check articles with images & full rich content...');

  let factCategory = await prisma.category.findUnique({
    where: { slug: 'fact-check' },
  });

  if (!factCategory) {
    console.log('Creating Fact Check category...');
    factCategory = await prisma.category.create({
      data: {
        slug: 'fact-check',
        name: 'Fact Check',
        nameGu: 'ફેક્ટ ચેક',
        nameHi: 'फैक्त चेक',
        description: 'Authentic fact checks, debunking viral social media claims, fake news and misinformation.',
        descriptionGu: 'સાચા અને અધિકૃત ફેક્ટ ચેક, સોશિયલ મીડિયા પર વાયરલ અફવાઓ અને બોગસ દાવાઓનું સત્ય.',
        descriptionHi: 'सच्चे और प्रामाणिक फैक्ट चेक, सोशल मीडिया पर वायरल अफवाहों और फर्जी दावों का सच।',
        icon: 'check-circle',
        color: '#dc2626',
        showInHeader: true,
        showInHome: true,
      },
    });
  }

  const author = await prisma.author.findFirst();
  if (!author) {
    throw new Error('No author found in database! Please seed authors first.');
  }

  const lastPost = await prisma.post.findFirst({
    orderBy: { articleNumber: 'desc' },
    select: { articleNumber: true },
  });
  let nextArticleNum = (lastPost?.articleNumber || 100) + 1;

  const tags = await prisma.tag.findMany({ take: 3 });

  for (const article of FACT_CHECK_ARTICLES) {
    const post = await prisma.post.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        titleGu: article.titleGu,
        titleHi: article.titleHi,
        excerpt: article.excerpt,
        excerptGu: article.excerptGu,
        excerptHi: article.excerptHi,
        content: article.content,
        contentGu: article.contentGu,
        contentHi: article.contentHi,
        featuredImage: article.featuredImage,
        status: PostStatus.PUBLISHED,
        readingTime: article.readingTime,
        priority: article.priority,
        isTrending: article.isTrending,
        isBreaking: article.isBreaking,
        isFeatured: article.isFeatured,
        views: article.views,
        categoryId: factCategory.id,
        authorId: author.id,
      },
      create: {
        slug: article.slug,
        articleNumber: nextArticleNum++,
        title: article.title,
        titleGu: article.titleGu,
        titleHi: article.titleHi,
        excerpt: article.excerpt,
        excerptGu: article.excerptGu,
        excerptHi: article.excerptHi,
        content: article.content,
        contentGu: article.contentGu,
        contentHi: article.contentHi,
        featuredImage: article.featuredImage,
        status: PostStatus.PUBLISHED,
        readingTime: article.readingTime,
        priority: article.priority,
        isTrending: article.isTrending,
        isBreaking: article.isBreaking,
        isFeatured: article.isFeatured,
        views: article.views,
        categoryId: factCategory.id,
        authorId: author.id,
      },
    });

    if (tags.length > 0) {
      for (const tag of tags) {
        await prisma.postTag.upsert({
          where: { postId_tagId: { postId: post.id, tagId: tag.id } },
          update: {},
          create: { postId: post.id, tagId: tag.id },
        });
      }
    }

    console.log(`✅ Successfully added Fact Check post: "${post.titleGu}" (Slug: ${post.slug})`);
  }

  console.log('🎉 All 15 Fact Check articles successfully populated in the database!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding fact check articles:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
