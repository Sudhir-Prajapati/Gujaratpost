'use client';

import React from 'react';
import { Page3Data } from './types';
import { EditableTextSlot } from './EditableTextSlot';
import { EditableImageSlot } from './EditableImageSlot';
import { useEpaperReadOnly, EpaperReadOnlyProvider } from './EpaperReadOnlyContext';

export interface Page3BusinessProps {
  data: Page3Data;
  onChange: (newData: Page3Data) => void;
  selectedPath?: string;
  onSelectSlot?: (path: string, label: string) => void;
  onImportClick?: (slotPath: string, label: string) => void;
  readOnly?: boolean;
}

const fallbackPage3 = {
  sectionTitle: 'બિઝનેસ અને એડિટોરિયલ વિશેષ',
  topBarTagline: 'ગુજરાત પોસ્ટ • દૈનિક ઈ-પેપર',
  businessStory: {
    category: 'શેરબજાર અને કોર્પોરેટ જગત',
    headline: 'ભારતીય અર્થતંત્રમાં ઐતિહાસિક તેજી: સેન્સેક્સ અને નિફ્ટી ઓલ-ટાઇમ હાઈ સપાટીએ',
    subheadline: 'વિદેશી રોકાણકારોની ભારે લેવાલીથી માર્કેટ કેપિટલાઇઝેશનમાં ₹૪ લાખ કરોડનો વધારો',
    location: 'મુંબઈ',
    paragraph1: 'મુંબઈ: વૈશ્વિક સકારાત્મક સંકેતો અને વિદેશી સંસ્થાકીય રોકાણકારો (FII) ની અવિરત જોરદાર ખરીદીને કારણે આજે ભારતીય શેરબજારમાં અભૂતપૂર્વ ઐતિહાસિક ઉછાળો જોવા મળ્યો છે. બોમ્બે સ્ટોક એક્સચેન્જનો સંવેદનશીલ સૂચકાંક સેન્સેક્સ ૮૫૦ પોઈન્ટના તોતિંગ ઉછાળા સાથે નવી સર્વોચ્ચ સપાટીએ પહોંચ્યો હતો. આઈટી, બેન્કિંગ, ઓટોમોબાઇલ અને રિન્યુએબલ એનર્જી સેક્ટરના શેરોમાં ભારે લેવાલી નોંધાઈ હતી. રોકાણકારોની સંપત્તિમાં આજે એક જ દિવસમાં ₹૪.૨ લાખ કરોડથી વધુનો તોતિંગ વધારો નોંધાયો છે, જેનાથી દલાલ સ્ટ્રીટમાં ઉત્સાહનો માહોલ છવાઈ ગયો છે.',
    paragraph2: 'વૈશ્વિક રેટિંગ એજન્સીઓ દ્વારા ભારતના જીડીપી ગ્રોથ અનુમાનમાં વધારો કરવામાં આવતા દેશી મ્યુચ્યુઅલ ફંડ્સ અને રિટેલ રોકાણકારોનો વિશ્વાસ વધુ મજબૂત બન્યો છે.',
    paragraph3: 'ટેકનોલોજી અને કેપિટલ ગુડ્સ કંપનીઓના ત્રિમાસિક પરિણામો અપેક્ષા કરતાં વધુ ઉત્કૃષ્ટ રહેતાં બજારમાં સતત ત્રીજા સપ્તાહે તેજીની આગેકૂચ જળવાઈ રહી છે.',
    articleBody: 'મુંબઈ: વૈશ્વિક સકારાત્મક સંકેતો અને વિદેશી સંસ્થાકીય રોકાણકારો (FII) ની અવિરત જોરદાર ખરીદીને કારણે આજે ભારતીય શેરબજારમાં અભૂતપૂર્વ ઐતિહાસિક ઉછાળો જોવા મળ્યો છે. બોમ્બે સ્ટોક એક્સચેન્જનો સંવેદનશીલ સૂચકાંક સેન્સેક્સ ૮૫૦ પોઈન્ટના તોતિંગ ઉછાળા સાથે નવી સર્વોચ્ચ સપાટીએ પહોંચ્યો હતો. આઈટી, બેન્કિંગ, ઓટોમોબાઇલ અને રિન્યુએબલ એનર્જી સેક્ટરના શેરોમાં ભારે લેવાલી નોંધાઈ હતી.',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80',
    caption: 'શેરબજારમાં રેકોર્ડબ્રેક તેજીથી રોકાણકારોમાં ભારે ઉત્સાહ',
    keyPoints: {
      title: 'બજાર તેજીના મુખ્ય પરિબળો',
      points: [
        'સેન્સેક્સ અને નિફ્ટી સર્વોચ્ચ સ્તરે',
        'રોકાણકારોની સંપત્તિમાં ₹૪ લાખ કરોડનો ઉછાળો',
        'બેન્કિંગ અને આઈટી શેરોમાં ભારે લેવાલી',
        'ભારતીય જીડીપી દર ૭.૨% રહેવાનો અંદાજ',
      ],
    },
  },
  editorial: {
    title: 'તંત્રીલેખ: ગુજરાતના આર્થિક અને સામાજિક વિકાસનો નવો સૂર્યોદય',
    subheadline: 'આધુનિક ટેકનોલોજી અને પારદર્શક વહીવટથી રાજ્યનું ભવિષ્ય ઉજ્જવળ બનશે',
    authorName: 'રમેશભાઈ પટેલ',
    authorRole: 'મુખ્ય સંપાદક, ગુજરાત પોસ્ટ',
    editorialText: 'કોઈપણ રાજ્ય કે રાષ્ટ્રના સર્વાંગી વિકાસનો મુખ્ય આધાર તેની દૂરંદેશી આર્થિક નીતિઓ અને પ્રજાની અથાક પરિશ્રમ ક્ષમતા પર રહેલો છે. વર્તમાન સમયમાં ગુજરાત જે તેજ ગતિએ સેમિકન્ડક્ટર, રિન્યુએબલ એનર્જી અને ગ્લોબલ ટ્રેડિંગ હબ તરીકે ઉભરી રહ્યું છે તે સમગ્ર રાષ્ટ્ર માટે એક ગૌરવપૂર્ણ આદર્શ મોડેલ સાબિત થયું છે.\n\nયુવા સાહસિકો માટે ઊભા થયેલા નવા અવસરો અને સ્ટાર્ટઅપ ઇકોસિસ્ટમ આવનારા દાયકામાં રાજ્યને નવી ઊંચાઈએ લઈ જશે. પારદર્શક પ્રશાસન અને નીતિગત સ્થિરતા જ કોઈપણ અર્થતંત્રને વૈશ્વિક કક્ષાએ સ્પર્ધાત્મક બનાવી શકે છે.',
    authorImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
    keyPoints: {
      title: 'તંત્રીના મુખ્ય વિચારો',
      points: [
        'ઔદ્યોગિક સ્થિરતા અને પારદર્શક વહીવટ',
        'યુવા ઉદ્યોગસાહસિકોને પ્રોત્સાહન',
        'ગ્લોબલ ઇન્વેસ્ટમેન્ટ્સમાં ભારત મોખરે',
      ],
    },
  },
  politicsStory: {
    category: 'કેન્દ્રીય કેબિનેટ અને નીતિગત નિર્ણયો',
    headline: 'કેન્દ્રીય કેબિનેટની મહત્વની બેઠક: નવી નિકાસ નીતિ અને MSME પ્રોત્સાહન પેકેજ મંજૂર',
    subheadline: 'લઘુ ઉદ્યોગોને રાહતદરે લોન અને વૈશ્વિક બજારોમાં નિકાસ વધારવા વિશેષ સહાય',
    location: 'નવી દિલ્હી',
    paragraph1: 'નવી દિલ્હી: કેન્દ્રીય મંત્રીમંડળની આજે મળેલી અગત્યની બેઠકમાં દેશના અર્થતંત્રને ગતિ આપવા માટે નવી રાષ્ટ્રીય નિકાસ નીતિ અને MSME સેક્ટર માટે ₹૨૫,૦૦૦ કરોડનું વિશેષ પ્રોત્સાહક પેકેજ મંજૂર કરવામાં આવ્યું છે. લઘુ અને મધ્યમ કદના એકમોને આધુનિક ટેકનોલોજી અપગ્રેડેશન માટે વ્યાજ સબસિડી આપવામાં આવશે.',
    paragraph2: 'વાણિજ્ય મંત્રાલય દ્વારા વૈશ્વિક સપ્લાય ચેઈનમાં ભારતીય ઉત્પાદનોનો હિસ્સો વધારવા સિંગલ વિન્ડો ક્લિયરન્સ વ્યવસ્થા લાગુ કરવામાં આવી છે, જેનાથી વેપારીઓને મોટી રાહત મળશે.',
    articleBody: 'નવી દિલ્હી: કેન્દ્રીય મંત્રીમંડળની આજે મળેલી અગત્યની બેઠકમાં દેશના અર્થતંત્રને ગતિ આપવા માટે નવી રાષ્ટ્રીય નિકાસ નીતિ અને MSME સેક્ટર માટે ₹૨૫,૦૦૦ કરોડનું વિશેષ પ્રોત્સાહક પેકેજ મંજૂર કરવામાં આવ્યું છે.',
    image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    caption: 'કેન્દ્રીય મંત્રીમંડળની બેઠક બાદ પત્રકાર પરિષદ',
    keyPoints: {
      title: 'નીતિગત નિર્ણયોની વિગત',
      points: [
        'MSME માટે ₹૨૫,૦૦૦ કરોડનું પેકેજ',
        'નિકાસકારો માટે સિંગલ વિન્ડો સિસ્ટમ',
        'લોકલથી ગ્લોબલ સપ્લાય ચેઈન મજબૂત',
      ],
    },
  },
  techStory: {
    category: 'ટેકનોલોજી & સેમિકન્ડક્ટર મિશન',
    headline: 'ગુજરાત સેમિકન્ડક્ટર અને ઇલેક્ટ્રોનિક્સ હબ બનવા સજ્જ: ₹૫૦,૦૦૦ કરોડના રોકાણ',
    subheadline: 'સાણંદ અને ધોલેરામાં ગ્લોબલ કંપનીઓના નવા પ્લાન્ટ્સથી હજારો હાઈ-ટેક રોજગારી',
    location: 'ગાંધીનગર',
    paragraph1: 'ગાંધીનગર: રાજ્યમાં સેમિકન્ડક્ટર અને માઇક્રોચિપ ઉત્પાદન ક્ષેત્રે ક્રાંતિ સર્જવા માટે વિશ્વની અગ્રણી ટેક કંપનીઓ દ્વારા સાણંદ અને ધોલેરા સ્પેશિયલ ઇન્વેસ્ટમેન્ટ રિજનમાં ₹૫૦,૦૦૦ કરોડથી વધુના નવા સેમિકન્ડક્ટર ફેબ પ્લાન્ટ્સ સ્થાપવાની કાર્યવાહી પૂરજોશમાં આગળ વધી રહી છે.',
    paragraph2: 'આ પ્રોજેક્ટ્સથી ભારત ચિપ ઉત્પાદનમાં સ્વનિર્ભર બનશે અને ગુજરાત વૈશ્વિક ઇલેક્ટ્રોનિક્સ મેન્યુફેક્ચરિંગ નકશા પર મોખરે પહોંચશે.',
    articleBody: 'ગાંધીનગર: રાજ્યમાં સેમિકન્ડક્ટર અને માઇક્રોચિપ ઉત્પાદન ક્ષેત્રે ક્રાંતિ સર્જવા માટે વિશ્વની અગ્રણી ટેક કંપનીઓ દ્વારા સાણંદ અને ધોલેરા સ્પેશિયલ ઇન્વેસ્ટમેન્ટ રિજનમાં ₹૫૦,૦૦૦ કરોડથી વધુના નવા સેમિકન્ડક્ટર ફેબ પ્લાન્ટ્સ સ્થાપવાની કાર્યવાહી પૂરજોશમાં આગળ વધી રહી છે.',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    caption: 'સાણંદ ખાતે નિર્માણાધીન અત્યાધુનિક ચિપ પ્લાન્ટ',
    keyPoints: {
      title: 'સેમિકન્ડક્ટર મિશન હાઈલાઈટ્સ',
      points: [
        'સાણંદ-ધોલેરામાં મેગા ચિપ પ્લાન્ટ્સ',
        '₹૫૦,૦૦૦ કરોડથી વધુનું વૈશ્વિક રોકાણ',
      ],
    },
  },
  bankingStory: {
    category: 'બેન્કિંગ & મ્યુચ્યુઅલ ફંડ્સ',
    headline: 'રિઝર્વ બેંકના નવા નિયમો: હોમ લોન અને ફિક્સ ડિપોઝિટના વ્યાજદરમાં સ્થિરતા',
    subheadline: 'સામાન્ય રોકાણકારો માટે મ્યુચ્યુઅલ ફંડ SIP અને ગોલ્ડ ઇટીએફમાં રોકાણની શ્રેષ્ઠ તક',
    location: 'અમદાવાદ',
    paragraph1: 'અમદાવાદ: ભારતીય રિઝર્વ બેંક (RBI) દ્વારા આજે જાહેર કરાયેલી નાણાકીય નીતિ સમીક્ષામાં રેપો રેટ યથાવત રાખવામાં આવ્યો છે. જેના પરિણામે સામાન્ય નાગરિકો માટે હોમ લોન, ઓટો લોન અને વ્યક્તિગત લોનના વ્યાજદરોમાં સ્થિરતા જળવાઈ રહેશે.',
    paragraph2: 'નાણાકીય નિષ્ણાતોના મતે વર્તમાન બજાર સ્થિતિમાં લાંબા ગાળાના સંપત્તિ સર્જન માટે સિસ્ટેમેટિક ઇન્વેસ્ટમેન્ટ પ્લાન (SIP) સૌથી સુરક્ષિત અને ફાયદાકારક વિકલ્પ સાબિત થઈ રહ્યો છે.',
    articleBody: 'અમદાવાદ: ભારતીય રિઝર્વ બેંક (RBI) દ્વારા આજે જાહેર કરાયેલી નાણાકીય નીતિ સમીક્ષામાં રેપો રેટ યથાવત રાખવામાં આવ્યો છે.',
    image: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80',
    caption: 'બેન્કિંગ ક્ષેત્રમાં સ્થિર વ્યાજદરથી ગ્રાહકોમાં રાહત',
    keyPoints: {
      title: 'સ્માર્ટ રોકાણ ટિપ્સ',
      points: [
        'હોમ લોનના EMI માં સ્થિરતા',
        'SIP અને ગોલ્ડ ઇટીએફમાં ઉત્તમ વળતર',
      ],
    },
  },
  startupStory: {
    category: 'સ્ટાર્ટઅપ & સાહસિકતા',
    headline: 'ગુજરાતના ૧૫ ગ્રીન-ટેક સ્ટાર્ટઅપ્સને વૈશ્વિક વેન્ચર ફંડ્સ તરફથી ₹૧૨૦ કરોડનું ફંડિંગ',
    subheadline: 'અમદાવાદ અને સુરતના યુવા સંશોધકો દ્વારા વિકસિત ક્લીન એનર્જી સોલ્યુશન્સ વૈશ્વિક સ્તરે ચમક્યા',
    location: 'અમદાવાદ',
    paragraph1: 'અમદાવાદ: ગુજરાત ટેકનોલોજીકલ યુનિવર્સિટી (GTU) અને આઈ-ક્રિએટ ઇન્ક્યુબેટર હેઠળ કાર્યરત રાજ્યના ૧૫ અગ્રણી ગ્રીન-ટેક અને ઇ-વ્હીકલ સ્ટાર્ટઅપ્સને આંતરરાષ્ટ્રીય રોકાણકારો તરફથી કુલ ₹૧૨૦ કરોડનું પ્રારંભિક સીડ ફંડિંગ પ્રાપ્ત થયું છે. આ સ્ટાર્ટઅપ્સ સોલાર સ્ટોરેજ, સ્માર્ટ બેટરી મેનેજમેન્ટ અને એગ્રી-વેસ્ટ રિસાયક્લિંગ ક્ષેત્રે નવીન ઉત્પાદનો બજારમાં મુકશે.',
    paragraph2: 'સ્ટાર્ટઅપ સંચાલકોએ જણાવ્યું કે આગામી બે વર્ષમાં ૨,૫૦૦ નવી ટેકનિકલ રોજગારીનું સર્જન થશે.',
    articleBody: 'અમદાવાદ: ગુજરાત ટેકનોલોજીકલ યુનિવર્સિટી (GTU) અને આઈ-ક્રિએટ ઇન્ક્યુબેટર હેઠળ કાર્યરત રાજ્યના ૧૫ અગ્રણી ગ્રીન-ટેક અને ઇ-વ્હીકલ સ્ટાર્ટઅપ્સને આંતરરાષ્ટ્રીય રોકાણકારો તરફથી કુલ ₹૧૨૦ કરોડનું પ્રારંભિક સીડ ફંડિંગ પ્રાપ્ત થયું છે.',
    image: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=600&q=80',
    caption: 'યુવા સાહસિકો દ્વારા ગ્રીન એનર્જી પ્રોજેક્ટનું પ્રેઝન્ટેશન',
  },
  commodityStory: {
    category: 'કોમોડિટી & કૃષિ માર્કેટ',
    headline: 'જીરૂ અને કપાસમાં તેજી: રાજકોટ અને ઊંઝા માર્કેટ યાર્ડમાં નવી આવકો સાથે રેકોર્ડ ભાવો',
    subheadline: 'સોના-ચાંદીમાં સુધારો, જ્યારે એરંડા અને સિંગતેલના ભાવ સામાન્ય નરમ રહ્યા',
    location: 'ઊંઝા',
    paragraph1: 'ઊંઝા: ઉત્તર ગુજરાતના એશિયાના સૌથી મોટા મસાલા માર્કેટ ઊંઝા ગંજ બજારમાં આજે જીરૂની આવકોમાં ઉછાળો જોવા મળ્યો હતો. નિકાસકારોની મજબૂત માંગના પગલે જીરૂના ક્વિન્ટલ દીઠ ભાવોમાં ₹૪૫૦નો સુધારો નોંધાયો હતો. આ તરફ સૌરાષ્ટ્રના રાજકોટ અને ગોંડલ માર્કેટ યાર્ડમાં સારા કપાસની ગાંસડીઓમાં પણ મિલોની સક્રિય લેવાલી જોવા મળી હતી.',
    paragraph2: 'વેપારીઓના મતે આગામી તહેવારોની સિઝનમાં ખાદ્યતેલ અને કઠોળના ભાવો સ્થિર રહેવાની સંભાવના છે.',
    articleBody: 'ઊંઝા: ઉત્તર ગુજરાતના એશિયાના સૌથી મોટા મસાલા માર્કેટ ઊંઝા ગંજ બજારમાં આજે જીરૂની આવકોમાં ઉછાળો જોવા મળ્યો હતો.',
    image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=600&q=80',
    caption: 'ઊંઝા માર્કેટ યાર્ડમાં કૃષિ પેદાશોની પુષ્કળ આવક',
  },
  corporateBriefs: [
    {
      id: 'brief_1',
      category: 'ઓટોમોબાઇલ',
      headline: 'ટાટા મોટર્સે સાણંદ પ્લાન્ટમાંથી ૧ લાખમી નેક્સન ઈવી રોલઆઉટ કરી',
      location: 'સાણંદ',
      articleBody: 'સાણંદ: ટાટા મોટર્સે તેના અત્યાધુનિક સાણંદ ઉત્પાદન એકમમાંથી આજે ૧ લાખમી ઇલેક્ટ્રિક કારનું ઉત્પાદન પૂર્ણ કરી નવો ઐતિહાસિક સીમાચિહ્ન સ્થાપિત કર્યો છે. કંપનીએ ગ્રીન મોબિલિટીમાં દેશભરમાં ૭૦% બજાર હિસ્સો જાળવી રાખ્યો છે.',
    },
    {
      id: 'brief_2',
      category: 'ગ્રીન એનર્જી',
      headline: 'રિલાયન્સ ગ્રીન એનર્જી ગીગા કોમ્પ્લેક્સનું જામનગરમાં પ્રથમ ચરણ સંપન્ન',
      location: 'જામનગર',
      articleBody: 'જામનગર: રિલાયન્સ ઇન્ડસ્ટ્રીઝ દ્વારા જામનગર ખાતે સ્થાપિત કરવામાં આવી રહેલા ૫,૦૦૦ એકરના વિશાળ ધીરુભાઈ અંબાણી ગ્રીન એનર્જી ગીગા કોમ્પ્લેક્સમાં સોલાર સેલ ઉત્પાદનનું પ્રથમ ચરણ સફળતાપૂર્વક સંપન્ન થયું છે.',
    },
    {
      id: 'brief_3',
      category: 'પોર્ટ્સ & લોજિસ્ટિક્સ',
      headline: 'અદાણી પોર્ટ્સે મુન્દ્રા પોર્ટ ખાતે ૧૦ મિલિયન ટન કાર્ગો હેન્ડલિંગનો રેકોર્ડ બનાવ્યો',
      location: 'મુન્દ્રા',
      articleBody: 'મુન્દ્રા: દેશના સૌથી મોટા ખાનગી કોમર્શિયલ પોર્ટ મુન્દ્રા પોર્ટે ચાલુ નાણાકીય વર્ષમાં ૧૦ મિલિયન મેટ્રિક ટન કાર્ગો સૌથી ઓછા સમયગાળામાં હેન્ડલ કરવાનો રાષ્ટ્રીય રેકોર્ડ નોંધાવ્યો છે.',
    },
  ],
  marketRates: {
    gold24k: '₹ ૭૪,૫૦૦',
    gold22k: '₹ ૬૮,૩૦૦',
    silver1kg: '₹ ૮૮,૨૦૦',
    sensex: '૮૨,૩૫૦ (+૪૫૦)',
    nifty: '૨૫,૨૪૦ (+૧૩૫)',
  },
  advertisement: {
    id: 'p3_ad',
    title: 'બિઝનેસ પાર્ટનર જાહેરાત સ્લોટ',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    link: 'https://gujaratpost.com',
  },
};

export const Page3Business: React.FC<Page3BusinessProps> = ({
  data: inputData,
  onChange,
  selectedPath,
  onSelectSlot,
  readOnly,
}) => {
  const contextReadOnly = useEpaperReadOnly();
  const isReadOnly = Boolean(readOnly ?? contextReadOnly);

  // Normalize data with robust fallbacks
  const data = React.useMemo(() => {
    const raw: any = inputData || {};
    const bStory: any = raw.businessStory || {};
    const pStory: any = raw.politicsStory || {};
    const tStory: any = raw.techStory || {};
    const bkStory: any = raw.bankingStory || {};
    const sStory: any = raw.startupStory || {};
    const cStory: any = raw.commodityStory || {};
    const briefs: any[] = Array.isArray(raw.corporateBriefs) && raw.corporateBriefs.length > 0
      ? raw.corporateBriefs
      : fallbackPage3.corporateBriefs;
    const edit: any = raw.editorial || {};
    const mRates: any = raw.marketRates || {};
    const ad: any = raw.advertisement || {};

    return {
      sectionTitle: raw.sectionTitle || fallbackPage3.sectionTitle,
      topBarTagline: raw.topBarTagline || fallbackPage3.topBarTagline,
      businessStory: {
        category: bStory.category || fallbackPage3.businessStory.category,
        headline: bStory.headline || fallbackPage3.businessStory.headline,
        subheadline: bStory.subheadline || fallbackPage3.businessStory.subheadline,
        location: bStory.location || fallbackPage3.businessStory.location,
        paragraph1: bStory.paragraph1 || bStory.articleBody || fallbackPage3.businessStory.paragraph1,
        paragraph2: bStory.paragraph2 || fallbackPage3.businessStory.paragraph2,
        paragraph3: bStory.paragraph3 || fallbackPage3.businessStory.paragraph3,
        body: bStory.body || bStory.articleBody || fallbackPage3.businessStory.articleBody,
        image: bStory.image || fallbackPage3.businessStory.image,
        caption: bStory.caption || bStory.imageCaption || fallbackPage3.businessStory.caption,
        keyPoints: bStory.keyPoints || fallbackPage3.businessStory.keyPoints,
      },
      editorial: {
        title: edit.title || fallbackPage3.editorial.title,
        subheadline: edit.subheadline || fallbackPage3.editorial.subheadline,
        authorName: edit.authorName || fallbackPage3.editorial.authorName,
        authorRole: edit.authorRole || fallbackPage3.editorial.authorRole,
        editorialText: edit.editorialText || fallbackPage3.editorial.editorialText,
        authorImage: edit.authorImage || fallbackPage3.editorial.authorImage,
        keyPoints: edit.keyPoints || fallbackPage3.editorial.keyPoints,
      },
      politicsStory: {
        category: pStory.category || fallbackPage3.politicsStory.category,
        headline: pStory.headline || fallbackPage3.politicsStory.headline,
        subheadline: pStory.subheadline || fallbackPage3.politicsStory.subheadline,
        location: pStory.location || fallbackPage3.politicsStory.location,
        paragraph1: pStory.paragraph1 || pStory.articleBody || fallbackPage3.politicsStory.paragraph1,
        paragraph2: pStory.paragraph2 || fallbackPage3.politicsStory.paragraph2,
        body: pStory.body || pStory.articleBody || fallbackPage3.politicsStory.articleBody,
        image: pStory.image || fallbackPage3.politicsStory.image,
        caption: pStory.caption || pStory.imageCaption || fallbackPage3.politicsStory.caption,
        keyPoints: pStory.keyPoints || fallbackPage3.politicsStory.keyPoints,
      },
      techStory: {
        category: tStory.category || fallbackPage3.techStory.category,
        headline: tStory.headline || fallbackPage3.techStory.headline,
        subheadline: tStory.subheadline || fallbackPage3.techStory.subheadline,
        location: tStory.location || fallbackPage3.techStory.location,
        paragraph1: tStory.paragraph1 || tStory.articleBody || fallbackPage3.techStory.paragraph1,
        paragraph2: tStory.paragraph2 || fallbackPage3.techStory.paragraph2,
        body: tStory.body || tStory.articleBody || fallbackPage3.techStory.articleBody,
        image: tStory.image || fallbackPage3.techStory.image,
        caption: tStory.caption || tStory.imageCaption || fallbackPage3.techStory.caption,
        keyPoints: tStory.keyPoints
          ? {
              ...tStory.keyPoints,
              points: (tStory.keyPoints.points || fallbackPage3.techStory.keyPoints.points).slice(0, 2),
            }
          : fallbackPage3.techStory.keyPoints,
      },
      bankingStory: {
        category: bkStory.category || fallbackPage3.bankingStory.category,
        headline: bkStory.headline || fallbackPage3.bankingStory.headline,
        subheadline: bkStory.subheadline || fallbackPage3.bankingStory.subheadline,
        location: bkStory.location || fallbackPage3.bankingStory.location,
        paragraph1: bkStory.paragraph1 || bkStory.articleBody || fallbackPage3.bankingStory.paragraph1,
        paragraph2: bkStory.paragraph2 || fallbackPage3.bankingStory.paragraph2,
        body: bkStory.body || bkStory.articleBody || fallbackPage3.bankingStory.articleBody,
        image: bkStory.image || fallbackPage3.bankingStory.image,
        caption: bkStory.caption || bkStory.imageCaption || fallbackPage3.bankingStory.caption,
        keyPoints: bkStory.keyPoints
          ? {
              ...bkStory.keyPoints,
              points: (bkStory.keyPoints.points || fallbackPage3.bankingStory.keyPoints.points).slice(0, 2),
            }
          : fallbackPage3.bankingStory.keyPoints,
      },
      startupStory: {
        category: sStory.category || fallbackPage3.startupStory.category,
        headline: sStory.headline || fallbackPage3.startupStory.headline,
        subheadline: sStory.subheadline || fallbackPage3.startupStory.subheadline,
        location: sStory.location || fallbackPage3.startupStory.location,
        paragraph1: sStory.paragraph1 || sStory.articleBody || fallbackPage3.startupStory.paragraph1,
        paragraph2: sStory.paragraph2 || fallbackPage3.startupStory.paragraph2,
        body: sStory.body || sStory.articleBody || fallbackPage3.startupStory.articleBody,
        image: sStory.image || fallbackPage3.startupStory.image,
        caption: sStory.caption || sStory.imageCaption || fallbackPage3.startupStory.caption,
        keyPoints: sStory.keyPoints || null,
      },
      commodityStory: {
        category: cStory.category || fallbackPage3.commodityStory.category,
        headline: cStory.headline || fallbackPage3.commodityStory.headline,
        subheadline: cStory.subheadline || fallbackPage3.commodityStory.subheadline,
        location: cStory.location || fallbackPage3.commodityStory.location,
        paragraph1: cStory.paragraph1 || cStory.articleBody || fallbackPage3.commodityStory.paragraph1,
        paragraph2: cStory.paragraph2 || fallbackPage3.commodityStory.paragraph2,
        body: cStory.body || cStory.articleBody || fallbackPage3.commodityStory.articleBody,
        image: cStory.image || fallbackPage3.commodityStory.image,
        caption: cStory.caption || cStory.imageCaption || fallbackPage3.commodityStory.caption,
        keyPoints: cStory.keyPoints || null,
      },
      corporateBriefs: briefs.map((b: any, idx: number) => ({
        id: b.id || `brief_${idx + 1}`,
        category: b.category || fallbackPage3.corporateBriefs[idx]?.category || 'કોર્પોરેટ',
        headline: b.headline || fallbackPage3.corporateBriefs[idx]?.headline || '',
        location: b.location || fallbackPage3.corporateBriefs[idx]?.location || '',
        articleBody: b.articleBody || fallbackPage3.corporateBriefs[idx]?.articleBody || '',
      })),
      marketRates: {
        gold24k: mRates.gold24k || fallbackPage3.marketRates.gold24k,
        gold22k: mRates.gold22k || fallbackPage3.marketRates.gold22k,
        silver1kg: mRates.silver1kg || fallbackPage3.marketRates.silver1kg,
        sensex: mRates.sensex || fallbackPage3.marketRates.sensex,
        nifty: mRates.nifty || fallbackPage3.marketRates.nifty,
      },
      advertisement: {
        id: ad.id || fallbackPage3.advertisement.id,
        title: ad.title || fallbackPage3.advertisement.title,
        image: ad.image || fallbackPage3.advertisement.image,
        link: ad.link || fallbackPage3.advertisement.link,
      },
    };
  }, [inputData]);

  const updateField = (path: string, value: any) => {
    const clone = JSON.parse(JSON.stringify(data));
    const keys = path.split('.');
    let current = clone;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    // Cross sync paragraphs into articleBody
    if (path.includes('paragraph1') || path.includes('paragraph2') || path.includes('paragraph3')) {
      const rootPath = path.substring(0, path.lastIndexOf('.'));
      let target = clone;
      const rootKeys = rootPath.split('.');
      for (const k of rootKeys) {
        if (!target[k]) target[k] = {};
        target = target[k];
      }
      const p1 = target.paragraph1 || '';
      const p2 = target.paragraph2 || '';
      const p3 = target.paragraph3 || '';
      const combined = [p1, p2, p3].filter(Boolean).join('\n\n');
      target.articleBody = combined;
      target.body = combined;
    }

    onChange(clone);
  };

  // Reusable KeyPointsBox matching the Gujarati broadsheet styling
  const KeyPointsBox = ({
    basePath,
    title,
    points,
    titleClassName = 'text-[11px]',
    pointClassName = 'text-[10px]',
  }: {
    basePath: string;
    title: string;
    points: string[];
    titleClassName?: string;
    pointClassName?: string;
  }) => {
    const isTwoPointBox = basePath === 'techStory' || basePath === 'bankingStory';
    const displayPoints = isTwoPointBox ? points.slice(0, 2) : points;

    return (
      <div className="bg-white border-2 border-red-700/80 p-1.5 shadow-sm my-1">
        <div className="bg-red-700 text-white font-sans font-black text-center py-0.5 px-1 mb-1 tracking-wider uppercase">
          <EditableTextSlot
            value={title}
            onChange={(val) => updateField(`${basePath}.keyPoints.title`, val)}
            isSelected={selectedPath === `${basePath}.keyPoints.title`}
            onSelect={() => onSelectSlot?.(`${basePath}.keyPoints.title`, 'મુદ્દા શીર્ષક')}
            className={`${titleClassName} font-bold text-white text-center block`}
          />
        </div>
        <ul className="space-y-0.5 px-1">
          {displayPoints.map((pt, pIdx) => (
            <li key={pIdx} className="flex items-start gap-1 font-serif text-slate-900 leading-tight">
              <span className="w-1.5 h-1.5 bg-red-700 rounded-full mt-1 shrink-0" />
              <EditableTextSlot
                value={pt}
                onChange={(val) => {
                  const newPts = [...displayPoints];
                  newPts[pIdx] = val;
                  updateField(`${basePath}.keyPoints.points`, isTwoPointBox ? newPts.slice(0, 2) : newPts);
                }}
                isSelected={selectedPath === `${basePath}.keyPoints.points.${pIdx}`}
                onSelect={() => onSelectSlot?.(`${basePath}.keyPoints.points.${pIdx}`, `મુદ્દો ${pIdx + 1}`)}
                className={`${pointClassName} font-semibold`}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <EpaperReadOnlyProvider value={isReadOnly}>
      <div className="w-[1224px] h-[1815px] max-h-[1815px] max-w-[1224px] bg-[#fffefb] text-slate-950 shadow-2xl border border-slate-400/80 p-7 flex flex-col justify-between font-serif select-none box-border overflow-hidden relative shrink-0">

        {/* ─── 1. TOP SECTION HEADER BAR (EXACT SAME AS PAGE 2) ─── */}
        <div className="shrink-0 mb-1.5">
          <div className="border-b-4 border-double border-slate-900 pb-1.5 flex justify-between items-center font-sans text-sm">
            <div className="flex items-center gap-2">
              <span className="font-black text-red-800 tracking-wider">
                <EditableTextSlot
                  value={data.topBarTagline}
                  onChange={(val) => updateField('topBarTagline', val)}
                  isSelected={selectedPath === 'topBarTagline'}
                  onSelect={() => onSelectSlot?.('topBarTagline', 'ટોપ ટેગલાઇન')}
                />
              </span>
            </div>
            <EditableTextSlot
              value={data.sectionTitle}
              onChange={(val) => updateField('sectionTitle', val)}
              isSelected={selectedPath === 'sectionTitle'}
              onSelect={() => onSelectSlot?.('sectionTitle', 'વિભાગ શીર્ષક')}
              className="text-lg font-black tracking-widest text-slate-950 uppercase font-serif"
            />
            <div className="flex items-center gap-3 font-semibold text-slate-700">
              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 border border-slate-300">
                પૃષ્ઠ ૩ (PAGE 3)
              </span>
            </div>
          </div>
        </div>

        {/* ─── 2. FINANCIAL MARKET RATES TICKER RIBBON ─── */}
        <div className="bg-amber-50/70 border-y border-amber-900/30 py-1 px-3 mb-2 flex items-center justify-between font-sans text-xs shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-red-700 text-white text-[10.5px] font-bold px-2 py-0.5 rounded-xs tracking-wider uppercase">
              <span>લાઇવ બજાર ભાવો</span>
            </div>

            {/* Gold 24K */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600">સોનું (૨૪K):</span>
              <span className="text-amber-800 font-black">
                <EditableTextSlot
                  value={data.marketRates.gold24k}
                  onChange={(val) => updateField('marketRates.gold24k', val)}
                  isSelected={selectedPath === 'marketRates.gold24k'}
                  onSelect={() => onSelectSlot?.('marketRates.gold24k', 'સોનું ૨૪K')}
                />
              </span>
              <span className="text-emerald-600 text-[10px]">▲</span>
            </div>

            <span className="text-slate-300">|</span>

            {/* Gold 22K */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600">સોનું (૨૨K):</span>
              <span className="text-amber-800 font-black">
                <EditableTextSlot
                  value={data.marketRates.gold22k}
                  onChange={(val) => updateField('marketRates.gold22k', val)}
                  isSelected={selectedPath === 'marketRates.gold22k'}
                  onSelect={() => onSelectSlot?.('marketRates.gold22k', 'સોનું ૨૨K')}
                />
              </span>
              <span className="text-emerald-600 text-[10px]">▲</span>
            </div>

            <span className="text-slate-300">|</span>

            {/* Silver */}
            <div className="flex items-center gap-1">
              <span className="text-slate-600">ચાંદી (૧KG):</span>
              <span className="text-slate-900 font-black">
                <EditableTextSlot
                  value={data.marketRates.silver1kg}
                  onChange={(val) => updateField('marketRates.silver1kg', val)}
                  isSelected={selectedPath === 'marketRates.silver1kg'}
                  onSelect={() => onSelectSlot?.('marketRates.silver1kg', 'ચાંદી ૧KG')}
                />
              </span>
              <span className="text-emerald-600 text-[10px]">▲</span>
            </div>

            <span className="text-slate-300">|</span>

            {/* BSE SENSEX */}
            <div className="flex items-center gap-1">
              <span className="text-blue-900 font-black">SENSEX:</span>
              <span className="text-emerald-700 font-black">
                <EditableTextSlot
                  value={data.marketRates.sensex}
                  onChange={(val) => updateField('marketRates.sensex', val)}
                  isSelected={selectedPath === 'marketRates.sensex'}
                  onSelect={() => onSelectSlot?.('marketRates.sensex', 'સેન્સેક્સ')}
                />
              </span>
            </div>

            <span className="text-slate-300">|</span>

            {/* NSE NIFTY */}
            <div className="flex items-center gap-1">
              <span className="text-blue-900 font-black">NIFTY:</span>
              <span className="text-emerald-700 font-black">
                <EditableTextSlot
                  value={data.marketRates.nifty}
                  onChange={(val) => updateField('marketRates.nifty', val)}
                  isSelected={selectedPath === 'marketRates.nifty'}
                  onSelect={() => onSelectSlot?.('marketRates.nifty', 'નિફ્ટી')}
                />
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-medium">
            <span>અમદાવાદ / મુંબઈ માર્કેટ્સ</span>
          </div>
        </div>

        {/* ─── 3. ROW 1: MEGA BUSINESS LEAD (8 Cols) + DISTINGUISHED EDITORIAL COLUMN (4 Cols) ─── */}
        <div className="grid grid-cols-12 gap-0 h-[525px] mb-2 shrink-0 border-b border-slate-300 pb-2 overflow-hidden">
          {/* Left: Mega Business Lead Story (col-span-8) */}
          <div className="col-span-8 pr-4 border-r border-slate-300 flex flex-col justify-between">
            <div className="h-full flex flex-col">
              {/* Category Eyebrow */}
              <div className="flex justify-center items-center mb-0.5">
                <EditableTextSlot
                  value={data.businessStory.category}
                  onChange={(val) => updateField('businessStory.category', val)}
                  isSelected={selectedPath === 'businessStory.category'}
                  onSelect={() => onSelectSlot?.('businessStory.category', 'બિઝનેસ કેટેગરી')}
                  className="text-red-700 font-bold text-[16px] font-sans tracking-wide mx-auto"
                />
              </div>

              {/* Major Financial Headline */}
              <EditableTextSlot
                tagName="h2"
                value={data.businessStory.headline}
                onChange={(val) => updateField('businessStory.headline', val)}
                isSelected={selectedPath === 'businessStory.headline'}
                onSelect={() => onSelectSlot?.('businessStory.headline', 'બિઝનેસ હેડલાઇન')}
                className="text-[34px] font-black text-slate-950 leading-[1.12] font-serif text-center mb-1.5 tracking-tight"
                maxLength={140}
              />

              {/* Grey Subheadline Banner */}
              <div className="bg-[#e2e8f0] border border-slate-300/70 py-1 px-3 rounded-xs mb-2 text-center">
                <EditableTextSlot
                  value={data.businessStory.subheadline || ''}
                  onChange={(val) => updateField('businessStory.subheadline', val)}
                  isSelected={selectedPath === 'businessStory.subheadline'}
                  onSelect={() => onSelectSlot?.('businessStory.subheadline', 'સબહેડલાઇન')}
                  className="text-[15px] font-bold text-slate-900 leading-snug font-sans"
                  maxLength={150}
                />
              </div>

              {/* 2-Column Lead Layout: Text on left + Wide image with KeyPoints + 2 under paragraphs */}
              <div className="grid grid-cols-12 gap-3 items-start flex-1 overflow-hidden">
                {/* Left: Paragraph 1 with Dateline */}
                <div className="col-span-4 text-[11.5px] leading-[1.44] text-slate-800 font-serif text-justify overflow-hidden">
                  {data.businessStory.location && (
                    <span className="font-black text-red-700 shrink-0">
                      {data.businessStory.location} |&nbsp;
                    </span>
                  )}
                  <EditableTextSlot
                    value={data.businessStory.paragraph1}
                    onChange={(val) => updateField('businessStory.paragraph1', val)}
                    isSelected={selectedPath === 'businessStory.paragraph1' || selectedPath === 'businessStory.articleBody'}
                    onSelect={() => onSelectSlot?.('businessStory.paragraph1', 'બિઝનેસ પેરાગ્રાફ ૧')}
                    multiline
                  />
                </div>

                {/* Right: Stock Market Photo + Overlaid Key Points Box + Under-image 2 paragraphs */}
                <div className="col-span-8 flex flex-col relative h-full overflow-hidden">
                  <EditableImageSlot
                    src={data.businessStory.image || ''}
                    onImageChange={(img) => updateField('businessStory.image', img)}
                    isSelected={selectedPath === 'businessStory.image'}
                    onSelect={() => onSelectSlot?.('businessStory.image', 'બિઝનેસ ઈમેજ')}
                    containerHeight="200px"
                    alt="Business Story Image"
                    actionsClassName={data.businessStory.keyPoints ? 'w-[52%]' : undefined}
                  />
                  {data.businessStory.caption && (
                    <EditableTextSlot
                      value={data.businessStory.caption}
                      onChange={(val) => updateField('businessStory.caption', val)}
                      isSelected={selectedPath === 'businessStory.caption'}
                      onSelect={() => onSelectSlot?.('businessStory.caption', 'ઈમેજ કૅપ્શન')}
                      className="text-[10.5px] text-slate-600 italic mt-0.5 font-sans text-center"
                    />
                  )}
                  {data.businessStory.keyPoints && (
                    <div className="absolute top-0 right-0 w-[47%]">
                      <KeyPointsBox
                        basePath="businessStory"
                        title={data.businessStory.keyPoints.title}
                        points={data.businessStory.keyPoints.points}
                      />
                    </div>
                  )}

                  {/* Under-image 2 paragraphs side by side */}
                  <div className="mt-1.5 pt-1.5 border-t border-slate-300 flex-1 overflow-hidden grid grid-cols-2 gap-3">
                    <div className="text-[11px] leading-[1.4] text-slate-800 font-serif text-justify overflow-hidden">
                      <EditableTextSlot
                        value={data.businessStory.paragraph2}
                        onChange={(val) => updateField('businessStory.paragraph2', val)}
                        isSelected={selectedPath === 'businessStory.paragraph2'}
                        onSelect={() => onSelectSlot?.('businessStory.paragraph2', 'બિઝનેસ પેરાગ્રાફ ૨')}
                        multiline
                      />
                    </div>
                    <div className="text-[11px] leading-[1.4] text-slate-800 font-serif text-justify overflow-hidden">
                      <EditableTextSlot
                        value={data.businessStory.paragraph3}
                        onChange={(val) => updateField('businessStory.paragraph3', val)}
                        isSelected={selectedPath === 'businessStory.paragraph3'}
                        onSelect={() => onSelectSlot?.('businessStory.paragraph3', 'બિઝનેસ પેરાગ્રાફ ૩')}
                        multiline
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Distinguished Framed Chief Editor Column (col-span-4) */}
          <div className="col-span-4 pl-4 flex flex-col justify-between bg-amber-50/20 p-2 border border-amber-900/20 shadow-xs h-full overflow-hidden">
            <div className="h-full flex flex-col justify-between">
              {/* Top Banner */}
              <div className="border-b-2 border-slate-900 pb-1 mb-1 text-center shrink-0">
                <span className="text-xs font-black uppercase tracking-widest text-slate-950 font-sans block">
                  — તંત્રીલેખ અને વિશેષ વિશ્લેષણ —
                </span>
              </div>

              {/* Author Info Bar */}
              <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-300 shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-800 shrink-0">
                  <EditableImageSlot
                    src={data.editorial.authorImage || ''}
                    onImageChange={(img) => updateField('editorial.authorImage', img)}
                    isSelected={selectedPath === 'editorial.authorImage'}
                    onSelect={() => onSelectSlot?.('editorial.authorImage', 'તંત્રી ફોટો')}
                    containerHeight="40px"
                    alt="Author"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <EditableTextSlot
                    value={data.editorial.authorName}
                    onChange={(val) => updateField('editorial.authorName', val)}
                    isSelected={selectedPath === 'editorial.authorName'}
                    onSelect={() => onSelectSlot?.('editorial.authorName', 'તંત્રી નામ')}
                    className="font-bold text-[13px] text-slate-900 font-serif block leading-tight"
                  />
                  <EditableTextSlot
                    value={data.editorial.authorRole}
                    onChange={(val) => updateField('editorial.authorRole', val)}
                    isSelected={selectedPath === 'editorial.authorRole'}
                    onSelect={() => onSelectSlot?.('editorial.authorRole', 'તંત્રી પદ')}
                    className="text-[10px] text-red-800 font-sans font-semibold block"
                  />
                </div>
              </div>

              {/* Editorial Title */}
              <EditableTextSlot
                tagName="h3"
                value={data.editorial.title}
                onChange={(val) => updateField('editorial.title', val)}
                isSelected={selectedPath === 'editorial.title'}
                onSelect={() => onSelectSlot?.('editorial.title', 'તંત્રીલેખ શીર્ષક')}
                className="text-[17px] font-black text-slate-950 leading-tight font-serif mb-1"
                maxLength={90}
              />

              {/* Subheadline */}
              <EditableTextSlot
                value={data.editorial.subheadline || ''}
                onChange={(val) => updateField('editorial.subheadline', val)}
                isSelected={selectedPath === 'editorial.subheadline'}
                onSelect={() => onSelectSlot?.('editorial.subheadline', 'તંત્રી સબહેડલાઇન')}
                className="text-[11px] font-bold text-slate-700 font-sans leading-snug mb-1"
                maxLength={100}
              />

              {/* Editorial Full Text */}
              <div className="text-[10.5px] leading-[1.38] text-slate-800 font-serif text-justify flex-1 overflow-hidden pr-0.5 border-t border-slate-200 pt-1">
                <EditableTextSlot
                  value={data.editorial.editorialText}
                  onChange={(val) => updateField('editorial.editorialText', val)}
                  isSelected={selectedPath === 'editorial.editorialText' || selectedPath === 'editorial.articleBody'}
                  onSelect={() => onSelectSlot?.('editorial.editorialText', 'તંત્રીલેખ વિગત')}
                  multiline
                />
              </div>

              {/* Key Insights Box */}
              {data.editorial.keyPoints && (
                <div className="mt-1 shrink-0">
                  <KeyPointsBox
                    basePath="editorial"
                    title={data.editorial.keyPoints.title}
                    points={data.editorial.keyPoints.points}
                    titleClassName="text-[10px]"
                    pointClassName="text-[9.5px]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── 4. ROW 2: NATIONAL ECONOMIC POLICY (6 Cols) + SEMICONDUCTOR TECH (6 Cols) ─── */}
        <div className="grid grid-cols-12 divide-x divide-slate-300 gap-0 mb-2 h-[310px] shrink-0 border-b border-slate-300 pb-2 overflow-hidden">
          {/* Left Feature: National Economic Policy & MSME (col-span-6) */}
          <div className="col-span-6 pr-4 flex flex-col justify-between overflow-hidden h-full">
            <div className="h-full flex flex-col overflow-hidden">
              <div className="flex justify-between items-start mb-0.5">
                <EditableTextSlot
                  value={data.politicsStory.category}
                  onChange={(val) => updateField('politicsStory.category', val)}
                  isSelected={selectedPath === 'politicsStory.category'}
                  onSelect={() => onSelectSlot?.('politicsStory.category', 'પોલિસી કેટેગરી')}
                  className="text-red-700 font-bold text-[12px] font-sans"
                />
              </div>

              <EditableTextSlot
                tagName="h4"
                value={data.politicsStory.headline}
                onChange={(val) => updateField('politicsStory.headline', val)}
                isSelected={selectedPath === 'politicsStory.headline'}
                onSelect={() => onSelectSlot?.('politicsStory.headline', 'પોલિસી હેડલાઇન')}
                className="text-[21px] font-black text-slate-950 leading-tight font-serif mb-0.5"
                maxLength={90}
              />

              <EditableTextSlot
                value={data.politicsStory.subheadline || ''}
                onChange={(val) => updateField('politicsStory.subheadline', val)}
                isSelected={selectedPath === 'politicsStory.subheadline'}
                onSelect={() => onSelectSlot?.('politicsStory.subheadline', 'પોલિસી સબહેડલાઇન')}
                className="text-[12px] font-bold text-slate-700 font-sans leading-snug mb-1"
                maxLength={100}
              />

              <div className="grid grid-cols-12 gap-2.5 items-start flex-1 overflow-hidden">
                <div className="col-span-6 text-[10.5px] leading-[1.38] text-slate-800 font-serif text-justify overflow-hidden">
                  {data.politicsStory.location && (
                    <span className="font-black text-red-700 shrink-0">{data.politicsStory.location} |&nbsp;</span>
                  )}
                  <EditableTextSlot
                    value={data.politicsStory.paragraph1}
                    onChange={(val) => updateField('politicsStory.paragraph1', val)}
                    isSelected={selectedPath === 'politicsStory.paragraph1'}
                    onSelect={() => onSelectSlot?.('politicsStory.paragraph1', 'પોલિસી પેરાગ્રાફ ૧')}
                    multiline
                  />
                </div>

                <div className="col-span-6 flex flex-col overflow-hidden">
                  <EditableImageSlot
                    src={data.politicsStory.image || ''}
                    onImageChange={(img) => updateField('politicsStory.image', img)}
                    isSelected={selectedPath === 'politicsStory.image'}
                    onSelect={() => onSelectSlot?.('politicsStory.image', 'પોલિસી ઈમેજ')}
                    containerHeight="95px"
                    className="mb-1"
                  />
                  {data.politicsStory.keyPoints && (
                    <KeyPointsBox
                      basePath="politicsStory"
                      title={data.politicsStory.keyPoints.title}
                      points={data.politicsStory.keyPoints.points}
                    />
                  )}
                  <div className="text-[10px] leading-[1.35] text-slate-800 font-serif text-justify overflow-hidden mt-0.5">
                    <EditableTextSlot
                      value={data.politicsStory.paragraph2}
                      onChange={(val) => updateField('politicsStory.paragraph2', val)}
                      isSelected={selectedPath === 'politicsStory.paragraph2'}
                      onSelect={() => onSelectSlot?.('politicsStory.paragraph2', 'પોલિસી પેરાગ્રાફ ૨')}
                      multiline
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Feature: Semiconductor & High-Tech Investments (col-span-6) */}
          <div className="col-span-6 pl-4 flex flex-col justify-between overflow-hidden h-full">
            <div className="h-full flex flex-col overflow-hidden">
              <div className="flex justify-between items-start mb-0.5">
                <EditableTextSlot
                  value={data.techStory.category}
                  onChange={(val) => updateField('techStory.category', val)}
                  isSelected={selectedPath === 'techStory.category'}
                  onSelect={() => onSelectSlot?.('techStory.category', 'ટેકનોલોજી કેટેગરી')}
                  className="text-red-700 font-bold text-[12px] font-sans"
                />
              </div>

              <EditableTextSlot
                tagName="h4"
                value={data.techStory.headline}
                onChange={(val) => updateField('techStory.headline', val)}
                isSelected={selectedPath === 'techStory.headline'}
                onSelect={() => onSelectSlot?.('techStory.headline', 'ટેકનોલોજી હેડલાઇન')}
                className="text-[21px] font-black text-slate-950 leading-tight font-serif mb-0.5"
                maxLength={90}
              />

              <EditableTextSlot
                value={data.techStory.subheadline || ''}
                onChange={(val) => updateField('techStory.subheadline', val)}
                isSelected={selectedPath === 'techStory.subheadline'}
                onSelect={() => onSelectSlot?.('techStory.subheadline', 'ટેકનોલોજી સબહેડલાઇન')}
                className="text-[12px] font-bold text-slate-700 font-sans leading-snug mb-1"
                maxLength={100}
              />

              <div className="grid grid-cols-12 gap-2.5 items-start flex-1 overflow-hidden">
                <div className="col-span-6 text-[10.5px] leading-[1.38] text-slate-800 font-serif text-justify overflow-hidden">
                  {data.techStory.location && (
                    <span className="font-black text-red-700 shrink-0">{data.techStory.location} |&nbsp;</span>
                  )}
                  <EditableTextSlot
                    value={data.techStory.paragraph1}
                    onChange={(val) => updateField('techStory.paragraph1', val)}
                    isSelected={selectedPath === 'techStory.paragraph1'}
                    onSelect={() => onSelectSlot?.('techStory.paragraph1', 'ટેકનોલોજી પેરાગ્રાફ ૧')}
                    multiline
                  />
                </div>

                <div className="col-span-6 flex flex-col overflow-hidden">
                  <EditableImageSlot
                    src={data.techStory.image || ''}
                    onImageChange={(img) => updateField('techStory.image', img)}
                    isSelected={selectedPath === 'techStory.image'}
                    onSelect={() => onSelectSlot?.('techStory.image', 'ટેકનોલોજી ઈમેજ')}
                    containerHeight="95px"
                    className="mb-1"
                  />
                  {data.techStory.keyPoints && (
                    <KeyPointsBox
                      basePath="techStory"
                      title={data.techStory.keyPoints.title}
                      points={data.techStory.keyPoints.points.slice(0, 2)}
                    />
                  )}
                  <div className="text-[10px] leading-[1.35] text-slate-800 font-serif text-justify overflow-hidden mt-0.5">
                    <EditableTextSlot
                      value={data.techStory.paragraph2}
                      onChange={(val) => updateField('techStory.paragraph2', val)}
                      isSelected={selectedPath === 'techStory.paragraph2'}
                      onSelect={() => onSelectSlot?.('techStory.paragraph2', 'ટેકનોલોજી પેરાગ્રાફ ૨')}
                      multiline
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 5. ROW 3: TRIPLE FINANCIAL & INNOVATION COLUMNS (4 Cols + 4 Cols + 4 Cols) ─── */}
        <div className="grid grid-cols-12 divide-x divide-slate-300 gap-0 mb-2 h-[340px] shrink-0 border-b border-slate-300 pb-2 overflow-hidden">
          {/* Col 1: Banking & Wealth Guide (col-span-4) */}
          <div className="col-span-4 pr-3 flex flex-col justify-between h-full overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-start mb-0.5">
                <EditableTextSlot
                  value={data.bankingStory.category}
                  onChange={(val) => updateField('bankingStory.category', val)}
                  isSelected={selectedPath === 'bankingStory.category'}
                  onSelect={() => onSelectSlot?.('bankingStory.category', 'બેન્કિંગ કેટેગરી')}
                  className="text-red-700 font-bold text-[11px] font-sans"
                />
              </div>

              <EditableTextSlot
                tagName="h4"
                value={data.bankingStory.headline}
                onChange={(val) => updateField('bankingStory.headline', val)}
                isSelected={selectedPath === 'bankingStory.headline'}
                onSelect={() => onSelectSlot?.('bankingStory.headline', 'બેન્કિંગ હેડલાઇન')}
                className="text-[18px] font-black text-slate-950 leading-tight font-serif mb-1"
                maxLength={80}
              />

              <EditableImageSlot
                src={data.bankingStory.image || ''}
                onImageChange={(img) => updateField('bankingStory.image', img)}
                isSelected={selectedPath === 'bankingStory.image'}
                onSelect={() => onSelectSlot?.('bankingStory.image', 'બેન્કિંગ ઈમેજ')}
                containerHeight="100px"
                className="mb-1"
              />

              <div className="text-[10.5px] leading-[1.38] text-slate-800 font-serif text-justify flex-1 overflow-hidden">
                {data.bankingStory.location && (
                  <span className="font-black text-red-700 shrink-0">{data.bankingStory.location} |&nbsp;</span>
                )}
                <EditableTextSlot
                  value={data.bankingStory.paragraph1}
                  onChange={(val) => updateField('bankingStory.paragraph1', val)}
                  isSelected={selectedPath === 'bankingStory.paragraph1'}
                  onSelect={() => onSelectSlot?.('bankingStory.paragraph1', 'બેન્કિંગ પેરાગ્રાફ ૧')}
                  multiline
                />
              </div>

              {data.bankingStory.keyPoints && (
                <div className="mt-1">
                  <KeyPointsBox
                    basePath="bankingStory"
                    title={data.bankingStory.keyPoints.title}
                    points={data.bankingStory.keyPoints.points.slice(0, 2)}
                    titleClassName="text-[9.5px]"
                    pointClassName="text-[9px]"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Col 2: Startups & Innovation Venture Hub (col-span-4) */}
          <div className="col-span-4 px-3 flex flex-col justify-between h-full overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-start mb-0.5">
                <EditableTextSlot
                  value={data.startupStory.category}
                  onChange={(val) => updateField('startupStory.category', val)}
                  isSelected={selectedPath === 'startupStory.category'}
                  onSelect={() => onSelectSlot?.('startupStory.category', 'સ્ટાર્ટઅપ કેટેગરી')}
                  className="text-red-700 font-bold text-[11px] font-sans"
                />
              </div>

              <EditableTextSlot
                tagName="h4"
                value={data.startupStory.headline}
                onChange={(val) => updateField('startupStory.headline', val)}
                isSelected={selectedPath === 'startupStory.headline'}
                onSelect={() => onSelectSlot?.('startupStory.headline', 'સ્ટાર્ટઅપ હેડલાઇન')}
                className="text-[18px] font-black text-slate-950 leading-tight font-serif mb-1"
                maxLength={80}
              />

              <EditableImageSlot
                src={data.startupStory.image || ''}
                onImageChange={(img) => updateField('startupStory.image', img)}
                isSelected={selectedPath === 'startupStory.image'}
                onSelect={() => onSelectSlot?.('startupStory.image', 'સ્ટાર્ટઅપ ઈમેજ')}
                containerHeight="100px"
                className="mb-1"
              />

              <div className="text-[10.5px] leading-[1.38] text-slate-800 font-serif text-justify flex-1 overflow-hidden">
                {data.startupStory.location && (
                  <span className="font-black text-red-700 shrink-0">{data.startupStory.location} |&nbsp;</span>
                )}
                <EditableTextSlot
                  value={data.startupStory.paragraph1}
                  onChange={(val) => updateField('startupStory.paragraph1', val)}
                  isSelected={selectedPath === 'startupStory.paragraph1'}
                  onSelect={() => onSelectSlot?.('startupStory.paragraph1', 'સ્ટાર્ટઅપ પેરાગ્રાફ ૧')}
                  multiline
                />
              </div>

              <div className="mt-1 bg-amber-50/60 border border-amber-800/30 p-1 rounded-xs text-[10px] text-slate-700 font-sans leading-tight">
                <EditableTextSlot
                  value={data.startupStory.paragraph2}
                  onChange={(val) => updateField('startupStory.paragraph2', val)}
                  isSelected={selectedPath === 'startupStory.paragraph2'}
                  onSelect={() => onSelectSlot?.('startupStory.paragraph2', 'સ્ટાર્ટઅપ પેરાગ્રાફ ૨')}
                  multiline
                />
              </div>
            </div>
          </div>

          {/* Col 3: Commodity, Agri & Bullion Pulse (col-span-4) */}
          <div className="col-span-4 pl-3 flex flex-col justify-between h-full overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-start mb-0.5">
                <EditableTextSlot
                  value={data.commodityStory.category}
                  onChange={(val) => updateField('commodityStory.category', val)}
                  isSelected={selectedPath === 'commodityStory.category'}
                  onSelect={() => onSelectSlot?.('commodityStory.category', 'કોમોડિટી કેટેગરી')}
                  className="text-red-700 font-bold text-[11px] font-sans"
                />
              </div>

              <EditableTextSlot
                tagName="h4"
                value={data.commodityStory.headline}
                onChange={(val) => updateField('commodityStory.headline', val)}
                isSelected={selectedPath === 'commodityStory.headline'}
                onSelect={() => onSelectSlot?.('commodityStory.headline', 'કોમોડિટી હેડલાઇન')}
                className="text-[18px] font-black text-slate-950 leading-tight font-serif mb-1"
                maxLength={80}
              />

              <EditableImageSlot
                src={data.commodityStory.image || ''}
                onImageChange={(img) => updateField('commodityStory.image', img)}
                isSelected={selectedPath === 'commodityStory.image'}
                onSelect={() => onSelectSlot?.('commodityStory.image', 'કોમોડિટી ઈમેજ')}
                containerHeight="100px"
                className="mb-1"
              />

              <div className="text-[10.5px] leading-[1.38] text-slate-800 font-serif text-justify flex-1 overflow-hidden">
                {data.commodityStory.location && (
                  <span className="font-black text-red-700 shrink-0">{data.commodityStory.location} |&nbsp;</span>
                )}
                <EditableTextSlot
                  value={data.commodityStory.paragraph1}
                  onChange={(val) => updateField('commodityStory.paragraph1', val)}
                  isSelected={selectedPath === 'commodityStory.paragraph1'}
                  onSelect={() => onSelectSlot?.('commodityStory.paragraph1', 'કોમોડિટી પેરાગ્રાફ ૧')}
                  multiline
                />
              </div>

              <div className="mt-1 bg-amber-50/60 border border-amber-800/30 p-1 rounded-xs text-[10px] text-slate-700 font-sans leading-tight">
                <EditableTextSlot
                  value={data.commodityStory.paragraph2}
                  onChange={(val) => updateField('commodityStory.paragraph2', val)}
                  isSelected={selectedPath === 'commodityStory.paragraph2'}
                  onSelect={() => onSelectSlot?.('commodityStory.paragraph2', 'કોમોડિટી પેરાગ્રાફ ૨')}
                  multiline
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── 6. ROW 4: CORPORATE BRIEFS (7 Cols, 3 Bulletins) + CORPORATE SOLUS AD (5 Cols) ─── */}
        <div className="grid grid-cols-12 divide-x divide-slate-300 gap-0 mb-1.5 h-[280px] shrink-0 overflow-hidden">
          {/* Left: Corporate Diary / Fast Bulletins (col-span-7) */}
          <div className="col-span-7 pr-3 flex flex-col justify-between h-full overflow-hidden">
            <div className="h-full flex flex-col justify-between">
              {/* Header Ribbon */}
              <div className="bg-slate-900 text-white px-2 py-0.5 flex items-center justify-between font-sans mb-1.5 shrink-0">
                <span className="text-[11.5px] font-black tracking-wider uppercase">
                  📋 કોર્પોરેટ ડાયરી અને મહત્વના બિઝનેસ અહેવાલો
                </span>
                <span className="text-[9.5px] text-amber-300 font-bold">ઝડપી સમાચાર</span>
              </div>

              {/* 3 Columns of Corporate Briefs */}
              <div className="grid grid-cols-3 divide-x divide-slate-200 gap-0 flex-1 overflow-hidden">
                {data.corporateBriefs.slice(0, 3).map((brief: any, bIdx: number) => (
                  <div key={bIdx} className={`flex flex-col justify-between h-full overflow-hidden ${bIdx === 0 ? 'pr-2' : bIdx === 1 ? 'px-2' : 'pl-2'}`}>
                    <div className="h-full flex flex-col">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="bg-red-700 text-white text-[8.5px] font-bold px-1 py-0.2 rounded-2xs uppercase">
                          <EditableTextSlot
                            value={brief.category}
                            onChange={(val) => updateField(`corporateBriefs.${bIdx}.category`, val)}
                            isSelected={selectedPath === `corporateBriefs.${bIdx}.category`}
                            onSelect={() => onSelectSlot?.(`corporateBriefs.${bIdx}.category`, `બ્રીફ ${bIdx + 1} કેટેગરી`)}
                          />
                        </span>
                      </div>

                      <EditableTextSlot
                        tagName="h4"
                        value={brief.headline}
                        onChange={(val) => updateField(`corporateBriefs.${bIdx}.headline`, val)}
                        isSelected={selectedPath === `corporateBriefs.${bIdx}.headline`}
                        onSelect={() => onSelectSlot?.(`corporateBriefs.${bIdx}.headline`, `બ્રીફ ${bIdx + 1} હેડલાઇન`)}
                        className="text-[13px] font-black text-slate-950 leading-tight font-serif mb-1"
                        maxLength={65}
                      />

                      <div className="text-[9.5px] leading-[1.35] text-slate-700 font-serif text-justify flex-1 overflow-hidden">
                        {brief.location && (
                          <span className="font-bold text-red-700">{brief.location} | </span>
                        )}
                        <EditableTextSlot
                          value={brief.articleBody}
                          onChange={(val) => updateField(`corporateBriefs.${bIdx}.articleBody`, val)}
                          isSelected={selectedPath === `corporateBriefs.${bIdx}.articleBody`}
                          onSelect={() => onSelectSlot?.(`corporateBriefs.${bIdx}.articleBody`, `બ્રીફ ${bIdx + 1} વિગત`)}
                          multiline
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Business Sponsor / Corporate Partner Solus (col-span-5) */}
          <div className="col-span-5 pl-3 flex flex-col justify-between h-full overflow-hidden">
            <div className="h-full flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-900 pb-0.5 mb-1 shrink-0">
                <span className="text-[10px] font-sans font-bold text-slate-600 tracking-wider">
                  — બિઝનેસ પાર્ટનર (BUSINESS SPONSOR) —
                </span>
                <span className="text-[9px] font-sans text-slate-400">ADVERTISEMENT</span>
              </div>

              <div className="flex-1 w-full bg-slate-50 border border-slate-300 relative overflow-hidden flex flex-col justify-between p-1">
                <EditableImageSlot
                  src={data.advertisement.image || ''}
                  onImageChange={(img) => updateField('advertisement.image', img)}
                  isSelected={selectedPath === 'advertisement.image'}
                  onSelect={() => onSelectSlot?.('advertisement.image', 'જાહેરાત ઈમેજ')}
                  containerHeight="220px"
                  alt="Business Partner Ad"
                />
                <div className="text-center mt-0.5 shrink-0">
                  <EditableTextSlot
                    value={data.advertisement.title || 'કોર્પોરેટ બિઝનેસ પાર્ટનર જાહેરાત સ્લોટ'}
                    onChange={(val) => updateField('advertisement.title', val)}
                    isSelected={selectedPath === 'advertisement.title'}
                    onSelect={() => onSelectSlot?.('advertisement.title', 'જાહેરાત શીર્ષક')}
                    className="text-[10px] text-slate-500 font-sans"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 7. FOOTER SECTION BAR (EXACT SAME AS PAGE 2) ─── */}
        <div className="shrink-0 pt-1.5 border-t-2 border-slate-900 flex justify-between items-center text-xs font-sans text-slate-600">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 tracking-wider">GUJARAT POST</span>
            <span>•</span>
            <span>BUSINESS & EDITORIAL SPECIAL EDITION</span>
            <span>•</span>
            <span className="text-[10px] text-slate-500">RNI Reg. No. GUJGUJ/2026/12345</span>
          </div>

          <div className="flex items-center gap-4">
            {/* CMYK Color Registration Target Dots */}
            <div className="flex items-center gap-1.5" title="CMYK Calibration Markers">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00ffff] border border-slate-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff00ff] border border-slate-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffff00] border border-slate-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#000000] border border-slate-400" />
            </div>

            <span className="font-bold text-slate-900">
              પાનું ૩ (PAGE 3 OF 4)
            </span>
          </div>
        </div>

      </div>
    </EpaperReadOnlyProvider>
  );
};
