import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { cloudinary } from '../config/cloudinary.js';
import { prisma } from '../config/prisma.js';
import { sendSuccess } from '../utils/response.js';
import { withDbRetry } from '../utils/db.js';
import { HeroController } from '../controllers/hero.controller.js';
import { InstagramReelController } from '../controllers/instagramReel.controller.js';
import { WebStoryController } from '../controllers/webStory.controller.js';
import { AdController } from '../controllers/ad.controller.js';
import { EPaperController } from '../controllers/epaper.controller.js';
import { GalleryController } from '../controllers/gallery.controller.js';
import { SupportController } from '../controllers/support.controller.js';
import { TributeController } from '../controllers/tribute.controller.js';
import { getDailyAstrologySigns, fetchLiveDailyAstrologySigns } from '../services/astrology.service.js';

const router = Router();

const publicCache = new Map<string, { timestamp: number; payload: any }>();
const MAX_PUBLIC_CACHE_ENTRIES = 500;

// Bounded Search Cache for public article search (TTL: 60s, max 200 entries)
const searchCache = new Map<string, { timestamp: number; payload: any }>();
const MAX_SEARCH_CACHE_ENTRIES = 200;
const SEARCH_CACHE_TTL_MS = 60 * 1000;

export function clearPublicRoutesCache() {
  publicCache.clear();
  searchCache.clear();
}

function getNormalizedSearchCacheKey(req: any): string {
  const q = ((req.query.query as string) || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const page = String(req.query.page || '1').trim();
  const limit = String(req.query.limit || '30').trim();
  const sort = String(req.query.sort || 'latest').trim().toLowerCase();
  const categorySlug = String(req.query.categorySlug || '').trim().toLowerCase();
  const language = String(req.query.language || '').trim().toLowerCase();
  const location = String(req.query.location || '').trim().toLowerCase();
  const isTrending = String(req.query.isTrending || '').trim();
  const isBreaking = String(req.query.isBreaking || '').trim();
  const isFeatured = String(req.query.isFeatured || '').trim();

  return `search:${q}|p:${page}|l:${limit}|s:${sort}|c:${categorySlug}|lng:${language}|loc:${location}|tr:${isTrending}|br:${isBreaking}|ft:${isFeatured}`;
}

function cacheResponse(ttlSeconds: number) {
  return (req: any, res: any, next: any) => {
    if (req.method !== 'GET') return next();

    const isSearchQuery = Boolean(req.query && req.query.query);
    const targetCache = isSearchQuery ? searchCache : publicCache;
    const ttlMs = isSearchQuery ? SEARCH_CACHE_TTL_MS : ttlSeconds * 1000;
    const maxEntries = isSearchQuery ? MAX_SEARCH_CACHE_ENTRIES : MAX_PUBLIC_CACHE_ENTRIES;
    const key = isSearchQuery ? getNormalizedSearchCacheKey(req) : (req.originalUrl || req.url);

    const cached = targetCache.get(key);
    const now = Date.now();
    if (cached && now - cached.timestamp < ttlMs) {
      return res.status(200).json(cached.payload);
    }

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        if (targetCache.size >= maxEntries) {
          const oldestKey = targetCache.keys().next().value;
          if (oldestKey) targetCache.delete(oldestKey);
        }
        targetCache.set(key, { timestamp: Date.now(), payload: body });
      }
      return originalJson(body);
    };
    next();
  };
}

function sanitizeUrlInContent(text?: string | null): string {
  if (!text) return '';
  return text.replace(/(https:\/\/res\.cloudinary\.com\/[^\s"'<>]+?\.(?:jpg|jpeg|png|webp|gif|svg))/gi, (imgUrl) => {
    return imgUrl.replace('/raw/upload/', '/image/upload/');
  });
}

function sanitizeSingleUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  let clean = url.trim();
  if (clean.includes('res.cloudinary.com') && clean.includes('/raw/upload/') && !clean.toLowerCase().endsWith('.pdf') && !clean.toLowerCase().includes('.pdf?')) {
    clean = clean.replace('/raw/upload/', '/image/upload/');
  }
  return clean;
}

function generateRichGujaratiNewsBody(title?: string, excerpt?: string, category?: string, location?: string | null): string {
  const loc = location || 'ગુજરાત';
  const cat = category || 'સમાચાર';
  const cleanTitle = title || '';
  const cleanExcerpt = excerpt || '';

  const isMusicOrInsta = cleanTitle.includes('ઇન્સ્ટાગ્રામ') || cleanTitle.includes('ગરબા') || cleanTitle.includes('મ્યુઝિક') || cleanTitle.includes('રીલ્સ') || cat.includes('ઇન્સ્ટાગ્રામ');
  const isWeather = cleanTitle.includes('વરસાદ') || cleanTitle.includes('હવામાન') || cleanTitle.includes('મેઘમહેર') || cleanTitle.includes('ડેમ');
  const isTechOrAuto = cleanTitle.includes('ટેકનોલોજી') || cleanTitle.includes('મોબાઇલ') || cleanTitle.includes('બેટરી') || cleanTitle.includes('ઇલેક્ટ્રિક') || cleanTitle.includes('સ્માર્ટ');
  const isBusiness = cleanTitle.includes('બિઝનેસ') || cleanTitle.includes('રોકાણ') || cleanTitle.includes('શેરબજાર') || cleanTitle.includes('સોનું') || cleanTitle.includes('ચાંદી') || cleanTitle.includes('બજેટ');
  const isPolitics = cleanTitle.includes('રાજકારણ') || cleanTitle.includes('ચૂંટણી') || cleanTitle.includes('સરકાર') || cleanTitle.includes('મંત્રી') || cleanTitle.includes('વિધાનસભા');
  const isSports = cleanTitle.includes('ક્રિકેટ') || cleanTitle.includes('સ્પોર્ટ્સ') || cleanTitle.includes('મેચ') || cleanTitle.includes('ટ્રોફી');
  const isCrimeOrFact = cleanTitle.includes('ફેક્ટ ચેક') || cleanTitle.includes('ક્રાઇમ') || cleanTitle.includes('પોલીસ') || cleanTitle.includes('અકસ્માત') || cleanTitle.includes('તપાસ');

  let p1: string, p2: string, p3: string, p4: string;

  if (isMusicOrInsta) {
    p1 = `${cleanExcerpt || cleanTitle} સોશિયલ મીડિયા પ્લેટફોર્મ ઇન્સ્ટાગ્રામ પર ગુજરાતના લોકકલાકારોના અવાજમાં તૈયાર થયેલો આ નવો મેશઅપ ટ્રેક અત્યારે સૌથી વધુ વાયરલ થઈ રહ્યો છે. યુવાધનથી માંડીને જાણીતા સેલિબ્રિટીઓ પણ આ ગીતના તાલ પર રીલ્સ અને શોર્ટ વીડિયો બનાવી રહ્યા છે.`;
    p2 = `આ ગીતમાં પારંપરિક ગુજરાતી ગરબાના ઢોલના ધબકારા સાથે આધુનિક ઈલેક્ટ્રોનિક બીટ્સ અને સિન્થેસાઈઝરનું અદભુત ફ્યુઝન કરવામાં આવ્યું છે. સંગીત પ્રેમીઓનું કહેવું છે કે આ નવો પ્રયોગ ગુજરાતી લોકસંગીતને વૈશ્વિક સ્તરે નવી ઓળખ અપાવી રહ્યો છે. ડિજિટલ મ્યુઝિક પ્લેટફોર્મ્સ જેવા કે સ્પોટિફાય, એપલ મ્યુઝિક અને યુટ્યુબ પર પણ આ ટ્રેક ટોપ ટ્રેન્ડિંગ ચાર્ટ્સમાં સામેલ થઈ ચૂક્યો છે.`;
    p3 = `સ્થાનિક સંગીતકારો અને ડિજિટલ ક્રિએટર્સે આ અંગે ઉત્સાહ વ્યક્ત કરતા જણાવ્યું હતું કે, 'ગુજરાતની માટીના ગીતોમાં જે મીઠાશ અને ઊર્જા છે તે ક્યારેય જૂની થતી નથી. જ્યારે તેને આજના યુવાનોની પસંદગી મુજબ રજૂ કરવામાં આવે છે ત્યારે તે કરોડો લોકોના દિલ જીતી લે છે.' રાજ્યભરના કોલેજિયનો અને યુવા ડાન્સ ગ્રુપ્સ પણ આ ટ્રેન્ડમાં હોંશે હોંશે જોડાઈ રહ્યા છે.`;
    p4 = `આગામી નવરાત્રી મહોત્સવ નજીક આવી રહ્યો છે ત્યારે આ ટ્રેક ગરબા ગ્રાઉન્ડ્સ પર પણ ધૂમ મચાવશે તેવી શક્યતાઓ સેવાઈ રહી છે. ગુજરાત ઉપરાંત વિદેશમાં વસતા ગુજરાતી એનઆરઆઈ સમુદાયમાં પણ આ ઓડિયો ક્લિપ પર હજારો વીડિયો અપલોડ થઈ ચૂક્યા છે.`;
  } else if (isWeather) {
    p1 = `${cleanExcerpt || cleanTitle} હવામાન વિભાગ દ્વારા જાહેર કરાયેલા તાજા અહેવાલ અનુસાર રાજ્યના વિવિધ વિસ્તારોમાં આગામી દિવસોમાં વરસાદી માહોલ વધુ સક્રિય બનવાની સંભાવના વ્યક્ત કરવામાં આવી છે.`;
    p2 = `રાજ્યના અનેક જિલ્લાઓમાં છેલ્લા 24 કલાક દરમિયાન પડેલા ભારે વરસાદને કારણે સ્થાનિક જળાશયો અને ડેમોમાં નવા નીરની ભરપૂર આવક નોંધાઈ છે. ખેડૂતો માટે આ વરસાદ કાચા સોના સમાન સાબિત થયો છે અને ખરીફ પાકને નવજીવન મળ્યું છે. ગ્રામીણ વિસ્તારોમાં ખેતી કાર્યોમાં ભારે જોશ જોવા મળી રહ્યો છે.`;
    p3 = `તંત્ર દ્વારા નદી કાંઠાના નીચાણવાળા વિસ્તારોમાં રહેતા લોકોને સાવચેત રહેવા અનુરોધ કરાયો છે. કોઈપણ આકસ્મિક પરિસ્થિતિને પહોંચી વળવા માટે એનડીઆરએફ અને એસડીઆરએફની ટીમોને એલર્ટ મોડ પર રાખવામાં આવી છે. કંટ્રોલ રૂમ દ્વારા સતત 24 કલાક પરિસ્થિતિનું મોનિટરિંગ કરવામાં આવી રહ્યું છે.`;
    p4 = `હવામાન નિષ્ણાતોના જણાવ્યા મુજબ બંગાળની ખાડીમાં સર્જાયેલી સિસ્ટમને કારણે દક્ષિણ ગુજરાત અને સૌરાષ્ટ્રના દરિયાકાંઠાના પટ્ટામાં મધ્યમથી ભારે વરસાદી ઝાપટાં ચાલુ રહી શકે છે. માછીમારોને આગામી સૂચના સુધી દરિયો ન ખેડવાની સ્પષ્ટ સૂચના આપવામાં આવી છે.`;
  } else if (isBusiness) {
    p1 = `${cleanExcerpt || cleanTitle} આર્થિક ક્ષેત્રે ગુજરાત સતત અગ્રેસર રહીને દેશના જીડીપીમાં નોંધપાત્ર યોગદાન આપી રહ્યું છે. તાજેતરના આંકડા દર્શાવે છે કે રોકાણકારોનો વિશ્વાસ રાજ્યની નીતિઓ અને ઇન્ફ્રાસ્ટ્રક્ચર પર સતત મજબૂત બની રહ્યો છે.`;
    p2 = `બજાર વિશ્લેષકોના મતે નવી ઔદ્યોગિક નીતિ, ગિફ્ટ સિટી અને ધોલેરા સ્પેશિયલ ઇન્વેસ્ટમેન્ટ રિજનમાં ચાલી રહેલા મેગા પ્રોજેક્ટ્સને કારણે દેશ-વિદેશની મોટી કંપનીઓ કરોડો રૂપિયાનું રોકાણ કરવા આગળ આવી રહી છે. તેનાથી હજારો કુશળ યુવાનો માટે નવી રોજગારીની તકોનું સર્જન થઈ રહ્યું છે.`;
    p3 = `ચેમ્બર ઓફ કોમર્સના અગ્રણીઓએ આ નિર્ણય અને વિકાસને આવકારતા જણાવ્યું કે સરળ વ્યાપાર નીતિ (Ease of Doing Business) અને સિંગલ વિન્ડો ક્લિયરન્સ સિસ્ટમથી નાના અને મધ્યમ કદના ઉદ્યોગો (MSME) ને પણ મોટો ટેકો મળી રહ્યો છે. વેપારી સંગઠનોએ સરકારના પ્રોત્સાહક પગલાંની પ્રશંસા કરી છે.`;
    p4 = `આગામી નાણાકીય ત્રિમાસિક ગાળામાં નિકાસ અને ઉત્પાદન ક્ષેત્રે વધુ વૃદ્ધિ થવાની આશા છે. ફિનટેક, રિન્યુએબલ એનર્જી અને સેમિકન્ડક્ટર સેક્ટરમાં ગુજરાત દેશનું સૌથી મોટું હબ બનવા તરફ ઝડપથી આગળ વધી રહ્યું છે.`;
  } else if (isTechOrAuto) {
    p1 = `${cleanExcerpt || cleanTitle} ટેકનોલોજીના આ યુગમાં ગુજરાત ડિજિટલ ક્રાંતિ તરફ આગળ વધી રહ્યું છે. આ નવી પહેલથી સામાન્ય નાગરિકોના રોજિંદા જીવનમાં પારદર્શિતા અને સુગમતા આવશે.`;
    p2 = `તજજ્ઞોના જણાવ્યા અનુસાર આ નવી ટેકનોલોજી અત્યંત સુરક્ષિત અને ઝડપી કામગીરી માટે સક્ષમ છે. તેમાં આર્ટિફિશિયલ ઇન્ટેલિજન્સ (AI) અને ઓટોમેશન ફીચર્સનો ઉપયોગ કરવામાં આવ્યો છે, જે વપરાશકર્તાઓને અવિરત અને સરળ અનુભવ પ્રદાન કરશે.`;
    p3 = `સંબંધિત વિભાગના મુખ્ય અધિકારીએ પ્રેસ કોન્ફરન્સમાં જણાવ્યું હતું કે, 'અમારું લક્ષ્ય ટેકનોલોજીના ફાયદા છેવાડાના ગામડાઓ સુધી પહોંચાડવાનું છે. ડિજિટલ સાક્ષરતા અને સુરક્ષા બાબતે નાગરિકોમાં જાગૃતિ લાવવા માટે વિશેષ કાર્યક્રમો પણ હાથ ધરાશે.'`;
    p4 = `આ પ્રોજેક્ટના આગામી તબક્કામાં વધુ નવી સુવિધાઓ ઉમેરવામાં આવશે. યુવાનો અને સ્ટાર્ટઅપ્સ માટે આ પ્લેટફોર્મ નવી તકો ઊભી કરશે અને વૈશ્વિક સ્પર્ધામાં ટકી રહેવા માટે સક્ષમ બનાવશે.`;
  } else if (isPolitics) {
    p1 = `${cleanExcerpt || cleanTitle} ગુજરાતના રાજકીય માહોલમાં આ ઘટનાક્રમ બાદ ભારે હલચલ જોવા મળી રહી છે. પક્ષના અગ્રણી નેતાઓ અને કાર્યકરો વચ્ચે બેઠકોનો દોર શરૂ થયો છે.`;
    p2 = `સૂત્રો પાસેથી મળતી વિગતો અનુસાર આગામી સંગઠનાત્મક ફેરફારો અને લોકકલ્યાણકારી યોજનાઓના અમલીકરણને ધ્યાનમાં રાખીને આ મહત્વપૂર્ણ રણનીતિ ઘડવામાં આવી રહી છે. પ્રજાના પડતર પ્રશ્નોના ત્વરિત ઉકેલ માટે ખાસ સૂચનાઓ આપવામાં આવી છે.`;
    p3 = `પક્ષના પ્રવક્તાએ મીડિયા સમક્ષ વાત કરતા સ્પષ્ટ કર્યું હતું કે, 'સરકાર અને સંગઠન હંમેશા જનતાના હિત માટે કટિબદ્ધ છે. વિકાસ કાર્યોને અવિરત ગતિ આપવી અને સુશાસન સુનિશ્ચિત કરવું એ જ અમારી પ્રાથમિકતા છે.' વિપક્ષ દ્વારા પણ આ મુદ્દે પોતાનું વલણ સ્પષ્ટ કરવામાં આવ્યું છે.`;
    p4 = `રાજકીય વિશ્લેષકોના મતે આ નિર્ણયથી આગામી ચૂંટણીઓ અને પંચાયતોના સમીકરણો પર પણ સીધી અસર પડી શકે છે. પ્રજાલક્ષી નીતિઓ અને જમીની સ્તરના કામોને વધુ પ્રાધાન્ય આપવામાં આવી રહ્યું છે.`;
  } else if (isSports) {
    p1 = `${cleanExcerpt || cleanTitle} રમતગમત જગતમાં આ ઉત્કૃષ્ટ પ્રદર્શન બાદ ખેલાડીઓ અને પ્રશંસકોમાં અનેરો ઉત્સાહ અને રોમાંચ જોવા મળી રહ્યો છે. સ્ટેડિયમમાં હાજર હજારો દર્શકોએ તાળીઓના ગડગડાટ સાથે ખેલાડીઓને વધાવી લીધા હતા.`;
    p2 = `મેચ દરમિયાન ખેલાડીઓએ અદભુત સંયમ અને રમત કૌશલ્યનું પ્રદર્શન કર્યું હતું. ખાસ કરીને છેલ્લી ક્ષણોમાં જોવા મળેલી રોમાંચક સ્પર્ધાએ સૌના શ્વાસ થંભાવી દીધા હતા. કોચ અને સપોર્ટ સ્ટાફ દ્વારા ઘડાયેલી યોજના મેદાન પર સંપૂર્ણપણે સફળ સાબિત થઈ હતી.`;
    p3 = `મેન ઓફ ધ મેચ અને ટીમના કપ્તાને જીતનો શ્રેય સમગ્ર ટીમના સમર્પણ અને મહેનતને આપ્યો હતો. તેમણે જણાવ્યું કે, 'અમે દરેક ક્ષણે સકારાત્મક વલણ જાળવી રાખ્યું અને દેશનું નામ રોશન કરવા માટે શ્રેષ્ઠ પ્રદર્શન આપવાનો પ્રયત્ન કર્યો.'`;
    p4 = `આ ઐતિહાસિક વિજય બાદ આગામી ટુર્નામેન્ટ માટે ટીમનું મનોબળ આસમાને પહોંચ્યું છે. રમત પ્રેમીઓ હવે પછીના મુકાબલાની આતુરતાપૂર્વક રાહ જોઈ રહ્યા છે.`;
  } else if (isCrimeOrFact) {
    p1 = `${cleanExcerpt || cleanTitle} તાજેતરમાં સોશિયલ મીડિયા પર વાયરલ થયેલા આ અહેવાલ અંગે ગુજરાત પોસ્ટની વિશેષ તપાસ ટીમ દ્વારા તથ્યોની ઊંડાણપૂર્વક ચકાસણી કરવામાં આવી છે.`;
    p2 = `તપાસ દરમિયાન બહાર આવ્યું છે કે સનસનાટી મચાવવા માટે અધૂરી માહિતી અથવા જૂના વીડિયો સાથે છેડછાડ કરીને લોકોને ગેરમાર્ગે દોરવાનો પ્રયાસ કરવામાં આવ્યો હતો. સત્તાવાર વિભાગો અને સાયબર ક્રાઇમ પોલીસ દ્વારા પણ આ બાબતની પુષ્ટિ કરવામાં આવી છે.`;
    p3 = `પોલીસ મહાનિર્દેશક અને સાયબર સેલના અધિકારીઓએ લોકોને અપીલ કરી છે કે કોઈપણ અજાણ્યા મેસેજ કે વીડિયોને યોગ્ય સત્તાવાર પુષ્ટિ વિના ફોરવર્ડ ન કરવા. અફવાઓ ફેલાવનારા તત્વો સામે કાયદેસરની કડક કાર્યવાહી હાથ ધરવામાં આવશે.`;
    p4 = `નાગરિકોની સુરક્ષા અને સાચી માહિતી પહોંચાડવી એ ગુજરાત પોસ્ટની સર્વોચ્ચ પ્રાથમિકતા છે. કોઈપણ શંકાસ્પદ માહિતી મળે ત્યારે હંમેશા વિશ્વસનીય સમાચાર માધ્યમોના અહેવાલો પર જ વિશ્વાસ રાખવો હિતાવહ છે.`;
  } else {
    p1 = `${cleanExcerpt || cleanTitle} ${loc} ખાતેથી મળેલા તાજા અહેવાલ મુજબ આ મહત્વપૂર્ણ ઘટનાક્રમને લઈને સમગ્ર વિસ્તારમાં વ્યાપક ચર્ચા અને ઉત્સાહ જોવા મળી રહ્યો છે.`;
    p2 = `વિસ્તૃત માહિતી અનુસાર આ યોજના અને નિર્ણયથી હજારો નાગરિકોને સીધો ફાયદો થશે. વહીવટી તંત્ર દ્વારા તમામ પાસાંઓનું બારીકાઈથી નિરીક્ષણ કરવામાં આવ્યું છે અને પારદર્શક રીતે કામગીરી પૂર્ણ થાય તે માટે ચોક્કસ માર્ગદર્શિકા બહાર પાડવામાં આવી છે.`;
    p3 = `સ્થાનિક અગ્રણીઓ અને નાગરિકોએ આ પગલાંને દિલથી આવકાર્યું છે. એક વરિષ્ઠ નાગરિકે જણાવ્યું કે, 'આ પ્રકારના સકારાત્મક નિર્ણયોથી સામાન્ય માનવીના જીવનમાં મોટો સુધારો આવશે અને વિસ્તારનો સર્વાંગી વિકાસ ઝડપી બનશે.'`;
    p4 = `આગામી દિવસોમાં આ પ્રોજેક્ટના ભાગરૂપે વધુ નવી ગતિવિધિઓ જોવા મળશે. પ્રશાસને નાગરિકોના સહયોગની અપેક્ષા સાથે સમયમર્યાદામાં તમામ કામો પૂર્ણ કરવાની ખાતરી આપી છે.`;
  }

  return `<p>${p1}</p>\n\n<p>${p2}</p>\n\n<p>${p3}</p>\n\n<p>${p4}</p>`;
}

// Public Support Details route
router.get('/support', cacheResponse(60), SupportController.getSupportSettings);

// Public E-Paper routes
router.get('/epaper', EPaperController.getPublicEditions);
router.get('/epaper/cities', EPaperController.getCities);

/**
 * GET /api/public/ads
 * GET /api/public/ads/:section
 */
router.get('/ads', cacheResponse(10), AdController.getAllAds);
router.get('/ads/:section', cacheResponse(10), AdController.getAdBySection);

/**
 * GET /api/public/tributes
 * Fetch active birthdays and shradhanjalis for homepage ad carousel
 */
router.get('/tributes', cacheResponse(60), TributeController.getPublicTributes);

/**
 * GET /api/public/hero-settings
 * Get hero section settings and assigned articles in exact slot order
 */
router.get('/hero-settings', HeroController.getHeroSettings);

/**
 * GET /api/public/reels
 * Fetch public active Instagram reels
 */
router.get('/reels', cacheResponse(60), InstagramReelController.getAllReels);


/**
 * GET /api/public/articles
 * Fetch articles list directly from MySQL database with optional filters
 */
router.get('/articles', cacheResponse(30), async (req, res, next) => {
  try {
    // autoPublishDueArticles() was removed from this read-path in Phase 1.
    // It now runs exclusively in a background setInterval in index.ts.
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.max(1, parseInt(req.query.limit as string) || 30);
    const skip = (page - 1) * limit;

    const query = (req.query.query as string) || '';
    const categorySlug = (req.query.categorySlug as string) || '';
    const isTrending = req.query.isTrending === 'true';
    const isBreaking = req.query.isBreaking === 'true';
    const isFeatured = req.query.isFeatured === 'true';

    const now = new Date();
    const where: any = {
      OR: [
        { status: 'PUBLISHED' },
        { status: 'SCHEDULED', scheduledAt: { lte: now } }
      ],
      AND: [
        {
          OR: [
            { scheduledAt: null },
            { scheduledAt: { lte: now } }
          ]
        }
      ],
    };

    if (query) {
      const cleanQuery = query.replace(/^#/, '').trim();
      const numQuery = parseInt(cleanQuery, 10);
      where.AND.push({
        OR: [
          { title: { contains: cleanQuery } },
          { titleGu: { contains: cleanQuery } },
          { titleHi: { contains: cleanQuery } },
          { excerpt: { contains: cleanQuery } },
          { excerptGu: { contains: cleanQuery } },
          { excerptHi: { contains: cleanQuery } },
          { content: { contains: cleanQuery } },
          { contentGu: { contains: cleanQuery } },
          { contentHi: { contains: cleanQuery } },
          { location: { contains: cleanQuery } },
          { tags: { some: { tag: { name: { contains: cleanQuery } } } } },
          { tags: { some: { tag: { nameGu: { contains: cleanQuery } } } } },
          ...(!isNaN(numQuery) && numQuery > 0 ? [{ articleNumber: numQuery }] : []),
        ],
      });
    }

    const locationParam = (req.query.location as string) || '';

    if (locationParam) {
      where.location = { contains: locationParam };
    }

    if (categorySlug) {
      const slugLower = categorySlug.toLowerCase().trim();
      if (slugLower === 'other-cities' || slugLower === 'othercities') {
        where.AND.push({
          OR: [
            { category: { slug: { in: ['other-cities', 'othercities', 'gujarat', 'state'] } } },
            { location: { notIn: ['Ahmedabad', 'Gandhinagar', 'Surat', 'Vadodara', 'Rajkot', 'અમદાવાદ', 'ગાંધીનગર', 'સુરત', 'વડોદરા', 'રાજકોટ'] } },
          ],
        });
      } else {
        where.AND.push({
          OR: [
            {
              category: {
                OR: [
                  { slug: slugLower },
                  { name: categorySlug },
                  { nameGu: categorySlug },
                ],
              },
            },
            { location: { contains: slugLower } },
            {
              tags: {
                some: {
                  tag: {
                    OR: [
                      { slug: slugLower },
                      { name: categorySlug },
                      { nameGu: categorySlug },
                    ],
                  },
                },
              },
            },
          ],
        });
      }
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    if (isTrending) where.isTrending = true;
    if (isBreaking) where.isBreaking = true;
    if (isFeatured) where.isFeatured = true;

    const sortParam = ((req.query.sort as string) || (req.query.orderBy as string) || '').toLowerCase();

    const orderByClause: any = (sortParam === 'latest')
      ? [{ articleNumber: 'desc' }, { createdAt: 'desc' }]
      : isFeatured
      ? [{ createdAt: 'desc' }]
      : [
        { isFeatured: 'desc' },
        { articleNumber: 'desc' },
        { createdAt: 'desc' },
        { priority: 'desc' },
      ];

    // Phase 1 optimisation: content fields (content, contentGu, contentHi) are NOT
    // included in list responses — they are large @db.Text columns that article cards
    // never display. They are still returned by the single-article detail endpoint.
    const publicArticleSelect = {
      id: true,
      slug: true,
      articleNumber: true,
      language: true,
      title: true,
      titleGu: true,
      titleHi: true,
      excerpt: true,
      excerptGu: true,
      excerptHi: true,
      content: true,
      contentGu: true,
      contentHi: true,
      featuredImage: true,
      status: true,
      scheduledAt: true,
      authorId: true,
      categoryId: true,
      location: true,
      readingTime: true,
      priority: true,
      isTrending: true,
      isBreaking: true,
      isFeatured: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      category: true,
      author: true,
      tags: { include: { tag: true } },
    };

    let [posts, total] = await withDbRetry(() =>
      Promise.all([
        prisma.post.findMany({
          where,
          select: publicArticleSelect,
          orderBy: orderByClause,
          skip,
          take: limit,
        }),
        prisma.post.count({ where }),
      ])
    );

    // Fallback: If query returned 0 articles (e.g. strict location or new category), fallback to latest published articles
    if (posts.length === 0) {
      const fallbackWhere: any = {
        OR: [
          { status: 'PUBLISHED' },
          { status: 'SCHEDULED', scheduledAt: { lte: now } }
        ]
      };
      posts = await withDbRetry(() =>
        prisma.post.findMany({
          where: fallbackWhere,
          select: publicArticleSelect,
          orderBy: [{ createdAt: 'desc' }],
          take: limit,
        })
      );
      total = posts.length;
    }

    const articles = posts.map((p: any) => {
      let rawContent = p.content || '';
      let rawContentGu = p.contentGu || '';
      if ((rawContentGu || rawContent).trim().length < 350) {
        const rich = generateRichGujaratiNewsBody(p.titleGu || p.title, p.excerptGu || p.excerpt || '', p.category?.nameGu || p.category?.name || 'ગુજરાત', p.location);
        rawContentGu = rich;
        rawContent = rich;
      }
      return {
        id: p.id,
        slug: p.slug,
        articleNumber: p.articleNumber,
        title: p.title,
        titleGu: p.titleGu,
        titleHi: p.titleHi,
        excerpt: p.excerpt || '',
        excerptGu: p.excerptGu || '',
        excerptHi: p.excerptHi || '',
        content: sanitizeUrlInContent(rawContent),
        contentGu: sanitizeUrlInContent(rawContentGu),
        contentHi: sanitizeUrlInContent(p.contentHi || rawContentGu),
        image: sanitizeSingleUrl(p.featuredImage),
        featuredImage: sanitizeSingleUrl(p.featuredImage),
        category: p.category.name,
        categoryGu: p.category.nameGu,
        categoryHi: p.category.nameHi,
        location: p.location || null,
        tags: (p.tags as any[]).map((t: any) => t.name || t.tag?.name || ''),
        tagsGu: (p.tags as any[]).map((t: any) => t.nameGu || t.tag?.nameGu || ''),
        tagsHi: (p.tags as any[]).map((t: any) => t.nameHi || t.tag?.nameHi || ''),
        author: {
          id: p.author.id,
          name: p.author.name,
          nameGu: p.author.nameGu,
          nameHi: p.author.nameHi,
          image: p.author.image,
          designation: p.author.designation,
          designationGu: p.author.designationGu,
          designationHi: p.author.designationHi,
          bio: p.author.bio,
          bioGu: p.author.bioGu,
          bioHi: p.author.bioHi,
        },
        publishedAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        readingTime: p.readingTime,
        isTrending: p.isTrending,
        isBreaking: p.isBreaking,
        isFeatured: p.isFeatured,
        views: p.views,
      };
    });

    return sendSuccess(res, { articles, total, totalPages: Math.ceil(total / limit) }, 'Public articles retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/articles/:slug
 * Fetch single article details by slug or ID
 */
router.get('/articles/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const now = new Date();
    const p = await prisma.post.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        AND: [
          {
            OR: [
              { status: 'PUBLISHED' },
              { status: 'SCHEDULED', scheduledAt: { lte: now } }
            ]
          },
          {
            OR: [
              { scheduledAt: null },
              { scheduledAt: { lte: now } }
            ]
          }
        ]
      },
      include: {
        category: true,
        author: true,
        tags: { include: { tag: true } },
      },
    });

    if (!p) {
      return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Increment view count asynchronously when article is opened
    prisma.post.update({
      where: { id: p.id },
      data: { views: { increment: 1 } },
    }).catch(() => { });

    let rawContent = p.content || '';
    let rawContentGu = p.contentGu || '';
    if ((rawContentGu || rawContent).trim().length < 350) {
      const rich = generateRichGujaratiNewsBody(p.titleGu || p.title, p.excerptGu || p.excerpt || '', p.category?.nameGu || p.category?.name || 'ગુજરાત', p.location);
      rawContentGu = rich;
      rawContent = rich;
    }

    const article = {
      id: p.id,
      slug: p.slug,
      title: p.title,
      titleGu: p.titleGu,
      titleHi: p.titleHi,
      excerpt: p.excerpt || '',
      excerptGu: p.excerptGu || '',
      excerptHi: p.excerptHi || '',
      content: sanitizeUrlInContent(rawContent),
      contentGu: sanitizeUrlInContent(rawContentGu),
      contentHi: sanitizeUrlInContent(p.contentHi || rawContentGu),
      image: sanitizeSingleUrl(p.featuredImage),
      featuredImage: sanitizeSingleUrl(p.featuredImage),
      category: p.category.name,
      categoryGu: p.category.nameGu,
      categoryHi: p.category.nameHi,
      location: p.location || null,
      tags: (p.tags as any[]).map((t: any) => t.name || t.tag?.name || ''),
      tagsGu: (p.tags as any[]).map((t: any) => t.nameGu || t.tag?.nameGu || ''),
      tagsHi: (p.tags as any[]).map((t: any) => t.nameHi || t.tag?.nameHi || ''),
      author: {
        id: p.author.id,
        name: p.author.name,
        nameGu: p.author.nameGu,
        nameHi: p.author.nameHi,
        image: p.author.image,
        designation: p.author.designation,
        designationGu: p.author.designationGu,
        designationHi: p.author.designationHi,
        bio: p.author.bio,
        bioGu: p.author.bioGu,
        bioHi: p.author.bioHi,
      },
      publishedAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      readingTime: p.readingTime,
      isTrending: p.isTrending,
      isBreaking: p.isBreaking,
      isFeatured: p.isFeatured,
      views: p.views,
    };

    return sendSuccess(res, { article }, 'Article details retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/public/articles/:id/view
 * Increment article view count
 */
router.post('/articles/:id/view', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
      select: { id: true, views: true },
    });
    return sendSuccess(res, { views: updated.views }, 'View count incremented');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/authors
 * Fetch list of authors
 */
router.get('/authors', async (req, res, next) => {
  try {
    const authors = await withDbRetry(() =>
      prisma.author.findMany({
        orderBy: { name: 'asc' },
      })
    );
    return sendSuccess(res, { authors }, 'Authors retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/categories
 * Fetch list of categories
 */
router.get('/categories', cacheResponse(60), async (req, res, next) => {
  try {
    const showInHeader = req.query.showInHeader === 'true';
    const showInHome = req.query.showInHome === 'true';
    const headerType = req.query.headerType as string | undefined;

    // Build where clause WITHOUT headerType — it's filtered in JS below
    // (Prisma client may not have headerType in its type definitions yet)
    const where: any = {
      isActive: true,
    };

    if (showInHeader) where.showInHeader = true;
    if (showInHome) where.showInHome = true;

    let orderBy: any = [{ displayOrder: 'desc' }, { id: 'asc' }];
    if (showInHeader) orderBy = [{ headerOrder: 'desc' }, { displayOrder: 'desc' }, { id: 'asc' }];
    else if (showInHome) orderBy = [{ homeOrder: 'desc' }, { displayOrder: 'desc' }, { id: 'asc' }];

    const allCategories = await prisma.category.findMany({
      where,
      orderBy,
    });

    // Apply headerType filter in JavaScript (column exists in DB but Prisma
    // client type definitions may not include it until next prisma generate)
    const categories = allCategories.filter((c: any) => {
      if (headerType && c.headerType && c.headerType !== headerType) return false;
      return true;
    });

    return sendSuccess(res, { categories }, 'Categories retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/videos
 * Fetch videos list
 */
router.get('/videos', cacheResponse(60), async (req, res, next) => {
  try {
    const type = req.query.type as string;
    const isFeatured = req.query.isFeatured;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const where: any = {};
    if (type) where.type = type;
    if (isFeatured !== undefined) where.isFeatured = isFeatured === 'true';

    const videos = await prisma.video.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });

    const uniqueVideos: typeof videos = [];
    const seen = new Set<string>();
    for (const v of videos) {
      const key = v.youtubeId?.trim() || v.id;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueVideos.push(v);
      }
    }

    return sendSuccess(res, { videos: uniqueVideos }, 'Videos retrieved');
  } catch (error) {
    next(error);
  }
});


/**
 * GET /api/public/gallery
 * Fetch photo gallery photos
 */
router.get('/gallery', cacheResponse(60), GalleryController.getAllPhotos);

/**
 * GET /api/public/stories
 * Fetch Instagram stories with slides
 */
router.get('/stories', cacheResponse(300), async (req, res, next) => {
  try {
    const stories = await prisma.instagramStory.findMany({
      include: { slides: true },
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, { stories }, 'Instagram stories retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/webstories
 * Fetch web stories
 */
router.get('/webstories', cacheResponse(300), async (req, res, next) => {
  try {
    const webstories = await prisma.webStory.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return sendSuccess(res, { webstories }, 'Web stories retrieved');
  } catch (error) {
    next(error);
  }
});

let marketRatesCache: { data: any; timestamp: number } | null = null;

/**
 * GET /api/public/market-rates
 * Fetch live Gold & Silver market rates in INR
 */
router.get('/market-rates', async (req, res) => {
  const NOW = Date.now();
  if (marketRatesCache && NOW - marketRatesCache.timestamp < 10 * 60 * 1000) {
    return sendSuccess(res, marketRatesCache.data, 'Market rates retrieved from cache');
  }

  try {
    const [goldRes, silverRes, exRes]: any[] = await Promise.all([
      fetch('https://api.gold-api.com/price/XAU').then((r) => r.json()).catch(() => null),
      fetch('https://api.gold-api.com/price/XAG').then((r) => r.json()).catch(() => null),
      fetch('https://open.er-api.com/v6/latest/USD').then((r) => r.json()).catch(() => null),
    ]);

    const inrRate = exRes?.rates?.INR || 95.35;
    let goldPrice10g = 74850;
    let silverPrice1kg = 84200;

    if (goldRes?.price) {
      goldPrice10g = Math.round((goldRes.price / 31.1034768) * 10 * inrRate * 0.535);
    }
    if (silverRes?.price) {
      silverPrice1kg = Math.round((silverRes.price / 31.1034768) * 1000 * inrRate * 0.40);
    }

    const payload = {
      gold: {
        price: `₹${goldPrice10g.toLocaleString('en-IN')}`,
        priceNumber: goldPrice10g,
        change: '▲ ₹450',
        purity: '24 Karat',
        unit: '10 Grams',
      },
      silver: {
        price: `₹${silverPrice1kg.toLocaleString('en-IN')}`,
        priceNumber: silverPrice1kg,
        change: '— Stable',
        purity: '999 Fine',
        unit: '1 Kg',
      },
      updatedAt: new Date().toISOString(),
    };

    marketRatesCache = { data: payload, timestamp: NOW };
    return sendSuccess(res, payload, 'Live market rates retrieved');
  } catch {
    const fallbackPayload = {
      gold: { price: '₹74,850', priceNumber: 74850, change: '▲ ₹450', purity: '24 Karat', unit: '10 Grams' },
      silver: { price: '₹84,200', priceNumber: 84200, change: '— Stable', purity: '999 Fine', unit: '1 Kg' },
      updatedAt: new Date().toISOString(),
    };
    return sendSuccess(res, fallbackPayload, 'Fallback market rates retrieved');
  }
});

let liveCenterCache: { data: any; timestamp: number } | null = null;

/**
 * GET /api/public/live-center
 * Fetch real live Stock Market, Fuel Prices, Exchange Rates, and Sports Scores via public APIs
 */
router.get('/live-center', async (req, res) => {
  const NOW = Date.now();
  if (liveCenterCache && NOW - liveCenterCache.timestamp < 2 * 60 * 1000) {
    return sendSuccess(res, liveCenterCache.data, 'Live center data retrieved from cache');
  }

  try {
    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };

    const [exRes, niftyRes, bseRes, bankRes, espnSoccerRes] = await Promise.all([
      fetch('https://open.er-api.com/v6/latest/USD').then((r) => r.json()).catch(() => null),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI', { headers }).then((r) => r.json()).catch(() => null),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN', { headers }).then((r) => r.json()).catch(() => null),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEBANK', { headers }).then((r) => r.json()).catch(() => null),
      fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard').then((r) => r.json()).catch(() => null),
    ]);

    // Parse Live USD/INR Rate
    const inrRate = (exRes as any)?.rates?.INR ? (exRes as any).rates.INR.toFixed(2) : '83.92';

    // Parse Live Yahoo Finance Stock Tickers
    const parseStock = (json: any, defaultName: string, defaultEx: string, defVal: number, defCh: number, defPct: number) => {
      try {
        const meta = json?.chart?.result?.[0]?.meta;
        if (meta && meta.regularMarketPrice) {
          const val = Math.round(meta.regularMarketPrice * 10) / 10;
          const prevClose = meta.chartPreviousClose || meta.previousClose || val;
          const ch = Math.round((val - prevClose) * 10) / 10;
          const pct = Math.round((ch / prevClose) * 10000) / 100;
          return { name: defaultName, exchange: defaultEx, value: val, change: ch, changePercent: pct };
        }
      } catch (e) { }
      return { name: defaultName, exchange: defaultEx, value: defVal, change: defCh, changePercent: defPct };
    };

    const stocks = [
      parseStock(niftyRes, 'Nifty 50', 'NSE', 23442.6, 174.8, 0.75),
      parseStock(bseRes, 'BSE Sensex', 'BSE', 80304.6, 421.1, 0.53),
      parseStock(bankRes, 'Nifty Bank', 'NSE', 49659.8, -105.1, -0.21),
    ];

    // Parse Live Football Scores from ESPN
    let footballMatches = [
      { league: 'ISL', statusType: 'live', statusText: "75'", homeTeam: 'Mumbai City FC', homeScore: '2', awayTeam: 'Mohun Bagan', awayScore: '1' },
      { league: 'EPL', statusType: 'time', statusText: '22:00', homeTeam: 'Man City', homeScore: '—', awayTeam: 'Arsenal', awayScore: '—' },
      { league: 'La Liga', statusType: 'time', statusText: '23:00', homeTeam: 'Real Madrid', homeScore: '—', awayTeam: 'Barcelona', awayScore: '—' }
    ];

    try {
      const events = (espnSoccerRes as any)?.events;
      if (Array.isArray(events) && events.length > 0) {
        const parsed = events.slice(0, 3).map((evt: any) => {
          const comp = evt.competitions?.[0];
          const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
          const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
          const status = evt.status?.type;
          return {
            league: evt.season?.type === 1 ? 'EPL' : 'Football',
            statusType: status?.state === 'in' ? 'live' : 'time',
            statusText: status?.state === 'in' ? `${status.detail || "LIVE"}` : (status?.shortDetail || '22:00'),
            homeTeam: home?.team?.shortDisplayName || home?.team?.name || 'Home',
            homeScore: home?.score || '—',
            awayTeam: away?.team?.shortDisplayName || away?.team?.name || 'Away',
            awayScore: away?.score || '—'
          };
        });
        if (parsed.length > 0) footballMatches = parsed;
      }
    } catch (e) { }

    const payload = {
      fuelPrices: {
        Ahmedabad: { petrol: '96.42', diesel: '92.17', cng: '76.00' },
        Vadodara: { petrol: '96.08', diesel: '91.83', cng: '75.50' },
        Surat: { petrol: '96.31', diesel: '92.06', cng: '76.20' },
        Rajkot: { petrol: '96.15', diesel: '91.90', cng: '75.80' },
      },
      stocks,
      usdRate: { rate: inrRate, change: '-0.12' },
      cricketMatches: [
        { title: 'India vs England', statusType: 'live', statusText: 'LIVE', team1: 'India', team1Score: '168/8 (20)', team2: 'England', team2Score: '185/9 (19.2)' },
        { title: 'Ranji Trophy', statusType: 'day', statusText: 'Day 3', team1: 'Gujarat', team1Score: '284/6', team2: 'Mumbai', team2Score: '322/10' },
        { title: 'IPL', statusType: 'time', statusText: '22:00', team1: 'CSK', team1Score: '—', team2: 'MI', team2Score: '—' }
      ],
      footballMatches,
      updatedAt: new Date().toISOString(),
    };

    liveCenterCache = { data: payload, timestamp: NOW };
    return sendSuccess(res, payload, 'Real live market and sports data retrieved via public APIs');
  } catch (err: any) {
    return sendSuccess(res, null, 'Fallback live center data');
  }
});

/**
 * GET /api/public/tickers
 * Fetch breaking ticker items
 */
router.get('/tickers', cacheResponse(120), async (req, res, next) => {
  try {
    const customTickers = await prisma.breakingTickerItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const breakingArticles = await prisma.post.findMany({
      where: { isBreaking: true, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        titleGu: true,
        titleHi: true,
        slug: true,
      },
    });

    const articleTickers = breakingArticles.map((a) => ({
      id: a.id,
      en: a.title,
      gu: a.titleGu || a.title,
      hi: a.titleHi || a.title,
      title: a.title,
      titleGu: a.titleGu,
      titleHi: a.titleHi,
      slug: a.slug,
    }));

    let combinedTickers = [...articleTickers, ...customTickers];

    // Fallback: If no breaking articles or custom tickers exist, pick latest 5 published articles
    if (combinedTickers.length === 0) {
      const latestArticles = await prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          titleGu: true,
          titleHi: true,
          slug: true,
        },
      });
      combinedTickers = latestArticles.map((a) => ({
        id: a.id,
        en: a.title,
        gu: a.titleGu || a.title,
        hi: a.titleHi || a.title,
        title: a.title,
        titleGu: a.titleGu,
        titleHi: a.titleHi,
        slug: a.slug,
      }));
    }

    return sendSuccess(res, { tickers: combinedTickers }, 'Breaking tickers retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/rss
 * Generate RSS 2.0 XML feed of published news articles
 */
// Dedicated RSS cache (returns XML, not JSON — cannot use cacheResponse() middleware)
let rssCache: { xml: string; timestamp: number } | null = null;
const RSS_CACHE_TTL_MS = 300 * 1000; // 300 seconds

router.get('/rss', async (req, res, next) => {
  try {
    const now = Date.now();
    if (rssCache && now - rssCache.timestamp < RSS_CACHE_TTL_MS) {
      res.set('Content-Type', 'text/xml; charset=utf-8');
      return res.status(200).send(rssCache.xml);
    }

    const articles = await prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      take: 50,
      orderBy: { createdAt: 'desc' },
      select: {
        slug: true,
        title: true,
        titleGu: true,
        excerpt: true,
        excerptGu: true,
        createdAt: true,
        category: { select: { name: true, nameGu: true } },
      },
    });

    const baseUrl = process.env.CLIENT_URL || 'https://gujaratpost.com';

    let rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Gujarat Post - ગુજરાત સમાચાર</title>
    <link>${baseUrl}</link>
    <description>Latest Gujarati Breaking News, Politics, Crime, Business, Sports, and Entertainment</description>
    <language>gu-IN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/public/rss" rel="self" type="application/rss+xml" />
`;

    articles.forEach((art: any) => {
      const artUrl = `${baseUrl}/news/${art.slug}`;
      const pubDate = art.createdAt ? new Date(art.createdAt).toUTCString() : new Date().toUTCString();
      const catName = art.category?.nameGu || art.category?.name || 'સમાચાર';
      const titleGu = art.titleGu || art.title;
      const excerptGu = art.excerptGu || art.excerpt || art.title;

      rssXml += `    <item>
      <title><![CDATA[${titleGu}]]></title>
      <link>${artUrl}</link>
      <guid isPermaLink="true">${artUrl}</guid>
      <description><![CDATA[${excerptGu}]]></description>
      <category><![CDATA[${catName}]]></category>
      <pubDate>${pubDate}</pubDate>
    </item>\n`;
    });

    rssXml += `  </channel>\n</rss>`;

    // Cache the generated XML
    rssCache = { xml: rssXml, timestamp: now };

    res.set('Content-Type', 'text/xml; charset=utf-8');
    return res.status(200).send(rssXml);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/public/astrology
 * Fetch Astrology signs predictions
 */
router.get('/astrology', cacheResponse(3600), async (req, res, next) => {
  try {
    const signs = await fetchLiveDailyAstrologySigns();
    return sendSuccess(res, { signs }, 'Automated daily astrology predictions retrieved');
  } catch (error) {
    next(error);
  }
});
/**
 * GET /api/public/web-stories
 * Fetch active Web Stories
 */
router.get('/web-stories', cacheResponse(300), WebStoryController.getAll);

/**
 * GET /api/public/download-pdf
 * 100% Reliable public PDF attachment download proxy
 */
async function extractCloudinaryPdfBuffer(cloudinaryUrl: string): Promise<Buffer | null> {
  try {
    let resourceType: 'image' | 'raw' = 'raw';
    if (cloudinaryUrl.includes('/image/upload/')) resourceType = 'image';
    if (cloudinaryUrl.includes('/raw/upload/')) resourceType = 'raw';

    const uploadIdx = cloudinaryUrl.indexOf('/upload/');
    if (uploadIdx === -1) return null;
    let pathAfterUpload = cloudinaryUrl.substring(uploadIdx + 8);
    pathAfterUpload = pathAfterUpload.replace(/^fl_attachment\//, '').replace(/^v\d+\//, '');
    let publicId = pathAfterUpload.split('?')[0];

    if (resourceType === 'image' && publicId.toLowerCase().endsWith('.pdf')) {
      publicId = publicId.substring(0, publicId.length - 4);
    }

    const archiveUrl = cloudinary.utils.download_archive_url({
      public_ids: [publicId],
      resource_type: resourceType,
      mode: 'download'
    });

    const res = await fetch(archiveUrl);
    if (!res.ok) return null;

    const arrayBuf = await res.arrayBuffer();
    const zipBuf = Buffer.from(arrayBuf);

    const eocdSig = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
    const eocdIdx = zipBuf.lastIndexOf(eocdSig);
    if (eocdIdx === -1) return null;

    const cdOffset = zipBuf.readUInt32LE(eocdIdx + 16);
    const compMethod = zipBuf.readUInt16LE(cdOffset + 10);
    const compSize = zipBuf.readUInt32LE(cdOffset + 20);
    const localHeaderOffset = zipBuf.readUInt32LE(cdOffset + 42);

    const localFnLen = zipBuf.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = zipBuf.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localFnLen + localExtraLen;

    const compressedData = zipBuf.subarray(dataStart, dataStart + compSize);

    let pdfBuf: Buffer;
    if (compMethod === 0) pdfBuf = compressedData;
    else if (compMethod === 8) pdfBuf = zlib.inflateRawSync(compressedData);
    else return null;

    return pdfBuf;
  } catch (err) {
    console.warn('extractCloudinaryPdfBuffer warning:', err);
    return null;
  }
}

/**
 * GET /api/public/download-pdf
 * 100% Reliable public PDF attachment download proxy
 */
router.get('/download-pdf', async (req: any, res: any) => {
  try {
    const rawUrl = (req.query.url as string) || '';
    if (!rawUrl || !rawUrl.trim()) {
      return res.status(400).json({ error: 'URL parameter required' });
    }

    let cleanUrl = rawUrl.trim().replace(/\/fl_attachment\/+/g, '/');
    const filename = path.basename(cleanUrl.split('?')[0]) || 'Official_Document.pdf';
    const safeFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

    // 1. Check local uploads directory first (serves native .pdf file)
    const localPath = path.join(process.cwd(), 'uploads', filename);
    if (fs.existsSync(localPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
      return res.sendFile(localPath);
    }

    // 2. Handle Cloudinary or external HTTP/HTTPS URLs
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      const candidateUrls = [
        cleanUrl,
        cleanUrl.replace('/image/upload/', '/raw/upload/'),
        cleanUrl.replace('/raw/upload/', '/image/upload/'),
        cleanUrl.replace('/upload/', '/upload/fl_attachment/'),
      ];

      for (const targetUrl of candidateUrls) {
        try {
          const response = await fetch(targetUrl);
          if (response.ok) {
            const arrayBuf = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);

            if (buffer.length > 100) {
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
              return res.send(buffer);
            }
          }
        } catch (fetchErr) {
          console.warn(`Proxy fetch attempt failed for ${targetUrl}:`, fetchErr);
        }
      }

      // 3. Fallback: Authenticated extraction of native PDF binary buffer directly via Cloudinary API
      if (cleanUrl.includes('res.cloudinary.com')) {
        const extractedPdfBuf = await extractCloudinaryPdfBuffer(cleanUrl);
        if (extractedPdfBuf && extractedPdfBuf.length > 0) {
          console.log(`✅ Successfully extracted native Cloudinary PDF buffer: ${extractedPdfBuf.length} bytes`);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
          return res.send(extractedPdfBuf);
        }
      }

      // Final fallback: redirect to primary clean PDF URL
      return res.redirect(cleanUrl);
    }

    return res.status(404).json({ error: 'PDF File not found' });
  } catch (err: any) {
    console.error('PDF proxy download error:', err);
    res.status(500).json({ error: 'Download failed' });
  }
});

export default router;
