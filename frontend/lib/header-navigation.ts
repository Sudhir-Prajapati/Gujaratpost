export const HIDDEN_NAVBAR_SLUGS = new Set([
  'latest-news',
  'taja-samachar',
  'taza-news',
  'latest',
  'webstory',
  'web-stories',
  'web-story',
  'business',
  'weather',
  'havaman',
  'sports',
  'ramatgamat',
  'ramat-gamat',
  'education',
  'shikshan',
  'varsad',
  'rain',
  'rainfall',
  'breaking-news',
  'mukhya-samachar',
  'mukhya-news',
  'jobs',
  'nokri-karkidi',
  'nokri-ane-karkidi',
  'career',
  'live-center',
  'live',
]);

export const isHiddenFromNavbar = (c: any) => {
  if (!c) return false;
  if (c.showInHeader === false || c.showInHeader === 'false' || c.showInHeader === 0) return true;

  const slug = (c.slug || (c.href ? c.href.replace(/^\/category\//, '').replace(/^\//, '') : '')).toLowerCase().trim();
  if (HIDDEN_NAVBAR_SLUGS.has(slug)) return true;

  const nameGu = (c.nameGu || c.labelGu || '').trim();
  if (
    nameGu === 'તાજા સમાચાર' ||
    nameGu === 'વેબસ્ટોરી' ||
    nameGu === 'બિઝનેસ' ||
    nameGu === 'હવામાન' ||
    nameGu === 'સ્પોર્ટ્સ' ||
    nameGu === 'રમત-જગત' ||
    nameGu === 'શિક્ષણ' ||
    nameGu === 'વરસાદ' ||
    nameGu === 'મુખ્ય સમાચાર' ||
    nameGu === 'નોકરી & કારકિર્દી' ||
    nameGu === 'લાઈવ સેન્ટર'
  ) {
    return true;
  }

  const name = (c.name || c.label || '').toLowerCase().trim();
  if (
    name === 'latest news' ||
    name === 'taza news' ||
    name === 'web stories' ||
    name === 'webstory' ||
    name === 'business' ||
    name === 'weather' ||
    name === 'sports' ||
    name === 'education' ||
    name === 'rainfall' ||
    name === 'rain' ||
    name === 'breaking news' ||
    name === 'jobs' ||
    name === 'live center'
  ) {
    return true;
  }
  return false;
};

