const fs = require('fs');
const readline = require('readline');

const DUMP_PATH = 'c:\\Users\\Admin\\OneDrive\\Desktop\\Gujarat-Post\\gujaratpost_newsgujrati_23OCT2026.sql.gz';
const TARGET_IDS = new Set([33999, 34000, 34001, 34002, 34003, 34004, 34005]);

async function extractArticles() {
  const rl = readline.createInterface({
    input: fs.createReadStream(DUMP_PATH, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });

  const extracted = [];

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO `news` VALUES')) {
      extractTuples(line, TARGET_IDS, extracted);
    }
  }

  console.log(`Successfully extracted ${extracted.length} articles.`);
  fs.writeFileSync('new_articles_diff.json', JSON.stringify(extracted, null, 2), 'utf8');

  // Also generate clean SQL for legacy news table
  let legacySql = '-- New records from gujaratpost_newsgujrati_23OCT2026.sql.gz not present in previous database\n';
  legacySql += 'INSERT INTO `news` VALUES \n';
  legacySql += extracted.map(e => `(${e.rawTuple})`).join(',\n') + ';\n';
  fs.writeFileSync('new_data_legacy_news.sql', legacySql, 'utf8');

  console.log('Saved new_articles_diff.json and new_data_legacy_news.sql');
}

function extractTuples(line, targetIds, extracted) {
  let i = line.indexOf('VALUES ') + 7;
  const len = line.length;

  while (i < len) {
    if (line[i] === '(') {
      const tupleStart = i;
      i++;
      let inString = false;
      let quoteChar = '';
      let escape = false;

      while (i < len) {
        const c = line[i];
        if (escape) {
          escape = false;
        } else if (c === '\\') {
          escape = true;
        } else if (inString) {
          if (c === quoteChar) {
            inString = false;
          }
        } else {
          if (c === "'" || c === '"') {
            inString = true;
            quoteChar = c;
          } else if (c === ')') {
            const tupleStr = line.substring(tupleStart + 1, i);
            checkAndParseTuple(tupleStr, targetIds, extracted);
            i++;
            break;
          }
        }
        i++;
      }
    } else {
      i++;
    }
  }
}

function checkAndParseTuple(tupleStr, targetIds, extracted) {
  let idStr = '';
  for (let j = 0; j < tupleStr.length; j++) {
    if (tupleStr[j] === ',') {
      idStr = tupleStr.substring(0, j).trim();
      break;
    }
  }
  const newsId = parseInt(idStr, 10);
  if (targetIds.has(newsId)) {
    // Parse all fields
    const fields = parseCsvTuple(tupleStr);
    extracted.push({
      newsId,
      newsOrd: fields[1],
      newsParentId: fields[2],
      newsName: fields[3],
      newsTitle: unescapeSql(fields[4]),
      newsSlug: unescapeSql(fields[5]),
      newsVideo: unescapeSql(fields[6]),
      newsVideoYoutube: unescapeSql(fields[7]),
      newsImage: unescapeSql(fields[8]),
      newsImage1: unescapeSql(fields[9]),
      newsImage2: unescapeSql(fields[10]),
      newsCategory: unescapeSql(fields[11]),
      newsCategory0: fields[12],
      newsCategory1: fields[13],
      newsCategory2: fields[14],
      newsSummary: unescapeSql(fields[15]),
      newsContent: unescapeSql(fields[16]),
      newsCreatedDate: unescapeSql(fields[33]),
      newsModifyDate: unescapeSql(fields[34]),
      newsStatus: fields[35],
      newsSeoTitle: unescapeSql(fields[30]),
      newsSeoDescription: unescapeSql(fields[31]),
      newsSeoKeywords: unescapeSql(fields[32]),
      rawTuple: tupleStr
    });
  }
}

function parseCsvTuple(str) {
  const fields = [];
  let curr = '';
  let inString = false;
  let quoteChar = '';
  let escape = false;

  for (let j = 0; j < str.length; j++) {
    const c = str[j];
    if (escape) {
      curr += c;
      escape = false;
    } else if (c === '\\') {
      curr += c;
      escape = true;
    } else if (inString) {
      if (c === quoteChar) {
        inString = false;
      } else {
        curr += c;
      }
    } else {
      if (c === "'" || c === '"') {
        inString = true;
        quoteChar = c;
      } else if (c === ',') {
        fields.push(curr);
        curr = '';
      } else {
        curr += c;
      }
    }
  }
  fields.push(curr);
  return fields;
}

function unescapeSql(val) {
  if (!val) return '';
  let s = val.trim();
  if (s.startsWith("'") && s.endsWith("'")) {
    s = s.substring(1, s.length - 1);
  }
  return s
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
    .replace(/\\\\/g, '\\');
}

extractArticles().catch(console.error);
