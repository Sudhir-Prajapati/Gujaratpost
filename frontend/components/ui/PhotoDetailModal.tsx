'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Link2, Check, MessageCircle, Phone, Globe, Mail } from 'lucide-react';
import { Photo, Language } from '@/types';
import { getLocalized } from '@/data';

// Custom share helper
const shareUrl = (platform: string, url: string, text: string) => {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);
  if (platform === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  if (platform === 'twitter') return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
  if (platform === 'whatsapp') return `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`;
  return '#';
};

interface PhotoDetailModalProps {
  photos: Photo[];
  activeIndex: number;
  onClose: () => void;
  language: Language;
  onSelectPhoto: (index: number) => void;
}

// Simulated detailed content matching real news articles for the photos
const MOCK_DESCRIPTIONS: Record<string, { en: string; gu: string; hi: string }> = {
  ph1: {
    en: "Ahmedabad witnessed heavy continuous rain causing traffic snarls and waterlogging in low-lying areas. The Sabarmati Riverfront development authority has monitored the water level closely and opened key gates to maintain safety guidelines. Civic teams are working continuously to clear roads and ensure public safety across major zones.",
    gu: "અમદાવાદમાં અવિરત ભારે વરસાદને પગલે નીચાણવાળા વિસ્તારોમાં પાણી ભરાયા છે અને ટ્રાફિક જામની સમસ્યા સર્જાઈ છે. સાબરમતી રિવરફ્રન્ટ ડેવલપમેન્ટ ઓથોરિટી દ્વારા પાણીના સ્તર પર ચાંપતી નજર રાખવામાં આવી રહી છે અને સુરક્ષા માર્ગદર્શિકા જાળવવા માટે મુખ્ય દરવાજા ખોલવામાં આવ્યા છે. મ્યુનિસિપલ ટીમો રસ્તાઓ સાફ કરવા માટે સતત કામ કરી રહી છે.",
    hi: "अहमदाबाद में लगातार भारी बारिश के कारण निचले इलाकों में जलभराव हो गया और ट्रैफिक जाम की समस्या पैदा हो गई। साबरमती रिवरफ्रंट विकास प्राधिकरण पानी के स्तर पर पैनी नजर रख रहा है और सुरक्षा बनाए रखने के लिए मुख्य गेट खोल दिए गए हैं। नगर निगम की टीमें सड़कों को साफ करने और सार्वजनिक सुरक्षा सुनिश्चित करने के लिए काम कर रही हैं।"
  },
  ph2: {
    en: "The Gujarat Cricket Team was seen during an intense practice session at the Narendra Modi Stadium. With the upcoming domestic and IPL seasons, key batsmen and bowlers were seen refining their skills under head coach's supervision. The energy was high as the young talent blended with experienced pros during training drills.",
    gu: "ગુજરાત ક્રિકેટ ટીમ નરેન્દ્ર મોદી સ્ટેડિયમમાં સઘન પ્રેક્ટિસ સેશન દરમિયાન જોવા મળી હતી. આગામી સ્થાનિક અને આઈપીએલ સીઝનને ધ્યાનમાં રાખીને, મુખ્ય બેટ્સમેનો અને બોલરો હેડ કોચની દેખરેખ હેઠળ તેમની કુશળતા સુધારી રહ્યા છે. તાલીમ દરમિયાન અનુભવી ખેલાડીઓ સાથે યુવા પ્રતિભાઓ ઉત્સાહભેર જોડાઈ હતી.",
    hi: "नरेंद्र मोदी स्टेडियम में गुजरात क्रिकेट टीम अभ्यास सत्र के दौरान नजर आई। आगामी घरेलू और आईपीएल सीज़न को देखते हुए, मुख्य बल्लेबाज और गेंदबाज मुख्य कोच की देखरेख में अपने कौशल को निखार रहे हैं। प्रशिक्षण के दौरान अनुभवी खिलाड़ियों के साथ युवा प्रतिभाएं भी काफी सक्रिय नजर आईं।"
  },
  ph3: {
    en: "A massive crowd gathered at the district election rally showing high enthusiasm and support. Political leaders addressed key developmental schemes, civic infrastructure plans, and employment initiatives targeted for the upcoming 2027 state assembly elections. Strict police deployment ensured smooth crowd management and traffic movement.",
    gu: "જિલ્લા ચૂંટણી રેલીમાં ભારે ઉત્સાહ અને સમર્થન દર્શાવતી વિશાળ જનમેદની એકઠી થઈ હતી. રાજકીય નેતાઓએ આગામી ૨૦૨૭ની વિધાનસભા ચૂંટણી માટે નિર્ધારિત કલ્યાણકારી યોજનાઓ, ઈન્ફ્રાસ્ટ્રક્ચર વિકાસ અને રોજગાર પહેલ અંગે સંબોધન કર્યું હતું. પોલીસ બંદોબસ્તને કારણે જનમેદની વ્યવસ્થા સુચારૂ રહી હતી.",
    hi: "जिला चुनाव रैली में भारी उत्साह और समर्थन दिखाते हुए विशाल जनसमुदाय एकत्रित हुआ। राजनीतिक नेताओं ने आगामी 2027 के राज्य विधानसभा चुनावों के लिए लक्षित प्रमुख विकास योजनाओं, बुनियादी ढांचे और रोजगार पहलों पर चर्चा की। पुलिस की मुस्तैदी से भीड़ प्रबंधन सुचारू रहा।"
  },
  ph4: {
    en: "Navratri Garba celebrations reached peak excitement in Gujarat as thousands of youngsters danced to traditional folk tunes. Dressed in vibrant ethnic attire, the participants showcased coordinated choreography. Organizing committees highlighted high-end security measures, CCTV surveillance, and first-aid counters at all major venues.",
    gu: "નવરાત્રી ગરબા મહોત્સવ ગુજરાતમાં ચરમસીમા પર પહોંચ્યો હતો જ્યાં હજારો ખેલૈયાઓ પરંપરાગત લોકધૂન પર ઝૂમ્યા હતા. વાઇબ્રન્ટ પરંપરાગત પોશાક સજ્જ થઈને ખેલૈયાઓએ રાસ-ગરબાની રમઝટ બોલાવી હતી. આયોજક સમિતિઓએ તમામ મુખ્ય સ્થળોએ હાઈ-એન્ડ સુરક્ષા પગલાં, સીસીટીવી સર્વેલન્સ અને પ્રાથમિક સારવાર કાઉન્ટર્સની વ્યવસ્થા કરી હતી.",
    hi: "गुजरात में नवरात्रि गरबा महोत्सव का उत्साह चरम पर पहुंच गया जहां हजारों युवाओं ने पारंपरिक धुनों पर नृत्य किया। रंग-बिरंगे पारंपरिक परिधानों में सजे प्रतिभागियों ने शानदार प्रदर्शन किया। आयोजन समितियों ने सुरक्षा उपायों, सीसीटीवी निगरानी और प्राथमिक चिकित्सा काउंटरों की व्यवस्था की।"
  },
  ph5: {
    en: "The iconic GIFT City skyline captured during twilight, representing Gujarat's growing corporate footprint and global financial integrations. With state-of-the-art infrastructure, tech hubs, and smart traffic control corridors, the district is rapidly emerging as a preferred investment destination for global multinational firms.",
    gu: "સંધ્યાકાળે લેવાયેલ GIFT સિટીની આકર્ષક સ્કાઇલાઇન, જે ગુજરાતના વધતા જતા કોર્પોરેટ ક્ષેત્ર અને વૈશ્વિક નાણાકીય એકીકરણનું પ્રતિનિધિત્વ કરે છે. અત્યાધુનિક ઇન્ફ્રાસ્ટ્રક્ચર, ટેક હબ અને સ્માર્ટ કંટ્રોલ કોરિડોર સાથે, આ ક્ષેત્ર વૈશ્વિક મલ્ટિનેશનલ કંપનીઓ માટે રોકાણનું કેન્દ્ર બની રહ્યું છે.",
    hi: "संध्याकाल के समय ली गई गिफ्ट सिटी की आकर्षक स्काईलाइन, जो गुजरात के बढ़ते कॉर्पोरेट क्षेत्र और वैश्विक वित्तीय एकीकरण का प्रतिनिधित्व करती है। अत्याधुनिक बुनियादी ढांचे, तकनीकी हब और स्मार्ट नियंत्रण के साथ, यह क्षेत्र बहुराष्ट्रीय कंपनियों के लिए पसंदीदा निवेश गंतव्य बन रहा है।"
  },
  ph6: {
    en: "Students interacting in a modern digital classroom implemented across municipal schools in Gujarat. Equipped with interactive smartboards, educational software, and tablet-based learning, the initiative aims to bridge the digital divide and foster conceptual clarity and cognitive skill development at secondary school levels.",
    gu: "ગુજરાતની સરકારી શાળાઓમાં અમલીકૃત આધુનિક ડિજિટલ ક્લાસરૂમમાં વિદ્યાર્થીઓ અભ્યાસ કરી રહ્યા છે. ઇન્ટરેક્ટિવ સ્માર્ટબોર્ડ્સ, શૈક્ષણિક સોફ્ટવેર અને ટેબ્લેટ-આધારિત લર્નિંગથી સજ્જ આ પહેલનો હેતુ ડિજિટલ વિભાજનને દૂર કરવાનો અને ગુણવત્તાયુક્ત શિક્ષણ પ્રદાન કરવાનો છે.",
    hi: "गुजरात के सरकारी स्कूलों में लागू आधुनिक डिजिटल कक्षा में छात्र पढ़ाई कर रहे हैं। इंटरैक्टिव स्मार्टबोर्ड, शैक्षिक सॉफ्टवेयर और टैबलेट-आधारित लर्निंग से लैस इस पहल का उद्देश्य डिजिटल विभाजन को दूर करना और माध्यमिक स्तर पर गुणवत्तापूर्ण शिक्षा प्रदान करना है।"
  }
};

export default function PhotoDetailModal({ photos, activeIndex, onClose, language, onSelectPhoto }: PhotoDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const activePhoto = photos[activeIndex];
  const photoUrl = typeof window !== 'undefined' ? `${window.location.origin}/photos` : 'https://gujaratpost.com/photos';

  useEffect(() => {
    // Prevent background scrolling when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleNext = () => {
    onSelectPhoto((activeIndex + 1) % photos.length);
    setCopied(false);
  };

  const handlePrev = () => {
    onSelectPhoto((activeIndex - 1 + photos.length) % photos.length);
    setCopied(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${photoUrl}?id=${activePhoto.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const photoCaption = getLocalized(language, {
    en: activePhoto.caption,
    gu: activePhoto.captionGu,
    hi: activePhoto.captionHi
  });

  const photoDescription = MOCK_DESCRIPTIONS[activePhoto.id]
    ? getLocalized(language, MOCK_DESCRIPTIONS[activePhoto.id])
    : photoCaption;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background w-screen h-screen overflow-hidden animate-in fade-in duration-200" role="dialog" aria-modal="true">
      <div className="relative flex h-full w-full flex-col bg-card overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 md:px-6 py-3.5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-black tracking-wider text-accent uppercase">Gujarat Post</span>
            <span className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-xs font-bold text-muted-foreground">
                {getLocalized(language, { en: 'Photo Gallery', gu: 'ફોટો ગેલેરી', hi: 'फोटो गैलरी' })}
              </h2>
              <span className="text-[10px] font-black text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {activeIndex + 1} / {photos.length}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-black text-foreground hover:bg-accent hover:text-white transition duration-200"
            aria-label="Close spotlight"
          >
            <X className="h-3.5 w-3.5" />
            <span>{getLocalized(language, { en: 'Close', gu: 'બંધ કરો', hi: 'बंद करें' })}</span>
          </button>
        </div>

        {/* Modal Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-border overflow-hidden flex-1">
          
          {/* Left/Center Panel (Image, controls, description, share buttons) */}
          <div className="lg:col-span-2 flex flex-col overflow-y-auto scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-transparent">
            
            {/* Image display section */}
            <div className="group relative aspect-[16/10] bg-muted/40 w-full overflow-hidden flex items-center justify-center">
              <Image 
                src={activePhoto.src} 
                alt={activePhoto.alt} 
                fill 
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-contain" 
                priority
              />
              
              {/* Prev / Next buttons inside image bounds (desktop only) */}
              <button 
                type="button" 
                onClick={handlePrev} 
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white hover:bg-accent transition opacity-0 group-hover:opacity-100 duration-200"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button 
                type="button" 
                onClick={handleNext} 
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2.5 text-white hover:bg-accent transition opacity-0 group-hover:opacity-100 duration-200"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            {/* Content, Shares, Caption Area */}
            <div className="p-4 md:p-6 flex flex-col md:flex-row gap-5">
              
              {/* Vertical Share Column */}
              <div className="flex md:flex-col gap-2 shrink-0 md:items-center justify-start border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-4">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider md:mb-1 self-center md:self-auto">
                  {getLocalized(language, { en: 'Share', gu: 'શેર', hi: 'शेयर' })}
                </span>
                
                <a 
                  href={shareUrl('facebook', photoUrl, photoCaption)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1877f2] text-white hover:scale-105 transition"
                  title="Share on Facebook"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="currentColor" d="M14.2 8.2V6.8c0-.7.5-.9.9-.9h2.2V2.1L14.2 2c-3.5 0-4.3 2.1-4.3 4.1v2.1H7.8v4.2h2.1V22h4.3v-9.6h2.9l.5-4.2h-3.4Z" /></svg>
                </a>

                <a 
                  href={shareUrl('twitter', photoUrl, photoCaption)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white hover:scale-105 transition"
                  title="Share on X"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path fill="currentColor" d="M18.9 2H22l-6.8 7.8L23.2 22H17l-4.8-6.3L6.7 22H3.5l7.2-8.3L3 2h6.3l4.4 5.8L18.9 2Zm-1.1 17.9h1.7L8.4 4H6.6l11.2 15.9Z" /></svg>
                </a>

                <a 
                  href={shareUrl('whatsapp', photoUrl, photoCaption)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25d366] text-white hover:scale-105 transition"
                  title="Share on WhatsApp"
                >
                  <MessageCircle className="h-4 w-4" fill="currentColor" />
                </a>

                <button 
                  type="button" 
                  onClick={copyLink} 
                  className={`flex h-8 w-8 items-center justify-center rounded-full transition ${copied ? 'bg-emerald-500 text-white' : 'bg-muted hover:bg-border text-foreground'}`}
                  title="Copy link"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                </button>
              </div>

              {/* Text Area */}
              <div className="flex-1">
                <h3 className="text-base md:text-lg font-black text-foreground mb-3 leading-snug">
                  {photoCaption}
                </h3>
                <p className="text-xs font-semibold text-muted-foreground/90 leading-relaxed whitespace-pre-line">
                  {photoDescription}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-bold text-muted-foreground/60 border-t border-dashed border-border pt-3">
                  <span>{getLocalized(language, { en: 'Gujarat Post Photo News', gu: 'ગુજરાત પોસ્ટ ફોટો સમાચાર', hi: 'गुजरात पोस्ट फोटो समाचार' })}</span>
                  <span>•</span>
                  <span>{new Date().toLocaleDateString(language === 'gu' ? 'gu-IN' : language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

            </div>

          </div>

          {/* Right Sidebar Panel (Advertisements, gallery navigation) */}
          <div className="lg:col-span-1 bg-muted/10 p-4 md:p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-accent/20 scrollbar-track-transparent flex flex-col gap-5">
            
            {/* Gallery Navigation List */}
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-foreground border-b border-border pb-2 mb-3">
                {getLocalized(language, { en: 'Other Photos', gu: 'અન્ય ફોટાઓ', hi: 'अन्य तस्वीरें' })}
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => {
                  const isCurrent = index === activeIndex;
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => {
                        onSelectPhoto(index);
                        setCopied(false);
                      }}
                      className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 bg-muted transition duration-200 hover:-translate-y-0.5 ${isCurrent ? 'border-accent ring-2 ring-accent/10 scale-98' : 'border-transparent hover:border-border'}`}
                    >
                      <Image 
                        src={photo.src} 
                        alt={photo.alt} 
                        fill 
                        sizes="100px"
                        className="object-cover"
                      />
                      {isCurrent && (
                        <div className="absolute inset-0 bg-accent/20 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="text-[9px] font-black text-white bg-accent px-1.5 py-0.5 rounded-md shadow">ACTIVE</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Simulated Gujarat Post Business Advertisement (Matches Screenshot Theme) */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-red-600 text-white font-black text-[8px] uppercase px-2 py-0.5 rounded-bl">
                Ad
              </div>
              <div className="flex items-center gap-1.5 text-accent text-[9px] font-black uppercase tracking-widest mb-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                Gujarat Post
              </div>
              <h5 className="text-xs font-black text-foreground mb-1 leading-snug">
                Business Advertisement
              </h5>
              <p className="text-[10px] font-semibold text-muted-foreground leading-relaxed mb-3">
                Reach lakhs of daily readers across Gujarat. Feature your businesses on our News Portal & Facebook Page.
              </p>
              
              <div className="space-y-1.5 border-t border-border pt-3">
                <a href="tel:+919909907227" className="flex items-center gap-2 text-[10px] font-bold text-foreground hover:text-accent transition">
                  <Phone className="h-3.5 w-3.5 text-accent shrink-0" />
                  +91 99099 07227
                </a>
                <a href="mailto:info@gujaratpost.in" className="flex items-center gap-2 text-[10px] font-bold text-foreground hover:text-accent transition">
                  <Mail className="h-3.5 w-3.5 text-accent shrink-0" />
                  info@gujaratpost.in
                </a>
                <a href="https://gujaratpost.in" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] font-bold text-foreground hover:text-accent transition">
                  <Globe className="h-3.5 w-3.5 text-accent shrink-0" />
                  www.gujaratpost.in
                </a>
              </div>

              <a 
                href="mailto:info@gujaratpost.in" 
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent text-white px-3 py-2 text-xs font-black hover:bg-accent/90 transition shadow-sm"
              >
                Advertise Now
              </a>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
