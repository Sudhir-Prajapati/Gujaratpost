'use client';

import React from 'react';
import { EditableTextSlot } from './EditableTextSlot';
import { EditableImageSlot } from './EditableImageSlot';
import { getIconFromConditionText } from '@/lib/weather';
import { useEpaperReadOnly, EpaperReadOnlyProvider } from './EpaperReadOnlyContext';

// ─────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────

export interface KeyPointsBoxData {
  title: string; // e.g. "મુખ્ય મુદ્દાઓ", "હવામાન વિભાગની આગાહી"
  points: string[];
}

export interface StoryBlockData {
  id?: string;
  category: string; // red eyebrow line above the headline
  headline: string;
  subheadline?: string;
  location?: string; // dateline, e.g. "ગાંધીનગર"
  paragraph1?: string;
  paragraph2?: string;
  paragraph3?: string;
  body: string;
  image?: string;
  imageCaption?: string;
  keyPoints?: KeyPointsBoxData;
  pullQuote?: PullQuoteData;
}

export interface PullQuoteData {
  quote?: string;
  text?: string;
  name?: string;
  author?: string;
  image?: string;
  photo?: string;
}

export interface PageIndexItem {
  label: string; // "રાજ્ય"
  page: string; // "02"
}

export interface Page1Data {
  // Masthead
  mastheadTitle: string;
  mastheadTagline: string;

  // Top strip
  quote: { text: string; author: string };
  weather: { city: string; high: string; low: string; condition: string; icon?: string };

  // Edition bar
  editionBar: {
    rniNo: string;
    dayDate: string; // "સોમવાર, ૭ સપ્ટેમ્બર ૨૦૨૬"
    yearIssue: string; // "વર્ષ : ૧૬ | અંક : ૨૫૦"
    city: string;
    website: string;
    price: string;
  };

  // Main story row
  mainHeadline: StoryBlockData;
  sideTopNews: StoryBlockData & { pullQuote?: PullQuoteData };

  // Three-across news blocks
  newsBlocks: StoryBlockData[];

  // Bottom two-across
  bottomLeftFeature: StoryBlockData;
  bottomMiddleSports?: StoryBlockData;
  bottomStories?: any[];
  advertisement?: {
    id?: string;
    title?: string;
    image: string;
    link?: string;
  };

  // Footer
  pageNumber?: string;
  pageIndex?: PageIndexItem[];
  tagline?: string;
}

// ─────────────────────────────────────────────────────────
// SAMPLE / DUMMY DATA (matches the exact reference design)
// ─────────────────────────────────────────────────────────

export const samplePage1Data: Page1Data = {
  mastheadTitle: 'ગુજરાત પોસ્ટ',
  mastheadTagline: 'ગુજરાતનું વિશ્વસનીય દૈનિક સમાચારપત્ર',

  quote: {
    text: '“મહેનતનું ફળ હંમેશા મીઠું હોય છે.”',
    author: '— સ્વામી વિવેકાનંદ',
  },

  weather: {
    city: 'અમદાવાદ',
    high: '૩૪°C',
    low: '૨૬°C',
    condition: 'આંશિક વાદળછાયું',
    icon: '⛅',
  },

  editionBar: {
    rniNo: 'RNI No. GUJGUJ/2011/40000',
    dayDate: 'સોમવાર, ૭ સપ્ટેમ્બર ૨૦૨૬',
    yearIssue: 'વર્ષ : ૧૬ | અંક : ૨૫૦',
    city: 'અમદાવાદ',
    website: 'www.gujaratpost.com',
    price: '₹ 4.00',
  },

  mainHeadline: {
    category: 'રાજ્યમાં શિક્ષણ વ્યવસ્થાનો નવી દિશા',
    headline: 'ગુજરાતમાં આજે મોટો ઐતિહાસિક નિર્ણય: નવા શિક્ષણ પ્રણાલીનો રાજ્યવ્યાપી અમલ',
    subheadline: 'વિદ્યાર્થીઓના સર્વાંગી વિકાસ, કૌશલ્ય અને આધુનિક ટેકનોલોજી પર રહેશે ખાસ ભાર',
    location: 'ગાંધીનગર',
    paragraph1: 'અમદાવાદ: ગુજરાત રાજ્યમાં આજે મુખ્યમંત્રીની અધ્યક્ષતામાં યોજાયેલી ઉચ્ચ સ્તરીય બેઠકમાં રાજ્યના સર્વાંગી વિકાસ માટે અનેક મોટા અને મહત્વપૂર્ણ નિર્ણયો લેવામાં આવ્યા છે. ઇન્ફ્રાસ્ટ્રક્ચર, આરોગ્ય અને શિક્ષણ ક્ષેત્રે નવી યોજનાઓ શરૂ કરવામાં આવશે. સંબંધિત વિભાગો દ્વારા વિગતોની સમીક્ષા ચાલુ છે અને આગામી કાર્યવાહી અંગે અધિકૃત માહિતી સમયસર જાહેર કરવામાં આવશે. સ્થાનિક લોકો તથા તજજ્ઞોના પ્રતિભાવો પણ લેવામાં આવી રહ્યા છે. રાજ્યના તમામ જિલ્લાઓમાં આધુનિક પ્રકલ્પો માટે બજેટની ફાળવણી પૂર્ણ થઈ છે. નાગરિકોની સુખાકારી અને પ્રગતિ માટે આ નિર્ણયો ઐતિહાસિક સાબિત થશે. રાજ્યના દરેક જિલ્લા મથકે આધુનિક સિવિલ હોસ્પિટલોનું નિર્માણ અને શાળાઓમાં સ્માર્ટ વર્ગખંડો સ્થાપવાની કામગીરીને અગ્રતા આપવામાં આવશે. રાજ્યના દરેક જિલ્લા મથકે આધુનિક સિવિલ હોસ્પિટલોનું નિર્માણ અને શાળાઓમાં સ્માર્ટ વર્ગખંડો સ્થાપવાની કામગીરીને અગ્રતા આપવામાં આવશે.',
    paragraph2: 'ગ્રામીણ વિસ્તારોમાં ખેડૂતોને સિંચાઈનું પાણી અને ૨૪ કલાક અવિરત ગુણવત્તાસભર વીજળી પહોંચાડવા માટે નવી સબ-સ્ટેશનો કાર્યરત કરાશે. ઔદ્યોગિક કોરિડોર અને એક્સપ્રેસવે પ્રોજેક્ટ્સને ઝડપથી પૂર્ણ કરવા વહીવટી મંજૂરીઓ તાત્કાલિક ધોરણે આપી દેવામાં આવી છે. એક્સપ્રેસવે પ્રોજેક્ટ્સને ઝડપથી પૂર્ણ કરવા વહીવટી મંજૂરીઓ તાત્કાલિક ધોરણે આપી દેવામાં આવી છે. એક્સપ્રેસવે પ્રોજેક્ટ્સને ઝડપથી પૂર્ણ કરવા વહીવટી મંજૂરીઓ તાત્કાલિક ધોરણે આપી દેવામાં આવી છે.એક્સપ્રેસવે પ્રોજેક્ટ્સને ઝડપથી પૂર્ણ કરવા વહીવટી મંજૂરીઓ',
    paragraph3: 'યુવાનો માટે ટેકનિકલ શિક્ષણ અને સ્કીલ ડેવલપમેન્ટ સેન્ટરો શરૂ કરી સ્થાનિક સ્તરે હજારો નવી રોજગારીની તકોનું સર્જન કરાશે. તમામ જિલ્લા કલેક્ટરો અને સચિવોને આ પ્રોજેક્ટ્સનું સાપ્તાહિક મોનિટરિંગ કરી પ્રગતિ અહેવાલ મુખ્યમંત્રી કાર્યાલયને મોકલવા આદેશ કરાયો છે. અને સચિવોને આ પ્રોજેક્ટ્સનું સાપ્તાહિક મોનિટરિંગ કરી પ્રગતિ અહેવાલ મુખ્યમંત્રી કાર્યાલયને મોકલવા આદેશ કરાયો છે. અને સચિવોને આ પ્રોજેક્ટ્સનું સાપ્તાહિક મોનિટરિંગ કરી પ્રગતિ અહેવાલ મુખ્યમંત્રી કાર્યાલયને મોકલવા આદેશ કરાયો છે.',
    body: 'અમદાવાદ: ગુજરાત રાજ્યમાં આજે મુખ્યમંત્રીની અધ્યક્ષતામાં યોજાયેલી ઉચ્ચ સ્તરીય બેઠકમાં રાજ્યના સર્વાંગી વિકાસ માટે અનેક મોટા અને મહત્વપૂર્ણ નિર્ણયો લેવામાં આવ્યા છે. ઇન્ફ્રાસ્ટ્રક્ચર, આરોગ્ય અને શિક્ષણ ક્ષેત્રે નવી યોજનાઓ શરૂ કરવામાં આવશે. સંબંધિત વિભાગો દ્વારા વિગતોની સમીક્ષા ચાલુ છે અને આગામી કાર્યવાહી અંગે અધિકૃત માહિતી સમયસર જાહેર કરવામાં આવશે. સ્થાનિક લોકો તથા તજજ્ઞોના પ્રતિભાવો પણ લેવામાં આવી રહ્યા છે. રાજ્યના તમામ જિલ્લાઓમાં આધુનિક પ્રકલ્પો માટે બજેટની ફાળવણી પૂર્ણ થઈ છે. નાગરિકોની સુખાકારી અને પ્રગતિ માટે આ નિર્ણયો ઐતિહાસિક સાબિત થશે. રાજ્યના દરેક જિલ્લા મથકે આધુનિક સિવિલ હોસ્પિટલોનું નિર્માણ અને શાળાઓમાં સ્માર્ટ વર્ગખંડો સ્થાપવાની કામગીરીને અગ્રતા આપવામાં આવશે.\n\nગ્રામીણ વિસ્તારોમાં ખેડૂતોને સિંચાઈનું પાણી અને ૨૪ કલાક અવિરત ગુણવત્તાસભર વીજળી પહોંચાડવા માટે નવી સબ-સ્ટેશનો કાર્યરત કરાશે. ઔદ્યોગિક કોરિડોર અને એક્સપ્રેસવે પ્રોજેક્ટ્સને ઝડપથી પૂર્ણ કરવા વહીવટી મંજૂરીઓ તાત્કાલિક ધોરણે આપી દેવામાં આવી છે.\n\nયુવાનો માટે ટેકનિકલ શિક્ષણ અને સ્કીલ ડેવલપમેન્ટ સેન્ટરો શરૂ કરી સ્થાનિક સ્તરે હજારો નવી રોજગારીની તકોનું સર્જન કરાશે. તમામ જિલ્લા કલેક્ટરો અને સચિવોને આ પ્રોજેક્ટ્સનું સાપ્તાહિક મોનિટરિંગ કરી પ્રગતિ અહેવાલ મુખ્યમંત્રી કાર્યાલયને મોકલવા આદેશ કરાયો છે.',
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
    imageCaption: 'નવી શિક્ષણ પ્રણાલીના અમલથી રાજ્યના વિદ્યાર્થીઓ માટે નવા અવસર ઉભા થશે.',
    keyPoints: {
      title: 'મુખ્ય મુદ્દાઓ',
      points: [
        'ધોરણ ૧થી નવી શિક્ષણ પ્રણાલી અમલમાં',
        'કૌશલ્ય આધારિત અભ્યાસક્રમ પર ભાર',
        'ડિજિટલ શિક્ષણ અને સ્માર્ટ વર્ગખંડ',
        'વિદ્યાર્થીઓ માટે વ્યક્તિગત મૂલ્યાંકન પદ્ધતિ',
        'ગ્રામીણ વિસ્તારોમાં પણ સુવિધાઓનો વિસ્તાર',
      ],
    },
  },

  sideTopNews: {
    category: 'મુખ્યમંત્રીની જાહેરાત',
    headline: 'ગુજરાત ૨૦૩૦ સુધીમાં ગ્રીન એનર્જીમાં અગ્રણી રાજ્ય બનશે',
    subheadline: 'સોલાર, વિન્ડ અને હાઈડ્રોજન પ્રોજેક્ટને મળશે વેગ',
    location: 'ગાંધીનગર',
    paragraph1: 'મુખ્યમંત્રીશ્રી દ્વારા રાજ્યમાં ગ્રીન એનર્જી ક્ષેત્રે ઐતિહાસિક કદમ ઉઠાવતા નવી ઉર્જા નીતિની જાહેરાત કરવામાં આવી છે. રાજ્યમાં સૌર અને પવન ઉર્જા પ્રોજેક્ટ્સને પ્રોત્સાહન આપી આગામી વર્ષોમાં સ્વચ્છ ઉર્જા ઉત્પાદનમાં અગ્રેસર બનવાનું લક્ષ્ય રાખવામાં આવ્યું છે. રાજ્યમાં સૌર અને પવન ઉર્જા પ્રોજેક્ટ્સને પ્રોત્સાહન આપી આગામી વર્ષોમાં સ્વચ્છ ઉર્જા ઉત્પાદનમાં અગ્રેસર બનવાનું લક્ષ્ય રાખવામાં આવ્યું છે.',
    paragraph2: 'આ યોજનાઓથી રાજ્યને ઉર્જા ક્ષેત્રે સ્વનિર્ભરતા મળશે અને ઉદ્યોગોને રાહતદરે અવિરત હરિત વીજળી પ્રાપ્ત થશે. પર્યાવરણ સુરક્ષા સાથે સ્થાનિક સ્તરે નવી ગ્રીન જોબ્સનું મોટા પાયે સર્જન થશે અને ગુજરાત સ્વચ્છ ઉર્જાનું ગ્લોબલ હબ બનશે. સ્તરે નવી ગ્રીન જોબ્સનું મોટા પાયે સર્જન થશે અને ગુજરાત.',
    body: 'મુખ્યમંત્રીશ્રી દ્વારા રાજ્યમાં ગ્રીન એનર્જી ક્ષેત્રે ઐતિહાસિક કદમ ઉઠાવતા નવી ઉર્જા નીતિની જાહેરાત કરવામાં આવી છે. રાજ્યમાં સૌર અને પવન ઉર્જા પ્રોજેક્ટ્સને પ્રોત્સાહન આપી આગામી વર્ષોમાં સ્વચ્છ ઉર્જા ઉત્પાદનમાં અગ્રેસર બનવાનું લક્ષ્ય રાખવામાં આવ્યું છે. રાજ્યમાં સૌર અને પવન ઉર્જા પ્રોજેક્ટ્સને પ્રોત્સાહન આપી આગામી વર્ષોમાં સ્વચ્છ ઉર્જા ઉત્પાદનમાં અગ્રેસર બનવાનું લક્ષ્ય રાખવામાં આવ્યું છે.રાજ્યમાં સૌર અને પવન ઉર્જા પ્રોજેક્ટ્સને પ્રોત્સાહન આપી આગામી વર્ષોમાં સ્વચ્છ ઉર્જા ઉત્પાદનમાં અગ્રેસર બનવાનું લક્ષ્ય રાખવામાં આવ્યું છે.\n\nઆ યોજનાઓથી રાજ્યને ઉર્જા ક્ષેત્રે સ્વનિર્ભરતા મળશે અને ઉદ્યોગોને રાહતદરે અવિરત હરિત વીજળી પ્રાપ્ત થશે. પર્યાવરણ સુરક્ષા સાથે સ્થાનિક સ્તરે નવી ગ્રીન જોબ્સનું મોટા પાયે સર્જન થશે અને ગુજરાત સ્વચ્છ ઉર્જાનું ગ્લોબલ હબ બનશે.',
    image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=600&q=80',
    imageCaption: 'સોલાર અને વિન્ડ એનર્જી પ્રોજેક્ટ',
    pullQuote: {
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
      quote: '“ગુજરાતને સ્વચ્છ અને સ્વસ્થ ભવિષ્ય આપવું અમારી પ્રાથમિકતા છે.”',
      text: '“ગુજરાતને સ્વચ્છ અને સ્વસ્થ ભવિષ્ય આપવું અમારી પ્રાથમિકતા છે.”',
      name: '— ભૂપેન્દ્ર પટેલ, મુખ્યમંત્રી, ગુજરાત',
      author: '— ભૂપેન્દ્ર પટેલ, મુખ્યમંત્રી, ગુજરાત',
    },
  },

  newsBlocks: [
    {
      category: 'વરસાદના કારણે જનજીવન પ્રભાવિત',
      headline: 'દક્ષિણ ગુજરાતમાં ભારે વરસાદ, વલસાડ-નવસારીમાં એલર્ટ',
      subheadline: 'નિકાસ વિસ્તારોમાં પાણી ભરાતા લોકો પરેશાન',
      location: 'વલસાડ',
      paragraph1: 'ગુજરાતમાં આજે દક્ષિણ ગુજરાતના સંત વરસાદ અને નવસારી જિલ્લામાં ભારે પાણી ભરાવાથી લોકો મુશ્કેલીમાં મુકાયા છે. વહીવટીતંત્ર સતર્ક બન્યું છે. ગુજરાતમાં આજે દક્ષિણ ગુજરાતના સંત વરસાદ અને નવસારી જિલ્લામાં ભારે પાણી ભરાવાથી લોકો મુશ્કેલીમાં મુકાયા છે. વહીવટીતંત્ર સતર્ક બન્યું છે. ગુજરાતમાં આજે દક્ષિણ ગુજરાતના સંત વરસાદ અને નવસારી જિલ્લામાં ભારે પાણી ભરાવાથી લોકો મુશ્કેલીમાં મુકાયા છે. વહીવટીતંત્ર સતર્ક બન્યું છે.',
      paragraph2: 'જિલ્લા વહીવટીતંત્ર દ્વારા નીચાણવાળા વિસ્તારોમાંથી લોકોને સલામત સ્થળે ખસેડવાની કામગીરી શરૂ કરવામાં આવી છે. ડિઝાસ્ટર મેનેજમેન્ટ અને એનડીઆરએફની ટીમોને એલર્ટ મોડ પર રાખવામાં આવી છે.',
      body: 'ગુજરાતમાં આજે દક્ષિણ ગુજરાતના સંત વરસાદ અને નવસારી જિલ્લામાં ભારે પાણી ભરાવાથી લોકો મુશ્કેલીમાં મુકાયા છે. વહીવટીતંત્ર સતર્ક બન્યું છે. ગુજરાતમાં આજે દક્ષિણ ગુજરાતના સંત વરસાદ અને નવસારી જિલ્લામાં ભારે પાણી ભરાવાથી લોકો મુશ્કેલીમાં મુકાયા છે. વહીવટીતંત્ર સતર્ક બન્યું છે. ગુજરાતમાં આજે દક્ષિણ ગુજરાતના સંત વરસાદ અને નવસારી જિલ્લામાં ભારે પાણી ભરાવાથી લોકો મુશ્કેલીમાં મુકાયા છે. વહીવટીતંત્ર સતર્ક બન્યું છે.\n\nજિલ્લા વહીવટીતંત્ર દ્વારા નીચાણવાળા વિસ્તારોમાંથી લોકોને સલામત સ્થળે ખસેડવાની કામગીરી શરૂ કરવામાં આવી છે. ડિઝાસ્ટર મેનેજમેન્ટ અને એનડીઆરએફની ટીમોને એલર્ટ મોડ પર રાખવામાં આવી છે.',
      image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
      keyPoints: {
        title: 'હવામાન વિભાગની આગાહી',
        points: [
          'આગામી ૪૮ કલાક ભારે વરસાદની શક્યતા',
          'નવસારી, વલસાડ, ડાંગમાં એલર્ટ',
          'લોકોને સાવચેતી રાખવાની સૂચના',
        ],
      },
    },
    {
      category: 'આર્થિક વિકાસમાં ગુજરાત ફરી આગળ',
      headline: 'રાજ્યમાં ૧ લાખથી વધુ નવી રોજગારીની તકો',
      subheadline: 'ઉદ્યોગોનો આંતરરાષ્ટ્રીય રોકાણકારો સાથે કરાર',
      location: 'અમદાવાદ',
      paragraph1: 'ગુજરાતમાં ઔદ્યોગિક વિકાસ ઝડપથી આગળ વધી રહ્યો છે. નવી નીતિઓથી ઉદ્યોગ જગતમાં ઉત્સાહ અને હજારો નવી રોજગારીની તકો ઊભી થશે. રાજ્ય સરકાર દ્વારા જાહેર કરાયેલી નવી ઔદ્યોગિક નીતિ અને સિંગલ વિન્ડો સિસ્ટમના કારણે દેશ-વિદેશના અગ્રણી ઉદ્યોગગૃહો રાજ્યમાં મૂડીરોકાણ કરવા આકર્ષાયા છે. વિવિધ ક્ષેત્રોમાં નવી ફેક્ટરીઓ અને ઉત્પાદન એકમો સ્થાપિત થવાથી યુવા વર્ગ માટે સ્થાનિક કક્ષાએ જ ૧ લાખથી વધુ પ્રત્યક્ષ અને પરોક્ષ રોજગારીની વિશાળ તકો ઉપલબ્ધ થશે.',
      paragraph2: 'વિદેશી રોકાણકારો સાથે થયેલા કરારોથી ઓટોમોબાઇલ, સેમિકન્ડક્ટર અને ડિફેન્સ મેન્યુફેક્ચરિંગ જેવા ક્ષેત્રોમાં તેજી આવશે અને કૌશલ્યવાન ઇજનેરો તથા યુવાનોની માંગ વધશે.',
      body: 'ગુજરાતમાં ઔદ્યોગિક વિકાસ ઝડપથી આગળ વધી રહ્યો છે. નવી નીતિઓથી ઉદ્યોગ જગતમાં ઉત્સાહ અને હજારો નવી રોજગારીની તકો ઊભી થશે. રાજ્ય સરકાર દ્વારા જાહેર કરાયેલી નવી ઔદ્યોગિક નીતિ અને સિંગલ વિન્ડો સિસ્ટમના કારણે દેશ-વિદેશના અગ્રણી ઉદ્યોગગૃહો રાજ્યમાં મૂડીરોકાણ કરવા આકર્ષાયા છે. વિવિધ ક્ષેત્રોમાં નવી ફેક્ટરીઓ અને ઉત્પાદન એકમો સ્થાપિત થવાથી યુવા વર્ગ માટે સ્થાનિક કક્ષાએ જ ૧ લાખથી વધુ પ્રત્યક્ષ અને પરોક્ષ રોજગારીની વિશાળ તકો ઉપલબ્ધ થશે.\n\nવિદેશી રોકાણકારો સાથે થયેલા કરારોથી ઓટોમોબાઇલ, સેમિકન્ડક્ટર અને ડિફેન્સ મેન્યુફેક્ચરિંગ જેવા ક્ષેત્રોમાં તેજી આવશે અને કૌશલ્યવાન ઇજનેરો તથા યુવાનોની માંગ વધશે.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
      keyPoints: {
        title: 'રોજગારીના મુખ્ય ક્ષેત્રો',
        points: [
          'મેન્યુફેક્ચરિંગ',
          'ગ્રીન એનર્જી',
          'IT અને ફિનટેક',
          'લોજિસ્ટિક્સ અને પોર્ટ ડેવલપમેન્ટ',
        ],
      },
    },
    {
      category: 'ભારતની મોટી સફળતા',
      headline: 'ચંદ્રયાન-૩ પછી હવે સૂર્ય અભિયાન તરફ ભારત',
      subheadline: 'આદિત્ય-L1 મિશન સફળતાપૂર્વક આગળ વધ્યું',
      location: 'નવી દિલ્હી',
      paragraph1: 'ભારતીય અવકાશ સંશોધન સંસ્થા (ઇસરો) દ્વારા સૂર્યના અભ્યાસ માટે મોકલવામાં આવેલા આદિત્ય-L1 મિશને સફળતાપૂર્વક તેના નિર્ધારિત લેગ્રેન્જ પોઇન્ટ-૧ પર પહોંચી વૈજ્ઞાનિક ડેટા મોકલવાનું શરૂ કર્યું છે. આ અભિયાનથી સૌર તોફાનો, કિરણોત્સર્ગ અને પૃથ્વીના વાતાવરણ પર થતી અસરો વિશે ઊંડાણપૂર્વકની માહિતી મળશે. ભારતીય વૈજ્ઞાનિકોની આ અભૂતપૂર્વ સિદ્ધિની વૈશ્વિક સ્તરે નાસા સહિતની એજન્સીઓ દ્વારા ભારે પ્રશંસા થઈ રહી છે.',
      paragraph2: 'આ મિશનમાં વપરાયેલા તમામ વૈજ્ઞાનિક પેલોડ સંપૂર્ણ સ્વદેશી ટેકનોલોજીથી ભારતમાં જ તૈયાર કરાયા છે, જે સ્પેસ સેક્ટરમાં આત્મનિર્ભરતાનું ઉત્તમ ઉદાહરણ પૂરું પાડે છે.',
      body: 'ભારતીય અવકાશ સંશોધન સંસ્થા (ઇસરો) દ્વારા સૂર્યના અભ્યાસ માટે મોકલવામાં આવેલા આદિત્ય-L1 મિશને સફળતાપૂર્વક તેના નિર્ધારિત લેગ્રેન્જ પોઇન્ટ-૧ પર પહોંચી વૈજ્ઞાનિક ડેટા મોકલવાનું શરૂ કર્યું છે. આ અભિયાનથી સૌર તોફાનો, કિરણોત્સર્ગ અને પૃથ્વીના વાતાવરણ પર થતી અસરો વિશે ઊંડાણપૂર્વકની માહિતી મળશે. ભારતીય વૈજ્ઞાનિકોની આ અભૂતપૂર્વ સિદ્ધિની વૈશ્વિક સ્તરે નાસા સહિતની એજન્સીઓ દ્વારા ભારે પ્રશંસા થઈ રહી છે.\n\nઆ મિશનમાં વપરાયેલા તમામ વૈજ્ઞાનિક પેલોડ સંપૂર્ણ સ્વદેશી ટેકનોલોજીથી ભારતમાં જ તૈયાર કરાયા છે, જે સ્પેસ સેક્ટરમાં આત્મનિર્ભરતાનું ઉત્તમ ઉદાહરણ પૂરું પાડે છે.',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
      keyPoints: {
        title: 'મિશનની વિશેષતાઓ',
        points: [
          'સૂર્યની સપાટી અને તેની ગતિવિધિઓનું અધ્યયન',
          'પાંચ વૈજ્ઞાનિક ઉપકરણો સાથે મિશન',
          'ભારત માટે વૈજ્ઞાનિક દ્રષ્ટિએ મહત્વપૂર્ણ પગલું',
        ],
      },
    },
  ],

  bottomLeftFeature: {
    category: 'સંસદનું સત્ર',
    headline: 'મહિલા સુરક્ષા બિલ આજે લોકસભામાં રજૂ',
    subheadline: 'વિરોધ પક્ષના સભ્યોમાં પણ મહત્વની ચર્ચા થવાની શક્યતા',
    location: 'નવી દિલ્હી',
    paragraph1: 'મહિલા સુરક્ષા બિલ કાયદાને મજબૂત કરવા માટે આજે સંસદના વિશેષ સત્રમાં લોકસભામાં રજૂ કરવામાં આવ્યું છે. આ ઐતિહાસિક બિલમાં મહિલાઓની સુરક્ષા, કાર્યસ્થળે સતામણી સામે કડક રક્ષણ અને ગુનેગારોને ઝડપી સજા આપવા માટે નવી જોગવાઈઓ સામેલ કરવામાં આવી છે. તમામ પક્ષો દ્વારા આ બિલને સૈદ્ધાંતિક સમર્થન મળવાની અપેક્ષા વ્યક્ત કરવામાં આવી છે. ગૃહમાં આ બિલ પર સભ્યો દ્વારા વિગતવાર ચર્ચા થશે અને ત્યારબાદ મંજૂરી માટે મતદાન યોજાશે. કાયદા મંત્રીએ જણાવ્યું હતું કે મહિલાઓ સામેના ગંભીર ગુનાઓમાં તપાસ પ્રક્રિયા સમયબદ્ધ પૂર્ણ થાય તે માટે પોલીસ વિભાગને આધુનિક ટેકનોલોજી અને વિશેષ ટાસ્ક ફોર્સ પૂરી પાડવામાં આવશે. દેશના તમામ રાજ્યોમાં ફાસ્ટ-ટ્રેક અદાલતોની સંખ્યા બમણી કરવાનો અને પીડિતોને આર્થિક સહાય તથા તાત્કાલિક પુનર્વસન પૂરું પાડવાનો આદેશ પણ અપાયો છે. આ ઉપરાંત દરેક જિલ્લામાં ૨૪ કલાક કાર્યરત હેલ્પલાઇન અને વન-સ્ટોપ સપોર્ટ સેન્ટરો ઊભા કરાશે, જેથી પીડિત મહિલાઓને એક જ સ્થળેથી ત્વરિત કાનૂની, તબીબી અને પરામર્શ સહાય મળી રહેશે.  આ ઉપરાંત દરેક જિલ્લામાં ૨૪ કલાક કાર્યરત હેલ્પલાઇન અને વન-સ્ટોપ સપોર્ટ સેન્ટરો ઊભા કરાશે, જેથી પીડિત મહિલાઓને એક જ સ્થળેથી ત્વરિત કાનૂની, તબીબી અને પરામર્શ સહાય મળી રહેશે.',
    paragraph2: 'કાયદા નિષ્ણાતોના મતે આ બિલ પાસ થવાથી પીડિત મહિલાઓને સમયસર અને ઝડપી ન્યાય મળશે તેમજ ન્યાયિક પ્રક્રિયા વધુ પારદર્શક તથા પરિણામલક્ષી બનશે. દેશભરની સામાજિક સંસ્થાઓ અને મહિલા સંગઠનોએ આ બિલને આવકાર્યું છે અને કેન્દ્ર સરકારના આ પગલાને મહિલા સશક્તિકરણની દિશામાં એક ઐતિહાસિક અને ક્રાંતિકારી પહેલ ગણાવી છે.',
    body: 'મહિલા સુરક્ષા બિલ કાયદાને મજબૂત કરવા માટે આજે સંસદના વિશેષ સત્રમાં લોકસભામાં રજૂ કરવામાં આવ્યું છે. આ ઐતિહાસિક બિલમાં મહિલાઓની સુરક્ષા, કાર્યસ્થળે સતામણી સામે કડક રક્ષણ અને ગુનેગારોને ઝડપી સજા આપવા માટે નવી જોગવાઈઓ સામેલ કરવામાં આવી છે. તમામ પક્ષો દ્વારા આ બિલને સૈદ્ધાંતિક સમર્થન મળવાની અપેક્ષા વ્યક્ત કરવામાં આવી છે. ગૃહમાં આ બિલ પર સભ્યો દ્વારા વિગતવાર ચર્ચા થશે અને ત્યારબાદ મંજૂરી માટે મતદાન યોજાશે. કાયદા મંત્રીએ જણાવ્યું હતું કે મહિલાઓ સામેના ગંભીર ગુનાઓમાં તપાસ પ્રક્રિયા સમયબદ્ધ પૂર્ણ થાય તે માટે પોલીસ વિભાગને આધુનિક ટેકનોલોજી અને વિશેષ ટાસ્ક ફોર્સ પૂરી પાડવામાં આવશે. દેશના તમામ રાજ્યોમાં ફાસ્ટ-ટ્રેક અદાલતોની સંખ્યા બમણી કરવાનો અને પીડિતોને આર્થિક સહાય તથા તાત્કાલિક પુનર્વસન પૂરું પાડવાનો આદેશ પણ અપાયો છે. આ ઉપરાંત દરેક જિલ્લામાં ૨૪ કલાક કાર્યરત હેલ્પલાઇન અને વન-સ્ટોપ સપોર્ટ સેન્ટરો ઊભા કરાશે, જેથી પીડિત મહિલાઓને એક જ સ્થળેથી ત્વરિત કાનૂની, તબીબી અને પરામર્શ સહાય મળી રહેશે.\n\nકાયદા નિષ્ણાતોના મતે આ બિલ પાસ થવાથી પીડિત મહિલાઓને સમયસર અને ઝડપી ન્યાય મળશે તેમજ ન્યાયિક પ્રક્રિયા વધુ પારદર્શક તથા પરિણામલક્ષી બનશે. દેશભરની સામાજિક સંસ્થાઓ અને મહિલા સંગઠનોએ આ બિલને આવકાર્યું છે અને કેન્દ્ર સરકારના આ પગલાને મહિલા સશક્તિકરણની દિશામાં એક ઐતિહાસિક અને ક્રાંતિકારી પહેલ ગણાવી છે.',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80',
    keyPoints: {
      title: 'બિલની મુખ્ય જોગવાઈઓ',
      points: [
        'મહિલા સુરક્ષા માટે કડક કાયદા',
        'ઝડપી ન્યાય માટે વિશેષ કોર્ટ',
        'ઓનલાઇન હેરાસમેન્ટ સામે કડક પગલા',
      ],
    },
  },

  bottomMiddleSports: {
    category: 'એશિયા કપ ૨૦૨૬',
    headline: 'ભારતે પાકિસ્તાનને ૫ વિકેટે હરાવ્યું',
    subheadline: 'રોહિત અને ગિલની શાનદાર બેટિંગથી ભારતને મોટી જીત',
    location: 'દુબઈ',
    paragraph1: 'દુબઈ ઇન્ટરનેશનલ સ્ટેડિયમ ખાતે રમાયેલી એશિયા કપ ૨૦૨૬ની રોમાંચક હાઈ-વોલ્ટેજ મેચમાં ભારતીય ટીમે શાનદાર સર્વાંગી પ્રદર્શન કરતાં કટ્ટર હરીફ પાકિસ્તાનને ૫ વિકેટે પરાજય આપીને વિજયી કૂચ જારી રાખી છે. પાકિસ્તાને ટોસ જીતીને પ્રથમ બેટિંગ કરવાનો નિર્ણય લીધો હતો, પરંતુ ભારતીય બોલરોના શિસ્તબદ્ધ આક્રમણ સામે પાકિસ્તાની ટીમ નિર્ધારિત ૫૦ ઓવરમાં ૨૪૫ રન બનાવીને ઓલઆઉટ થઈ ગઈ હતી. લક્ષ્યાંકનો પીછો કરવા ઉતરેલી ભારતીય ટીમ તરફથી સુકાની રોહિત શર્મા અને યુવા ઓપનર શુભમન ગિલે આક્રમક શરૂઆત અપાવી હતી. રોહિત શર્માએ ૭ ચોગ્ગા અને ૩ છગ્ગાની મદદથી ૬૪ રનની કેપ્ટન ઇનિંગ રમી હતી, જ્યારે ગિલે ૬૨ રનનું મહત્વનું યોગદાન આપ્યું હતું. બંને વચ્ચે પ્રથમ વિકેટ માટે ૧૧૫ રનની મજબૂત ભાગીદારી નોંધાઈ હતી, જેણે ભારતની જીતનો મજબૂત પાયો નાખ્યો હતો. મધ્યમ ક્રમમાં વિરાટ કોહલી અને કેએલ રાહુલે સંયમપૂર્વક બેટિંગ કરીને ટીમને વિજયના દ્વાર સુધી પહોંચાડી હતી. જેણે ભારતની જીતનો મજબૂત પાયો નાખ્યો હતો. મધ્યમ ક્રમમાં વિરાટ કોહલી અને કેએલ રાહુલે સંયમપૂર્વક બેટિંગ કરીને ટીમને વિજયના દ્વાર સુધી પહોંચાડી હતી.જેણે ભારતની જીતનો મજબૂત પાયો નાખ્યો હતો. મધ્યમ ક્રમમાં વિરાટ કોહલી અને કેએલ રાહુલે સંયમપૂર્વક બેટિંગ કરીને ટીમને વિજયના દ્વાર સુધી પહોંચાડી હતી.',
    paragraph2: 'ભારતીય બોલિંગ આક્રમણમાં જસપ્રીત બુમરાહે ૩ વિકેટ ઝડપી પાકિસ્તાનના મિડલ ઓર્ડરને ધ્વસ્ત કરી દીધો હતો, જ્યારે કુલદીપ યાદવે ૨ મહત્વની વિકેટ મેળવી હતી. આ ભવ્ય વિજય સાથે ભારતીય ટીમ એશિયા કપના સુપર-૪ રાઉન્ડમાં ટોચના સ્થાને પહોંચી ગઈ છે અને ચાહકોમાં ઉત્સાહનો માહોલ જોવા મળી રહ્યો છે.',
    body: 'દુબઈ ઇન્ટરનેશનલ સ્ટેડિયમ ખાતે રમાયેલી એશિયા કપ ૨૦૨૬ની રોમાંચક હાઈ-વોલ્ટેજ મેચમાં ભારતીય ટીમે શાનદાર સર્વાંગી પ્રદર્શન કરતાં કટ્ટર હરીફ પાકિસ્તાનને ૫ વિકેટે પરાજય આપીને વિજયી કૂચ જારી રાખી છે. પાકિસ્તાને ટોસ જીતીને પ્રથમ બેટિંગ કરવાનો નિર્ણય લીધો હતો, પરંતુ ભારતીય બોલરોના શિસ્તબદ્ધ આક્રમણ સામે પાકિસ્તાની ટીમ નિર્ધારિત ૫૦ ઓવરમાં ૨૪૫ રન બનાવીને ઓલઆઉટ થઈ ગઈ હતી. લક્ષ્યાંકનો પીછો કરવા ઉતરેલી ભારતીય ટીમ તરફથી સુકાની રોહિત શર્મા અને યુવા ઓપનર શુભમન ગિલે આક્રમક શરૂઆત અપાવી હતી. રોહિત શર્માએ ૭ ચોગ્ગા અને ૩ છગ્ગાની મદદથી ૬૪ રનની કેપ્ટન ઇનિંગ રમી હતી, જ્યારે ગિલે ૬૨ રનનું મહત્વનું યોગદાન આપ્યું હતું. બંને વચ્ચે પ્રથમ વિકેટ માટે ૧૧૫ રનની મજબૂત ભાગીદારી નોંધાઈ હતી, જેણે ભારતની જીતનો મજબૂત પાયો નાખ્યો હતો. મધ્યમ ક્રમમાં વિરાટ કોહલી અને કેએલ રાહુલે સંયમપૂર્વક બેટિંગ કરીને ટીમને વિજયના દ્વાર સુધી પહોંચાડી હતી.\n\nભારતીય બોલિંગ આક્રમણમાં જસપ્રીત બુમરાહે ૩ વિકેટ ઝડપી પાકિસ્તાનના મિડલ ઓર્ડરને ધ્વસ્ત કરી દીધો હતો, જ્યારે કુલદીપ યાદવે ૨ મહત્વની વિકેટ મેળવી હતી. આ ભવ્ય વિજય સાથે ભારતીય ટીમ એશિયા કપના સુપર-૪ રાઉન્ડમાં ટોચના સ્થાને પહોંચી ગઈ છે અને ચાહકોમાં ઉત્સાહનો માહોલ જોવા મળી રહ્યો છે.',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=600&q=80',
    keyPoints: {
      title: 'મેચની મુખ્ય વાતો',
      points: [
        'ભારતે ૫ વિકેટે જીત્યું',
        'રોહિત શર્માએ ૬૪ રન',
        'ગિલે ૬૨ રન નોંધ્યા',
        'ભારત સુપર-૪ માં આગળ',
      ],
    },
  },

  pageNumber: '૦૧',
  pageIndex: [
    { label: 'રાજ્ય', page: '02' },
    { label: 'દેશ-વિદેશ', page: '04' },
    { label: 'અર્થતંત્ર', page: '06' },
    { label: 'રમતગમત', page: '08' },
    { label: 'જીવનશૈલી', page: '10' },
    { label: 'સંપાદકીય', page: '12' },
  ],

  tagline: 'સત્યની સાથે... હંમેશા તમારી સાથે...',

  advertisement: {
    id: 'p1_ad',
    title: 'જાહેરાત (ADVERTISEMENT)',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
    link: 'https://gujaratpost.com',
  },
};

// ─────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────

export interface Page1FrontProps {
  data: any;
  onChange: (newData: any) => void;
  selectedPath?: string;
  onSelectSlot?: (path: string, label: string) => void;
  onImportClick?: (slotPath: string, label: string) => void;
  onRefreshWeather?: () => void;
  readOnly?: boolean;
}

export const Page1Front: React.FC<Page1FrontProps> = ({
  data: inputData,
  onChange,
  selectedPath,
  onSelectSlot,
  onImportClick,
  onRefreshWeather,
  readOnly,
}) => {
  const contextReadOnly = useEpaperReadOnly();
  const isReadOnly = Boolean(readOnly ?? contextReadOnly);
  const effectiveOnSelect = isReadOnly ? undefined : onSelectSlot;
  const effectiveSelectedPath = isReadOnly ? undefined : selectedPath;
  const data: Page1Data = React.useMemo(() => {
    if (!inputData) return samplePage1Data;
    return {
      mastheadTitle: inputData.mastheadTitle || samplePage1Data.mastheadTitle,
      mastheadTagline: inputData.mastheadTagline || samplePage1Data.mastheadTagline,
      quote: {
        text: inputData.quote?.text || samplePage1Data.quote.text,
        author: inputData.quote?.author || samplePage1Data.quote.author,
      },
      weather: {
        city: inputData.weather?.city || inputData.city || samplePage1Data.weather.city,
        high: inputData.weather?.high || samplePage1Data.weather.high,
        low: inputData.weather?.low || samplePage1Data.weather.low,
        condition: inputData.weather?.condition || samplePage1Data.weather.condition,
        icon: inputData.weather?.icon || samplePage1Data.weather.icon || '⛅',
      },
      editionBar: {
        rniNo: inputData.editionBar?.rniNo || samplePage1Data.editionBar.rniNo,
        dayDate: inputData.editionBar?.dayDate || inputData.date || samplePage1Data.editionBar.dayDate,
        yearIssue: inputData.editionBar?.yearIssue || inputData.editionInfo || samplePage1Data.editionBar.yearIssue,
        city: inputData.editionBar?.city || inputData.city || samplePage1Data.editionBar.city,
        website: inputData.editionBar?.website || samplePage1Data.editionBar.website,
        price: inputData.editionBar?.price || inputData.price || samplePage1Data.editionBar.price,
      },
      mainHeadline: {
        category: inputData.mainHeadline?.category || inputData.leadStory?.category || samplePage1Data.mainHeadline.category,
        headline: inputData.mainHeadline?.headline || inputData.leadStory?.headline || samplePage1Data.mainHeadline.headline,
        subheadline: inputData.mainHeadline?.subheadline || inputData.leadStory?.subheadline || samplePage1Data.mainHeadline.subheadline,
        location: inputData.mainHeadline?.location || inputData.leadStory?.location || samplePage1Data.mainHeadline.location,
        paragraph1: inputData.mainHeadline?.paragraph1 !== undefined
          ? inputData.mainHeadline.paragraph1
          : (inputData.leadStory?.paragraph1 !== undefined
              ? inputData.leadStory.paragraph1
              : samplePage1Data.mainHeadline.paragraph1),
        paragraph2: inputData.mainHeadline?.paragraph2 !== undefined
          ? inputData.mainHeadline.paragraph2
          : (inputData.leadStory?.paragraph2 !== undefined
              ? inputData.leadStory.paragraph2
              : samplePage1Data.mainHeadline.paragraph2),
        paragraph3: inputData.mainHeadline?.paragraph3 !== undefined
          ? inputData.mainHeadline.paragraph3
          : (inputData.leadStory?.paragraph3 !== undefined
              ? inputData.leadStory.paragraph3
              : samplePage1Data.mainHeadline.paragraph3),
        body: inputData.mainHeadline?.body || inputData.leadStory?.articleBody || inputData.leadStory?.body || samplePage1Data.mainHeadline.body,
        image: inputData.mainHeadline?.image ?? inputData.leadStory?.image ?? samplePage1Data.mainHeadline.image,
        imageCaption: inputData.mainHeadline?.imageCaption || inputData.leadStory?.caption || samplePage1Data.mainHeadline.imageCaption,
        keyPoints: inputData.mainHeadline?.keyPoints || inputData.leadStory?.keyPoints || samplePage1Data.mainHeadline.keyPoints,
      },
      sideTopNews: {
        category: inputData.sideTopNews?.category || samplePage1Data.sideTopNews.category,
        headline: inputData.sideTopNews?.headline || samplePage1Data.sideTopNews.headline,
        subheadline: inputData.sideTopNews?.subheadline || samplePage1Data.sideTopNews.subheadline,
        location: inputData.sideTopNews?.location || samplePage1Data.sideTopNews.location,
        paragraph1:
          inputData.sideTopNews?.paragraph1?.trim()
            ? inputData.sideTopNews.paragraph1
            : samplePage1Data.sideTopNews.paragraph1,
        paragraph2:
          inputData.sideTopNews?.paragraph2?.trim()
            ? inputData.sideTopNews.paragraph2
            : samplePage1Data.sideTopNews.paragraph2,
        body:
          inputData.sideTopNews?.body?.trim()
            ? inputData.sideTopNews.body
            : samplePage1Data.sideTopNews.body,
        image: inputData.sideTopNews?.image ?? samplePage1Data.sideTopNews.image,
        imageCaption: inputData.sideTopNews?.imageCaption || samplePage1Data.sideTopNews.imageCaption,
        pullQuote: {
          image: inputData.sideTopNews?.pullQuote?.image || inputData.sideTopNews?.pullQuote?.photo || samplePage1Data.sideTopNews.pullQuote?.image,
          photo: inputData.sideTopNews?.pullQuote?.photo || inputData.sideTopNews?.pullQuote?.image || samplePage1Data.sideTopNews.pullQuote?.photo,
          quote: inputData.sideTopNews?.pullQuote?.quote || inputData.sideTopNews?.pullQuote?.text || samplePage1Data.sideTopNews.pullQuote?.quote,
          text: inputData.sideTopNews?.pullQuote?.text || inputData.sideTopNews?.pullQuote?.quote || samplePage1Data.sideTopNews.pullQuote?.text,
          name: inputData.sideTopNews?.pullQuote?.name || inputData.sideTopNews?.pullQuote?.author || samplePage1Data.sideTopNews.pullQuote?.name,
          author: inputData.sideTopNews?.pullQuote?.author || inputData.sideTopNews?.pullQuote?.name || samplePage1Data.sideTopNews.pullQuote?.author,
        },
        keyPoints: inputData.sideTopNews?.keyPoints || samplePage1Data.sideTopNews.keyPoints,
      },
      newsBlocks: (() => {
        const inputBlocks = Array.isArray(inputData.newsBlocks) && inputData.newsBlocks.length > 0
          ? inputData.newsBlocks
          : [];

        const maxLen = Math.max(samplePage1Data.newsBlocks.length, inputBlocks.length);
        const result: StoryBlockData[] = [];

        for (let idx = 0; idx < maxLen; idx++) {
          const sampleBlock = samplePage1Data.newsBlocks[idx] || {
            category: '',
            headline: '',
            body: '',
          };
          const inBlock = inputBlocks[idx];

          if (!inBlock) {
            result.push(sampleBlock);
            continue;
          }

          // Paragraph 1 & 2 resolution
          let p1 = inBlock.paragraph1;
          let p2 = inBlock.paragraph2;
          let body = inBlock.body;

          if (body && (!p1 || !p2)) {
            const parts = body.split(/\n\s*\n/).map((s: string) => s.trim()).filter(Boolean);
            if (parts.length >= 2) {
              if (!p1) p1 = parts[0];
              if (!p2) p2 = parts.slice(1).join('\n\n');
            } else if (parts.length === 1 && !p1) {
              p1 = parts[0];
            }
          }

          // If idx === 1 and it had the old short single sentence body without explicit paragraph1/paragraph2
          if (idx === 1 && (!inBlock.paragraph1 || inBlock.paragraph1 === 'ગુજરાતમાં ઔદ્યોગિક વિકાસ ઝડપથી આગળ વધી રહ્યો છે. નવી નીતિઓથી ઉદ્યોગ જગતમાં ઉત્સાહ અને હજારો નવી રોજગારીની તકો ઊભી થશે.') && inBlock.body === 'ગુજરાતમાં ઔદ્યોગિક વિકાસ ઝડપથી આગળ વધી રહ્યો છે. નવી નીતિઓથી ઉદ્યોગ જગતમાં ઉત્સાહ અને હજારો નવી રોજગારીની તકો ઊભી થશે.') {
            p1 = sampleBlock.paragraph1;
            p2 = inBlock.paragraph2 || sampleBlock.paragraph2;
            body = p2 ? `${p1}\n\n${p2}` : p1;
          }

          // If idx === 2 and it had the old short single sentence body without explicit paragraph1/paragraph2
          if (idx === 2 && (!inBlock.paragraph1 || inBlock.paragraph1 === 'ભારતીય અવકાશ સંસ્થા ISRO દ્વારા આદિત્ય-L1 મિશન અંતર્ગત મહત્વપૂર્ણ માહિતી એકત્ર કરવામાં આવી છે. વિશ્વભરમાં ભારતના વિજ્ઞાનની પ્રશંસા થઈ રહી છે.') && inBlock.body === 'ભારતીય અવકાશ સંસ્થા ISRO દ્વારા આદિત્ય-L1 મિશન અંતર્ગત મહત્વપૂર્ણ માહિતી એકત્ર કરવામાં આવી છે. વિશ્વભરમાં ભારતના વિજ્ઞાનની પ્રશંસા થઈ રહી છે.') {
            p1 = sampleBlock.paragraph1;
            p2 = inBlock.paragraph2 || sampleBlock.paragraph2;
            body = p2 ? `${p1}\n\n${p2}` : p1;
          }

          if (!p1) {
            p1 = sampleBlock.paragraph1 || sampleBlock.body || '';
          }
          if (!p2) {
            p2 = sampleBlock.paragraph2 || '';
          }
          if (!body) {
            body = p2 ? `${p1}\n\n${p2}` : (p1 || sampleBlock.body || '');
          }

          result.push({
            ...sampleBlock,
            ...inBlock,
            category: inBlock.category || sampleBlock.category,
            headline: inBlock.headline || sampleBlock.headline,
            subheadline: inBlock.subheadline || sampleBlock.subheadline,
            location: inBlock.location !== undefined ? inBlock.location : sampleBlock.location,
            paragraph1: p1,
            paragraph2: p2,
            body,
            image: inBlock.image ?? sampleBlock.image,
            keyPoints: inBlock.keyPoints || sampleBlock.keyPoints,
          });
        }
        return result;
      })(),
      bottomLeftFeature: (() => {
        const inBL = inputData.bottomLeftFeature || {};
        const sampleBL = samplePage1Data.bottomLeftFeature;

        let p1 = inBL.paragraph1;
        let p2 = inBL.paragraph2;
        let body = inBL.body;

        if (body && (!p1 || !p2)) {
          const parts = body.split(/\n\s*\n/).map((s: string) => s.trim()).filter(Boolean);
          if (parts.length >= 2) {
            if (!p1) p1 = parts[0];
            if (!p2) p2 = parts.slice(1).join('\n\n');
          } else if (parts.length === 1 && !p1) {
            p1 = parts[0];
          }
        }

        // Check if p1 is old short version or missing
        if (!p1 || p1 === 'મહિલા સુરક્ષા બિલ કાયદાને મજબૂત કરવા માટે લોકસભામાં રજૂ કરવામાં આવ્યું છે. તમામ પક્ષો દ્વારા આ બિલને સમર્થન મળવાની અપેક્ષા છે.' || (p1.startsWith('મહિલા સુરક્ષા બિલ કાયદાને મજબૂત કરવા માટે આજે સંસદના વિશેષ સત્રમાં') && !p1.includes('હેલ્પલાઇન'))) {
          p1 = sampleBL.paragraph1;
        }

        // Check if p2 is old short version or missing
        if (!p2 || p2 === 'કાયદા નિષ્ણાતોના મતે આ બિલ પાસ થવાથી પીડિત મહિલાઓને ઝડપી ન્યાય મળશે અને ન્યાયિક પ્રક્રિયા વધુ પારદર્શક તથા અસરકારક બનશે.') {
          p2 = sampleBL.paragraph2;
        }

        if (!body || body.includes('તમામ પક્ષો દ્વારા આ બિલને સમર્થન મળવાની અપેક્ષા છે.') || (body.startsWith('મહિલા સુરક્ષા બિલ કાયદાને મજબૂત કરવા માટે આજે સંસદના વિશેષ સત્રમાં') && !body.includes('હેલ્પલાઇન'))) {
          body = `${p1}\n\n${p2}`;
        }

        return {
          ...sampleBL,
          ...inBL,
          category: inBL.category || sampleBL.category,
          headline: inBL.headline || sampleBL.headline,
          subheadline: inBL.subheadline || sampleBL.subheadline,
          location: inBL.location !== undefined ? inBL.location : sampleBL.location,
          paragraph1: p1,
          paragraph2: p2,
          body,
          image: inBL.image ?? sampleBL.image,
          keyPoints: inBL.keyPoints || sampleBL.keyPoints,
        };
      })(),
      bottomMiddleSports: (() => {
        const inBMS = (inputData.bottomMiddleSports || {}) as any;
        const sampleBMS = samplePage1Data.bottomMiddleSports;
        if (!sampleBMS) return undefined;

        let p1 = inBMS.paragraph1;
        let p2 = inBMS.paragraph2;
        let body = inBMS.body;

        if (!p1 && !p2 && body) {
          const parts = body.split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean);
          if (parts.length >= 2) {
            p1 = parts[0];
            p2 = parts.slice(1).join('\n\n');
          } else {
            p1 = body;
          }
        }

        if (!p1 || p1 === 'ભારતે ૫ વિકેટે જીત મેળવી એશિયા કપમાં શાનદાર પ્રદર્શન ચાલુ રાખ્યું છે. રોહિત અને ગિલની અડધી સદીથી ભારતે લક્ષ્ય સરળતાથી પ્રાપ્ત કર્યું.') {
          p1 = sampleBMS.paragraph1;
        }

        if (!p2) {
          p2 = sampleBMS.paragraph2;
        }

        if (!body || body.includes('રોહિત અને ગિલની અડધી સદીથી ભારતે લક્ષ્ય સરળતાથી પ્રાપ્ત કર્યું.')) {
          body = `${p1}\n\n${p2}`;
        }

        return {
          ...sampleBMS,
          ...inBMS,
          category: inBMS.category || sampleBMS.category,
          headline: inBMS.headline || sampleBMS.headline,
          subheadline: inBMS.subheadline || sampleBMS.subheadline,
          location: inBMS.location !== undefined ? inBMS.location : sampleBMS.location,
          paragraph1: p1,
          paragraph2: p2,
          body,
          image: inBMS.image ?? sampleBMS.image,
          keyPoints: inBMS.keyPoints || sampleBMS.keyPoints,
        };
      })(),
      pageNumber: inputData.pageNumber || samplePage1Data.pageNumber || '૦૧',
      pageIndex: Array.isArray(inputData.pageIndex) && inputData.pageIndex.length > 0
        ? inputData.pageIndex
        : samplePage1Data.pageIndex,
      tagline: inputData.tagline || samplePage1Data.tagline,
      advertisement: inputData.advertisement || samplePage1Data.advertisement || {
        id: 'p1_ad',
        title: 'જાહેરાત (ADVERTISEMENT)',
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
        link: 'https://gujaratpost.com',
      },
    };
  }, [inputData]);

  const [showIconPicker, setShowIconPicker] = React.useState(false);

  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const clone = JSON.parse(JSON.stringify(data));
    let current = clone;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    if (path === 'mainHeadline.paragraph1' || path === 'leadStory.paragraph1') {
      if (!clone.mainHeadline) clone.mainHeadline = {};
      if (!clone.leadStory) clone.leadStory = {};
      clone.mainHeadline.paragraph1 = value;
      clone.leadStory.paragraph1 = value;
      const p2 = clone.mainHeadline.paragraph2 || clone.leadStory.paragraph2 || samplePage1Data.mainHeadline.paragraph2 || '';
      const p3 = clone.mainHeadline.paragraph3 || clone.leadStory.paragraph3 || samplePage1Data.mainHeadline.paragraph3 || '';
      const combined = [value, p2, p3].filter(Boolean).join('\n\n');
      clone.mainHeadline.body = combined;
      clone.leadStory.articleBody = combined;
    }
    if (path === 'mainHeadline.paragraph2' || path === 'leadStory.paragraph2') {
      if (!clone.mainHeadline) clone.mainHeadline = {};
      if (!clone.leadStory) clone.leadStory = {};
      clone.mainHeadline.paragraph2 = value;
      clone.leadStory.paragraph2 = value;
      const p1 = clone.mainHeadline.paragraph1 || clone.leadStory.paragraph1 || samplePage1Data.mainHeadline.paragraph1 || '';
      const p3 = clone.mainHeadline.paragraph3 || clone.leadStory.paragraph3 || samplePage1Data.mainHeadline.paragraph3 || '';
      const combined = [p1, value, p3].filter(Boolean).join('\n\n');
      clone.mainHeadline.body = combined;
      clone.leadStory.articleBody = combined;
    }
    if (path === 'mainHeadline.paragraph3' || path === 'leadStory.paragraph3') {
      if (!clone.mainHeadline) clone.mainHeadline = {};
      if (!clone.leadStory) clone.leadStory = {};
      clone.mainHeadline.paragraph3 = value;
      clone.leadStory.paragraph3 = value;
      const p1 = clone.mainHeadline.paragraph1 || clone.leadStory.paragraph1 || samplePage1Data.mainHeadline.paragraph1 || '';
      const p2 = clone.mainHeadline.paragraph2 || clone.leadStory.paragraph2 || samplePage1Data.mainHeadline.paragraph2 || '';
      const combined = [p1, p2, value].filter(Boolean).join('\n\n');
      clone.mainHeadline.body = combined;
      clone.leadStory.articleBody = combined;
    }
    if (path === 'mainHeadline.body' || path === 'leadStory.articleBody') {
      if (!clone.mainHeadline) clone.mainHeadline = {};
      if (!clone.leadStory) clone.leadStory = {};
      clone.mainHeadline.body = value;
      clone.leadStory.articleBody = value;
      const parts = (value || '').split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        clone.mainHeadline.paragraph1 = parts[0];
        clone.mainHeadline.paragraph2 = parts[1];
        clone.mainHeadline.paragraph3 = parts.slice(2).join('\n\n');
        clone.leadStory.paragraph1 = parts[0];
        clone.leadStory.paragraph2 = parts[1];
        clone.leadStory.paragraph3 = parts.slice(2).join('\n\n');
      } else if (parts.length === 2) {
        clone.mainHeadline.paragraph1 = parts[0];
        clone.mainHeadline.paragraph2 = parts[1];
        clone.mainHeadline.paragraph3 = '';
        clone.leadStory.paragraph1 = parts[0];
        clone.leadStory.paragraph2 = parts[1];
        clone.leadStory.paragraph3 = '';
      } else if (parts.length === 1) {
        clone.mainHeadline.paragraph1 = parts[0];
        clone.mainHeadline.paragraph2 = '';
        clone.mainHeadline.paragraph3 = '';
        clone.leadStory.paragraph1 = parts[0];
        clone.leadStory.paragraph2 = '';
        clone.leadStory.paragraph3 = '';
      } else {
        clone.mainHeadline.paragraph1 = '';
        clone.mainHeadline.paragraph2 = '';
        clone.mainHeadline.paragraph3 = '';
        clone.leadStory.paragraph1 = '';
        clone.leadStory.paragraph2 = '';
        clone.leadStory.paragraph3 = '';
      }
    }
    if (path === 'mainHeadline.headline' || path === 'leadStory.headline') {
      if (!clone.mainHeadline) clone.mainHeadline = {};
      if (!clone.leadStory) clone.leadStory = {};
      clone.mainHeadline.headline = value;
      clone.leadStory.headline = value;
    }
    if (path === 'mainHeadline.subheadline' || path === 'leadStory.subheadline') {
      if (!clone.mainHeadline) clone.mainHeadline = {};
      if (!clone.leadStory) clone.leadStory = {};
      clone.mainHeadline.subheadline = value;
      clone.leadStory.subheadline = value;
    }
    if (path === 'mainHeadline.category' || path === 'leadStory.category') {
      if (!clone.mainHeadline) clone.mainHeadline = {};
      if (!clone.leadStory) clone.leadStory = {};
      clone.mainHeadline.category = value;
      clone.leadStory.category = value;
    }
    if (path === 'mainHeadline.location' || path === 'leadStory.location') {
      if (!clone.mainHeadline) clone.mainHeadline = {};
      if (!clone.leadStory) clone.leadStory = {};
      clone.mainHeadline.location = value;
      clone.leadStory.location = value;
    }
    if (path === 'mainHeadline.image' || path === 'leadStory.image') {
      if (!clone.mainHeadline) clone.mainHeadline = {};
      if (!clone.leadStory) clone.leadStory = {};
      clone.mainHeadline.image = value;
      clone.leadStory.image = value;
    }
    if (path === 'mainHeadline.imageCaption' || path === 'leadStory.caption') {
      if (!clone.mainHeadline) clone.mainHeadline = {};
      if (!clone.leadStory) clone.leadStory = {};
      clone.mainHeadline.imageCaption = value;
      clone.leadStory.caption = value;
    }

    if (path === 'sideTopNews.paragraph1') {
      if (!clone.sideTopNews) clone.sideTopNews = {};
      clone.sideTopNews.paragraph1 = value;
      const p2 = clone.sideTopNews.paragraph2 || samplePage1Data.sideTopNews.paragraph2 || '';
      clone.sideTopNews.body = p2 ? `${value}\n\n${p2}` : value;
    }
    if (path === 'sideTopNews.paragraph2') {
      if (!clone.sideTopNews) clone.sideTopNews = {};
      clone.sideTopNews.paragraph2 = value;
      const p1 = clone.sideTopNews.paragraph1 || samplePage1Data.sideTopNews.paragraph1 || '';
      clone.sideTopNews.body = p1 ? `${p1}\n\n${value}` : value;
    }
    if (path === 'sideTopNews.body') {
      if (!clone.sideTopNews) clone.sideTopNews = {};
      clone.sideTopNews.body = value;
      const parts = (value || '').split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        clone.sideTopNews.paragraph1 = parts[0];
        clone.sideTopNews.paragraph2 = parts.slice(1).join('\n\n');
      } else {
        clone.sideTopNews.paragraph1 = parts[0] || value || '';
        clone.sideTopNews.paragraph2 = '';
      }
    }
    if (path === 'sideTopNews.pullQuote.quote' || path === 'sideTopNews.pullQuote.text') {
      if (!clone.sideTopNews) clone.sideTopNews = {};
      if (!clone.sideTopNews.pullQuote) clone.sideTopNews.pullQuote = {};
      clone.sideTopNews.pullQuote.quote = value;
      clone.sideTopNews.pullQuote.text = value;
    }
    if (path === 'sideTopNews.pullQuote.name' || path === 'sideTopNews.pullQuote.author') {
      if (!clone.sideTopNews) clone.sideTopNews = {};
      if (!clone.sideTopNews.pullQuote) clone.sideTopNews.pullQuote = {};
      clone.sideTopNews.pullQuote.name = value;
      clone.sideTopNews.pullQuote.author = value;
    }
    if (path === 'sideTopNews.pullQuote.image' || path === 'sideTopNews.pullQuote.photo') {
      if (!clone.sideTopNews) clone.sideTopNews = {};
      if (!clone.sideTopNews.pullQuote) clone.sideTopNews.pullQuote = {};
      clone.sideTopNews.pullQuote.image = value;
      clone.sideTopNews.pullQuote.photo = value;
    }

    // Mirror sideTopNews to secondaryStories[0] if secondaryStories exists
    if (path.startsWith('sideTopNews') && clone.secondaryStories?.[0]) {
      const sec0 = clone.secondaryStories[0];
      if (path === 'sideTopNews.headline') sec0.headline = value;
      if (path === 'sideTopNews.subheadline') sec0.subheadline = value;
      if (path === 'sideTopNews.category') sec0.category = value;
      if (path === 'sideTopNews.image') sec0.image = value;
      if (path === 'sideTopNews.body') sec0.articleBody = value;
      if (path === 'sideTopNews.paragraph1') sec0.paragraph1 = value;
      if (path === 'sideTopNews.paragraph2') sec0.paragraph2 = value;
      if (path.startsWith('sideTopNews.pullQuote.')) {
        if (!sec0.pullQuote) sec0.pullQuote = {};
        const subKey = path.replace('sideTopNews.pullQuote.', '');
        sec0.pullQuote[subKey] = value;
        if (subKey === 'quote' || subKey === 'text') {
          sec0.pullQuote.quote = value;
          sec0.pullQuote.text = value;
        }
        if (subKey === 'name' || subKey === 'author') {
          sec0.pullQuote.name = value;
          sec0.pullQuote.author = value;
        }
        if (subKey === 'image' || subKey === 'photo') {
          sec0.pullQuote.image = value;
          sec0.pullQuote.photo = value;
        }
      }
    }

    const newsBlockMatch = path.match(/^newsBlocks\.(\d+)\.(paragraph1|paragraph2|body)$/);
    if (newsBlockMatch) {
      const idx = parseInt(newsBlockMatch[1], 10);
      const field = newsBlockMatch[2];
      if (!clone.newsBlocks) clone.newsBlocks = [];
      if (!clone.newsBlocks[idx]) clone.newsBlocks[idx] = {};

      if (field === 'paragraph1') {
        clone.newsBlocks[idx].paragraph1 = value;
        const p2 = clone.newsBlocks[idx].paragraph2 ?? samplePage1Data.newsBlocks[idx]?.paragraph2 ?? '';
        clone.newsBlocks[idx].body = p2 ? `${value}\n\n${p2}` : value;
      } else if (field === 'paragraph2') {
        clone.newsBlocks[idx].paragraph2 = value;
        const p1 = clone.newsBlocks[idx].paragraph1 ?? samplePage1Data.newsBlocks[idx]?.paragraph1 ?? clone.newsBlocks[idx].body ?? '';
        clone.newsBlocks[idx].body = p1 ? `${p1}\n\n${value}` : value;
      } else if (field === 'body') {
        clone.newsBlocks[idx].body = value;
        const parts = (value || '').split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          clone.newsBlocks[idx].paragraph1 = parts[0];
          clone.newsBlocks[idx].paragraph2 = parts.slice(1).join('\n\n');
        } else {
          clone.newsBlocks[idx].paragraph1 = parts[0] || value || '';
          clone.newsBlocks[idx].paragraph2 = '';
        }
      }
    }

    if (path === 'bottomLeftFeature.paragraph1') {
      if (!clone.bottomLeftFeature) clone.bottomLeftFeature = {};
      clone.bottomLeftFeature.paragraph1 = value;
      const p2 = clone.bottomLeftFeature.paragraph2 ?? samplePage1Data.bottomLeftFeature.paragraph2 ?? '';
      clone.bottomLeftFeature.body = p2 ? `${value}\n\n${p2}` : value;
    }
    if (path === 'bottomLeftFeature.paragraph2') {
      if (!clone.bottomLeftFeature) clone.bottomLeftFeature = {};
      clone.bottomLeftFeature.paragraph2 = value;
      const p1 = clone.bottomLeftFeature.paragraph1 ?? samplePage1Data.bottomLeftFeature.paragraph1 ?? clone.bottomLeftFeature.body ?? '';
      clone.bottomLeftFeature.body = p1 ? `${p1}\n\n${value}` : value;
    }
    if (path === 'bottomLeftFeature.body') {
      if (!clone.bottomLeftFeature) clone.bottomLeftFeature = {};
      clone.bottomLeftFeature.body = value;
      const parts = (value || '').split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        clone.bottomLeftFeature.paragraph1 = parts[0];
        clone.bottomLeftFeature.paragraph2 = parts.slice(1).join('\n\n');
      } else {
        clone.bottomLeftFeature.paragraph1 = parts[0] || value || '';
        clone.bottomLeftFeature.paragraph2 = '';
      }
    }

    if (path === 'bottomMiddleSports.paragraph1') {
      if (!clone.bottomMiddleSports) clone.bottomMiddleSports = {};
      clone.bottomMiddleSports.paragraph1 = value;
      const p2 = clone.bottomMiddleSports.paragraph2 ?? samplePage1Data.bottomMiddleSports?.paragraph2 ?? '';
      clone.bottomMiddleSports.body = p2 ? `${value}\n\n${p2}` : value;
    }
    if (path === 'bottomMiddleSports.paragraph2') {
      if (!clone.bottomMiddleSports) clone.bottomMiddleSports = {};
      clone.bottomMiddleSports.paragraph2 = value;
      const p1 = clone.bottomMiddleSports.paragraph1 ?? samplePage1Data.bottomMiddleSports?.paragraph1 ?? clone.bottomMiddleSports.body ?? '';
      clone.bottomMiddleSports.body = p1 ? `${p1}\n\n${value}` : value;
    }
    if (path === 'bottomMiddleSports.body') {
      if (!clone.bottomMiddleSports) clone.bottomMiddleSports = {};
      clone.bottomMiddleSports.body = value;
      const parts = (value || '').split(/\n\s*\n/).map((p: string) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        clone.bottomMiddleSports.paragraph1 = parts[0];
        clone.bottomMiddleSports.paragraph2 = parts.slice(1).join('\n\n');
      } else {
        clone.bottomMiddleSports.paragraph1 = parts[0] || value || '';
        clone.bottomMiddleSports.paragraph2 = '';
      }
    }

    if (path.startsWith('editionBar.')) {
      if (!clone.editionBar) clone.editionBar = {};
      const subKey = path.replace('editionBar.', '');
      clone.editionBar[subKey] = value;
      if (subKey === 'city') clone.city = value;
      if (subKey === 'dayDate') clone.date = value;
      if (subKey === 'yearIssue') clone.editionInfo = value;
      if (subKey === 'price') clone.price = value;
    }

    if (path.startsWith('quote.')) {
      if (!clone.quote) clone.quote = {};
      const subKey = path.replace('quote.', '');
      clone.quote[subKey] = value;
    }

    if (path.startsWith('weather.')) {
      if (!clone.weather) clone.weather = {};
      const subKey = path.replace('weather.', '');
      clone.weather[subKey] = value;
      if (subKey === 'condition') {
        clone.weather.icon = getIconFromConditionText(value);
      }
    }

    if (path === 'pageNumber') {
      clone.pageNumber = value;
    }

    if (path.startsWith('advertisement.')) {
      if (!clone.advertisement) clone.advertisement = {};
      const subKey = path.replace('advertisement.', '');
      clone.advertisement[subKey] = value;
    }
    if (path === 'advertisement') {
      clone.advertisement = value;
    }

    onChange(clone);
  };

  // Imported article summaries are often only one or two sentences long. Expand
  // those short summaries into a readable newspaper brief so a page never has
  // empty article columns, without causing sections to overflow.
  const expandedArticleCopy = (body: string | undefined, minimumLength = 120) => {
    let copy = (body || '').trim();
    if (!copy) {
      copy = 'અમદાવાદ: ગુજરાત રાજ્યમાં આજે મુખ્યમંત્રીની અધ્યક્ષતામાં યોજાયેલી ઉચ્ચ સ્તરીય બેઠકમાં રાજ્યના સર્વાંગી વિકાસ માટે અનેક મોટા અને મહત્વપૂર્ણ નિર્ણયો લેવામાં આવ્યા છે.';
    }

    const fillers = [
      'રાજ્યના દરેક જિલ્લા મથકે આધુનિક સિવિલ હોસ્પિટલોનું નિર્માણ અને શાળાઓમાં સ્માર્ટ વર્ગખંડો સ્થાપવાની કામગીરીને અગ્રતા આપવામાં આવશે.',
      'ગ્રામીણ વિસ્તારોમાં ખેડૂતોને સિંચાઈનું પાણી અને ૨૪ કલાક અવિરત ગુણવત્તાસભર વીજળી પહોંચાડવા માટે નવી સબ-સ્ટેશનો કાર્યરત કરાશે.',
      'ઔદ્યોગિક કોરિડોર અને એક્સપ્રેસવે પ્રોજેક્ટ્સને ઝડપથી પૂર્ણ કરવા વહીવટી મંજૂરીઓ તાત્કાલિક ધોરણે આપી દેવામાં આવી છે.',
      'યુવાનો માટે ટેકનિકલ શિક્ષણ અને સ્કીલ ડેવલપમેન્ટ સેન્ટરો શરૂ કરી સ્થાનિક સ્તરે હજારો નવી રોજગારીની તકોનું સર્જન કરાશે.',
      'તમામ જિલ્લા કલેક્ટરો અને સચિવોને આ પ્રોજેક્ટ્સનું સાપ્તાહિક મોનિટરિંગ કરી પ્રગતિ અહેવાલ મુખ્યમંત્રી કાર્યાલયને મોકલવા આદેશ કરાયો છે.',
    ];

    let fillerIdx = 0;
    while (copy.length < minimumLength && fillerIdx < fillers.length * 4) {
      const sentence = fillers[fillerIdx % fillers.length];
      if (!copy.includes(sentence)) {
        copy = `${copy} ${sentence}`;
      } else {
        copy = `${copy} ${sentence}`;
      }
      fillerIdx++;
    }
    return copy.trim();
  };

  const splitArticleCopy = (body: string | undefined, minimumLength: number, leadLength: number) => {
    const fullCopy = expandedArticleCopy(body, minimumLength);
    const splitAt = fullCopy.lastIndexOf(' ', leadLength);
    const safeSplitAt = splitAt > 40 ? splitAt : Math.min(leadLength, fullCopy.length);

    return {
      lead: fullCopy.slice(0, safeSplitAt).trim(),
      continuation: fullCopy.slice(safeSplitAt).trim(),
    };
  };

  const getMainStoryParagraphs = (story: StoryBlockData | undefined) => {
    const defaultP1 = samplePage1Data.mainHeadline.paragraph1 || '';
    const defaultP2 = samplePage1Data.mainHeadline.paragraph2 || '';
    const defaultP3 = samplePage1Data.mainHeadline.paragraph3 || '';

    if (!story) {
      return { p1: defaultP1, p2: defaultP2, p3: defaultP3 };
    }

    if (story.paragraph1 !== undefined || story.paragraph2 !== undefined || story.paragraph3 !== undefined) {
      return {
        p1: story.paragraph1 !== undefined ? story.paragraph1 : defaultP1,
        p2: story.paragraph2 !== undefined ? story.paragraph2 : defaultP2,
        p3: story.paragraph3 !== undefined ? story.paragraph3 : defaultP3,
      };
    }

    const raw = (story.body || '').trim();

    if (!raw) {
      return {
        p1: defaultP1,
        p2: defaultP2,
        p3: defaultP3,
      };
    }

    // Check if body already has paragraph breaks (\n\n or \n)
    const doubleParts = raw.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    if (doubleParts.length >= 3) {
      return {
        p1: doubleParts[0],
        p2: doubleParts[1],
        p3: doubleParts.slice(2).join('\n\n'),
      };
    }
    const singleParts = raw.split(/\n+/).map((p) => p.trim()).filter(Boolean);
    if (singleParts.length >= 3) {
      return {
        p1: singleParts[0],
        p2: singleParts[1],
        p3: singleParts.slice(2).join('\n\n'),
      };
    }
    if (doubleParts.length === 2) {
      const rest = doubleParts[1];
      const halfRest = Math.floor(rest.length / 2);
      const splitPos = rest.lastIndexOf('. ', halfRest + 60);
      const p2End = splitPos > 40 ? splitPos + 1 : halfRest;
      return {
        p1: doubleParts[0],
        p2: rest.slice(0, p2End).trim() || defaultP2,
        p3: rest.slice(p2End).trim() || defaultP3,
      };
    }

    // Single continuous block: split cleanly into 3 paragraphs at sentence boundaries
    const fullText = expandedArticleCopy(raw, 1150);

    // Split at paragraph 1 boundary (around 660 chars)
    let p1Split = fullText.lastIndexOf('. ', 680);
    if (p1Split < 350) p1Split = fullText.lastIndexOf('। ', 680);
    if (p1Split < 350) p1Split = fullText.lastIndexOf('.', 680);
    const p1End = p1Split > 300 ? p1Split + 1 : (fullText.lastIndexOf(' ', 660) > 300 ? fullText.lastIndexOf(' ', 660) : 657);

    const p1 = fullText.slice(0, p1End).trim();
    const rest = fullText.slice(p1End).trim();

    // Split rest into p2 and p3 (around half of rest)
    const halfRest = Math.floor(rest.length / 2);
    let p2Split = rest.lastIndexOf('. ', halfRest + 60);
    if (p2Split < 50) p2Split = rest.lastIndexOf('। ', halfRest + 60);
    if (p2Split < 50) p2Split = rest.lastIndexOf('.', halfRest + 60);
    const p2End = p2Split > 50 ? p2Split + 1 : (rest.lastIndexOf(' ', halfRest) > 50 ? rest.lastIndexOf(' ', halfRest) : halfRest);

    const p2 = rest.slice(0, p2End).trim();
    const p3 = rest.slice(p2End).trim();

    return {
      p1: p1 || defaultP1,
      p2: p2 || defaultP2,
      p3: p3 || defaultP3,
    };
  };

  const getSideStoryParagraphs = (story: StoryBlockData | undefined) => {
    const defaultP1 = samplePage1Data.sideTopNews.paragraph1;
    const defaultP2 = samplePage1Data.sideTopNews.paragraph2;

    if (!story) {
      return { p1: defaultP1, p2: defaultP2 };
    }

    const p1 = story.paragraph1?.trim() || defaultP1;
    const p2 = story.paragraph2?.trim() || defaultP2;

    return { p1, p2 };
  };

  const mainStory = getMainStoryParagraphs(data.mainHeadline);
  const sideStory = getSideStoryParagraphs(data.sideTopNews);

  // ─── Reusable "Key Points" callout box ───
  const KeyPointsBox: React.FC<{
    basePath: string;
    title: string;
    points: string[];
    accent?: string;
  }> = ({ basePath, title, points }) => (
    <div className="bg-white border border-slate-300 rounded-none overflow-hidden my-1 shadow-xs">
      <div className="bg-red-700 text-white text-[11.5px] font-sans font-black px-2 py-0.5 text-center tracking-wide">
        <EditableTextSlot
          value={title}
          onChange={(val) => updateField(`${basePath}.keyPoints.title`, val)}
          isSelected={selectedPath === `${basePath}.keyPoints.title`}
          onSelect={() => onSelectSlot?.(`${basePath}.keyPoints.title`, 'કી પોઈન્ટ શીર્ષક')}
        />
      </div>
      <ul className="px-2 py-1 space-y-0.5 bg-red-50/15">
        {(points || []).map((pt, i) => (
          <li key={i} className="flex items-start gap-1 text-[11px] leading-tight text-slate-900 font-sans">
            <span className="text-red-700 font-black shrink-0 leading-tight">▪</span>
            <EditableTextSlot
              value={pt}
              onChange={(val) => updateField(`${basePath}.keyPoints.points.${i}`, val)}
              isSelected={selectedPath === `${basePath}.keyPoints.points.${i}`}
              onSelect={() => onSelectSlot?.(`${basePath}.keyPoints.points.${i}`, `મુદ્દો ${i + 1}`)}
              className="flex-1"
            />
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <EpaperReadOnlyProvider value={isReadOnly}>
      <div className="w-[1224px] h-[1815px] max-h-[1815px] max-w-[1224px] bg-white text-slate-950 shadow-2xl border border-slate-300 p-1 flex flex-col font-serif select-none box-border overflow-hidden relative shrink-0">
        {/* ─── TOP ROW: Quote | Masthead | Weather ─── */}
        <div className="grid grid-cols-12 gap-2 h-[132px] mb-1 shrink-0 items-stretch">
          {/* Quote box ("Top Left - Quote / Thought") */}
          <div
            onClick={!isReadOnly ? () => onSelectSlot?.('quote.text', 'આજનું સુકૃતિવચન') : undefined}
            className={`col-span-3 bg-white border border-slate-300 p-3 flex flex-col justify-between relative ${!isReadOnly ? 'cursor-pointer hover:border-red-400 group/quote' : ''} transition-colors`}
            title={!isReadOnly ? "સુકૃતિવચન સંપાદિત કરવા ક્લિક કરો" : undefined}
          >
            <div>
              <span className="inline-block bg-red-700 text-white text-[10px] font-sans font-bold px-2 py-0.5 mb-2">
                આજનું સુકૃતિવચન
              </span>
              <EditableTextSlot
                value={data.quote.text}
                onChange={(val) => updateField('quote.text', val)}
                isSelected={effectiveSelectedPath === 'quote.text'}
                onSelect={() => effectiveOnSelect?.('quote.text', 'સુવિચાર')}
                className="text-[14px] font-black italic leading-snug text-slate-900 font-serif"
                multiline
                readOnly={isReadOnly}
              />
            </div>
            <EditableTextSlot
              value={data.quote.author}
              onChange={(val) => updateField('quote.author', val)}
              isSelected={effectiveSelectedPath === 'quote.author'}
              onSelect={() => effectiveOnSelect?.('quote.author', 'લેખક')}
              className="text-[11px] font-bold text-slate-700 self-end mt-1 font-sans"
              readOnly={isReadOnly}
            />
          </div>

          {/* Masthead ("Masthead / Logo") */}
          <div
            onClick={!isReadOnly ? () => onSelectSlot?.('mastheadTitle', 'માસ્ટહેડ શિર્ષક') : undefined}
            className={`col-span-6 text-center flex flex-col justify-center items-center leading-none px-2 ${!isReadOnly ? 'cursor-pointer hover:bg-red-50/20 rounded group/masthead' : ''} transition-colors`}
            title={!isReadOnly ? "માસ્ટહેડ સંપાદિત કરવા ક્લિક કરો" : undefined}
          >
          <EditableTextSlot
            tagName="h1"
            value={data.mastheadTitle}
            onChange={(val) => updateField('mastheadTitle', val)}
            isSelected={selectedPath === 'mastheadTitle'}
            onSelect={() => onSelectSlot?.('mastheadTitle', 'માસ્ટહેડ શિર્ષક')}
            className="text-[64px] font-black tracking-tight text-[#c51c1c] font-serif leading-none whitespace-nowrap"
          />
          <EditableTextSlot
            value={data.mastheadTagline}
            onChange={(val) => updateField('mastheadTagline', val)}
            isSelected={selectedPath === 'mastheadTagline'}
            onSelect={() => onSelectSlot?.('mastheadTagline', 'ટૅગલાઇન')}
            className="text-[12px] font-bold text-slate-700 tracking-wide block mt-1.5 font-sans"
          />
        </div>

        {/* Weather box ("Top Right - Weather / Info") */}
        <div
          onClick={!isReadOnly ? () => onSelectSlot?.('weather.city', 'આજનું હવામાન') : undefined}
          className={`col-span-3 bg-white border border-slate-300 p-3 flex flex-col justify-between group/weather relative ${!isReadOnly ? 'cursor-pointer hover:border-red-400' : ''} transition-colors`}
          title={!isReadOnly ? "હવામાન સંપાદિત કરવા ક્લિક કરો" : undefined}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="inline-block bg-red-700 text-white text-[10px] font-sans font-bold px-2 py-0.5">
              આજનું હવામાન
            </span>
            {!isReadOnly && onRefreshWeather && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefreshWeather();
                }}
                className="text-[9.5px] text-blue-600 hover:text-blue-800 font-sans font-bold flex items-center gap-0.5 cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                title="Open-Meteo API પરથી લાઈવ હવામાન મેળવો"
              >
                🔄 લાઈવ
              </button>
            )}
          </div>
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-6 flex flex-col items-center justify-center text-center relative">
              {!isReadOnly ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowIconPicker(!showIconPicker);
                  }}
                  className="text-2xl leading-none mb-0.5 cursor-pointer hover:scale-115 transition-transform p-0.5 rounded hover:bg-slate-100"
                  title="હવામાન આઇકન બદલવા ક્લિક કરો"
                >
                  {data.weather.icon || getIconFromConditionText(data.weather.condition) || '⛅'}
                </button>
              ) : (
                <span className="text-2xl leading-none mb-0.5 select-none p-0.5">
                  {data.weather.icon || getIconFromConditionText(data.weather.condition) || '⛅'}
                </span>
              )}

              {/* Quick Icon Picker Popover */}
              {showIconPicker && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 bg-white border border-slate-300 shadow-xl rounded-lg p-1.5 grid grid-cols-4 gap-1 w-32 animate-in fade-in zoom-in-95">
                  {['☀️', '⛅', '☁️', '🌧️', '⛈️', '🌦️', '❄️', '🌫️'].map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateField('weather.icon', ic);
                        setShowIconPicker(false);
                      }}
                      className="text-lg p-1 rounded hover:bg-slate-100 transition flex items-center justify-center cursor-pointer"
                      title={ic}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              )}

              <EditableTextSlot
                value={data.weather.condition}
                onChange={(val) => updateField('weather.condition', val)}
                isSelected={selectedPath === 'weather.condition'}
                onSelect={() => onSelectSlot?.('weather.condition', 'હવામાન સ્થિતિ')}
                className="text-[10px] font-bold text-slate-800 font-sans"
              />
            </div>
            <div className="col-span-6 border-l border-slate-300 pl-2 text-[10.5px] font-sans">
              <EditableTextSlot
                value={data.weather.city}
                onChange={(val) => updateField('weather.city', val)}
                isSelected={selectedPath === 'weather.city'}
                onSelect={() => onSelectSlot?.('weather.city', 'શહેર')}
                className="text-[12px] font-black text-slate-900 mb-0.5 font-sans"
              />
              <div className="text-slate-800 flex items-center gap-1">
                <span>મહત્તમ</span>
                <span className="font-bold">
                  <EditableTextSlot
                    value={data.weather.high}
                    onChange={(val) => updateField('weather.high', val)}
                    isSelected={selectedPath === 'weather.high'}
                    onSelect={() => onSelectSlot?.('weather.high', 'મહત્તમ તાપમાન')}
                  />
                </span>
              </div>
              <div className="text-slate-800 flex items-center gap-1">
                <span>લઘુત્તમ</span>
                <span className="font-bold">
                  <EditableTextSlot
                    value={data.weather.low}
                    onChange={(val) => updateField('weather.low', val)}
                    isSelected={selectedPath === 'weather.low'}
                    onSelect={() => onSelectSlot?.('weather.low', 'લઘુત્તમ તાપમાન')}
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── EDITION DETAILS BAR ("Edition Details Bar") ─── */}
      <div
        onClick={() => onSelectSlot?.('editionBar.rniNo', 'અખબાર વિગત પટ્ટી')}
        className="h-[32px] flex justify-between items-center border-y-2 border-slate-800 py-1 px-2 mb-2.5 font-sans text-[11px] font-bold text-slate-900 shrink-0 cursor-pointer hover:bg-amber-50/30 transition-colors group/edition"
        title="અખબાર વિગત પટ્ટી સંપાદિત કરવા ક્લિક કરો"
      >
        <div className="flex items-center gap-2">
          <EditableTextSlot
            value={data.editionBar.rniNo}
            onChange={(val) => updateField('editionBar.rniNo', val)}
            isSelected={selectedPath === 'editionBar.rniNo'}
            onSelect={() => onSelectSlot?.('editionBar.rniNo', 'RNI નંબર')}
          />
          <span className="text-slate-400 font-normal">|</span>
          <EditableTextSlot
            value={data.editionBar.dayDate}
            onChange={(val) => updateField('editionBar.dayDate', val)}
            isSelected={selectedPath === 'editionBar.dayDate'}
            onSelect={() => onSelectSlot?.('editionBar.dayDate', 'દિવસ અને તારીખ')}
          />
          <span className="text-slate-400 font-normal">|</span>
          <EditableTextSlot
            value={data.editionBar.yearIssue}
            onChange={(val) => updateField('editionBar.yearIssue', val)}
            isSelected={selectedPath === 'editionBar.yearIssue'}
            onSelect={() => onSelectSlot?.('editionBar.yearIssue', 'વર્ષ અને અંક')}
          />
          <span className="text-slate-400 font-normal">|</span>
          <EditableTextSlot
            value={data.editionBar.city}
            onChange={(val) => updateField('editionBar.city', val)}
            isSelected={selectedPath === 'editionBar.city'}
            onSelect={() => onSelectSlot?.('editionBar.city', 'આવૃત્તિ શહેર')}
          />
        </div>
        <div className="flex items-center gap-2">
          <EditableTextSlot
            value={data.editionBar.website}
            onChange={(val) => updateField('editionBar.website', val)}
            isSelected={selectedPath === 'editionBar.website'}
            onSelect={() => onSelectSlot?.('editionBar.website', 'વેબસાઈટ')}
            className="text-slate-900"
          />
          <span className="text-slate-400 font-normal">|</span>
          <span className="flex items-center gap-1">
            <span>કિંમત</span>
            <EditableTextSlot
              value={data.editionBar.price}
              onChange={(val) => updateField('editionBar.price', val)}
              isSelected={selectedPath === 'editionBar.price'}
              onSelect={() => onSelectSlot?.('editionBar.price', 'કિંમત')}
            />
          </span>
        </div>
      </div>

      {/* ─── MAIN STORY ROW ("Main Headline Section" + "Side Top News") ─── */}
      <div className="grid grid-cols-12 gap-0 h-[650px] mb-2.5 shrink-0 border-b border-slate-300 pb-2.5 overflow-hidden">
        {/* Main headline section ("Main Headline Section") - 73% (col-span-9) */}
        <div className="col-span-9 pr-4 border-r border-slate-300 flex flex-col justify-between">
          <div className="h-full flex flex-col">
            <div className="flex justify-center items-center mb-0.5">
              <EditableTextSlot
                value={data.mainHeadline.category}
                onChange={(val) => updateField('mainHeadline.category', val)}
                isSelected={selectedPath === 'mainHeadline.category'}
                onSelect={() => onSelectSlot?.('mainHeadline.category', 'મુખ્ય કેટેગરી')}
                className="text-red-700 font-bold text-[18px] font-sans tracking-wide mx-auto"
              />
            </div>

            <EditableTextSlot
              tagName="h2"
              value={data.mainHeadline.headline}
              onChange={(val) => updateField('mainHeadline.headline', val)}
              isSelected={selectedPath === 'mainHeadline.headline'}
              onSelect={() => onSelectSlot?.('mainHeadline.headline', 'મુખ્ય હેડલાઇન')}
              className="text-[38px] font-black text-slate-950 leading-[1.12] font-serif text-center mb-2 tracking-tight"
              maxLength={140}
            />

            {/* Grey Banner for Subheadline */}
            <div className="bg-[#e2e8f0] border border-slate-300/70 py-1.5 px-3 rounded-xs mb-3 text-center">
              <EditableTextSlot
                value={data.mainHeadline.subheadline || ''}
                onChange={(val) => updateField('mainHeadline.subheadline', val)}
                isSelected={selectedPath === 'mainHeadline.subheadline'}
                onSelect={() => onSelectSlot?.('mainHeadline.subheadline', 'સબહેડલાઇન')}
                className="text-[18px] font-bold text-slate-900 leading-snug font-sans"
                maxLength={150}
              />
            </div>

            {/* Lead layout: text column plus a wide photo with an overlaid key-points panel and under-image 2 paragraphs */}
            <div className="grid grid-cols-12 gap-3 items-start flex-1">
              {/* Left Column: Body text (Paragraph 1) */}
              <div className="col-span-3 text-[12px] leading-[1.45] text-slate-800 font-serif text-justify overflow-hidden">
                {data.mainHeadline.location && (
                  <span className="font-black text-red-700 shrink-0">
                    {data.mainHeadline.location} |&nbsp;
                  </span>
                )}
                <EditableTextSlot
                  value={mainStory.p1}
                  onChange={(val) => updateField('mainHeadline.paragraph1', val)}
                  isSelected={
                    selectedPath === 'mainHeadline.paragraph1' ||
                    selectedPath === 'leadStory.paragraph1' ||
                    selectedPath === 'mainHeadline.body' ||
                    selectedPath === 'mainHeadline.body.p1' ||
                    selectedPath === 'leadStory.articleBody' ||
                    selectedPath === 'leadStory'
                  }
                  onSelect={() => onSelectSlot?.('mainHeadline.paragraph1', 'મુખ્ય સમાચાર - પેરાગ્રાફ ૧ (ડાબે)')}
                  multiline
                />
              </div>

              {/* Wide classroom image + caption + under-image 2 paragraphs */}
              <div className="col-span-9 flex flex-col relative h-full">
                <EditableImageSlot
                  src={data.mainHeadline.image || ''}
                  onImageChange={(img) => updateField('mainHeadline.image', img)}
                  isSelected={selectedPath === 'mainHeadline.image' || selectedPath === 'leadStory.image'}
                  onSelect={() => onSelectSlot?.('mainHeadline.image', 'મુખ્ય ઈમેજ')}
                  containerHeight="245px"
                  alt="Main headline image"
                  actionsClassName={data.mainHeadline.keyPoints ? 'w-[52%]' : undefined}
                />
                {data.mainHeadline.imageCaption && (
                  <EditableTextSlot
                    value={data.mainHeadline.imageCaption}
                    onChange={(val) => updateField('mainHeadline.imageCaption', val)}
                    isSelected={selectedPath === 'mainHeadline.imageCaption' || selectedPath === 'leadStory.caption'}
                    onSelect={() => onSelectSlot?.('mainHeadline.imageCaption', 'કૅપ્શન')}
                    className="text-[11px] text-slate-600 italic mt-1 font-sans text-center"
                  />
                )}
                {data.mainHeadline.keyPoints && (
                  <div className="absolute top-0 right-0 w-[47%]">
                    <KeyPointsBox
                      basePath="mainHeadline"
                      title={data.mainHeadline.keyPoints.title}
                      points={data.mainHeadline.keyPoints.points}
                    />
                  </div>
                )}

                {/* News content under the image: Two separate paragraphs side by side */}
                <div className="mt-2 pt-2 border-t border-slate-300 flex-1 overflow-hidden grid grid-cols-2 gap-4">
                  {/* Paragraph 2 under image (Left column) */}
                  <div className="text-[11.5px] leading-[1.42] text-slate-800 font-serif text-justify overflow-hidden">
                    <EditableTextSlot
                      value={mainStory.p2}
                      onChange={(val) => updateField('mainHeadline.paragraph2', val)}
                      isSelected={
                        selectedPath === 'mainHeadline.paragraph2' ||
                        selectedPath === 'leadStory.paragraph2' ||
                        selectedPath === 'mainHeadline.body.p2' ||
                        selectedPath === 'leadStory.p2'
                      }
                      onSelect={() => onSelectSlot?.('mainHeadline.paragraph2', 'મુખ્ય સમાચાર - પેરાગ્રાફ ૨')}
                      multiline
                    />
                  </div>

                  {/* Paragraph 3 under image (Right column) */}
                  <div className="text-[11.5px] leading-[1.42] text-slate-800 font-serif text-justify overflow-hidden">
                    <EditableTextSlot
                      value={mainStory.p3}
                      onChange={(val) => updateField('mainHeadline.paragraph3', val)}
                      isSelected={
                        selectedPath === 'mainHeadline.paragraph3' ||
                        selectedPath === 'leadStory.paragraph3' ||
                        selectedPath === 'mainHeadline.body.p3' ||
                        selectedPath === 'leadStory.p3'
                      }
                      onSelect={() => onSelectSlot?.('mainHeadline.paragraph3', 'મુખ્ય સમાચાર - પેરાગ્રાફ ૩')}
                      multiline
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side top news ("Side Top News") - 27% (col-span-3) */}
        <div className="col-span-3 pl-4 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category header and Import button */}
            <div className="flex justify-between items-center mb-1 gap-2">
              <EditableTextSlot
                value={data.sideTopNews.category}
                onChange={(val) => updateField('sideTopNews.category', val)}
                isSelected={selectedPath === 'sideTopNews.category'}
                onSelect={() => onSelectSlot?.('sideTopNews.category', 'સાઈડ ન્યુઝ કેટેગરી')}
                className="text-red-700 font-bold text-[17px] font-sans tracking-wide"
              />
            </div>

            {/* Headline */}
            <EditableTextSlot
              tagName="h3"
              value={data.sideTopNews.headline}
              onChange={(val) => updateField('sideTopNews.headline', val)}
              isSelected={selectedPath === 'sideTopNews.headline'}
              onSelect={() => onSelectSlot?.('sideTopNews.headline', 'સાઈડ ન્યુઝ હેડલાઇન')}
              className="text-[26px] font-black text-slate-950 leading-tight font-serif mb-1.5"
              maxLength={100}
            />

            {/* Subheadline */}
            <EditableTextSlot
              value={data.sideTopNews.subheadline || 'સોલાર, વિન્ડ અને હાઈડ્રોજન પ્રોજેક્ટને મળશે વેગ'}
              onChange={(val) => updateField('sideTopNews.subheadline', val)}
              isSelected={selectedPath === 'sideTopNews.subheadline'}
              onSelect={() => onSelectSlot?.('sideTopNews.subheadline', 'સાઈડ ન્યુઝ સબહેડલાઇન')}
              className="text-[14px] font-bold text-slate-700 font-sans leading-snug mb-2"
              maxLength={100}
            />

            {/* Side-by-side: Paragraph 1 (left, goes till the end) + Image (right) */}
            <div className="grid grid-cols-12 gap-2.5 items-start flex-1 overflow-hidden mb-1">
              {/* Left: Paragraph 1 (goes till the end) */}
              <div className="col-span-6 text-[12px] leading-[1.48] text-slate-800 font-serif text-justify overflow-hidden">
                {data.sideTopNews.location && (
                  <span className="font-black text-red-700 shrink-0">
                    {data.sideTopNews.location} |&nbsp;
                  </span>
                )}
                <EditableTextSlot
                  value={sideStory.p1}
                  onChange={(val) => updateField('sideTopNews.paragraph1', val)}
                  isSelected={
                    selectedPath === 'sideTopNews.paragraph1' ||
                    selectedPath === 'sideTopNews.body' ||
                    selectedPath === 'sideTopNews.body.p1'
                  }
                  onSelect={() => onSelectSlot?.('sideTopNews.paragraph1', 'સાઈડ ન્યુઝ - પેરાગ્રાફ ૧ (ડાબે)')}
                  multiline
                />
              </div>

              {/* Right: Story Image + Caption + Paragraph 2 in empty space */}
              <div className="col-span-6 flex flex-col">
                <EditableImageSlot
                  src={data.sideTopNews.image || ''}
                  onImageChange={(img) => updateField('sideTopNews.image', img)}
                  isSelected={selectedPath === 'sideTopNews.image'}
                  onSelect={() => onSelectSlot?.('sideTopNews.image', 'સાઈડ ન્યુઝ ઈમેજ')}
                  containerHeight="130px"
                  alt="Side news image"
                />
                {data.sideTopNews.imageCaption && (
                  <EditableTextSlot
                    value={data.sideTopNews.imageCaption}
                    onChange={(val) => updateField('sideTopNews.imageCaption', val)}
                    isSelected={selectedPath === 'sideTopNews.imageCaption'}
                    onSelect={() => onSelectSlot?.('sideTopNews.imageCaption', 'સાઈડ ન્યુઝ કૅપ્શન')}
                    className="text-[10px] text-slate-500 italic mt-1 font-sans text-center"
                  />
                )}
                {/* Paragraph 2 under image in the empty space */}
                <div className="text-[11.5px] leading-[1.45] text-slate-800 font-serif text-justify mt-2 overflow-hidden">
                  <EditableTextSlot
                    value={sideStory.p2}
                    onChange={(val) => updateField('sideTopNews.paragraph2', val)}
                    isSelected={
                      selectedPath === 'sideTopNews.paragraph2' ||
                      selectedPath === 'sideTopNews.body.p2'
                    }
                    onSelect={() => onSelectSlot?.('sideTopNews.paragraph2', 'સાઈડ ન્યુઝ - પેરાગ્રાફ ૨ (જમણે)')}
                    multiline
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pull Quote Box (Image + Quote + Quote Name) */}
          <div className="bg-[#f8fafc] border border-slate-300 p-2 flex items-center gap-2.5 rounded-none mt-auto">
            {/* 1. Image Quote (Author photo) */}
            <div className="w-[54px] h-[60px] shrink-0">
              <EditableImageSlot
                src={
                  data.sideTopNews.pullQuote?.image ||
                  data.sideTopNews.pullQuote?.photo ||
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
                }
                onImageChange={(img) => {
                  updateField('sideTopNews.pullQuote.image', img);
                  updateField('sideTopNews.pullQuote.photo', img);
                }}
                isSelected={
                  selectedPath === 'sideTopNews.pullQuote.image' ||
                  selectedPath === 'sideTopNews.pullQuote.photo'
                }
                onSelect={() => onSelectSlot?.('sideTopNews.pullQuote.image', 'અવતરણ ઈમેજ (Quote Image)')}
                containerHeight="60px"
                alt="Quote author"
              />
            </div>

            {/* 2. Quote Text & 3. Quote Name */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-1">
                <span className="text-red-600 font-serif text-xl font-black leading-none shrink-0">❝</span>
                <EditableTextSlot
                  value={
                    data.sideTopNews.pullQuote?.quote ||
                    data.sideTopNews.pullQuote?.text ||
                    '“ગુજરાતને સ્વચ્છ અને સ્વસ્થ ભવિષ્ય આપવું અમારી પ્રાથમિકતા છે.”'
                  }
                  onChange={(val) => {
                    updateField('sideTopNews.pullQuote.quote', val);
                    updateField('sideTopNews.pullQuote.text', val);
                  }}
                  isSelected={
                    selectedPath === 'sideTopNews.pullQuote.quote' ||
                    selectedPath === 'sideTopNews.pullQuote.text'
                  }
                  onSelect={() => onSelectSlot?.('sideTopNews.pullQuote.quote', 'અવતરણ (Quote Text)')}
                  className="text-[10px] italic font-black text-slate-900 leading-tight"
                  multiline
                />
              </div>
              <EditableTextSlot
                value={
                  data.sideTopNews.pullQuote?.name ||
                  data.sideTopNews.pullQuote?.author ||
                  '— ભૂપેન્દ્ર પટેલ, મુખ્યમંત્રી, ગુજરાત'
                }
                onChange={(val) => {
                  updateField('sideTopNews.pullQuote.name', val);
                  updateField('sideTopNews.pullQuote.author', val);
                }}
                isSelected={
                  selectedPath === 'sideTopNews.pullQuote.name' ||
                  selectedPath === 'sideTopNews.pullQuote.author'
                }
                onSelect={() => onSelectSlot?.('sideTopNews.pullQuote.name', 'અવતરણ નામ (Quote Name)')}
                className="text-[9.5px] font-bold text-slate-600 mt-1 block text-right font-sans"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── THREE NEWS BLOCKS ("News Block 1" | "News Block 2" | "News Block 3") ─── */}
      <div className="grid grid-cols-3 divide-x divide-slate-300 gap-0 h-[490px] mb-2.5 shrink-0 border-b border-slate-300 pb-2.5 overflow-hidden">
        {/* Block 1 (Rain & Alert) */}
        <div className="pr-4 flex flex-col justify-between overflow-hidden h-full">
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-start mb-0.5">
              <EditableTextSlot
                value={data.newsBlocks[0]?.category}
                onChange={(val) => updateField('newsBlocks.0.category', val)}
                isSelected={selectedPath === 'newsBlocks.0.category'}
                onSelect={() => onSelectSlot?.('newsBlocks.0.category', 'સમાચાર ૧ કેટેગરી')}
                className="text-red-700 font-bold text-[11.5px] font-sans"
              />
            </div>

            <EditableTextSlot
              tagName="h4"
              value={data.newsBlocks[0]?.headline}
              onChange={(val) => updateField('newsBlocks.0.headline', val)}
              isSelected={selectedPath === 'newsBlocks.0.headline'}
              onSelect={() => onSelectSlot?.('newsBlocks.0.headline', 'સમાચાર ૧ હેડલાઇન')}
              className="text-[23px] font-black text-slate-950 leading-tight font-serif mb-1"
              maxLength={90}
            />

            <EditableTextSlot
              value={data.newsBlocks[0]?.subheadline || 'નિકાસ વિસ્તારોમાં પાણી ભરાતા લોકો પરેશાન'}
              onChange={(val) => updateField('newsBlocks.0.subheadline', val)}
              isSelected={selectedPath === 'newsBlocks.0.subheadline'}
              onSelect={() => onSelectSlot?.('newsBlocks.0.subheadline', 'સમાચાર ૧ સબહેડલાઇન')}
              className="text-[13px] font-bold text-slate-700 font-sans leading-snug mb-1.5"
              maxLength={90}
            />

            {/* Wide image */}
            <EditableImageSlot
              src={data.newsBlocks[0]?.image || ''}
              onImageChange={(img) => updateField('newsBlocks.0.image', img)}
              isSelected={selectedPath === 'newsBlocks.0.image'}
              onSelect={() => onSelectSlot?.('newsBlocks.0.image', 'સમાચાર ૧ ઈમેજ')}
              containerHeight="120px"
              className="mb-1.5"
            />

            {/* 2 sub-columns: Text on left, Weather forecast Key Points + Paragraph 2 in whitespace on right */}
            <div className="grid grid-cols-12 gap-2 items-start flex-1 overflow-hidden">
              <div className="col-span-6 text-[11px] leading-[1.38] text-slate-800 font-serif text-justify overflow-hidden">
                {data.newsBlocks[0]?.location && (
                  <span className="font-black text-red-700 shrink-0">{data.newsBlocks[0].location} |&nbsp;</span>
                )}
                <EditableTextSlot
                  value={data.newsBlocks[0]?.paragraph1 || data.newsBlocks[0]?.body || ''}
                  onChange={(val) => updateField('newsBlocks.0.paragraph1', val)}
                  isSelected={selectedPath === 'newsBlocks.0.paragraph1' || selectedPath === 'newsBlocks.0.body'}
                  onSelect={() => onSelectSlot?.('newsBlocks.0.paragraph1', 'સમાચાર ૧ પેરાગ્રાફ ૧')}
                  multiline
                />
              </div>

              <div className="col-span-6 overflow-hidden">
                {data.newsBlocks[0]?.keyPoints && (
                  <KeyPointsBox
                    basePath="newsBlocks.0"
                    title={data.newsBlocks[0].keyPoints.title}
                    points={data.newsBlocks[0].keyPoints.points}
                  />
                )}
                <div className="text-[11px] leading-[1.38] text-slate-800 font-serif text-justify overflow-hidden mt-1">
                  <EditableTextSlot
                    value={data.newsBlocks[0]?.paragraph2 || ''}
                    onChange={(val) => updateField('newsBlocks.0.paragraph2', val)}
                    isSelected={selectedPath === 'newsBlocks.0.paragraph2'}
                    onSelect={() => onSelectSlot?.('newsBlocks.0.paragraph2', 'સમાચાર ૧ પેરાગ્રાફ ૨')}
                    multiline
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Block 2 (Jobs & Industries) */}
        <div className="px-4 flex flex-col justify-between overflow-hidden h-full">
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-start mb-0.5">
              <EditableTextSlot
                value={data.newsBlocks[1]?.category}
                onChange={(val) => updateField('newsBlocks.1.category', val)}
                isSelected={selectedPath === 'newsBlocks.1.category'}
                onSelect={() => onSelectSlot?.('newsBlocks.1.category', 'સમાચાર ૨ કેટેગરી')}
                className="text-red-700 font-bold text-[11.5px] font-sans"
              />
            </div>

            <EditableTextSlot
              tagName="h4"
              value={data.newsBlocks[1]?.headline}
              onChange={(val) => updateField('newsBlocks.1.headline', val)}
              isSelected={selectedPath === 'newsBlocks.1.headline'}
              onSelect={() => onSelectSlot?.('newsBlocks.1.headline', 'સમાચાર ૨ હેડલાઇન')}
              className="text-[23px] font-black text-slate-950 leading-tight font-serif mb-1"
              maxLength={90}
            />

            <EditableTextSlot
              value={data.newsBlocks[1]?.subheadline || 'ઉદ્યોગોનો આંતરરાષ્ટ્રીય રોકાણકારો સાથે કરાર'}
              onChange={(val) => updateField('newsBlocks.1.subheadline', val)}
              isSelected={selectedPath === 'newsBlocks.1.subheadline'}
              onSelect={() => onSelectSlot?.('newsBlocks.1.subheadline', 'સમાચાર ૨ સબહેડલાઇન')}
              className="text-[13px] font-bold text-slate-700 font-sans leading-snug mb-1.5"
              maxLength={90}
            />

            {/* Text on left, Factory image + paragraph 2 on right */}
            <div className="grid grid-cols-12 gap-2 items-start mb-1.5 flex-1 overflow-hidden">
              <div className="col-span-6 text-[10.5px] leading-[1.38] text-slate-800 font-serif text-justify overflow-hidden">
                {data.newsBlocks[1]?.location && (
                  <span className="font-black text-red-700 shrink-0">{data.newsBlocks[1].location} |&nbsp;</span>
                )}
                <EditableTextSlot
                  value={data.newsBlocks[1]?.paragraph1 || data.newsBlocks[1]?.body || ''}
                  onChange={(val) => updateField('newsBlocks.1.paragraph1', val)}
                  isSelected={selectedPath === 'newsBlocks.1.paragraph1' || selectedPath === 'newsBlocks.1.body'}
                  onSelect={() => onSelectSlot?.('newsBlocks.1.paragraph1', 'સમાચાર ૨ પેરાગ્રાફ ૧')}
                  multiline
                />
              </div>
              <div className="col-span-6 flex flex-col overflow-hidden">
                <EditableImageSlot
                  src={data.newsBlocks[1]?.image || ''}
                  onImageChange={(img) => updateField('newsBlocks.1.image', img)}
                  isSelected={selectedPath === 'newsBlocks.1.image'}
                  onSelect={() => onSelectSlot?.('newsBlocks.1.image', 'સમાચાર ૨ ઈમેજ')}
                  containerHeight="115px"
                  className="mb-1"
                />
                <div className="text-[10.5px] leading-[1.38] text-slate-800 font-serif text-justify overflow-hidden">
                  <EditableTextSlot
                    value={data.newsBlocks[1]?.paragraph2 || ''}
                    onChange={(val) => updateField('newsBlocks.1.paragraph2', val)}
                    isSelected={selectedPath === 'newsBlocks.1.paragraph2'}
                    onSelect={() => onSelectSlot?.('newsBlocks.1.paragraph2', 'સમાચાર ૨ પેરાગ્રાફ ૨')}
                    multiline
                  />
                </div>
              </div>
            </div>

            {/* Full width Key points box: રોજગારીના મુખ્ય ક્ષેત્રો */}
            {data.newsBlocks[1]?.keyPoints && (
              <div className="mt-auto">
                <KeyPointsBox
                  basePath="newsBlocks.1"
                  title={data.newsBlocks[1].keyPoints.title}
                  points={data.newsBlocks[1].keyPoints.points}
                />
              </div>
            )}
          </div>
        </div>

        {/* Block 3 (Aditya-L1 Space Mission) */}
        <div className="pl-4 flex flex-col justify-between overflow-hidden h-full">
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-start mb-0.5">
              <EditableTextSlot
                value={data.newsBlocks[2]?.category}
                onChange={(val) => updateField('newsBlocks.2.category', val)}
                isSelected={selectedPath === 'newsBlocks.2.category'}
                onSelect={() => onSelectSlot?.('newsBlocks.2.category', 'સમાચાર ૩ કેટેગરી')}
                className="text-red-700 font-bold text-[11.5px] font-sans"
              />
            </div>

            <EditableTextSlot
              tagName="h4"
              value={data.newsBlocks[2]?.headline}
              onChange={(val) => updateField('newsBlocks.2.headline', val)}
              isSelected={selectedPath === 'newsBlocks.2.headline'}
              onSelect={() => onSelectSlot?.('newsBlocks.2.headline', 'સમાચાર ૩ હેડલાઇન')}
              className="text-[23px] font-black text-slate-950 leading-tight font-serif mb-1"
              maxLength={90}
            />

            <EditableTextSlot
              value={data.newsBlocks[2]?.subheadline || 'આદિત્ય-L1 મિશન સફળતાપૂર્વક આગળ વધ્યું'}
              onChange={(val) => updateField('newsBlocks.2.subheadline', val)}
              isSelected={selectedPath === 'newsBlocks.2.subheadline'}
              onSelect={() => onSelectSlot?.('newsBlocks.2.subheadline', 'સમાચાર ૩ સબહેડલાઇન')}
              className="text-[13px] font-bold text-slate-700 font-sans leading-snug mb-1.5"
              maxLength={90}
            />

            {/* Text on left, Satellite image + paragraph 2 on right */}
            <div className="grid grid-cols-12 gap-2 items-start mb-1.5 flex-1 overflow-hidden">
              <div className="col-span-6 text-[10.5px] leading-[1.38] text-slate-800 font-serif text-justify overflow-hidden">
                {data.newsBlocks[2]?.location && (
                  <span className="font-black text-red-700 shrink-0">{data.newsBlocks[2].location} |&nbsp;</span>
                )}
                <EditableTextSlot
                  value={data.newsBlocks[2]?.paragraph1 || data.newsBlocks[2]?.body || ''}
                  onChange={(val) => updateField('newsBlocks.2.paragraph1', val)}
                  isSelected={selectedPath === 'newsBlocks.2.paragraph1' || selectedPath === 'newsBlocks.2.body'}
                  onSelect={() => onSelectSlot?.('newsBlocks.2.paragraph1', 'સમાચાર ૩ પેરાગ્રાફ ૧')}
                  multiline
                />
              </div>
              <div className="col-span-6 flex flex-col overflow-hidden">
                <EditableImageSlot
                  src={data.newsBlocks[2]?.image || ''}
                  onImageChange={(img) => updateField('newsBlocks.2.image', img)}
                  isSelected={selectedPath === 'newsBlocks.2.image'}
                  onSelect={() => onSelectSlot?.('newsBlocks.2.image', 'સમાચાર ૩ ઈમેજ')}
                  containerHeight="115px"
                  className="mb-1"
                />
                <div className="text-[10.5px] leading-[1.38] text-slate-800 font-serif text-justify overflow-hidden">
                  <EditableTextSlot
                    value={data.newsBlocks[2]?.paragraph2 || ''}
                    onChange={(val) => updateField('newsBlocks.2.paragraph2', val)}
                    isSelected={selectedPath === 'newsBlocks.2.paragraph2'}
                    onSelect={() => onSelectSlot?.('newsBlocks.2.paragraph2', 'સમાચાર ૩ પેરાગ્રાફ ૨')}
                    multiline
                  />
                </div>
              </div>
            </div>

            {/* Full width Key points box: મિશનની વિશેષતાઓ */}
            {data.newsBlocks[2]?.keyPoints && (
              <div className="mt-auto">
                <KeyPointsBox
                  basePath="newsBlocks.2"
                  title={data.newsBlocks[2].keyPoints.title}
                  points={data.newsBlocks[2].keyPoints.points}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── BOTTOM TWO BLOCKS: FEATURE + SPORTS ─── */}
      <div className="grid grid-cols-12 divide-x divide-slate-300 gap-0 mb-2 h-[429px] shrink-0 overflow-hidden">
        {/* Bottom left feature ("Bottom Left - Feature") */}
        <div className="col-span-6 pr-4 flex flex-col justify-between">
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-start mb-0.5">
              <EditableTextSlot
                value={data.bottomLeftFeature.category}
                onChange={(val) => updateField('bottomLeftFeature.category', val)}
                isSelected={selectedPath === 'bottomLeftFeature.category'}
                onSelect={() => onSelectSlot?.('bottomLeftFeature.category', 'ફીચર કેટેગરી')}
                className="text-red-700 font-bold text-[11.5px] font-sans"
              />
            </div>

            <EditableTextSlot
              tagName="h4"
              value={data.bottomLeftFeature.headline}
              onChange={(val) => updateField('bottomLeftFeature.headline', val)}
              isSelected={selectedPath === 'bottomLeftFeature.headline'}
              onSelect={() => onSelectSlot?.('bottomLeftFeature.headline', 'ફીચર હેડલાઇન')}
              className="text-[24px] font-black text-slate-950 leading-tight font-serif mb-1"
              maxLength={90}
            />

            <EditableTextSlot
              value={data.bottomLeftFeature.subheadline || 'વિરોધ પક્ષના સભ્યોમાં પણ મહત્વની ચર્ચા થવાની શક્યતા'}
              onChange={(val) => updateField('bottomLeftFeature.subheadline', val)}
              isSelected={selectedPath === 'bottomLeftFeature.subheadline'}
              onSelect={() => onSelectSlot?.('bottomLeftFeature.subheadline', 'ફીચર સબહેડલાઇન')}
              className="text-[13px] font-bold text-slate-700 font-sans leading-snug mb-1.5"
              maxLength={100}
            />

            <div className="grid grid-cols-12 gap-3 items-start flex-1 overflow-hidden">
              {/* Left: Article paragraph 1 */}
              <div className="col-span-6 text-[11px] leading-[1.42] text-slate-800 font-serif text-justify overflow-hidden">
                {data.bottomLeftFeature.location && (
                  <span className="font-black text-red-700 shrink-0">{data.bottomLeftFeature.location} |&nbsp;</span>
                )}
                <EditableTextSlot
                  value={data.bottomLeftFeature.paragraph1 || data.bottomLeftFeature.body || ''}
                  onChange={(val) => updateField('bottomLeftFeature.paragraph1', val)}
                  isSelected={selectedPath === 'bottomLeftFeature.paragraph1' || selectedPath === 'bottomLeftFeature.body'}
                  onSelect={() => onSelectSlot?.('bottomLeftFeature.paragraph1', 'ફીચર પેરાગ્રાફ ૧')}
                  multiline
                />
              </div>

              {/* Right: Parliament image + Key points box + paragraph 2 bottom of box */}
              <div className="col-span-6 flex flex-col overflow-hidden">
                <EditableImageSlot
                  src={data.bottomLeftFeature.image || ''}
                  onImageChange={(img) => updateField('bottomLeftFeature.image', img)}
                  isSelected={selectedPath === 'bottomLeftFeature.image'}
                  onSelect={() => onSelectSlot?.('bottomLeftFeature.image', 'ફીચર ઈમેજ')}
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
                    value={data.bottomLeftFeature.paragraph2 || ''}
                    onChange={(val) => updateField('bottomLeftFeature.paragraph2', val)}
                    isSelected={selectedPath === 'bottomLeftFeature.paragraph2'}
                    onSelect={() => onSelectSlot?.('bottomLeftFeature.paragraph2', 'ફીચર પેરાગ્રાફ ૨')}
                    multiline
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Right: Front Page Advertisement Box (Option 1) */}
        <div className="col-span-6 pl-4 flex flex-col justify-between h-full overflow-hidden">
          <div className="h-full flex flex-col justify-between">
            {/* Ad Header Label */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-1 mb-1.5 shrink-0">
              <span className="text-[10.5px] font-sans font-bold text-slate-600 tracking-wider">
                — જાહેરાત (ADVERTISEMENT) —
              </span>
              <span className="text-[9.5px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                Front Page Solus
              </span>
            </div>

            {/* Main Ad Box */}
            <div className="flex-1 w-full flex flex-col overflow-hidden bg-slate-50/50 rounded border border-slate-300 p-1 relative">
              <EditableImageSlot
                src={data.advertisement?.image || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80'}
                onImageChange={(img) => updateField('advertisement.image', img)}
                isSelected={selectedPath === 'advertisement.image' || selectedPath === 'advertisement'}
                onSelect={() => onSelectSlot?.('advertisement.image', 'ફ્રન્ટ પેજ જાહેરાત')}
                containerHeight="388px"
                objectFit="contain"
                className="w-full h-full bg-white shadow-xs"
                alt="Front Page Advertisement"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── FOOTER: AUTHENTIC PRINT REGISTRATION STRIP + PAGE NUMBER ─── */}
      <div className="h-[28px] border-t-2 border-slate-900 pt-1 flex items-center justify-between font-sans text-[11px] font-bold shrink-0 px-2 overflow-hidden select-none">
        {/* Newspaper Print Registration Bar (repeating continuously till page number) */}
        <div className="flex items-center gap-2 overflow-hidden opacity-85 flex-1 mr-3 select-none">
          {[0, 1, 2, 3].map((idx) => (
            <div key={idx} className="flex items-center gap-2 shrink-0">
              {/* Grayscale Density Step Wedge */}
              <span className="flex items-center h-2 shrink-0 border border-slate-400/50">
                <span className="w-2.5 h-full bg-slate-200" title="10% Gray" />
                <span className="w-2.5 h-full bg-slate-300" title="25% Gray" />
                <span className="w-2.5 h-full bg-slate-400" title="40% Gray" />
                <span className="w-2.5 h-full bg-slate-600" title="60% Gray" />
                <span className="w-2.5 h-full bg-slate-800" title="80% Gray" />
                <span className="w-2.5 h-full bg-black" title="100% Black" />
              </span>

              {/* Registration Target Crosshair */}
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-slate-700 shrink-0">
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="0.8" fill="none" />
                <line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" strokeWidth="0.8" />
                <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="0.8" />
                <circle cx="8" cy="8" r="1.8" fill="currentColor" />
              </svg>

              {/* CMYK Dual-tone Dots (100% solid and 50% screen pairs) */}
              <span className="flex items-center gap-1 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00AEEF] inline-block border border-slate-400/40" title="Cyan 100%" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#7FD7F7] inline-block border border-slate-400/40" title="Cyan 50%" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#EC008C] inline-block border border-slate-400/40" title="Magenta 100%" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#F688C6] inline-block border border-slate-400/40" title="Magenta 50%" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFF200] inline-block border border-slate-400/40" title="Yellow 100%" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFF980] inline-block border border-slate-400/40" title="Yellow 50%" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] inline-block border border-slate-400/40" title="Black 100%" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#888888] inline-block border border-slate-400/40" title="Black 50%" />
              </span>

              {/* Grayscale Density Step Wedge */}
              <span className="flex items-center h-2 shrink-0 border border-slate-400/50">
                <span className="w-2.5 h-full bg-slate-200" />
                <span className="w-2.5 h-full bg-slate-300" />
                <span className="w-2.5 h-full bg-slate-400" />
                <span className="w-2.5 h-full bg-slate-600" />
                <span className="w-2.5 h-full bg-slate-800" />
                <span className="w-2.5 h-full bg-black" />
              </span>

              {/* 4 Micro Alignment Dots */}
              <span className="flex items-center gap-1 px-1 shrink-0">
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="w-1 h-1 rounded-full bg-slate-600" />
              </span>

              {/* Grayscale Density Step Wedge */}
              <span className="flex items-center h-2 shrink-0 border border-slate-400/50">
                <span className="w-2.5 h-full bg-slate-200" />
                <span className="w-2.5 h-full bg-slate-300" />
                <span className="w-2.5 h-full bg-slate-400" />
                <span className="w-2.5 h-full bg-slate-600" />
                <span className="w-2.5 h-full bg-slate-800" />
                <span className="w-2.5 h-full bg-black" />
              </span>

              {/* Repeated CMYK Dual-tone Dots */}
              <span className="flex items-center gap-1 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00AEEF] inline-block border border-slate-400/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#7FD7F7] inline-block border border-slate-400/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#EC008C] inline-block border border-slate-400/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#F688C6] inline-block border border-slate-400/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFF200] inline-block border border-slate-400/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFF980] inline-block border border-slate-400/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#1A1A1A] inline-block border border-slate-400/40" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#888888] inline-block border border-slate-400/40" />
              </span>

              {/* Registration Crosshair Target */}
              <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 text-slate-700 shrink-0">
                <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="0.8" fill="none" />
                <line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" strokeWidth="0.8" />
                <line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="0.8" />
                <circle cx="8" cy="8" r="1.8" fill="currentColor" />
              </svg>

              {/* Grayscale Density Step Wedge */}
              <span className="flex items-center h-2 shrink-0 border border-slate-400/50">
                <span className="w-2.5 h-full bg-slate-200" />
                <span className="w-2.5 h-full bg-slate-300" />
                <span className="w-2.5 h-full bg-slate-400" />
                <span className="w-2.5 h-full bg-slate-600" />
                <span className="w-2.5 h-full bg-slate-800" />
                <span className="w-2.5 h-full bg-black" />
              </span>
            </div>
          ))}
        </div>

        {/* Page Number Only on the Far Right */}
        <div className="flex items-center gap-1.5 shrink-0 font-sans pl-2 border-l border-slate-300">
          <span className="bg-red-700 text-white text-[10px] font-black px-2 py-0.5 rounded-xs tracking-wider">
            પૃષ્ઠ
          </span>
          <EditableTextSlot
            value={data.pageNumber || '૦૧'}
            onChange={(val) => updateField('pageNumber', val)}
            isSelected={selectedPath === 'pageNumber'}
            onSelect={() => onSelectSlot?.('pageNumber', 'પેજ નંબર')}
            className="text-[13px] font-black text-slate-950 font-serif tracking-wider"
          />
        </div>
      </div>

      </div>
    </EpaperReadOnlyProvider>
  );
};
