'use client';

import React from 'react';
import { Page4Data } from './types';
import { EditableTextSlot } from './EditableTextSlot';
import { EditableImageSlot } from './EditableImageSlot';
import { Trophy, Film, Sparkles, Brain, HeartPulse, Lightbulb, Star, Award, CheckCircle2 } from 'lucide-react';
import { useEpaperReadOnly, EpaperReadOnlyProvider } from './EpaperReadOnlyContext';

export interface Page4SportsProps {
  data: Page4Data;
  onChange: (newData: Page4Data) => void;
  selectedPath?: string;
  onSelectSlot?: (path: string, label: string) => void;
  onImportClick?: (slotPath: string, label: string) => void;
  onOpenHoroscopeEditor?: () => void;
  readOnly?: boolean;
}

const fallbackPage4 = {
  sectionTitle: 'સ્પોર્ટ્સ અને એન્ટરટેઇનમેન્ટ',
  topBarTagline: 'ગુજરાત પોસ્ટ • દૈનિક ઈ-પેપર',
  matchInfo: 'મેચ સમરી: ભારત વિ. ઓસ્ટ્રેલિયા : ભારત ૬ વિકેટે વિજયી • વિરાટ કોહલી ૧૧૪ (૧૨૦ બોલ), બુમરાહ ૪/૩૩ • લાઈવ સ્કોર અપડેટ્સ',
  mainSportsStory: {
    category: 'ક્રિકેટ વિશેષ',
    headline: 'ભારતીય ક્રિકેટ ટીમનો ભવ્ય વિજય: અંતિમ ઓવરમાં રોમાંચક જીત હાંસલ કરી',
    subheadline: 'વિરાટ કોહલીની ૧૧૪ રનની ઇનિંગ: બોલિંગમાં બુમરાહે ૪ વિકેટ ઝડપી વિજય પર મહોર લગાવી',
    location: 'અમદાવાદ',
    paragraph1: 'અમદાવાદ: નરેન્દ્ર મોદી સ્ટેડિયમ ખાતે રમાયેલી રોમાંચક વન-ડે શ્રેણીની આખરી મેચમાં ભારતીય ટીમે ઓસ્ટ્રેલિયા સામે ૪ વિકેટે ભવ્ય વિજય હાંસલ કર્યો છે. મુલાકાતી ટીમે આપેલા ૩૨૧ રનના વિશાળ લક્ષ્યાંકનો પીછો કરતા ભારતે ૪૯.૨ ઓવરમાં ૬ વિકેટ ગુમાવીને રોમાંચક જીત મેળવી હતી.',
    paragraph2: 'વિરાટ કોહલીએ શાનદાર ૧૧૪ રનની ઇનિંગ રમી હતી, જ્યારે સુકાની રોહિત શર્માએ ૬૮ રનનું યોગદાન આપ્યું હતું. બોલિંગમાં જસપ્રીત બુમરાહે ડેથ ઓવરોમાં ઘાતક યોર્કર ફેંકી ૪ મહત્વની વિકેટ ઝડપી જીત નક્કી કરી હતી.',
    articleBody: 'અમદાવાદ: નરેન્દ્ર મોદી સ્ટેડિયમ ખાતે રમાયેલી રોમાંચક વન-ડે શ્રેણીની આખરી મેચમાં ભારતીય ટીમે ઓસ્ટ્રેલિયા સામે ૪ વિકેટે ભવ્ય વિજય હાંસલ કર્યો છે.',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
    caption: 'અમદાવાદના નરેન્દ્ર મોદી સ્ટેડિયમમાં ઐતિહાસિક જીત બાદ ઉજવણી કરતા ભારતીય ખેલાડીઓ',
    keyPoints: {
      title: 'મેચ હાઇલાઇટ્સ',
      points: [
        'ભારત ૪ વિકેટે વિજયી',
        'વિરાટ કોહલીની ૧૧૪ રનની સદી',
        'જસપ્રીત બુમરાહની ૪/૩૩ શ્રેષ્ઠ બોલિંગ',
      ],
    },
    matchScorecard: {
      title: '🏏 મેચ સમરી સ્કોરકાર્ડ',
      venue: 'અમદાવાદ',
      team1Name: 'ભારત:',
      team1Score: '૩૨૪/૬ (૪૯.૨ ઓવર)',
      team1Details: 'વિરાટ ૧૧૪ (૧૨૦), રોહિત ૬૮ (૫૮)',
      team2Name: 'ઓસ્ટ્રેલિયા:',
      team2Score: '૩૨૦/૯ (૫૦ ઓવર)',
      team2Details: 'બુમરાહ ૪/૩૩, શમી ૩/૪૨',
    },
  },
  sportsRoundupTitle: '⚡ રમત-ગમત સંક્ષિપ્ત (SPORTS ROUNDUP)',
  secondarySportsStory: {
    category: 'એથ્લેટિક્સ',
    headline: 'ઓલિમ્પિક્સ ક્વોલિફાયરમાં ગુજરાતી ખેલાડીએ ગોલ્ડ મેડલ જીત્યો',
    subheadline: '૮૮.૫ મીટરના ઐતિહાસિક ભાલા ફેંક સાથે આગામી રમતો માટે સીધી એન્ટ્રી મેળવી',
    location: 'ટોક્યો',
    paragraph1: 'ટોક્યો ખાતે યોજાયેલી એશિયન એથ્લેટિક્સ ચેમ્પિયનશિપમાં ગુજરાતના યુવા એથ્લેટ નીરજ પટેલે ૮૮.૫ મીટરના થ્રો સાથે સુવર્ણચંદ્રક જીતી નવો રાષ્ટ્રીય કીર્તિમાન સ્થાપ્યો છે. રાજ્ય સરકારે ₹૧ કરોડના ઇનામની જાહેરાત કરી છે.',
    paragraph2: 'આ સિદ્ધિ સાથે નીરજ પટેલ ઓલિમ્પિક્સ માટે ક્વોલિફાય થનાર રાજ્યના પ્રથમ ટ્રેક એન્ડ ફિલ્ડ એથ્લેટ બન્યા છે.',
    articleBody: 'ટોક્યો ખાતે યોજાયેલી એશિયન એથ્લેટિક્સ ચેમ્પિયનશિપમાં ગુજરાતના યુવા એથ્લેટ નીરજ પટેલે ૮૮.૫ મીટરના થ્રો સાથે સુવર્ણચંદ્રક જીતી નવો રાષ્ટ્રીય કીર્તિમાન સ્થાપ્યો છે.',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=600&q=80',
    caption: 'સુવર્ણચંદ્રક સાથે ગુજરાતી એથ્લેટ નીરજ પટેલ',
  },
  sportsBriefs: [
    {
      id: 'sb_1',
      category: 'બેડમિન્ટન',
      headline: 'પી.વી. સિંધુ સ્વિસ ઓપનની ફાઇનલમાં પ્રવેશી',
      location: 'બાસેલ',
      articleBody: 'ભારતીય સ્ટાર શટલરે સેમિફાઇનલમાં જાપાનની પ્રતિસ્પર્ધીને ૨૧-૧૮, ૨૧-૧૫થી હરાવી ટાઇટલ મેચમાં પ્રવેશ કર્યો.',
    },
    {
      id: 'sb_2',
      category: 'ચેસ',
      headline: 'પ્રજ્ઞાનાનંદાએ વર્લ્ડ ચેમ્પિયનને હરાવ્યો',
      location: 'ઓસ્લો',
      articleBody: 'ભારતના યુવા ગ્રાન્ડમાસ્ટરે શાનદાર એન્ડગેમ વ્યુહરચના દ્વારા વર્લ્ડ નંબર ૧ કાર્લસનને પરાજિત કરી ઇતિહાસ રચ્યો.',
    },
    {
      id: 'sb_3',
      category: 'ટેબલ ટેનિસ',
      headline: 'મનિકા બત્રા એશિયન કપના ટોપ-૮માં પ્રવેશી',
      location: 'બેંગકોક',
      articleBody: 'ભારતીય પેડલર મનિકા બત્રાએ કોરિયન ખેલાડી સામે રોમાંચક ૪-૩થી વિજય મેળવી ક્વાર્ટર ફાઇનલમાં સ્થાન બનાવ્યું.',
    },
    {
      id: 'sb_4',
      category: 'ખેલ મહાકુંભ',
      headline: 'ગુજરાતમાં ૫૫ લાખ ખેલાડીઓએ રજીસ્ટ્રેશન નોંધાવ્યું',
      location: 'ગાંધીનગર',
      articleBody: 'રાજ્ય કક્ષાએથી ગ્રામીણ કક્ષા સુધી ૨૯ વિવિધ રમતોમાં યુવા પ્રતિભાઓને પ્રોત્સાહન અપાશે.',
    },
  ],
  entertainmentStory: {
    category: 'મનોરંજન',
    headline: 'ગુજરાતી સિનેમાની નવી બ્લોકબસ્ટર ફિલ્મ: પહેલા જ દિવસે બોક્સ ઓફિસ પર ધમાકો',
    subheadline: 'અર્બન કોમેડી અને ફેમિલી ડ્રામા દર્શકોને સિનેમાઘરો તરફ આકર્ષિત કરવામાં સફળ',
    location: 'મુંબઈ',
    paragraph1: 'મુંબઈ: દેશભરના ૧,૮૦૦થી વધુ સ્ક્રીન્સ પર રિલીઝ થયેલી નવી ગુજરાતી પારિવારિક ડ્રામા ફિલ્મે પહેલા જ દિવસે બોક્સ ઓફિસ પર સર્વકાલીન નવો રેકોર્ડ બનાવ્યો છે. ફિલ્મ ક્રિટિક્સ દ્વારા ફિલ્મને ૪.૫ સ્ટાર રેટિંગ આપવામાં આવ્યું છે.',
    paragraph2: 'અમદાવાદ, સુરત અને રાજકોટના મલ્ટીપ્લેક્સમાં સતત તમામ શો હાઉસફુલ રહ્યા છે. દર્શકો વાર્તા અને કલાકારોના અભિનયની ભારે પ્રશંસા કરી રહ્યા છે.',
    articleBody: 'મુંબઈ: દેશભરના ૧,૮૦૦થી વધુ સ્ક્રીન્સ પર રિલીઝ થયેલી નવી ગુજરાતી પારિવારિક ડ્રામા ફિલ્મે પહેલા જ દિવસે બોક્સ ઓફિસ પર સર્વકાલીન નવો રેકોર્ડ બનાવ્યો છે.',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    caption: 'ફિલ્મ પ્રીમિયર દરમિયાન કલાકારો અને નિર્દેશકની ખાસ ક્ષણ',
    keyPoints: {
      title: 'ફિલ્મના ખાસ પાસાં',
      points: [
        'પ્રથમ દિવસે ₹૪.૫ કરોડનું ઓપનિંગ',
        'કલાકારોનો હૃદયસ્પર્શી અભિનય',
        'ક્રિટિક્સ રેટિંગ: ★★★★☆ ૪.૫/૫',
      ],
    },
    boxOffice: {
      title: '📊 બોક્સ ઓફિસ કલેક્શન',
      rating: '★★★★☆ ૪.૫/૫',
      day1Label: 'પ્રથમ દિવસ',
      day1Val: '₹૪.૫ કરોડ',
      weekendLabel: 'વીકેન્ડ',
      weekendVal: '₹૧૮ કરોડ',
      totalLabel: 'કુલ આવક',
      totalVal: '₹૧૫૦ કરોડ+',
    },
  },
  ottLifestyleStory: {
    category: 'ઓટીટી & વેબ સિરીઝ',
    headline: 'આ સપ્તાહે ઓટીટી પ્લેટફોર્મ્સ પર ધૂમ મચાવશે નવી રહસ્યમય ક્રાઈમ થ્રિલર સિરીઝ',
    subheadline: 'ટોચના ઓટીટી પ્લેટફોર્મ પર રજૂ થનારી વર્ષની સૌથી પ્રતીક્ષિત સિરીઝનું સ્ટ્રીમિંગ શરૂ',
    location: 'મનોરંજન ડેસ્ક',
    paragraph1: 'ડિજિટલ પ્લેટફોર્મ્સ પર આ સપ્તાહ મનોરંજન પ્રેમીઓ માટે અત્યંત રોમાંચક બની રહ્યું છે. પ્રખ્યાત ડિરેક્ટર દ્વારા દિગ્દર્શિત નવી સસ્પેન્સ ક્રાઈમ થ્રિલર સિરીઝનું વૈશ્વિક પ્રીમિયર યોજાઈ ચૂક્યું છે જેને જબરદસ્ત રિસ્પોન્સ મળ્યો છે.',
    paragraph2: 'આ સિરીઝ ઉપરાંત કોમેડી, રોમાન્સ અને સાયન્સ ફિક્શન જોનરમાં અન્ય ૪ મોટી ફિલ્મો પણ રિલીઝ થઈ છે.',
    articleBody: 'ડિજિટલ પ્લેટફોર્મ્સ પર આ સપ્તાહ મનોરંજન પ્રેમીઓ માટે અત્યંત રોમાંચક બની રહ્યું છે.',
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=600&q=80',
    caption: 'ઓટીટી પ્લેટફોર્મ પર રિલીઝ થયેલી નવી વેબ સિરીઝ',
    ottPicks: {
      title: '🍿 આ સપ્તાહના ટોચના ૩ ઓટીટી પિક્સ',
      tagline: 'સ્ટ્રીમિંગ નાઉ',
      pick1Platform: 'Netflix',
      pick1Title: 'ક્રાઇમ ડાયરીઝ',
      pick2Platform: 'Prime',
      pick2Title: 'પંચાયત સિઝન',
      pick3Platform: 'Hotstar',
      pick3Title: 'સ્પેશિયલ ઓપ્સ',
    },
  },
  horoscope: [
    { signGu: 'મેષ', signEn: 'Aries', prediction: 'વેપારમાં લાભદાયી તક મળશે. પરિવારમાં આનંદ રહેશે.', luckyNo: '૯', luckyColor: 'લાલ' },
    { signGu: 'વૃષભ', signEn: 'Taurus', prediction: 'આર્થિક સ્થિતિ મજબૂત બનશે. નવું કાર્ય શરૂ થશે.', luckyNo: '૬', luckyColor: 'સફેદ' },
    { signGu: 'મિથુન', signEn: 'Gemini', prediction: 'ઉતાવળ ન કરવી. મિત્રોનો સાથ-સહકાર મળશે.', luckyNo: '૫', luckyColor: 'લીલો' },
    { signGu: 'કર્ક', signEn: 'Cancer', prediction: 'કારકિર્દીમાં નવી તકો ખુલશે. આરોગ્ય સારું રહેશે.', luckyNo: '૨', luckyColor: 'સફેદ' },
    { signGu: 'સિંહ', signEn: 'Leo', prediction: 'આત્મવિશ્વાસ વધશે. અટકેલા નાણાં પરત મળશે.', luckyNo: '૧', luckyColor: 'સોનેરી' },
    { signGu: 'કન્યા', signEn: 'Virgo', prediction: 'આકસ્મિક ધનલાભના યોગ. પરીક્ષામાં સફળતા મળશે.', luckyNo: '૫', luckyColor: 'લીલો' },
    { signGu: 'તુલા', signEn: 'Libra', prediction: 'સામાજિક પ્રતિષ્ઠા વધશે. શુભ કાર્યનું આયોજન થશે.', luckyNo: '૬', luckyColor: 'ગુલાબી' },
    { signGu: 'વૃશ્ચિક', signEn: 'Scorpio', prediction: 'નવા સંપર્કોથી ફાયદો. વ્યવસાયમાં વૃદ્ધિ થશે.', luckyNo: '૯', luckyColor: 'લાલ' },
    { signGu: 'ધન', signEn: 'Sagittarius', prediction: 'ધાર્મિક કાર્યોમાં રુચિ વધશે. સન્માન પ્રાપ્ત થશે.', luckyNo: '૩', luckyColor: 'પીળો' },
    { signGu: 'મકર', signEn: 'Capricorn', prediction: 'મનોબળ દ્રઢ રહેશે. જૂની ચિંતાઓ દૂર થશે.', luckyNo: '૮', luckyColor: 'વાદળી' },
    { signGu: 'કુંભ', signEn: 'Aquarius', prediction: 'નવા પ્રોજેક્ટ મંજૂર થશે. યાત્રા લાભદાયી રહેશે.', luckyNo: '૮', luckyColor: 'કાળો' },
    { signGu: 'મીન', signEn: 'Pisces', prediction: 'સર્જનાત્મક કાર્યોમાં પ્રગતિ. પરિવાર સાથે સમય વીતશે.', luckyNo: '૩', luckyColor: 'પીળો' },
  ],
  bottomStories: [
    {
      id: 'p4_bottom_1',
      category: '🏏 ટી૨૦ & યુવા લીગ',
      headline: 'ગુજરાત પ્રીમિયર લીગ ટી૨૦: યુવા ખેલાડીઓના દમદાર પ્રદર્શનથી રોમાંચક વિજય',
      subheadline: 'છેલ્લી ઓવરમાં ૧૮ રનની જરૂરિયાત વચ્ચે સતત બે સિક્સર ફટકારી ટીમને ફાઇનલમાં પહોંચાડી',
      location: 'રાજકોટ',
      paragraph1: 'રાજકોટ: સૌરાષ્ટ્ર ક્રિકેટ એસોસિએશન સ્ટેડિયમ ખાતે રમાયેલી ગુજરાત ટી૨૦ લીગની હાઇ-વોલ્ટેજ સેમિફાઇનલ મેચમાં યુવા ઓલરાઉન્ડરે અવિશ્વસનીય બેટિંગ કરી પોતાની ટીમને અદભુત વિજય અપાવ્યો હતો. દર્શકોથી ખીચોખીચ ભરેલા સ્ટેડિયમમાં છેલ્લી ઓવર સુધી રોમાંચ ચરમસીમા પર રહ્યો હતો.',
      paragraph2: 'મેચ વિનિંગ ઇનિંગ બદલ તેમને મેન ઓફ ધ મેચ જાહેર કરાયા હતા. પસંદગીકારોએ જણાવ્યું હતું કે આવા ઘરેલુ ટુર્નામેન્ટથી રાજ્યમાંથી રાષ્ટ્રીય સ્તરની શ્રેષ્ઠ પ્રતિભાઓ સામે આવી રહી છે.',
      articleBody: 'રાજકોટ: સૌરાષ્ટ્ર ક્રિકેટ એસોસિએશન સ્ટેડિયમ ખાતે રમાયેલી ગુજરાત ટી૨૦ લીગની હાઇ-વોલ્ટેજ સેમિફાઇનલ મેચમાં યુવા ઓલરાઉન્ડરે અવિશ્વસનીય બેટિંગ કરી પોતાની ટીમને અદભુત વિજય અપાવ્યો હતો.\n\nમેચ વિનિંગ ઇનિંગ બદલ તેમને મેન ઓફ ધ મેચ જાહેર કરાયા હતા.',
      image: 'https://images.unsplash.com/photo-1531415074868-036b1c57e329?auto=format&fit=crop&w=600&q=80',
      caption: 'વિજયી શોટ ફટકાર્યા બાદ બેટ્સમેનનું ઉત્સાહભર્યું સેલિબ્રેશન',
    },
    {
      id: 'p4_bottom_2',
      category: '🏸 બેડમિન્ટન ચેમ્પિયનશિપ',
      headline: 'વર્લ્ડ બેડમિન્ટન સિરીઝ: ભારતીય જોડી ક્વાર્ટર ફાઇનલમાં દમદાર પ્રવેશ',
      subheadline: 'વિશ્વની નંબર ૩ જોડી સામે સીધા સેટોમાં ૨૧-૧૯, ૨૧-૧૬થી મેળવી સનસનાટીભરી જીત',
      location: 'બેંગકોક',
      paragraph1: 'બેંગકોક: થાઈલેન્ડ ઓપન સુપર સિરીઝમાં ભારતીય મેન્સ ડબલ્સ જોડીએ શાનદાર સંકલન અને આક્રમક રમતનું પ્રદર્શન કરી ક્વાર્ટર ફાઇનલમાં પોતાનું સ્થાન નિશ્ચિત કર્યું છે. સમગ્ર મેચ દરમિયાન ભારતીય જોડીએ નેટ પ્લે અને સ્મેશિંગમાં સતત દબદબો જાળવી રાખ્યો હતો.',
      paragraph2: 'કોચે જણાવ્યું કે બંને ખેલાડીઓ શારીરિક અને માનસિક રીતે શ્રેષ્ઠ ફોર્મમાં છે અને આગામી રાઉન્ડમાં પણ આ જ લય જાળવી રાખવા માટે સંપૂર્ણ પ્રતિબદ્ધ છે.',
      articleBody: 'બેંગકોક: થાઈલેન્ડ ઓપન સુપર સિરીઝમાં ભારતીય મેન્સ ડબલ્સ જોડીએ શાનદાર સંકલન અને આક્રમક રમતનું પ્રદર્શન કરી ક્વાર્ટર ફાઇનલમાં પોતાનું સ્થાન નિશ્ચિત કર્યું છે.\n\nકોચે જણાવ્યું કે બંને ખેલાડીઓ શારીરિક અને માનસિક રીતે શ્રેષ્ઠ ફોર્મમાં છે.',
      image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
      caption: 'કોર્ટ પર આક્રમક રમતનું પ્રદર્શન કરતી ભારતીય ડબલ્સ જોડી',
    },
    {
      id: 'p4_bottom_3',
      category: '🎭 રંગભૂમિ & કલા મહોત્સવ',
      headline: 'ગુજરાતી નાટ્ય મહોત્સવ: ૨૫ નવા નાટકોનું ભવ્ય મંચન, કલાકારોનું સન્માન',
      subheadline: 'રાજ્યભરમાંથી આવેલા ૧૫૦થી વધુ કલાકારોએ પોતાની કલાનું સર્વોત્કૃષ્ટ પ્રદર્શન કર્યું',
      location: 'અમદાવાદ',
      paragraph1: 'અમદાવાદ: ટાગોર હોલ ખાતે શરૂ થયેલા સપ્તાહવ્યાપી રાષ્ટ્રીય ગુજરાતી નાટ્ય મહોત્સવમાં પ્રથમ દિવસે ત્રણ પ્રયોગશીલ નાટકોનું મંચન થયું હતું જેને દર્શકો દ્વારા સ્ટેન્ડિંગ ઓવેશન મળ્યું હતું. યુવા લેખકો અને નિર્દેશકો દ્વારા રજૂ કરાયેલા સામાજિક વિષયોએ ઊંડી છાપ છોડી હતી.',
      paragraph2: 'મહોત્સવના સમાપન સમારોહમાં પીઢ રંગભૂમિ કલાકારોને લાઈફટાઈમ એચીવમેન્ટ એવોર્ડથી સન્માનિત કરવામાં આવશે. સાંસ્કૃતિક વિભાગ દ્વારા આ મહોત્સવને વ્યાપક સમર્થન અપાયું છે.',
      articleBody: 'અમદાવાદ: ટાગોર હોલ ખાતે શરૂ થયેલા સપ્તાહવ્યાપી રાષ્ટ્રીય ગુજરાતી નાટ્ય મહોત્સવમાં પ્રથમ દિવસે ત્રણ પ્રયોગશીલ નાટકોનું મંચન થયું હતું જેને દર્શકો દ્વારા સ્ટેન્ડિંગ ઓવેશન મળ્યું હતું.\n\nમહોત્સવના સમાપન સમારોહમાં પીઢ રંગભૂમિ કલાકારોનું સન્માન થશે.',
      image: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?auto=format&fit=crop&w=600&q=80',
      caption: 'નાટ્ય મંચન દરમિયાન પાત્રમાં ઓતપ્રોત થયેલા રંગભૂમિના કલાકારો',
    },
  ],
  brainTeaser: {
    title: 'સુડોકુ & મગજની કસરત',
    description: 'દરેક આડી હરોળ, ઊભા સ્તંભ અને ૩x૩ ચોરસમાં ૧ થી ૯ ના અંકો પુનરાવર્તન વિના એક જ વાર આવે.',
    tip: 'આજની કસરત: ૧ થી ૯ ના અંકો દરેક ચોરસમાં સાચી રીતે ગોઠવી મગજને સતેજ બનાવો.',
  },
};

export const Page4Sports: React.FC<Page4SportsProps> = ({
  data: inputData,
  onChange,
  selectedPath,
  onSelectSlot,
  readOnly,
  onOpenHoroscopeEditor,
}) => {
  const contextReadOnly = useEpaperReadOnly();
  const isReadOnly = Boolean(readOnly ?? contextReadOnly);

  // Normalize data with robust fallbacks
  const data = React.useMemo(() => {
    const raw: any = inputData || {};
    const msStory: any = raw.mainSportsStory || {};
    const ssStory: any = raw.secondarySportsStory || {};
    const entStory: any = raw.entertainmentStory || {};
    const ottStory: any = raw.ottLifestyleStory || {};
    let briefs: any[] = [];
    if (Array.isArray(raw.sportsBriefs) && raw.sportsBriefs.length > 0) {
      briefs = raw.sportsBriefs;
    } else if (raw.sportsBriefs && typeof raw.sportsBriefs === 'object') {
      const vals = Object.values(raw.sportsBriefs);
      if (vals.length > 0) briefs = vals;
    }
    if (briefs.length === 0) {
      briefs = fallbackPage4.sportsBriefs;
    }

    let bottomNews: any[] = [];
    if (Array.isArray(raw.bottomStories) && raw.bottomStories.length > 0) {
      bottomNews = raw.bottomStories.slice(0, 3);
    } else if (raw.bottomStories && typeof raw.bottomStories === 'object') {
      const vals = Object.values(raw.bottomStories);
      if (vals.length > 0) bottomNews = vals.slice(0, 3);
    }
    if (bottomNews.length === 0) {
      bottomNews = fallbackPage4.bottomStories.slice(0, 3);
    }

    const horo: any[] = Array.isArray(raw.horoscope) && raw.horoscope.length > 0
      ? raw.horoscope
      : fallbackPage4.horoscope;
    const bt: any = raw.brainTeaser || fallbackPage4.brainTeaser;

    return {
      sectionTitle: raw.sectionTitle || fallbackPage4.sectionTitle,
      topBarTagline: raw.topBarTagline || fallbackPage4.topBarTagline,
      matchInfo: raw.matchInfo || fallbackPage4.matchInfo,
      mainSportsStory: {
        category: msStory.category || fallbackPage4.mainSportsStory.category,
        headline: msStory.headline || fallbackPage4.mainSportsStory.headline,
        subheadline: msStory.subheadline || fallbackPage4.mainSportsStory.subheadline,
        location: msStory.location || fallbackPage4.mainSportsStory.location,
        paragraph1: msStory.paragraph1 || msStory.articleBody || fallbackPage4.mainSportsStory.paragraph1,
        paragraph2: msStory.paragraph2 || fallbackPage4.mainSportsStory.paragraph2,
        body: msStory.body || msStory.articleBody || fallbackPage4.mainSportsStory.articleBody,
        image: msStory.image || fallbackPage4.mainSportsStory.image,
        caption: msStory.caption || fallbackPage4.mainSportsStory.caption,
        keyPoints: msStory.keyPoints
          ? {
              title: msStory.keyPoints.title || fallbackPage4.mainSportsStory.keyPoints.title,
              points: Array.isArray(msStory.keyPoints.points)
                ? msStory.keyPoints.points.slice(0, 3)
                : fallbackPage4.mainSportsStory.keyPoints.points,
            }
          : fallbackPage4.mainSportsStory.keyPoints,
        matchScorecard: {
          title: msStory.matchScorecard?.title || fallbackPage4.mainSportsStory.matchScorecard.title,
          venue: msStory.matchScorecard?.venue || fallbackPage4.mainSportsStory.matchScorecard.venue,
          team1Name: msStory.matchScorecard?.team1Name || fallbackPage4.mainSportsStory.matchScorecard.team1Name,
          team1Score: msStory.matchScorecard?.team1Score || fallbackPage4.mainSportsStory.matchScorecard.team1Score,
          team1Details: msStory.matchScorecard?.team1Details || fallbackPage4.mainSportsStory.matchScorecard.team1Details,
          team2Name: msStory.matchScorecard?.team2Name || fallbackPage4.mainSportsStory.matchScorecard.team2Name,
          team2Score: msStory.matchScorecard?.team2Score || fallbackPage4.mainSportsStory.matchScorecard.team2Score,
          team2Details: msStory.matchScorecard?.team2Details || fallbackPage4.mainSportsStory.matchScorecard.team2Details,
        },
      },
      sportsRoundupTitle: raw.sportsRoundupTitle || fallbackPage4.sportsRoundupTitle,
      secondarySportsStory: {
        category: ssStory.category || fallbackPage4.secondarySportsStory.category,
        headline: ssStory.headline || fallbackPage4.secondarySportsStory.headline,
        subheadline: ssStory.subheadline || fallbackPage4.secondarySportsStory.subheadline,
        location: ssStory.location || fallbackPage4.secondarySportsStory.location,
        paragraph1: ssStory.paragraph1 || ssStory.articleBody || fallbackPage4.secondarySportsStory.paragraph1,
        paragraph2: ssStory.paragraph2 || fallbackPage4.secondarySportsStory.paragraph2,
        body: ssStory.body || ssStory.articleBody || fallbackPage4.secondarySportsStory.articleBody,
        image: ssStory.image || fallbackPage4.secondarySportsStory.image,
        caption: ssStory.caption || fallbackPage4.secondarySportsStory.caption,
      },
      sportsBriefs: briefs.map((b: any, idx: number) => ({
        id: b.id || `sb_${idx + 1}`,
        category: b.category || fallbackPage4.sportsBriefs[idx]?.category || 'સ્પોર્ટ્સ',
        headline: b.headline || fallbackPage4.sportsBriefs[idx]?.headline || '',
        location: b.location || fallbackPage4.sportsBriefs[idx]?.location || '',
        articleBody: b.articleBody || fallbackPage4.sportsBriefs[idx]?.articleBody || '',
      })),
      entertainmentStory: {
        category: entStory.category || fallbackPage4.entertainmentStory.category,
        headline: entStory.headline || fallbackPage4.entertainmentStory.headline,
        subheadline: entStory.subheadline || fallbackPage4.entertainmentStory.subheadline,
        location: entStory.location || fallbackPage4.entertainmentStory.location,
        paragraph1: entStory.paragraph1 || entStory.articleBody || fallbackPage4.entertainmentStory.paragraph1,
        paragraph2: entStory.paragraph2 || fallbackPage4.entertainmentStory.paragraph2,
        body: entStory.body || entStory.articleBody || fallbackPage4.entertainmentStory.articleBody,
        image: entStory.image || fallbackPage4.entertainmentStory.image,
        caption: entStory.caption || fallbackPage4.entertainmentStory.caption,
        keyPoints: entStory.keyPoints
          ? {
              title: entStory.keyPoints.title || fallbackPage4.entertainmentStory.keyPoints.title,
              points: Array.isArray(entStory.keyPoints.points)
                ? entStory.keyPoints.points.slice(0, 3)
                : fallbackPage4.entertainmentStory.keyPoints.points.slice(0, 3),
            }
          : fallbackPage4.entertainmentStory.keyPoints,
        boxOffice: {
          title: entStory.boxOffice?.title || fallbackPage4.entertainmentStory.boxOffice.title,
          rating: entStory.boxOffice?.rating || fallbackPage4.entertainmentStory.boxOffice.rating,
          day1Label: entStory.boxOffice?.day1Label || fallbackPage4.entertainmentStory.boxOffice.day1Label,
          day1Val: entStory.boxOffice?.day1Val || fallbackPage4.entertainmentStory.boxOffice.day1Val,
          weekendLabel: entStory.boxOffice?.weekendLabel || fallbackPage4.entertainmentStory.boxOffice.weekendLabel,
          weekendVal: entStory.boxOffice?.weekendVal || fallbackPage4.entertainmentStory.boxOffice.weekendVal,
          totalLabel: entStory.boxOffice?.totalLabel || fallbackPage4.entertainmentStory.boxOffice.totalLabel,
          totalVal: entStory.boxOffice?.totalVal || fallbackPage4.entertainmentStory.boxOffice.totalVal,
        },
      },
      ottLifestyleStory: {
        category: ottStory.category || fallbackPage4.ottLifestyleStory.category,
        headline: ottStory.headline || fallbackPage4.ottLifestyleStory.headline,
        subheadline: ottStory.subheadline || fallbackPage4.ottLifestyleStory.subheadline,
        location: ottStory.location || fallbackPage4.ottLifestyleStory.location,
        paragraph1: ottStory.paragraph1 || ottStory.articleBody || fallbackPage4.ottLifestyleStory.paragraph1,
        paragraph2: ottStory.paragraph2 || fallbackPage4.ottLifestyleStory.paragraph2,
        body: ottStory.body || ottStory.articleBody || fallbackPage4.ottLifestyleStory.articleBody,
        image: ottStory.image || fallbackPage4.ottLifestyleStory.image,
        caption: ottStory.caption || fallbackPage4.ottLifestyleStory.caption,
        ottPicks: {
          title: ottStory.ottPicks?.title || fallbackPage4.ottLifestyleStory.ottPicks.title,
          tagline: ottStory.ottPicks?.tagline || fallbackPage4.ottLifestyleStory.ottPicks.tagline,
          pick1Platform: ottStory.ottPicks?.pick1Platform || fallbackPage4.ottLifestyleStory.ottPicks.pick1Platform,
          pick1Title: ottStory.ottPicks?.pick1Title || fallbackPage4.ottLifestyleStory.ottPicks.pick1Title,
          pick2Platform: ottStory.ottPicks?.pick2Platform || fallbackPage4.ottLifestyleStory.ottPicks.pick2Platform,
          pick2Title: ottStory.ottPicks?.pick2Title || fallbackPage4.ottLifestyleStory.ottPicks.pick2Title,
          pick3Platform: ottStory.ottPicks?.pick3Platform || fallbackPage4.ottLifestyleStory.ottPicks.pick3Platform,
          pick3Title: ottStory.ottPicks?.pick3Title || fallbackPage4.ottLifestyleStory.ottPicks.pick3Title,
        },
      },
      horoscope: horo.map((h: any, idx: number) => ({
        signGu: h.signGu || fallbackPage4.horoscope[idx]?.signGu || '',
        signEn: h.signEn || fallbackPage4.horoscope[idx]?.signEn || '',
        prediction: h.prediction || fallbackPage4.horoscope[idx]?.prediction || '',
        luckyNo: h.luckyNo || fallbackPage4.horoscope[idx]?.luckyNo || '૯',
        luckyColor: h.luckyColor || fallbackPage4.horoscope[idx]?.luckyColor || 'લાલ',
      })),
      brainTeaser: {
        title: bt.title || fallbackPage4.brainTeaser.title,
        description: bt.description || fallbackPage4.brainTeaser.description,
        tip: bt.tip || fallbackPage4.brainTeaser.tip,
      },
      bottomStories: bottomNews.map((s: any, idx: number) => ({
        id: s.id || `p4_bottom_${idx + 1}`,
        category: s.category || fallbackPage4.bottomStories[idx]?.category || 'સમાચાર',
        headline: s.headline || fallbackPage4.bottomStories[idx]?.headline || '',
        subheadline: s.subheadline || fallbackPage4.bottomStories[idx]?.subheadline || '',
        location: s.location || fallbackPage4.bottomStories[idx]?.location || '',
        paragraph1: s.paragraph1 || s.articleBody || fallbackPage4.bottomStories[idx]?.paragraph1 || '',
        paragraph2: s.paragraph2 || fallbackPage4.bottomStories[idx]?.paragraph2 || '',
        body: s.body || s.articleBody || fallbackPage4.bottomStories[idx]?.articleBody || '',
        articleBody: s.articleBody || s.body || fallbackPage4.bottomStories[idx]?.articleBody || '',
        image: s.image || fallbackPage4.bottomStories[idx]?.image || '',
        caption: s.caption || fallbackPage4.bottomStories[idx]?.caption || '',
      })),
    };
  }, [inputData]);

  const updateField = (path: string, value: any) => {
    const clone = JSON.parse(JSON.stringify(data));

    if (path === 'sportsRoundupTitle') {
      clone.sportsRoundupTitle = value;
      onChange(clone);
      return;
    }

    if (path.startsWith('sportsBriefs.')) {
      if (!Array.isArray(clone.sportsBriefs)) {
        clone.sportsBriefs = JSON.parse(JSON.stringify(fallbackPage4.sportsBriefs));
      }
      const parts = path.split('.');
      const idx = Number(parts[1]) || 0;
      const subField = parts[2];
      if (!clone.sportsBriefs[idx]) {
        clone.sportsBriefs[idx] = JSON.parse(JSON.stringify(fallbackPage4.sportsBriefs[idx] || {}));
      }
      clone.sportsBriefs[idx][subField] = value;
      onChange(clone);
      return;
    }

    if (path.startsWith('bottomStories.')) {
      if (!Array.isArray(clone.bottomStories)) {
        clone.bottomStories = JSON.parse(JSON.stringify(fallbackPage4.bottomStories));
      }
      const parts = path.split('.');
      const idx = Number(parts[1]) || 0;
      const subField = parts[2];
      if (!clone.bottomStories[idx]) {
        clone.bottomStories[idx] = JSON.parse(JSON.stringify(fallbackPage4.bottomStories[idx] || {}));
      }
      clone.bottomStories[idx][subField] = value;
      if (subField === 'paragraph1' || subField === 'paragraph2') {
        const p1 = clone.bottomStories[idx].paragraph1 || '';
        const p2 = clone.bottomStories[idx].paragraph2 || '';
        const combined = [p1, p2].filter(Boolean).join('\n\n');
        clone.bottomStories[idx].articleBody = combined;
        clone.bottomStories[idx].body = combined;
      }
      onChange(clone);
      return;
    }

    const keys = path.split('.');
    let current = clone;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    // Cross sync paragraphs into articleBody
    if (path.includes('paragraph1') || path.includes('paragraph2')) {
      const rootPath = path.substring(0, path.lastIndexOf('.'));
      let target = clone;
      const rootKeys = rootPath.split('.');
      for (const k of rootKeys) {
        if (!target[k]) target[k] = {};
        target = target[k];
      }
      const p1 = target.paragraph1 || '';
      const p2 = target.paragraph2 || '';
      const combined = [p1, p2].filter(Boolean).join('\n\n');
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
  }) => (
    <div className="bg-white border-2 border-emerald-700/80 p-1.5 shadow-xs my-1">
      <div className="bg-emerald-800 text-white font-sans font-black text-center py-0.5 px-1 mb-1 tracking-wider uppercase">
        <EditableTextSlot
          value={title}
          onChange={(val) => updateField(`${basePath}.keyPoints.title`, val)}
          isSelected={selectedPath === `${basePath}.keyPoints.title`}
          onSelect={() => onSelectSlot?.(`${basePath}.keyPoints.title`, 'મુદ્દા શીર્ષક')}
          className={`${titleClassName} font-bold text-white text-center block`}
        />
      </div>
      <ul className="space-y-0.5 px-1">
        {(Array.isArray(points) ? points.slice(0, 3) : []).map((pt: string, pIdx: number) => (
          <li key={pIdx} className="flex items-start gap-1 font-serif text-slate-900 leading-tight">
            <span className="w-1.5 h-1.5 bg-emerald-700 rounded-full mt-1 shrink-0" />
            <EditableTextSlot
              value={pt}
              onChange={(val) => {
                const newPts = [...(points || []).slice(0, 3)];
                newPts[pIdx] = val;
                updateField(`${basePath}.keyPoints.points`, newPts.slice(0, 3));
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
      <div className="w-[1224px] h-[1815px] max-h-[1815px] max-w-[1224px] bg-[#fffefb] text-slate-950 shadow-2xl border border-slate-400/80 p-7 flex flex-col justify-between font-serif select-none box-border overflow-hidden relative shrink-0">

        {/* ─── 1. TOP SECTION HEADER BAR (EXACT SAME AS PAGE 2 & PAGE 3) ─── */}
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
                પૃષ્ઠ ૪ (PAGE 4)
              </span>
            </div>
          </div>
        </div>

        {/* ─── 2. LIVE SPORTS SCOREBOARD / MATCH TICKER RIBBON ─── */}
        <div className="bg-emerald-950 text-white py-1 px-3 mb-2 flex items-center justify-between font-sans text-xs shrink-0 rounded-xs shadow-xs">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-1.5 bg-emerald-700 text-white text-[10.5px] font-black px-2 py-0.5 rounded-xs tracking-wider uppercase shrink-0">
              <Trophy className="w-3.5 h-3.5 text-amber-300" />
              <span>લાઈવ સ્કોરકાર્ડ</span>
            </div>
            <div className="font-bold text-[11.5px] text-emerald-100 truncate flex-1">
              <EditableTextSlot
                value={data.matchInfo}
                onChange={(val) => updateField('matchInfo', val)}
                isSelected={selectedPath === 'matchInfo'}
                onSelect={() => onSelectSlot?.('matchInfo', 'મેચ સ્કોરકાર્ડ વિગત')}
              />
            </div>
          </div>
          <div className="text-[10px] text-emerald-300 font-bold tracking-wide shrink-0 pl-2">
            <span>વિશ્વ રમત-ગમત સમીક્ષા</span>
          </div>
        </div>

        {/* ─── 3. ROW 1: SPORTS ARENA (8 Cols Lead Cricket + 4 Cols Athletics & Wire) ─── */}
        <div className="grid grid-cols-12 gap-0 h-[495px] mb-2 shrink-0 border-b border-slate-300 pb-2 overflow-hidden">
          {/* Left: Lead Sports Story (col-span-8) */}
          <div className="col-span-8 pr-4 border-r border-slate-300 flex flex-col justify-between h-full overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Category Eyebrow */}
              <div className="flex justify-between items-center mb-0.5">
                <EditableTextSlot
                  value={data.mainSportsStory.category}
                  onChange={(val) => updateField('mainSportsStory.category', val)}
                  isSelected={selectedPath === 'mainSportsStory.category'}
                  onSelect={() => onSelectSlot?.('mainSportsStory.category', 'સ્પોર્ટ્સ કેટેગરી')}
                  className="text-emerald-800 font-black text-[13px] font-sans tracking-wide"
                />
                <span className="text-[10px] font-bold text-slate-500 font-sans">CRICKET HEADLINES</span>
              </div>

              {/* Headline */}
              <EditableTextSlot
                tagName="h2"
                value={data.mainSportsStory.headline}
                onChange={(val) => updateField('mainSportsStory.headline', val)}
                isSelected={selectedPath === 'mainSportsStory.headline'}
                onSelect={() => onSelectSlot?.('mainSportsStory.headline', 'મુખ્ય સ્પોર્ટ્સ હેડલાઇન')}
                className="text-[27px] font-black text-slate-950 leading-[1.15] font-serif mb-1 tracking-tight"
                maxLength={110}
              />

              {/* Subheadline */}
              <div className="bg-emerald-50/80 border-l-4 border-emerald-700 py-1 px-2.5 mb-2">
                <EditableTextSlot
                  value={data.mainSportsStory.subheadline || ''}
                  onChange={(val) => updateField('mainSportsStory.subheadline', val)}
                  isSelected={selectedPath === 'mainSportsStory.subheadline'}
                  onSelect={() => onSelectSlot?.('mainSportsStory.subheadline', 'સ્પોર્ટ્સ સબહેડલાઇન')}
                  className="text-[13px] font-bold text-emerald-950 leading-snug font-sans"
                  maxLength={130}
                />
              </div>

              {/* 2-Column Split Layout */}
              <div className="grid grid-cols-12 gap-3 items-start flex-1 overflow-hidden">
                {/* Left Text Column + Mini Match Scorecard Table */}
                <div className="col-span-5 text-[11px] leading-[1.44] text-slate-800 font-serif text-justify overflow-hidden flex flex-col justify-between h-full">
                  <div>
                    {data.mainSportsStory.location && (
                      <span className="font-black text-emerald-800 shrink-0">
                        {data.mainSportsStory.location} |&nbsp;
                      </span>
                    )}
                    <EditableTextSlot
                      value={data.mainSportsStory.paragraph1}
                      onChange={(val) => updateField('mainSportsStory.paragraph1', val)}
                      isSelected={selectedPath === 'mainSportsStory.paragraph1' || selectedPath === 'mainSportsStory.articleBody'}
                      onSelect={() => onSelectSlot?.('mainSportsStory.paragraph1', 'સ્પોર્ટ્સ પેરાગ્રાફ ૧')}
                      multiline
                    />
                    <div className="mt-1.5 text-[10.5px] leading-[1.4] text-slate-700 border-t border-slate-200 pt-1">
                      <EditableTextSlot
                        value={data.mainSportsStory.paragraph2}
                        onChange={(val) => updateField('mainSportsStory.paragraph2', val)}
                        isSelected={selectedPath === 'mainSportsStory.paragraph2'}
                        onSelect={() => onSelectSlot?.('mainSportsStory.paragraph2', 'સ્પોર્ટ્સ પેરાગ્રાફ ૨')}
                        multiline
                      />
                    </div>
                  </div>

                  {/* Authentic Match Scoreboard Summary Box - 100% Editable */}
                  {data.mainSportsStory.matchScorecard && (
                    <div className="bg-emerald-900 text-white p-1.5 rounded-xs mt-1 border border-emerald-950 shadow-2xs font-sans">
                      <div className="text-[10px] font-black text-amber-300 border-b border-emerald-800 pb-0.5 mb-1 flex justify-between items-center">
                        <EditableTextSlot
                          value={data.mainSportsStory.matchScorecard.title}
                          onChange={(val) => updateField('mainSportsStory.matchScorecard.title', val)}
                          isSelected={selectedPath === 'mainSportsStory.matchScorecard.title'}
                          onSelect={() => onSelectSlot?.('mainSportsStory.matchScorecard.title', 'સ્કોરબોર્ડ શીર્ષક')}
                        />
                        <span className="text-[8.5px] bg-emerald-800 px-1 py-0.2 rounded-2xs">
                          <EditableTextSlot
                            value={data.mainSportsStory.matchScorecard.venue}
                            onChange={(val) => updateField('mainSportsStory.matchScorecard.venue', val)}
                            isSelected={selectedPath === 'mainSportsStory.matchScorecard.venue'}
                            onSelect={() => onSelectSlot?.('mainSportsStory.matchScorecard.venue', 'મેચ સ્થળ')}
                          />
                        </span>
                      </div>
                      <div className="text-[9.5px] space-y-0.5 text-emerald-50">
                        <div className="flex justify-between font-bold">
                          <EditableTextSlot
                            value={data.mainSportsStory.matchScorecard.team1Name}
                            onChange={(val) => updateField('mainSportsStory.matchScorecard.team1Name', val)}
                            isSelected={selectedPath === 'mainSportsStory.matchScorecard.team1Name'}
                            onSelect={() => onSelectSlot?.('mainSportsStory.matchScorecard.team1Name', 'ટીમ ૧ નામ')}
                          />
                          <EditableTextSlot
                            value={data.mainSportsStory.matchScorecard.team1Score}
                            onChange={(val) => updateField('mainSportsStory.matchScorecard.team1Score', val)}
                            isSelected={selectedPath === 'mainSportsStory.matchScorecard.team1Score'}
                            onSelect={() => onSelectSlot?.('mainSportsStory.matchScorecard.team1Score', 'ટીમ ૧ સ્કોર')}
                          />
                        </div>
                        <div className="text-[8.5px] text-emerald-200">
                          <EditableTextSlot
                            value={data.mainSportsStory.matchScorecard.team1Details}
                            onChange={(val) => updateField('mainSportsStory.matchScorecard.team1Details', val)}
                            isSelected={selectedPath === 'mainSportsStory.matchScorecard.team1Details'}
                            onSelect={() => onSelectSlot?.('mainSportsStory.matchScorecard.team1Details', 'ટીમ ૧ વિગતો')}
                          />
                        </div>
                        <div className="flex justify-between font-bold border-t border-emerald-800/80 pt-0.5">
                          <EditableTextSlot
                            value={data.mainSportsStory.matchScorecard.team2Name}
                            onChange={(val) => updateField('mainSportsStory.matchScorecard.team2Name', val)}
                            isSelected={selectedPath === 'mainSportsStory.matchScorecard.team2Name'}
                            onSelect={() => onSelectSlot?.('mainSportsStory.matchScorecard.team2Name', 'ટીમ ૨ નામ')}
                          />
                          <EditableTextSlot
                            value={data.mainSportsStory.matchScorecard.team2Score}
                            onChange={(val) => updateField('mainSportsStory.matchScorecard.team2Score', val)}
                            isSelected={selectedPath === 'mainSportsStory.matchScorecard.team2Score'}
                            onSelect={() => onSelectSlot?.('mainSportsStory.matchScorecard.team2Score', 'ટીમ ૨ સ્કોર')}
                          />
                        </div>
                        <div className="text-[8.5px] text-emerald-200">
                          <EditableTextSlot
                            value={data.mainSportsStory.matchScorecard.team2Details}
                            onChange={(val) => updateField('mainSportsStory.matchScorecard.team2Details', val)}
                            isSelected={selectedPath === 'mainSportsStory.matchScorecard.team2Details'}
                            onSelect={() => onSelectSlot?.('mainSportsStory.matchScorecard.team2Details', 'ટીમ ૨ વિગતો')}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Image + Key Points */}
                <div className="col-span-7 flex flex-col relative h-full overflow-hidden justify-between">
                  <div>
                    <EditableImageSlot
                      src={data.mainSportsStory.image || ''}
                      onImageChange={(img) => updateField('mainSportsStory.image', img)}
                      isSelected={selectedPath === 'mainSportsStory.image'}
                      onSelect={() => onSelectSlot?.('mainSportsStory.image', 'સ્પોર્ટ્સ ઈમેજ')}
                      containerHeight="200px"
                      alt="Cricket Match Win"
                    />
                    {data.mainSportsStory.caption && (
                      <EditableTextSlot
                        value={data.mainSportsStory.caption}
                        onChange={(val) => updateField('mainSportsStory.caption', val)}
                        isSelected={selectedPath === 'mainSportsStory.caption'}
                        onSelect={() => onSelectSlot?.('mainSportsStory.caption', 'ઈમેજ કૅપ્શન')}
                        className="text-[10px] text-slate-600 italic mt-0.5 font-sans text-center"
                      />
                    )}
                  </div>
                  {data.mainSportsStory.keyPoints && (
                    <div className="mt-1">
                      <KeyPointsBox
                        basePath="mainSportsStory"
                        title={data.mainSportsStory.keyPoints.title}
                        points={data.mainSportsStory.keyPoints.points}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Secondary Sports Story & Sports Wire (col-span-4) */}
          <div className="col-span-4 pl-4 flex flex-col justify-between h-full overflow-hidden">
            <div className="h-full flex flex-col justify-between">
              {/* Secondary Sports Story */}
              <div className="pb-1.5 border-b border-slate-300">
                <div className="flex justify-between items-start mb-0.5">
                  <EditableTextSlot
                    value={data.secondarySportsStory.category}
                    onChange={(val) => updateField('secondarySportsStory.category', val)}
                    isSelected={selectedPath === 'secondarySportsStory.category'}
                    onSelect={() => onSelectSlot?.('secondarySportsStory.category', 'એથ્લેટિક્સ કેટેગરી')}
                    className="text-amber-800 font-bold text-[11.5px] font-sans"
                  />
                </div>

                <EditableTextSlot
                  tagName="h3"
                  value={data.secondarySportsStory.headline}
                  onChange={(val) => updateField('secondarySportsStory.headline', val)}
                  isSelected={selectedPath === 'secondarySportsStory.headline'}
                  onSelect={() => onSelectSlot?.('secondarySportsStory.headline', 'એથ્લેટિક્સ હેડલાઇન')}
                  className="text-[16.5px] font-black text-slate-950 leading-tight font-serif mb-1"
                  maxLength={85}
                />

                <EditableImageSlot
                  src={data.secondarySportsStory.image || ''}
                  onImageChange={(img) => updateField('secondarySportsStory.image', img)}
                  isSelected={selectedPath === 'secondarySportsStory.image'}
                  onSelect={() => onSelectSlot?.('secondarySportsStory.image', 'એથ્લેટિક્સ ઈમેજ')}
                  containerHeight="105px"
                  alt="Athletics Feature"
                  className="mb-1"
                />

                <div className="text-[10px] leading-[1.38] text-slate-800 font-serif text-justify line-clamp-3">
                  {data.secondarySportsStory.location && (
                    <span className="font-bold text-amber-800">{data.secondarySportsStory.location} | </span>
                  )}
                  <EditableTextSlot
                    value={data.secondarySportsStory.paragraph1}
                    onChange={(val) => updateField('secondarySportsStory.paragraph1', val)}
                    isSelected={selectedPath === 'secondarySportsStory.paragraph1'}
                    onSelect={() => onSelectSlot?.('secondarySportsStory.paragraph1', 'એથ્લેટિક્સ વિગત')}
                    multiline
                  />
                </div>
              </div>

              {/* Sports Wire Briefs (4 Bulletins) */}
              <div className="pt-1 flex-1 flex flex-col justify-between overflow-hidden">
                <div className="bg-slate-900 text-white px-2 py-0.5 text-[10px] font-bold font-sans tracking-wide uppercase flex items-center justify-between mb-1 shrink-0">
                  <EditableTextSlot
                    value={data.sportsRoundupTitle || '⚡ રમત-ગમત સંક્ષિપ્ત (SPORTS ROUNDUP)'}
                    onChange={(val) => updateField('sportsRoundupTitle', val)}
                    isSelected={selectedPath === 'sportsRoundupTitle'}
                    onSelect={() => onSelectSlot?.('sportsRoundupTitle', 'રમત સંક્ષિપ્ત શીર્ષક')}
                    className="w-full text-white font-black"
                  />
                </div>

                <div className="space-y-1 overflow-hidden flex-1 flex flex-col justify-around">
                  {data.sportsBriefs.slice(0, 3).map((sb: any, idx: number) => (
                    <div key={idx} className="border-b border-slate-200 pb-0.5 last:border-0 last:pb-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[8.5px] font-black bg-emerald-100 text-emerald-900 px-1 py-0.2 rounded-2xs shrink-0">
                          <EditableTextSlot
                            value={sb.category}
                            onChange={(val) => updateField(`sportsBriefs.${idx}.category`, val)}
                            isSelected={selectedPath === `sportsBriefs.${idx}.category`}
                            onSelect={() => onSelectSlot?.(`sportsBriefs.${idx}.category`, `બ્રીફ ${idx + 1} કેટેગરી`)}
                          />
                        </span>
                        <span className="text-[10.5px] font-black text-slate-900 truncate flex-1">
                          <EditableTextSlot
                            value={sb.headline}
                            onChange={(val) => updateField(`sportsBriefs.${idx}.headline`, val)}
                            isSelected={selectedPath === `sportsBriefs.${idx}.headline`}
                            onSelect={() => onSelectSlot?.(`sportsBriefs.${idx}.headline`, `બ્રીફ ${idx + 1} હેડલાઇન`)}
                          />
                        </span>
                      </div>
                      <div className="text-[9px] leading-tight text-slate-600 truncate mt-0.5">
                        <EditableTextSlot
                          value={sb.articleBody}
                          onChange={(val) => updateField(`sportsBriefs.${idx}.articleBody`, val)}
                          isSelected={selectedPath === `sportsBriefs.${idx}.articleBody`}
                          onSelect={() => onSelectSlot?.(`sportsBriefs.${idx}.articleBody`, `બ્રીફ ${idx + 1} વિગત`)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 4. ROW 2: CINEMA, BOLLYWOOD & OTT WORLD (7 Cols + 5 Cols) ─── */}
        <div className="grid grid-cols-12 divide-x divide-slate-300 gap-0 mb-2 h-[380px] shrink-0 border-b border-slate-300 pb-2 overflow-hidden">
          {/* Cinema Lead (col-span-7) */}
          <div className="col-span-7 pr-4 flex flex-col justify-between h-full overflow-hidden">
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="font-sans font-black text-xs text-purple-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-purple-700" />
                    <EditableTextSlot
                      value={data.entertainmentStory.category}
                      onChange={(val) => updateField('entertainmentStory.category', val)}
                      isSelected={selectedPath === 'entertainmentStory.category'}
                      onSelect={() => onSelectSlot?.('entertainmentStory.category', 'મનોરંજન કેટેગરી')}
                    />
                  </span>
                  <span className="text-[10px] text-purple-800 font-bold bg-purple-50 px-2 py-0.5 border border-purple-200">
                    બોક્સ ઓફિસ રિપોર્ટ
                  </span>
                </div>

                <EditableTextSlot
                  tagName="h3"
                  value={data.entertainmentStory.headline}
                  onChange={(val) => updateField('entertainmentStory.headline', val)}
                  isSelected={selectedPath === 'entertainmentStory.headline'}
                  onSelect={() => onSelectSlot?.('entertainmentStory.headline', 'મનોરંજન હેડલાઇન')}
                  className="text-[22px] font-black text-slate-950 leading-tight font-serif mb-1"
                  maxLength={95}
                />

                <EditableTextSlot
                  value={data.entertainmentStory.subheadline || ''}
                  onChange={(val) => updateField('entertainmentStory.subheadline', val)}
                  isSelected={selectedPath === 'entertainmentStory.subheadline'}
                  onSelect={() => onSelectSlot?.('entertainmentStory.subheadline', 'મનોરંજન સબહેડલાઇન')}
                  className="text-[12px] font-bold text-slate-700 font-sans leading-snug mb-1"
                  maxLength={110}
                />
              </div>

              <div className="grid grid-cols-12 gap-3 items-start flex-1 overflow-hidden">
                <div className="col-span-6 text-[10.5px] leading-[1.4] text-slate-800 font-serif text-justify overflow-hidden flex flex-col justify-between h-full">
                  <div>
                    {data.entertainmentStory.location && (
                      <span className="font-black text-purple-800">{data.entertainmentStory.location} | </span>
                    )}
                    <EditableTextSlot
                      value={data.entertainmentStory.paragraph1}
                      onChange={(val) => updateField('entertainmentStory.paragraph1', val)}
                      isSelected={selectedPath === 'entertainmentStory.paragraph1' || selectedPath === 'entertainmentStory.articleBody'}
                      onSelect={() => onSelectSlot?.('entertainmentStory.paragraph1', 'મનોરંજન પેરાગ્રાફ ૧')}
                      multiline
                    />
                    <div className="mt-1 pt-1 border-t border-slate-200 text-[10px] text-slate-700">
                      <EditableTextSlot
                        value={data.entertainmentStory.paragraph2}
                        onChange={(val) => updateField('entertainmentStory.paragraph2', val)}
                        isSelected={selectedPath === 'entertainmentStory.paragraph2'}
                        onSelect={() => onSelectSlot?.('entertainmentStory.paragraph2', 'મનોરંજન પેરાગ્રાફ ૨')}
                        multiline
                      />
                    </div>
                  </div>

                  {/* Box Office Revenue Stats Box - 100% Editable */}
                  {data.entertainmentStory.boxOffice && (
                    <div className="bg-purple-950 text-white p-1.5 rounded-xs font-sans text-[9px] mt-1 border border-purple-900 shadow-2xs">
                      <div className="font-bold text-purple-200 border-b border-purple-800 pb-0.5 mb-0.5 flex justify-between items-center">
                        <EditableTextSlot
                          value={data.entertainmentStory.boxOffice.title}
                          onChange={(val) => updateField('entertainmentStory.boxOffice.title', val)}
                          isSelected={selectedPath === 'entertainmentStory.boxOffice.title'}
                          onSelect={() => onSelectSlot?.('entertainmentStory.boxOffice.title', 'બોક્સ ઓફિસ શીર્ષક')}
                        />
                        <span className="text-amber-300">
                          <EditableTextSlot
                            value={data.entertainmentStory.boxOffice.rating}
                            onChange={(val) => updateField('entertainmentStory.boxOffice.rating', val)}
                            isSelected={selectedPath === 'entertainmentStory.boxOffice.rating'}
                            onSelect={() => onSelectSlot?.('entertainmentStory.boxOffice.rating', 'રેટિંગ')}
                          />
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div className="bg-purple-900/80 p-0.5 rounded-2xs">
                          <span className="text-[8px] text-purple-300 block">
                            <EditableTextSlot
                              value={data.entertainmentStory.boxOffice.day1Label}
                              onChange={(val) => updateField('entertainmentStory.boxOffice.day1Label', val)}
                              isSelected={selectedPath === 'entertainmentStory.boxOffice.day1Label'}
                              onSelect={() => onSelectSlot?.('entertainmentStory.boxOffice.day1Label', 'દિવસ ૧ લેબલ')}
                            />
                          </span>
                          <span className="font-black text-white block">
                            <EditableTextSlot
                              value={data.entertainmentStory.boxOffice.day1Val}
                              onChange={(val) => updateField('entertainmentStory.boxOffice.day1Val', val)}
                              isSelected={selectedPath === 'entertainmentStory.boxOffice.day1Val'}
                              onSelect={() => onSelectSlot?.('entertainmentStory.boxOffice.day1Val', 'દિવસ ૧ કલેક્શન')}
                            />
                          </span>
                        </div>
                        <div className="bg-purple-900/80 p-0.5 rounded-2xs">
                          <span className="text-[8px] text-purple-300 block">
                            <EditableTextSlot
                              value={data.entertainmentStory.boxOffice.weekendLabel}
                              onChange={(val) => updateField('entertainmentStory.boxOffice.weekendLabel', val)}
                              isSelected={selectedPath === 'entertainmentStory.boxOffice.weekendLabel'}
                              onSelect={() => onSelectSlot?.('entertainmentStory.boxOffice.weekendLabel', 'વીકેન્ડ લેબલ')}
                            />
                          </span>
                          <span className="font-black text-white block">
                            <EditableTextSlot
                              value={data.entertainmentStory.boxOffice.weekendVal}
                              onChange={(val) => updateField('entertainmentStory.boxOffice.weekendVal', val)}
                              isSelected={selectedPath === 'entertainmentStory.boxOffice.weekendVal'}
                              onSelect={() => onSelectSlot?.('entertainmentStory.boxOffice.weekendVal', 'વીકેન્ડ કલેક્શન')}
                            />
                          </span>
                        </div>
                        <div className="bg-purple-900/80 p-0.5 rounded-2xs">
                          <span className="text-[8px] text-purple-300 block">
                            <EditableTextSlot
                              value={data.entertainmentStory.boxOffice.totalLabel}
                              onChange={(val) => updateField('entertainmentStory.boxOffice.totalLabel', val)}
                              isSelected={selectedPath === 'entertainmentStory.boxOffice.totalLabel'}
                              onSelect={() => onSelectSlot?.('entertainmentStory.boxOffice.totalLabel', 'કુલ આવક લેબલ')}
                            />
                          </span>
                          <span className="font-black text-amber-300 block">
                            <EditableTextSlot
                              value={data.entertainmentStory.boxOffice.totalVal}
                              onChange={(val) => updateField('entertainmentStory.boxOffice.totalVal', val)}
                              isSelected={selectedPath === 'entertainmentStory.boxOffice.totalVal'}
                              onSelect={() => onSelectSlot?.('entertainmentStory.boxOffice.totalVal', 'કુલ આવક કલેક્શન')}
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-span-6 flex flex-col overflow-hidden justify-between h-full">
                  <div>
                    <EditableImageSlot
                      src={data.entertainmentStory.image || ''}
                      onImageChange={(img) => updateField('entertainmentStory.image', img)}
                      isSelected={selectedPath === 'entertainmentStory.image'}
                      onSelect={() => onSelectSlot?.('entertainmentStory.image', 'મનોરંજન ઈમેજ')}
                      containerHeight="120px"
                      className="mb-1"
                    />
                  </div>
                  {data.entertainmentStory.keyPoints && (
                    <div className="bg-purple-50 border border-purple-200 p-1.5 rounded-xs">
                      <span className="text-[10px] font-bold text-purple-900 block mb-0.5 font-sans">
                        {data.entertainmentStory.keyPoints.title}
                      </span>
                      <ul className="text-[9.5px] text-purple-950 space-y-0.5 font-serif">
                        {(Array.isArray(data.entertainmentStory.keyPoints.points) ? data.entertainmentStory.keyPoints.points.slice(0, 3) : []).map((pt: string, pIdx: number) => (
                          <li key={pIdx} className="flex items-center gap-1">
                            <span className="text-purple-600 text-[10px]">★</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* OTT & Streaming (col-span-5) */}
          <div className="col-span-5 pl-4 flex flex-col justify-between h-full overflow-hidden">
            <div className="h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <EditableTextSlot
                    value={data.ottLifestyleStory.category}
                    onChange={(val) => updateField('ottLifestyleStory.category', val)}
                    isSelected={selectedPath === 'ottLifestyleStory.category'}
                    onSelect={() => onSelectSlot?.('ottLifestyleStory.category', 'ઓટીટી કેટેગરી')}
                    className="text-rose-800 font-bold text-[11.5px] font-sans"
                  />
                  <span className="text-[9.5px] text-slate-500 font-sans">STREAMING GUIDE</span>
                </div>

                <EditableTextSlot
                  tagName="h4"
                  value={data.ottLifestyleStory.headline}
                  onChange={(val) => updateField('ottLifestyleStory.headline', val)}
                  isSelected={selectedPath === 'ottLifestyleStory.headline'}
                  onSelect={() => onSelectSlot?.('ottLifestyleStory.headline', 'ઓટીટી હેડલાઇન')}
                  className="text-[16.5px] font-black text-slate-950 leading-tight font-serif mb-0.5"
                  maxLength={85}
                />

                <EditableTextSlot
                  value={data.ottLifestyleStory.subheadline || ''}
                  onChange={(val) => updateField('ottLifestyleStory.subheadline', val)}
                  isSelected={selectedPath === 'ottLifestyleStory.subheadline'}
                  onSelect={() => onSelectSlot?.('ottLifestyleStory.subheadline', 'ઓટીટી સબહેડલાઇન')}
                  className="text-[11px] font-bold text-slate-700 font-sans leading-snug mb-1"
                  maxLength={95}
                />
              </div>

              <div className="flex-1 flex flex-col justify-between overflow-hidden">
                <EditableImageSlot
                  src={data.ottLifestyleStory.image || ''}
                  onImageChange={(img) => updateField('ottLifestyleStory.image', img)}
                  isSelected={selectedPath === 'ottLifestyleStory.image'}
                  onSelect={() => onSelectSlot?.('ottLifestyleStory.image', 'ઓટીટી ઈમેજ')}
                  containerHeight="115px"
                  className="mb-1"
                />

                <div className="text-[10px] leading-[1.38] text-slate-800 font-serif text-justify overflow-hidden">
                  {data.ottLifestyleStory.location && (
                    <span className="font-bold text-rose-800">{data.ottLifestyleStory.location} | </span>
                  )}
                  <EditableTextSlot
                    value={data.ottLifestyleStory.paragraph1}
                    onChange={(val) => updateField('ottLifestyleStory.paragraph1', val)}
                    isSelected={selectedPath === 'ottLifestyleStory.paragraph1'}
                    onSelect={() => onSelectSlot?.('ottLifestyleStory.paragraph1', 'ઓટીટી વિગત')}
                    multiline
                  />
                </div>

                {/* Top 3 OTT Streaming Releases Box - 100% Editable */}
                {data.ottLifestyleStory.ottPicks && (
                  <div className="bg-rose-50 border border-rose-200 p-1.5 rounded-xs mt-1 font-sans text-[9px]">
                    <div className="font-black text-rose-950 border-b border-rose-200 pb-0.5 mb-1 flex items-center justify-between">
                      <span>
                        <EditableTextSlot
                          value={data.ottLifestyleStory.ottPicks.title}
                          onChange={(val) => updateField('ottLifestyleStory.ottPicks.title', val)}
                          isSelected={selectedPath === 'ottLifestyleStory.ottPicks.title'}
                          onSelect={() => onSelectSlot?.('ottLifestyleStory.ottPicks.title', 'ઓટીટી પિક્સ શીર્ષક')}
                        />
                      </span>
                      <span className="text-rose-700 font-bold">
                        <EditableTextSlot
                          value={data.ottLifestyleStory.ottPicks.tagline}
                          onChange={(val) => updateField('ottLifestyleStory.ottPicks.tagline', val)}
                          isSelected={selectedPath === 'ottLifestyleStory.ottPicks.tagline'}
                          onSelect={() => onSelectSlot?.('ottLifestyleStory.ottPicks.tagline', 'ઓટીટી ટેગલાઇન')}
                        />
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-slate-800">
                      <div className="bg-white p-1 rounded-2xs border border-rose-100">
                        <span className="font-black text-red-600 block">
                          <EditableTextSlot
                            value={data.ottLifestyleStory.ottPicks.pick1Platform}
                            onChange={(val) => updateField('ottLifestyleStory.ottPicks.pick1Platform', val)}
                            isSelected={selectedPath === 'ottLifestyleStory.ottPicks.pick1Platform'}
                            onSelect={() => onSelectSlot?.('ottLifestyleStory.ottPicks.pick1Platform', 'પ્લેટફોર્મ ૧')}
                          />
                        </span>
                        <span className="font-bold truncate block">
                          <EditableTextSlot
                            value={data.ottLifestyleStory.ottPicks.pick1Title}
                            onChange={(val) => updateField('ottLifestyleStory.ottPicks.pick1Title', val)}
                            isSelected={selectedPath === 'ottLifestyleStory.ottPicks.pick1Title'}
                            onSelect={() => onSelectSlot?.('ottLifestyleStory.ottPicks.pick1Title', 'શો ૧')}
                          />
                        </span>
                      </div>
                      <div className="bg-white p-1 rounded-2xs border border-rose-100">
                        <span className="font-black text-blue-600 block">
                          <EditableTextSlot
                            value={data.ottLifestyleStory.ottPicks.pick2Platform}
                            onChange={(val) => updateField('ottLifestyleStory.ottPicks.pick2Platform', val)}
                            isSelected={selectedPath === 'ottLifestyleStory.ottPicks.pick2Platform'}
                            onSelect={() => onSelectSlot?.('ottLifestyleStory.ottPicks.pick2Platform', 'પ્લેટફોર્મ ૨')}
                          />
                        </span>
                        <span className="font-bold truncate block">
                          <EditableTextSlot
                            value={data.ottLifestyleStory.ottPicks.pick2Title}
                            onChange={(val) => updateField('ottLifestyleStory.ottPicks.pick2Title', val)}
                            isSelected={selectedPath === 'ottLifestyleStory.ottPicks.pick2Title'}
                            onSelect={() => onSelectSlot?.('ottLifestyleStory.ottPicks.pick2Title', 'શો ૨')}
                          />
                        </span>
                      </div>
                      <div className="bg-white p-1 rounded-2xs border border-rose-100">
                        <span className="font-black text-indigo-600 block">
                          <EditableTextSlot
                            value={data.ottLifestyleStory.ottPicks.pick3Platform}
                            onChange={(val) => updateField('ottLifestyleStory.ottPicks.pick3Platform', val)}
                            isSelected={selectedPath === 'ottLifestyleStory.ottPicks.pick3Platform'}
                            onSelect={() => onSelectSlot?.('ottLifestyleStory.ottPicks.pick3Platform', 'પ્લેટફોર્મ ૩')}
                          />
                        </span>
                        <span className="font-bold truncate block">
                          <EditableTextSlot
                            value={data.ottLifestyleStory.ottPicks.pick3Title}
                            onChange={(val) => updateField('ottLifestyleStory.ottPicks.pick3Title', val)}
                            isSelected={selectedPath === 'ottLifestyleStory.ottPicks.pick3Title'}
                            onSelect={() => onSelectSlot?.('ottLifestyleStory.ottPicks.pick3Title', 'શો ૩')}
                          />
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── 5. ROW 3: 12 ZODIAC SIGNS HOROSCOPE (6x2 Astrological Grid) ─── */}
        <div className="bg-purple-50/40 border border-purple-300/80 rounded-xs p-2 mb-2 shrink-0 shadow-2xs">
          <div className="flex items-center justify-between border-b border-purple-200 pb-1 mb-1.5 font-sans">
            <div className="flex items-center gap-1.5 font-black text-purple-950 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-700" />
              <span>આજનું દૈનિક રાશિભવિષ્ય (TODAY'S 12 ZODIAC HOROSCOPE)</span>
            </div>
            {onOpenHoroscopeEditor && (
              <button
                onClick={onOpenHoroscopeEditor}
                className="text-[10px] text-purple-800 hover:underline font-bold bg-white px-2 py-0.5 rounded-xs border border-purple-300 cursor-pointer flex items-center gap-1"
              >
                <span>બધી ૧૨ રાશિઓ સંપાદિત કરો</span>
                <span>➔</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-6 gap-2 text-xs">
            {data.horoscope.map((item: any, idx: number) => (
              <div
                key={item.signEn || idx}
                className="bg-white p-1.5 rounded-xs border border-purple-100 shadow-2xs space-y-0.5"
              >
                <div className="flex justify-between items-center font-black text-purple-950 border-b border-purple-100 pb-0.5 text-[11px]">
                  <span>{item.signGu}</span>
                  <span className="text-[9px] text-purple-500 font-normal">({item.signEn})</span>
                </div>
                <EditableTextSlot
                  value={item.prediction}
                  onChange={(val) => updateField(`horoscope.${idx}.prediction`, val)}
                  isSelected={selectedPath === `horoscope.${idx}.prediction`}
                  onSelect={() => onSelectSlot?.(`horoscope.${idx}.prediction`, `${item.signGu} રાશિ ભવિષ્ય`)}
                  className="text-[9.5px] leading-tight text-slate-700 font-serif line-clamp-3"
                />
                <div className="pt-0.5 border-t border-purple-50 flex justify-between items-center text-[8px] text-purple-900/80 font-sans">
                  <span>શુભ અંક: {item.luckyNo || (idx % 9 + 1)}</span>
                  <span>રંગ: {item.luckyColor || 'લાલ'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 6. ROW 4: 3 BOTTOM EDITORIAL & SPORTS/CULTURE NEWS STORIES (100% NEWS - ZERO ADS!) ─── */}
        <div className="grid grid-cols-12 divide-x divide-slate-300 gap-0 mb-1 h-[345px] shrink-0 overflow-hidden border border-slate-300 bg-white shadow-2xs">
          {(data.bottomStories || []).slice(0, 3).map((story: any, idx: number) => {
            const basePath = `bottomStories.${idx}`;
            const categoryColors = [
              'bg-blue-800 text-white',
              'bg-emerald-800 text-white',
              'bg-rose-800 text-white',
            ];
            const badgeColor = categoryColors[idx % categoryColors.length];

            return (
              <div
                key={story.id || idx}
                className="col-span-4 p-2.5 flex flex-col justify-between h-full overflow-hidden bg-white hover:bg-slate-50/40 transition-colors"
              >
                <div className="space-y-1.5 overflow-hidden flex-1 flex flex-col">
                  {/* Top Bar: Category badge & Location tag */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1 shrink-0">
                    <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-2xs tracking-wider ${badgeColor}`}>
                      <EditableTextSlot
                        value={story.category}
                        onChange={(val) => updateField(`${basePath}.category`, val)}
                        isSelected={selectedPath === `${basePath}.category`}
                        onSelect={() => onSelectSlot?.(`${basePath}.category`, `બોટમ ન્યૂઝ ${idx + 1} કેટેગરી`)}
                      />
                    </span>
                    <span className="text-[10px] font-sans font-bold text-slate-600 flex items-center gap-1">
                      <span>📍</span>
                      <EditableTextSlot
                        value={story.location}
                        onChange={(val) => updateField(`${basePath}.location`, val)}
                        isSelected={selectedPath === `${basePath}.location`}
                        onSelect={() => onSelectSlot?.(`${basePath}.location`, `બોટમ ન્યૂઝ ${idx + 1} સ્થળ`)}
                      />
                    </span>
                  </div>

                  {/* Headline */}
                  <div className="shrink-0">
                    <EditableTextSlot
                      value={story.headline}
                      onChange={(val) => updateField(`${basePath}.headline`, val)}
                      isSelected={selectedPath === `${basePath}.headline`}
                      onSelect={() => onSelectSlot?.(`${basePath}.headline`, `બોટમ ન્યૂઝ ${idx + 1} હેડલાઇન`)}
                      multiline
                      className="text-[13.5px] font-serif font-black leading-[1.25] text-slate-950 hover:text-red-700 transition-colors line-clamp-2"
                    />
                  </div>

                  {/* Subheadline */}
                  {story.subheadline && (
                    <div className="shrink-0">
                      <EditableTextSlot
                        value={story.subheadline}
                        onChange={(val) => updateField(`${basePath}.subheadline`, val)}
                        isSelected={selectedPath === `${basePath}.subheadline`}
                        onSelect={() => onSelectSlot?.(`${basePath}.subheadline`, `બોટમ ન્યૂઝ ${idx + 1} સબહેડિંગ`)}
                        className="text-[9.5px] font-serif font-semibold text-slate-600 leading-tight line-clamp-1 border-b border-slate-100 pb-0.5"
                      />
                    </div>
                  )}

                  {/* Optional Image with Caption */}
                  {story.image && (
                    <div className="shrink-0 space-y-0.5 my-0.5">
                      <EditableImageSlot
                        src={story.image || ''}
                        alt={story.headline || 'News'}
                        onImageChange={(img: string) => updateField(`${basePath}.image`, img)}
                        isSelected={selectedPath === `${basePath}.image`}
                        onSelect={() => onSelectSlot?.(`${basePath}.image`, `બોટમ ન્યૂઝ ${idx + 1} ફોટો`)}
                        containerHeight="105px"
                        className="w-full h-[105px] object-cover rounded-xs border border-slate-200 shadow-2xs"
                      />
                      {story.caption && (
                        <EditableTextSlot
                          value={story.caption}
                          onChange={(val) => updateField(`${basePath}.caption`, val)}
                          isSelected={selectedPath === `${basePath}.caption`}
                          onSelect={() => onSelectSlot?.(`${basePath}.caption`, `બોટમ ન્યૂઝ ${idx + 1} કેપ્શન`)}
                          className="text-[8.5px] font-serif italic text-slate-500 text-center leading-tight line-clamp-1 block"
                        />
                      )}
                    </div>
                  )}

                  {/* Paragraph 1 */}
                  <div className="flex-1 overflow-hidden">
                    <EditableTextSlot
                      value={story.paragraph1}
                      onChange={(val) => updateField(`${basePath}.paragraph1`, val)}
                      isSelected={selectedPath === `${basePath}.paragraph1`}
                      onSelect={() => onSelectSlot?.(`${basePath}.paragraph1`, `બોટમ ન્યૂઝ ${idx + 1} પેરા ૧`)}
                      multiline
                      className="text-[9.5px] font-serif text-slate-800 leading-[1.38] text-justify line-clamp-4"
                    />
                  </div>
                </div>

                {/* Footer readmore / dateline bar */}
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[8.5px] text-slate-400 font-sans shrink-0">
                  <span className="font-semibold text-slate-600">ગુજરાત પોસ્ટ સ્પેશિયલ ડેસ્ક</span>
                  <span className="text-red-600 font-bold hover:underline cursor-pointer">વિશેષ અહેવાલ ➔</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── 7. FOOTER SECTION BAR (EXACT SAME AS PAGE 2 & PAGE 3) ─── */}
        <div className="shrink-0 pt-1.5 border-t-2 border-slate-900 flex justify-between items-center text-xs font-sans text-slate-600">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900 tracking-wider">GUJARAT POST</span>
            <span>•</span>
            <span>SPORTS & ENTERTAINMENT SPECIAL EDITION</span>
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
              પાનું ૪ (PAGE 4 OF 4)
            </span>
          </div>
        </div>

      </div>
    </EpaperReadOnlyProvider>
  );
};
