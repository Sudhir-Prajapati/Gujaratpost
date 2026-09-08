'use client';

import React from 'react';
import { Page2Data } from './types';
import { EditableTextSlot } from './EditableTextSlot';
import { EditableImageSlot } from './EditableImageSlot';
import { useEpaperReadOnly, EpaperReadOnlyProvider } from './EpaperReadOnlyContext';

export interface Page2GujaratProps {
  data: Page2Data;
  onChange: (newData: Page2Data) => void;
  selectedPath?: string;
  onSelectSlot?: (path: string, label: string) => void;
  onImportClick?: (slotPath: string, label: string) => void;
  readOnly?: boolean;
}

// Default fallback data for Page 2 with 30% variation (Regional/State news broadsheet) & NO AD
const fallbackPage2 = {
  sectionTitle: 'ગુજરાત સમાચાર વિશેષ (રાજ્ય & પ્રાદેશિક વિશેષ અંક)',
  topBarTagline: 'ગુજરાત પોસ્ટ • દૈનિક ઈ-પેપર',
  districtBar: 'અમદાવાદ • સુરત • વડોદરા • રાજકોટ • ભાવનગર • જામનગર • જૂનાગઢ • ભુજ • આણંદ • મહેસાણા • ગાંધીનગર',
  mainDistrictStory: {
    district: 'ગાંધીનગર',
    location: 'ગાંધીનગર',
    category: 'રાજ્ય વિકાસ અને ઈન્ફ્રાસ્ટ્રક્ચર વિશેષ',
    headline: 'ગુજરાતમાં હાઈસ્પીડ કનેક્ટિવિટી: ૫ નવા એક્સપ્રેસવે અને ૧૨ સ્માર્ટ બ્રિજ મંજૂર',
    subheadline: 'મુખ્યમંત્રી દ્વારા ₹૧૮,૫૦૦ કરોડના મેગા પ્રોજેક્ટ્સની ઘોષણા, ૨૦૨૮ સુધીમાં તમામ પ્રોજેક્ટ કાર્યરત થશે',
    paragraph1: 'ગાંધીનગર: ગુજરાત રાજ્યના સર્વાંગી અને ઝડપી વિકાસને નવી ગતિ આપવા માટે આજે મુખ્યમંત્રીની અધ્યક્ષતામાં મળેલી કેબિનેટ બેઠકમાં ઐતિહાસિક નિર્ણયો લેવામાં આવ્યા છે. રાજ્યભરમાં માર્ગ અને પરિવહન નેટવર્કને અત્યાધુનિક બનાવવા માટે ₹૧૮,૫૦૦ કરોડના વિશાળ બજેટ સાથે ૫ નવા હાઈસ્પીડ ગ્રીનફિલ્ડ એક્સપ્રેસવે અને વિવિધ મહાનગરોમાં ૧૨ સ્માર્ટ સિગ્નેચર બ્રિજનું નિર્માણ કરવાની સૈદ્ધાંતિક મંજૂરી આપવામાં આવી છે. આ પ્રોજેક્ટ્સથી રાજ્યના તમામ ઔદ્યોગિક હબ અને બંદરો વચ્ચે માલવાહક વાહનોનો મુસાફરી સમય ૫૦ ટકા જેટલો ઘટી જશે. નાયબ મુખ્ય સચિવ અને માર્ગ-મકાન વિભાગના ઉચ્ચ અધિકારીઓને તાત્કાલિક ટેન્ડર પ્રક્રિયા પૂર્ણ કરી નિર્ધારિત સમયમર્યાદામાં કામ શરૂ કરવા સૂચના અપાઈ છે. રાજ્યના તમામ ૩૩ જિલ્લાઓને સીધી ઝડપી કનેક્ટિવિટી મળશે.',
    paragraph2: 'નવા એક્સપ્રેસવે પ્રોજેક્ટ અંતર્ગત સૌરાષ્ટ્ર, ઉત્તર ગુજરાત અને મધ્ય ગુજરાત વચ્ચે નિર્વિધ્ન લોજિસ્ટિક્સ કોરિડોર ઊભો થશે. આ માર્ગો પર ઇલેક્ટ્રિક વાહનો માટે સુપરફાસ્ટ ચાર્જિંગ સ્ટેશનો અને અદ્યતન એમ્બ્યુલન્સ ટ્રોમા સેન્ટરો સ્થાપવામાં આવશે.',
    paragraph3: 'વિશ્વ કક્ષાની ટેકનોલોજીનો ઉપયોગ કરી તમામ બ્રિજ પર સેન્સર આધારિત ટ્રાફિક મોનિટરિંગ સિસ્ટમ લાગુ કરવામાં આવશે. રાજ્યમાં પ્રવાસન, વેપાર અને રોજગારી ક્ષેત્રે આ માળખાગત સુવિધાઓ મોટો ક્રાંતિકારી બદલાવ લાવશે.',
    articleBody: 'ગાંધીનગર: ગુજરાત રાજ્યના સર્વાંગી અને ઝડપી વિકાસને નવી ગતિ આપવા માટે આજે મુખ્યમંત્રીની અધ્યક્ષતામાં મળેલી કેબિનેટ બેઠકમાં ઐતિહાસિક નિર્ણયો લેવામાં આવ્યા છે. રાજ્યભરમાં માર્ગ અને પરિવહન નેટવર્કને અત્યાધુનિક બનાવવા માટે ₹૧૮,૫૦૦ કરોડના વિશાળ બજેટ સાથે ૫ નવા હાઈસ્પીડ ગ્રીનફિલ્ડ એક્સપ્રેસવે અને વિવિધ મહાનગરોમાં ૧૨ સ્માર્ટ સિગ્નેચર બ્રિજનું નિર્માણ કરવાની સૈદ્ધાંતિક મંજૂરી આપવામાં આવી છે.',
    image: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?auto=format&fit=crop&w=800&q=80',
    caption: 'રાજ્યમાં નિર્માણાધીન આધુનિક એક્સપ્રેસવે અને સ્માર્ટ બ્રિજ પ્રોજેક્ટ',
    keyPoints: {
      title: 'પ્રોજેક્ટની મુખ્ય બાબતો',
      points: [
        '₹૧૮,૫૦૦ કરોડનું ઐતિહાસિક રોકાણ',
        '૫ નવા હાઈસ્પીડ ગ્રીનફિલ્ડ કોરિડોર',
        '૧૨ આધુનિક સ્માર્ટ સિગ્નેચર બ્રિજ',
        'મુસાફરી સમયમાં ૫૦% સુધીનો ઘટાડો',
      ],
    },
  },
  sideLeadStory: {
    district: 'અમદાવાદ',
    location: 'અમદાવાદ',
    category: 'આરોગ્ય અને લોકકલ્યાણ',
    headline: 'રાજ્યની સિવિલ હોસ્પિટલોમાં હવે રોબોટિક સર્જરી અને ૨૪ કલાક નિઃશુલ્ક સારવાર',
    subheadline: 'દરેક જિલ્લા મથકે સુપર સ્પેશિયાલિટી યુનિટ્સ કાર્યરત થશે',
    paragraph1: 'રાજ્ય સરકાર દ્વારા સામાન્ય અને મધ્યમ વર્ગના પરિવારોને શ્રેષ્ઠ તબીબી સેવાઓ ઘરઆંગણે પૂરી પાડવા માટે અમદાવાદ સહિત તમામ જિલ્લા સિવિલ હોસ્પિટલોમાં રોબોટિક સર્જરી સુવિધા અને આધુનિક એમઆરઆઈ સેન્ટરો શરૂ કરવાનો નિર્ણય લેવાયો છે. દર્દીઓને ખાનગી હોસ્પિટલો જેવી આંતરરાષ્ટ્રીય સ્તરની સારવાર વિનામૂલ્યે ઉપલબ્ધ કરાશે.',
    paragraph2: 'આ નવી યોજના અંતર્ગત હૃદયરોગ, કિડની અને કેન્સર જેવી ગંભીર બીમારીઓ માટે ૨૪ કલાક નિષ્ણાત ડોક્ટરોની ટીમ તૈનાત રહેશે. રાજ્યના અંતરિયાળ વિસ્તારોમાંથી આવતા દર્દીઓ માટે દવાઓ અને લેબ ટેસ્ટિંગ સંપૂર્ણ મફત રહેશે.',
    articleBody: 'રાજ્ય સરકાર દ્વારા સામાન્ય અને મધ્યમ વર્ગના પરિવારોને શ્રેષ્ઠ તબીબી સેવાઓ ઘરઆંગણે પૂરી પાડવા માટે અમદાવાદ સહિત તમામ જિલ્લા સિવિલ હોસ્પિટલોમાં રોબોટિક સર્જરી સુવિધા અને આધુનિક એમઆરઆઈ સેન્ટરો શરૂ કરવાનો નિર્ણય લેવાયો છે.',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
    caption: 'સિવિલ હોસ્પિટલમાં આધુનિક ઓપરેશન થિયેટર',
    pullQuote: {
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      text: '“છેવાડાના નાગરિક સુધી શ્રેષ્ઠ સ્વાસ્થ્ય સુવિધા પહોંચાડવી અમારો મુખ્ય સંકલ્પ છે.”',
      author: '— ઋષિકેશ પટેલ, આરોગ્ય મંત્રી, ગુજરાત',
    },
  },
  districtStories: [
    {
      district: 'સુરત',
      location: 'સુરત',
      category: 'હીરા અને ટેક્સટાઇલ નગરી',
      headline: 'સુરતમાં ડાયમંડ બુર્સ ખાતે ગ્લોબલ ટ્રેડ સેન્ટરનો ભવ્ય પ્રારંભ',
      subheadline: 'વિશ્વના ૫૦થી વધુ દેશોના વેપારીઓ ભાગીદાર બનશે',
      paragraph1: 'સુરત: વિશ્વના સૌથી મોટા ઓફિસ સંકુલ સુરત ડાયમંડ બુર્સમાં આજે આંતરરાષ્ટ્રીય જેમ્સ એન્ડ જ્વેલરી ટ્રેડ સેન્ટરનો વિધિવત પ્રારંભ થયો છે. વૈશ્વિક વેપારને સીધો વેગ મળશે.',
      paragraph2: 'કાપડ અને હીરા ઉદ્યોગમાં નવી ટેકનોલોજીના સમાવેશથી આગામી છ મહિનામાં ₹૧૫,૦૦૦ કરોડથી વધુનો એક્સપોર્ટ બિઝનેસ વધવાની અપેક્ષા વ્યક્ત કરાઈ છે.',
      articleBody: 'સુરત: વિશ્વના સૌથી મોટા ઓફિસ સંકુલ સુરત ડાયમંડ બુર્સમાં આજે આંતરરાષ્ટ્રીય જેમ્સ એન્ડ જ્વેલરી ટ્રેડ સેન્ટરનો વિધિવત પ્રારંભ થયો છે. વૈશ્વિક વેપારને સીધો વેગ મળશે.',
      image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&w=500&q=80',
      keyPoints: {
        title: 'સુરત ટ્રેડિંગ હાઈલાઈટ્સ',
        points: [
          '૫૦થી વધુ દેશોનું ડાયરેક્ટ ટ્રેડિંગ',
          'નવા ૨૦,૦૦૦ રોજગારીના અવસર',
          'ટેક્સટાઇલ અને જેમ્સ હબનો વિકાસ',
        ],
      },
    },
    {
      district: 'રાજકોટ',
      location: 'રાજકોટ',
      category: 'સૌરાષ્ટ્ર ઉદ્યોગ જગત',
      headline: 'રાજકોટમાં મેગા એન્જિનિયરિંગ ક્લસ્ટર: ૨૫ હજાર યુવાનોને નવી નોકરીઓ',
      subheadline: 'ઓટો પાર્ટ્સ અને પંપ મશીનરી ઉદ્યોગમાં ભારે રોકાણ',
      paragraph1: 'રાજકોટ: સૌરાષ્ટ્રના ઔદ્યોગિક પાટનગર રાજકોટના શાપર-વેરાવળ પંથકમાં નવું હાઈ-ટેક એન્જિનિયરિંગ ક્લસ્ટર સ્થાપવાની મંજૂરી અપાઈ છે. આધુનિક પ્લાન્ટ્સ ઊભા કરાશે.',
      paragraph2: 'જર્મની અને જાપાનની અગ્રણી કંપનીઓ સાથે સંયુક્ત સાહસ કરી ગુજરાતમાં બનતા ઓટોમોબાઇલ પાર્ટ્સની નિકાસને પ્રોત્સાહન આપવામાં આવશે.',
      articleBody: 'રાજકોટ: સૌરાષ્ટ્રના ઔદ્યોગિક પાટનગર રાજકોટના શાપર-વેરાવળ પંથકમાં નવું હાઈ-ટેક એન્જિનિયરિંગ ક્લસ્ટર સ્થાપવાની મંજૂરી અપાઈ છે. આધુનિક પ્લાન્ટ્સ ઊભા કરાશે.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=500&q=80',
      keyPoints: {
        title: 'રાજકોટ ક્લસ્ટર વિગત',
        points: [
          'શાપર-વેરાવળમાં વિશાળ જમીન ફાળવણી',
          'ઓટો અને મશીનરી પાર્ટ્સનું હબ',
          'સ્થાનિક યુવાનોને સ્કીલ ટ્રેનિંગ',
        ],
      },
    },
    {
      district: 'વડોદરા',
      location: 'વડોદરા',
      category: 'સાંસ્કૃતિક અને સંસ્કારી નગરી',
      headline: 'વડોદરા વિશ્વામિત્રી રિડેવલપમેન્ટ પ્રોજેક્ટ: ₹૧,૨૦૦ કરોડની નવી યોજના',
      subheadline: 'સ્માર્ટ સિટી મિશન અંતર્ગત રિવરફ્રન્ટ અને ગ્રીન બેલ્ટ',
      paragraph1: 'વડોદરા: વડોદરા શહેરની શાન સમાન વિશ્વામિત્રી નદીના કાયાકલ્પ માટે ₹૧,૨૦૦ કરોડના મેગા રિડેવલપમેન્ટ પ્રોજેક્ટને કેન્દ્ર અને રાજ્ય સરકારની અંતિમ મંજૂરી મળી છે.',
      paragraph2: 'નદી કાંઠે સુંદર રિવરફ્રન્ટ પ્રોમેનાડ, પક્ષી અભયારણ્ય અને પૂર નિયંત્રણ માટે અધ્યતન જળ વ્યવસ્થાપન દીવાલોનું નિર્માણ તાત્કાલિક શરૂ કરાશે.',
      articleBody: 'વડોદરા: વડોદરા શહેરની શાન સમાન વિશ્વામિત્રી નદીના કાયાકલ્પ માટે ₹૧,૨૦૦ કરોડના મેગા રિડેવલપમેન્ટ પ્રોજેક્ટને કેન્દ્ર અને રાજ્ય સરકારની અંતિમ મંજૂરી મળી છે.',
      image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=500&q=80',
      keyPoints: {
        title: 'વિશ્વામિત્રી પ્રોજેક્ટ ફાયદા',
        points: [
          'પૂર નિયંત્રણ માટે પાકી સુરક્ષા દીવાલો',
          '૧૫ કિમી લાંબો ગ્રીન રિવરફ્રન્ટ',
          'પર્યાવરણ અને જળ શુદ્ધિકરણ પ્લાન્ટ',
        ],
      },
    },
  ],
  bottomLeftFeature: {
    category: 'કૃષિ અને ગ્રામીણ અર્થતંત્ર',
    headline: 'રાજ્યમાં પ્રાકૃતિક ખેતી કરતા ખેડૂતો માટે વિશેષ પેકેજ જાહેર: ₹૫,૦૦૦ સહાય',
    subheadline: '૧૦ લાખથી વધુ ખેડૂત પરિવારોને દેશી ગાય આધારિત ખેતી માટે પ્રોત્સાહન',
    location: 'આણંદ',
    paragraph1: 'આણંદ કૃષિ યુનિવર્સિટી ખાતે આયોજિત રાજ્યકક્ષાના પ્રાકૃતિક કૃષિ પરિસંવાદમાં રાજ્ય સરકાર દ્વારા ખેડૂતોના હિતમાં મોટી જાહેરાત કરવામાં આવી છે. દેશી ગાય પાળતા અને રસાયણમુક્ત પ્રાકૃતિક ખેતી કરતા પ્રત્યેક ખેડૂતને વાર્ષિક ₹૫,૦૦૦ સુધીની સીધી આર્થિક સહાય બેંક ખાતામાં જમા કરવામાં આવશે. જમીનની ફળદ્રુપતા વધારવા અને ઝેરમુક્ત અનાજ ઉત્પાદન માટે સમગ્ર રાજ્યમાં ઝુંબેશ ચલાવાશે.',
    paragraph2: 'કૃષિ મંત્રીએ જણાવ્યું કે દરેક તાલુકા મથકે પ્રાકૃતિક કૃષિ ઉત્પાદનોના વેચાણ માટે વિશેષ ખેડૂત બજારો સ્થાપવામાં આવશે. પ્રમાણિત ઉત્પાદનોને પ્રીમિયમ ભાવ મળે તે માટે ડિજિટલ સર્ટિફિકેશન વ્યવસ્થા પણ અમલમાં મૂકવામાં આવી રહી છે.',
    articleBody: 'આણંદ કૃષિ યુનિવર્સિટી ખાતે આયોજિત રાજ્યકક્ષાના પ્રાકૃતિક કૃષિ પરિસંવાદમાં રાજ્ય સરકાર દ્વારા ખેડૂતોના હિતમાં મોટી જાહેરાત કરવામાં આવી છે. દેશી ગાય પાળતા અને રસાયણમુક્ત પ્રાકૃતિક ખેતી કરતા પ્રત્યેક ખેડૂતને વાર્ષિક ₹૫,૦૦૦ સુધીની સીધી આર્થિક સહાય બેંક ખાતામાં જમા કરવામાં આવશે.',
    image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80',
    keyPoints: {
      title: 'કૃષિ પેકેજ હાઈલાઈટ્સ',
      points: [
        '૧૦ લાખ ખેડૂતોને સીધી આર્થિક સહાય',
        'તાલુકા મથકે ઓર્ગેનિક બજારો',
        'ડિજિટલ ક્વોલિટી સર્ટિફિકેશન',
      ],
    },
  },
  bottomRightFeature: {
    category: 'શિક્ષણ અને આદિજાતિ ઉત્કર્ષ',
    headline: 'ડાંગ, નર્મદા અને તાપીમાં ૧૫ નવી એકલવ્ય મોડેલ સ્કૂલો અને હોસ્ટેલ મંજૂર',
    subheadline: 'આદિવાસી અને ગ્રામીણ વિદ્યાર્થીઓને મળશે નિઃશુલ્ક ઉચ્ચ સ્તરનું સ્માર્ટ શિક્ષણ',
    location: 'નર્મદા',
    paragraph1: 'નર્મદા: રાજ્યના પૂર્વ પટ્ટીના છેવાડાના વિસ્તારોમાં શિક્ષણનો વ્યાપ વધારવા માટે સરકારે ₹૪૫૦ કરોડના ખર્ચે ૧૫ અત્યાધુનિક એકલવ્ય મોડેલ રેસિડેન્શિયલ શાળાઓ મંજૂર કરી છે. આ શાળાઓમાં સીબીએસઈ પેટર્ન મુજબ આધુનિક કોમ્પ્યુટર લેબ્સ, સાયન્સ રિસર્ચ સેન્ટરો અને રમતગમત સંકુલ ઊભા કરાશે. તમામ વિદ્યાર્થીઓને રહેવા-જમવાની સાથે ઉચ્ચ સ્પર્ધાત્મક પરીક્ષાઓની વિશેષ કોચિંગ આપવામાં આવશે.',
    paragraph2: 'આદિજાતિ વિકાસ વિભાગ દ્વારા તેજસ્વી વિદ્યાર્થીઓને વિદેશ અભ્યાસ માટે પણ વિશેષ સ્કોલરશિપ આપવાની નવી ગાઈડલાઈન જાહેર કરવામાં આવી છે, જેથી આદિવાસી યુવાનો વૈશ્વિક સ્તરે ઉત્કૃષ્ટ કારકિર્દી બનાવી શકે.',
    articleBody: 'નર્મદા: રાજ્યના પૂર્વ પટ્ટીના છેવાડાના વિસ્તારોમાં શિક્ષણનો વ્યાપ વધારવા માટે સરકારે ₹૪૫૦ કરોડના ખર્ચે ૧૫ અત્યાધુનિક એકલવ્ય મોડેલ રેસિડેન્શિયલ શાળાઓ મંજૂર કરી છે.',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    keyPoints: {
      title: 'શિક્ષણ સુવિધાઓ',
      points: [
        '૧૫ અત્યાધુનિક રેસિડેન્શિયલ કેમ્પસ',
        'ડિજિટલ સ્માર્ટ વર્ગખંડો અને હોસ્ટેલ',
        'વિદેશ અભ્યાસ માટે વિશેષ સહાય',
      ],
    },
  },
};

export const Page2Gujarat: React.FC<Page2GujaratProps> = ({
  data: inputData,
  onChange,
  selectedPath,
  onSelectSlot,
  readOnly,
}) => {
  const contextReadOnly = useEpaperReadOnly();
  const isReadOnly = Boolean(readOnly ?? contextReadOnly);

  // Normalize data with full fallback values
  const data = React.useMemo(() => {
    const raw: any = inputData || {};
    const main: any = raw.mainDistrictStory || raw.leadStory || {};
    const side: any = raw.sideLeadStory || raw.sideTopNews || (raw.districtStories && raw.districtStories[3]) || {};
    const dStories: any[] = Array.isArray(raw.districtStories) && raw.districtStories.length > 0
      ? raw.districtStories
      : fallbackPage2.districtStories;

    const bLeft: any = raw.bottomLeftFeature || fallbackPage2.bottomLeftFeature;
    const bRight: any = raw.bottomRightFeature || fallbackPage2.bottomRightFeature;

    return {
      sectionTitle: raw.sectionTitle || fallbackPage2.sectionTitle,
      topBarTagline: raw.topBarTagline || fallbackPage2.topBarTagline,
      districtBar: raw.districtBar || fallbackPage2.districtBar,
      mainDistrictStory: {
        category: main.category || fallbackPage2.mainDistrictStory.category,
        headline: main.headline || fallbackPage2.mainDistrictStory.headline,
        subheadline: main.subheadline || fallbackPage2.mainDistrictStory.subheadline,
        district: main.district || fallbackPage2.mainDistrictStory.district,
        location: main.location || main.district || fallbackPage2.mainDistrictStory.location,
        paragraph1: main.paragraph1 || main.articleBody || fallbackPage2.mainDistrictStory.paragraph1,
        paragraph2: main.paragraph2 || fallbackPage2.mainDistrictStory.paragraph2,
        paragraph3: main.paragraph3 || fallbackPage2.mainDistrictStory.paragraph3,
        body: main.body || main.articleBody || fallbackPage2.mainDistrictStory.articleBody,
        image: main.image || fallbackPage2.mainDistrictStory.image,
        caption: main.caption || main.imageCaption || fallbackPage2.mainDistrictStory.caption,
        keyPoints: main.keyPoints || fallbackPage2.mainDistrictStory.keyPoints,
      },
      sideLeadStory: {
        category: side.category || fallbackPage2.sideLeadStory.category,
        headline: side.headline || fallbackPage2.sideLeadStory.headline,
        subheadline: side.subheadline || fallbackPage2.sideLeadStory.subheadline,
        district: side.district || fallbackPage2.sideLeadStory.district,
        location: side.location || side.district || fallbackPage2.sideLeadStory.location,
        paragraph1: side.paragraph1 || side.articleBody || fallbackPage2.sideLeadStory.paragraph1,
        paragraph2: side.paragraph2 || fallbackPage2.sideLeadStory.paragraph2,
        body: side.body || side.articleBody || fallbackPage2.sideLeadStory.articleBody,
        image: side.image || fallbackPage2.sideLeadStory.image,
        caption: side.caption || side.imageCaption || fallbackPage2.sideLeadStory.caption,
        pullQuote: side.pullQuote || fallbackPage2.sideLeadStory.pullQuote,
      },
      districtStories: [0, 1, 2].map((idx) => {
        const item: any = dStories[idx] || fallbackPage2.districtStories[idx] || fallbackPage2.districtStories[0];
        const fb: any = fallbackPage2.districtStories[idx] || fallbackPage2.districtStories[0];
        return {
          district: item.district || fb.district,
          location: item.location || item.district || fb.location,
          category: item.category || fb.category,
          headline: item.headline || fb.headline,
          subheadline: item.subheadline || fb.subheadline,
          paragraph1: item.paragraph1 || item.articleBody || fb.paragraph1,
          paragraph2: item.paragraph2 || fb.paragraph2,
          body: item.body || item.articleBody || fb.articleBody,
          image: item.image || fb.image,
          caption: item.caption || item.imageCaption || fb.caption,
          keyPoints: item.keyPoints || fb.keyPoints,
        };
      }),
      bottomLeftFeature: {
        category: bLeft.category || fallbackPage2.bottomLeftFeature.category,
        headline: bLeft.headline || fallbackPage2.bottomLeftFeature.headline,
        subheadline: bLeft.subheadline || fallbackPage2.bottomLeftFeature.subheadline,
        location: bLeft.location || bLeft.district || fallbackPage2.bottomLeftFeature.location,
        paragraph1: bLeft.paragraph1 || bLeft.articleBody || fallbackPage2.bottomLeftFeature.paragraph1,
        paragraph2: bLeft.paragraph2 || fallbackPage2.bottomLeftFeature.paragraph2,
        body: bLeft.body || bLeft.articleBody || fallbackPage2.bottomLeftFeature.articleBody,
        image: bLeft.image || fallbackPage2.bottomLeftFeature.image,
        caption: bLeft.caption || bLeft.imageCaption || (fallbackPage2.bottomLeftFeature as any).caption || '',
        keyPoints: bLeft.keyPoints || fallbackPage2.bottomLeftFeature.keyPoints,
      },
      bottomRightFeature: {
        category: bRight.category || fallbackPage2.bottomRightFeature.category,
        headline: bRight.headline || fallbackPage2.bottomRightFeature.headline,
        subheadline: bRight.subheadline || fallbackPage2.bottomRightFeature.subheadline,
        location: bRight.location || bRight.district || fallbackPage2.bottomRightFeature.location,
        paragraph1: bRight.paragraph1 || bRight.articleBody || fallbackPage2.bottomRightFeature.paragraph1,
        paragraph2: bRight.paragraph2 || fallbackPage2.bottomRightFeature.paragraph2,
        body: bRight.body || bRight.articleBody || fallbackPage2.bottomRightFeature.articleBody,
        image: bRight.image || fallbackPage2.bottomRightFeature.image,
        caption: bRight.caption || bRight.imageCaption || (fallbackPage2.bottomRightFeature as any).caption || '',
        keyPoints: bRight.keyPoints || fallbackPage2.bottomRightFeature.keyPoints,
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

  // Reusable KeyPointsBox matching Page 1 styling
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
  }) => (
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
        {points.map((pt, pIdx) => (
          <li key={pIdx} className="flex items-start gap-1 font-serif text-slate-900 leading-tight">
            <span className="w-1.5 h-1.5 bg-red-700 rounded-full mt-1 shrink-0" />
            <EditableTextSlot
              value={pt}
              onChange={(val) => {
                const newPts = [...points];
                newPts[pIdx] = val;
                updateField(`${basePath}.keyPoints.points`, newPts);
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

  return (
    <EpaperReadOnlyProvider value={isReadOnly}>
      <div className="w-[1224px] h-[1815px] max-h-[1815px] max-w-[1224px] bg-[#fffefb] text-slate-950 shadow-2xl border border-slate-400/80 p-8 flex flex-col justify-between font-serif select-none box-border overflow-hidden relative shrink-0">

        {/* ─── 1. TOP SECTION HEADER BAR (~30% variation: Regional & State Edition Header) ─── */}
        <div className="shrink-0 mb-1">
          <div className="border-b-4 border-double border-slate-900 pb-2 mb-1.5 flex justify-between items-center font-sans text-sm">
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
              tagName="h2"
              value={data.sectionTitle}
              onChange={(val) => updateField('sectionTitle', val)}
              isSelected={selectedPath === 'sectionTitle'}
              onSelect={() => onSelectSlot?.('sectionTitle', 'વિભાગ શીર્ષક')}
              className="text-2xl font-black text-slate-950 tracking-wide uppercase font-serif text-center"
            />
            <span className="font-black text-slate-800">પૃષ્ઠ ૨ (PAGE 2)</span>
          </div>

        </div>

        {/* ─── 2. MAIN STORY ROW (73% Lead State Story + 27% Side Lead Spotlight) ─── */}
        <div className="grid grid-cols-12 gap-0 h-[650px] mb-2.5 shrink-0 border-b border-slate-300 pb-2.5 overflow-hidden">
          {/* Main State Lead Story - 73% (col-span-9) */}
          <div className="col-span-9 pr-4 border-r border-slate-300 flex flex-col justify-between">
            <div className="h-full flex flex-col">
              {/* Category Eyebrow */}
              <div className="flex justify-center items-center mb-0.5">
                <EditableTextSlot
                  value={data.mainDistrictStory.category}
                  onChange={(val) => updateField('mainDistrictStory.category', val)}
                  isSelected={selectedPath === 'mainDistrictStory.category'}
                  onSelect={() => onSelectSlot?.('mainDistrictStory.category', 'મુખ્ય કેટેગરી')}
                  className="text-red-700 font-bold text-[18px] font-sans tracking-wide mx-auto"
                />
              </div>

              {/* Major Broadsheet Headline */}
              <EditableTextSlot
                tagName="h2"
                value={data.mainDistrictStory.headline}
                onChange={(val) => updateField('mainDistrictStory.headline', val)}
                isSelected={selectedPath === 'mainDistrictStory.headline'}
                onSelect={() => onSelectSlot?.('mainDistrictStory.headline', 'મુખ્ય હેડલાઇન')}
                className="text-[38px] font-black text-slate-950 leading-[1.12] font-serif text-center mb-2 tracking-tight"
                maxLength={140}
              />

              {/* Grey Subheadline Banner */}
              <div className="bg-[#e2e8f0] border border-slate-300/70 py-1.5 px-3 rounded-xs mb-3 text-center">
                <EditableTextSlot
                  value={data.mainDistrictStory.subheadline || ''}
                  onChange={(val) => updateField('mainDistrictStory.subheadline', val)}
                  isSelected={selectedPath === 'mainDistrictStory.subheadline'}
                  onSelect={() => onSelectSlot?.('mainDistrictStory.subheadline', 'સબહેડલાઇન')}
                  className="text-[18px] font-bold text-slate-900 leading-snug font-sans"
                  maxLength={150}
                />
              </div>

              {/* Lead Layout: Left column paragraph 1 + Wide Photo with overlaid red KeyPoints + under-image 2 paragraphs */}
              <div className="grid grid-cols-12 gap-3 items-start flex-1">
                {/* Left Column: Body text (Paragraph 1) */}
                <div className="col-span-3 text-[12px] leading-[1.45] text-slate-800 font-serif text-justify overflow-hidden">
                  {data.mainDistrictStory.location && (
                    <span className="font-black text-red-700 shrink-0">
                      {data.mainDistrictStory.location} |&nbsp;
                    </span>
                  )}
                  <EditableTextSlot
                    value={data.mainDistrictStory.paragraph1}
                    onChange={(val) => updateField('mainDistrictStory.paragraph1', val)}
                    isSelected={selectedPath === 'mainDistrictStory.paragraph1' || selectedPath === 'mainDistrictStory.articleBody'}
                    onSelect={() => onSelectSlot?.('mainDistrictStory.paragraph1', 'મુખ્ય સમાચાર - પેરાગ્રાફ ૧')}
                    multiline
                  />
                </div>

                {/* Wide Project Image + Caption + Overlaid Key Points Box */}
                <div className="col-span-9 flex flex-col relative h-full">
                  <EditableImageSlot
                    src={data.mainDistrictStory.image || ''}
                    onImageChange={(img) => updateField('mainDistrictStory.image', img)}
                    isSelected={selectedPath === 'mainDistrictStory.image'}
                    onSelect={() => onSelectSlot?.('mainDistrictStory.image', 'મુખ્ય ઈમેજ')}
                    containerHeight="245px"
                    alt="Main district story image"
                    actionsClassName={data.mainDistrictStory.keyPoints ? 'w-[52%]' : undefined}
                  />
                  {data.mainDistrictStory.caption && (
                    <EditableTextSlot
                      value={data.mainDistrictStory.caption}
                      onChange={(val) => updateField('mainDistrictStory.caption', val)}
                      isSelected={selectedPath === 'mainDistrictStory.caption'}
                      onSelect={() => onSelectSlot?.('mainDistrictStory.caption', 'ઈમેજ કૅપ્શન')}
                      className="text-[11px] text-slate-600 italic mt-1 font-sans text-center"
                    />
                  )}
                  {data.mainDistrictStory.keyPoints && (
                    <div className="absolute top-0 right-0 w-[47%]">
                      <KeyPointsBox
                        basePath="mainDistrictStory"
                        title={data.mainDistrictStory.keyPoints.title}
                        points={data.mainDistrictStory.keyPoints.points}
                      />
                    </div>
                  )}

                  {/* Under-image 2 Paragraphs side by side */}
                  <div className="mt-2 pt-2 border-t border-slate-300 flex-1 overflow-hidden grid grid-cols-2 gap-4">
                    <div className="text-[11.5px] leading-[1.42] text-slate-800 font-serif text-justify overflow-hidden">
                      <EditableTextSlot
                        value={data.mainDistrictStory.paragraph2}
                        onChange={(val) => updateField('mainDistrictStory.paragraph2', val)}
                        isSelected={selectedPath === 'mainDistrictStory.paragraph2'}
                        onSelect={() => onSelectSlot?.('mainDistrictStory.paragraph2', 'મુખ્ય સમાચાર - પેરાગ્રાફ ૨')}
                        multiline
                      />
                    </div>
                    <div className="text-[11.5px] leading-[1.42] text-slate-800 font-serif text-justify overflow-hidden">
                      <EditableTextSlot
                        value={data.mainDistrictStory.paragraph3}
                        onChange={(val) => updateField('mainDistrictStory.paragraph3', val)}
                        isSelected={selectedPath === 'mainDistrictStory.paragraph3'}
                        onSelect={() => onSelectSlot?.('mainDistrictStory.paragraph3', 'મુખ્ય સમાચાર - પેરાગ્રાફ ૩')}
                        multiline
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Lead Spotlight Story - 27% (col-span-3) */}
          <div className="col-span-3 pl-4 flex flex-col justify-between overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex justify-between items-center mb-1 gap-2">
                <EditableTextSlot
                  value={data.sideLeadStory.category}
                  onChange={(val) => updateField('sideLeadStory.category', val)}
                  isSelected={selectedPath === 'sideLeadStory.category'}
                  onSelect={() => onSelectSlot?.('sideLeadStory.category', 'સાઈડ ન્યુઝ કેટેગરી')}
                  className="text-red-700 font-bold text-[17px] font-sans tracking-wide"
                />
              </div>

              <EditableTextSlot
                tagName="h3"
                value={data.sideLeadStory.headline}
                onChange={(val) => updateField('sideLeadStory.headline', val)}
                isSelected={selectedPath === 'sideLeadStory.headline'}
                onSelect={() => onSelectSlot?.('sideLeadStory.headline', 'સાઈડ ન્યુઝ હેડલાઇન')}
                className="text-[26px] font-black text-slate-950 leading-tight font-serif mb-1.5"
                maxLength={100}
              />

              <EditableTextSlot
                value={data.sideLeadStory.subheadline || ''}
                onChange={(val) => updateField('sideLeadStory.subheadline', val)}
                isSelected={selectedPath === 'sideLeadStory.subheadline'}
                onSelect={() => onSelectSlot?.('sideLeadStory.subheadline', 'સાઈડ ન્યુઝ સબહેડલાઇન')}
                className="text-[14px] font-bold text-slate-700 font-sans leading-snug mb-2"
                maxLength={100}
              />

              {/* Side-by-side: Paragraph 1 (left) + Image (right) */}
              <div className="grid grid-cols-12 gap-2.5 items-start flex-1 overflow-hidden mb-1">
                <div className="col-span-6 text-[12px] leading-[1.48] text-slate-800 font-serif text-justify overflow-hidden">
                  {data.sideLeadStory.location && (
                    <span className="font-black text-red-700 shrink-0">
                      {data.sideLeadStory.location} |&nbsp;
                    </span>
                  )}
                  <EditableTextSlot
                    value={data.sideLeadStory.paragraph1}
                    onChange={(val) => updateField('sideLeadStory.paragraph1', val)}
                    isSelected={selectedPath === 'sideLeadStory.paragraph1'}
                    onSelect={() => onSelectSlot?.('sideLeadStory.paragraph1', 'સાઈડ ન્યુઝ - પેરાગ્રાફ ૧')}
                    multiline
                  />
                </div>

                <div className="col-span-6 flex flex-col">
                  <EditableImageSlot
                    src={data.sideLeadStory.image || ''}
                    onImageChange={(img) => updateField('sideLeadStory.image', img)}
                    isSelected={selectedPath === 'sideLeadStory.image'}
                    onSelect={() => onSelectSlot?.('sideLeadStory.image', 'સાઈડ ન્યુઝ ઈમેજ')}
                    containerHeight="130px"
                    alt="Side lead image"
                  />
                  {data.sideLeadStory.caption && (
                    <EditableTextSlot
                      value={data.sideLeadStory.caption}
                      onChange={(val) => updateField('sideLeadStory.caption', val)}
                      isSelected={selectedPath === 'sideLeadStory.caption'}
                      onSelect={() => onSelectSlot?.('sideLeadStory.caption', 'સાઈડ ન્યુઝ કૅપ્શન')}
                      className="text-[10px] text-slate-500 italic mt-1 font-sans text-center"
                    />
                  )}
                  <div className="text-[11.5px] leading-[1.45] text-slate-800 font-serif text-justify mt-2 overflow-hidden">
                    <EditableTextSlot
                      value={data.sideLeadStory.paragraph2}
                      onChange={(val) => updateField('sideLeadStory.paragraph2', val)}
                      isSelected={selectedPath === 'sideLeadStory.paragraph2'}
                      onSelect={() => onSelectSlot?.('sideLeadStory.paragraph2', 'સાઈડ ન્યુઝ - પેરાગ્રાફ ૨')}
                      multiline
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Official Pull Quote Box at the bottom */}
            {data.sideLeadStory.pullQuote && (
              <div className="bg-[#f8fafc] border border-slate-300 p-2 flex items-center gap-2.5 rounded-none mt-auto">
                <div className="w-[54px] h-[60px] shrink-0">
                  <EditableImageSlot
                    src={data.sideLeadStory.pullQuote.photo || data.sideLeadStory.pullQuote.image || ''}
                    onImageChange={(img) => updateField('sideLeadStory.pullQuote.photo', img)}
                    isSelected={selectedPath === 'sideLeadStory.pullQuote.photo'}
                    onSelect={() => onSelectSlot?.('sideLeadStory.pullQuote.photo', 'અવતરણ ઈમેજ')}
                    containerHeight="60px"
                    alt="Quote portrait"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-1">
                    <span className="text-red-600 font-serif text-xl font-black leading-none shrink-0">❝</span>
                    <EditableTextSlot
                      value={data.sideLeadStory.pullQuote.text || data.sideLeadStory.pullQuote.quote || ''}
                      onChange={(val) => updateField('sideLeadStory.pullQuote.text', val)}
                      isSelected={selectedPath === 'sideLeadStory.pullQuote.text'}
                      onSelect={() => onSelectSlot?.('sideLeadStory.pullQuote.text', 'અવતરણ')}
                      className="text-[10px] italic font-black text-slate-900 leading-tight"
                      multiline
                    />
                  </div>
                  <EditableTextSlot
                    value={data.sideLeadStory.pullQuote.author || data.sideLeadStory.pullQuote.name || ''}
                    onChange={(val) => updateField('sideLeadStory.pullQuote.author', val)}
                    isSelected={selectedPath === 'sideLeadStory.pullQuote.author'}
                    onSelect={() => onSelectSlot?.('sideLeadStory.pullQuote.author', 'અવતરણ નામ')}
                    className="text-[9.5px] font-bold text-slate-600 mt-1 block text-right font-sans"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── 3. THREE-ACROSS DISTRICT NEWS BLOCKS (Surat | Rajkot | Vadodara) ─── */}
        <div className="grid grid-cols-3 divide-x divide-slate-300 gap-0 h-[490px] mb-2.5 shrink-0 border-b border-slate-300 pb-2.5 overflow-hidden">
          {data.districtStories.slice(0, 3).map((dist, idx) => (
            <div
              key={idx}
              className={`flex flex-col justify-between overflow-hidden h-full ${
                idx === 0 ? 'pr-4' : idx === 1 ? 'px-4' : 'pl-4'
              }`}
            >
              <div className="h-full flex flex-col overflow-hidden">
                <div className="flex justify-between items-start mb-0.5">
                  <EditableTextSlot
                    value={dist.category}
                    onChange={(val) => updateField(`districtStories.${idx}.category`, val)}
                    isSelected={selectedPath === `districtStories.${idx}.category`}
                    onSelect={() => onSelectSlot?.(`districtStories.${idx}.category`, `જિલ્લો ${idx + 1} કેટેગરી`)}
                    className="text-red-700 font-bold text-[11.5px] font-sans"
                  />
                </div>

                <EditableTextSlot
                  tagName="h4"
                  value={dist.headline}
                  onChange={(val) => updateField(`districtStories.${idx}.headline`, val)}
                  isSelected={selectedPath === `districtStories.${idx}.headline`}
                  onSelect={() => onSelectSlot?.(`districtStories.${idx}.headline`, `જિલ્લો ${idx + 1} હેડલાઇન`)}
                  className="text-[23px] font-black text-slate-950 leading-tight font-serif mb-1"
                  maxLength={90}
                />

                <EditableTextSlot
                  value={dist.subheadline || ''}
                  onChange={(val) => updateField(`districtStories.${idx}.subheadline`, val)}
                  isSelected={selectedPath === `districtStories.${idx}.subheadline`}
                  onSelect={() => onSelectSlot?.(`districtStories.${idx}.subheadline`, `જિલ્લો ${idx + 1} સબહેડલાઇન`)}
                  className="text-[13px] font-bold text-slate-700 font-sans leading-snug mb-1.5"
                  maxLength={90}
                />

                {/* Text on left, Photo + Paragraph 2 on right */}
                <div className="grid grid-cols-12 gap-2 items-start mb-1.5 flex-1 overflow-hidden">
                  <div className="col-span-6 text-[10.5px] leading-[1.38] text-slate-800 font-serif text-justify overflow-hidden">
                    {dist.location && (
                      <span className="font-black text-red-700 shrink-0">{dist.location} |&nbsp;</span>
                    )}
                    <EditableTextSlot
                      value={dist.paragraph1}
                      onChange={(val) => updateField(`districtStories.${idx}.paragraph1`, val)}
                      isSelected={selectedPath === `districtStories.${idx}.paragraph1`}
                      onSelect={() => onSelectSlot?.(`districtStories.${idx}.paragraph1`, `જિલ્લો ${idx + 1} પેરાગ્રાફ ૧`)}
                      multiline
                    />
                  </div>

                  <div className="col-span-6 flex flex-col overflow-hidden">
                    <EditableImageSlot
                      src={dist.image || ''}
                      onImageChange={(img) => updateField(`districtStories.${idx}.image`, img)}
                      isSelected={selectedPath === `districtStories.${idx}.image`}
                      onSelect={() => onSelectSlot?.(`districtStories.${idx}.image`, `જિલ્લો ${idx + 1} ઈમેજ`)}
                      containerHeight="115px"
                      className="mb-1"
                    />
                    <div className="text-[10.5px] leading-[1.38] text-slate-800 font-serif text-justify overflow-hidden">
                      <EditableTextSlot
                        value={dist.paragraph2}
                        onChange={(val) => updateField(`districtStories.${idx}.paragraph2`, val)}
                        isSelected={selectedPath === `districtStories.${idx}.paragraph2`}
                        onSelect={() => onSelectSlot?.(`districtStories.${idx}.paragraph2`, `જિલ્લો ${idx + 1} પેરાગ્રાફ ૨`)}
                        multiline
                      />
                    </div>
                  </div>
                </div>

                {/* Red Key Points Box at Bottom */}
                {dist.keyPoints && (
                  <div className="mt-auto">
                    <KeyPointsBox
                      basePath={`districtStories.${idx}`}
                      title={dist.keyPoints.title}
                      points={dist.keyPoints.points}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ─── 4. BOTTOM ROW: TWO FULL NEWS FEATURES (NO ADVERTISEMENT!) ─── */}
        <div className="grid grid-cols-12 divide-x divide-slate-300 gap-0 mb-2 h-[429px] shrink-0 overflow-hidden">
          {/* Bottom Left Feature: Agriculture & Rural Economy */}
          <div className="col-span-6 pr-4 flex flex-col justify-between">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-start mb-0.5">
                <EditableTextSlot
                  value={data.bottomLeftFeature.category}
                  onChange={(val) => updateField('bottomLeftFeature.category', val)}
                  isSelected={selectedPath === 'bottomLeftFeature.category'}
                  onSelect={() => onSelectSlot?.('bottomLeftFeature.category', 'બોટમ ફીચર ૧ કેટેગરી')}
                  className="text-red-700 font-bold text-[11.5px] font-sans"
                />
              </div>

              <EditableTextSlot
                tagName="h4"
                value={data.bottomLeftFeature.headline}
                onChange={(val) => updateField('bottomLeftFeature.headline', val)}
                isSelected={selectedPath === 'bottomLeftFeature.headline'}
                onSelect={() => onSelectSlot?.('bottomLeftFeature.headline', 'બોટમ ફીચર ૧ હેડલાઇન')}
                className="text-[24px] font-black text-slate-950 leading-tight font-serif mb-1"
                maxLength={90}
              />

              <EditableTextSlot
                value={data.bottomLeftFeature.subheadline || ''}
                onChange={(val) => updateField('bottomLeftFeature.subheadline', val)}
                isSelected={selectedPath === 'bottomLeftFeature.subheadline'}
                onSelect={() => onSelectSlot?.('bottomLeftFeature.subheadline', 'બોટમ ફીચર ૧ સબહેડલાઇન')}
                className="text-[13px] font-bold text-slate-700 font-sans leading-snug mb-1.5"
                maxLength={100}
              />

              <div className="grid grid-cols-12 gap-3 items-start flex-1 overflow-hidden">
                <div className="col-span-6 text-[11px] leading-[1.42] text-slate-800 font-serif text-justify overflow-hidden">
                  {data.bottomLeftFeature.location && (
                    <span className="font-black text-red-700 shrink-0">{data.bottomLeftFeature.location} |&nbsp;</span>
                  )}
                  <EditableTextSlot
                    value={data.bottomLeftFeature.paragraph1}
                    onChange={(val) => updateField('bottomLeftFeature.paragraph1', val)}
                    isSelected={selectedPath === 'bottomLeftFeature.paragraph1'}
                    onSelect={() => onSelectSlot?.('bottomLeftFeature.paragraph1', 'બોટમ ફીચર ૧ પેરાગ્રાફ ૧')}
                    multiline
                  />
                </div>

                <div className="col-span-6 flex flex-col overflow-hidden">
                  <EditableImageSlot
                    src={data.bottomLeftFeature.image || ''}
                    onImageChange={(img) => updateField('bottomLeftFeature.image', img)}
                    isSelected={selectedPath === 'bottomLeftFeature.image'}
                    onSelect={() => onSelectSlot?.('bottomLeftFeature.image', 'બોટમ ફીચર ૧ ઈમેજ')}
                    containerHeight="115px"
                    className="mb-1"
                  />
                  {data.bottomLeftFeature.keyPoints && (
                    <KeyPointsBox
                      basePath="bottomLeftFeature"
                      title={data.bottomLeftFeature.keyPoints.title}
                      points={data.bottomLeftFeature.keyPoints.points}
                    />
                  )}
                  <div className="text-[10.5px] leading-[1.38] text-slate-800 font-serif text-justify overflow-hidden mt-1">
                    <EditableTextSlot
                      value={data.bottomLeftFeature.paragraph2}
                      onChange={(val) => updateField('bottomLeftFeature.paragraph2', val)}
                      isSelected={selectedPath === 'bottomLeftFeature.paragraph2'}
                      onSelect={() => onSelectSlot?.('bottomLeftFeature.paragraph2', 'બોટમ ફીચર ૧ પેરાગ્રાફ ૨')}
                      multiline
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right Feature: Tribal & Coastal Modern Education (PURE NEWS - NO AD!) */}
          <div className="col-span-6 pl-4 flex flex-col justify-between">
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-start mb-0.5">
                <EditableTextSlot
                  value={data.bottomRightFeature.category}
                  onChange={(val) => updateField('bottomRightFeature.category', val)}
                  isSelected={selectedPath === 'bottomRightFeature.category'}
                  onSelect={() => onSelectSlot?.('bottomRightFeature.category', 'બોટમ ફીચર ૨ કેટેગરી')}
                  className="text-red-700 font-bold text-[11.5px] font-sans"
                />
              </div>

              <EditableTextSlot
                tagName="h4"
                value={data.bottomRightFeature.headline}
                onChange={(val) => updateField('bottomRightFeature.headline', val)}
                isSelected={selectedPath === 'bottomRightFeature.headline'}
                onSelect={() => onSelectSlot?.('bottomRightFeature.headline', 'બોટમ ફીચર ૨ હેડલાઇન')}
                className="text-[24px] font-black text-slate-950 leading-tight font-serif mb-1"
                maxLength={90}
              />

              <EditableTextSlot
                value={data.bottomRightFeature.subheadline || ''}
                onChange={(val) => updateField('bottomRightFeature.subheadline', val)}
                isSelected={selectedPath === 'bottomRightFeature.subheadline'}
                onSelect={() => onSelectSlot?.('bottomRightFeature.subheadline', 'બોટમ ફીચર ૨ સબહેડલાઇન')}
                className="text-[13px] font-bold text-slate-700 font-sans leading-snug mb-1.5"
                maxLength={100}
              />

              <div className="grid grid-cols-12 gap-3 items-start flex-1 overflow-hidden">
                <div className="col-span-6 text-[11px] leading-[1.42] text-slate-800 font-serif text-justify overflow-hidden">
                  {data.bottomRightFeature.location && (
                    <span className="font-black text-red-700 shrink-0">{data.bottomRightFeature.location} |&nbsp;</span>
                  )}
                  <EditableTextSlot
                    value={data.bottomRightFeature.paragraph1}
                    onChange={(val) => updateField('bottomRightFeature.paragraph1', val)}
                    isSelected={selectedPath === 'bottomRightFeature.paragraph1'}
                    onSelect={() => onSelectSlot?.('bottomRightFeature.paragraph1', 'બોટમ ફીચર ૨ પેરાગ્રાફ ૧')}
                    multiline
                  />
                </div>

                <div className="col-span-6 flex flex-col overflow-hidden">
                  <EditableImageSlot
                    src={data.bottomRightFeature.image || ''}
                    onImageChange={(img) => updateField('bottomRightFeature.image', img)}
                    isSelected={selectedPath === 'bottomRightFeature.image'}
                    onSelect={() => onSelectSlot?.('bottomRightFeature.image', 'બોટમ ફીચર ૨ ઈમેજ')}
                    containerHeight="115px"
                    className="mb-1"
                  />
                  {data.bottomRightFeature.keyPoints && (
                    <KeyPointsBox
                      basePath="bottomRightFeature"
                      title={data.bottomRightFeature.keyPoints.title}
                      points={data.bottomRightFeature.keyPoints.points}
                    />
                  )}
                  <div className="text-[10.5px] leading-[1.38] text-slate-800 font-serif text-justify overflow-hidden mt-1">
                    <EditableTextSlot
                      value={data.bottomRightFeature.paragraph2}
                      onChange={(val) => updateField('bottomRightFeature.paragraph2', val)}
                      isSelected={selectedPath === 'bottomRightFeature.paragraph2'}
                      onSelect={() => onSelectSlot?.('bottomRightFeature.paragraph2', 'બોટમ ફીચર ૨ પેરાગ્રાફ ૨')}
                      multiline
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 5. PAGE 2 FOOTER & REGISTRATION MARKS ─── */}
        <div className="pt-2 border-t-2 border-slate-900 text-[11px] font-sans text-slate-700 flex justify-between items-center shrink-0">
          <span className="font-bold tracking-wider">GUJARAT POST • STATE & DISTRICT SPECIAL EDITION</span>
          <div className="flex items-center gap-1 text-[8px] font-mono tracking-widest text-slate-400">
            <span>●</span>
            <span className="text-cyan-600">●</span>
            <span className="text-pink-600">●</span>
            <span className="text-yellow-500">●</span>
            <span className="text-slate-900">●</span>
          </div>
          <span className="font-black text-slate-900">પાનું ૨ (PAGE 2 OF 4)</span>
        </div>

      </div>
    </EpaperReadOnlyProvider>
  );
};
