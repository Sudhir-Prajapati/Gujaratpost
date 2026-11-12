const mysql = require('mysql2/promise');

async function main() {
  try {
    const conn = await mysql.createConnection('mysql://gujaratpost:gujaratpost2005@127.0.0.1:3306/gujaratpost');
    const [total] = await conn.execute('SELECT COUNT(*) as c FROM gallery_photos');
    const [jsonMulti] = await conn.execute("SELECT COUNT(*) as c FROM gallery_photos WHERE src LIKE '[%'");
    const [cloud] = await conn.execute("SELECT COUNT(*) as c FROM gallery_photos WHERE src LIKE 'https://res.cloudinary.com%'");
    const [uploads] = await conn.execute("SELECT COUNT(*) as c FROM gallery_photos WHERE src LIKE '/uploads/%'");
    const [corrupt] = await conn.execute("SELECT COUNT(*) as c FROM gallery_photos WHERE src LIKE '%\"%'");
    const [emptyCaption] = await conn.execute("SELECT COUNT(*) as c FROM gallery_photos WHERE caption = '' OR caption = 'ગેલેરી ફોટો'");

    console.log({
      total: total[0].c,
      jsonMulti: jsonMulti[0].c,
      cloud: cloud[0].c,
      uploads: uploads[0].c,
      corrupt: corrupt[0].c,
      emptyCaption: emptyCaption[0].c
    });

    const [sampleMulti] = await conn.execute("SELECT id, alt, src FROM gallery_photos WHERE src LIKE '[%' LIMIT 2");
    if (sampleMulti.length > 0) {
      console.log('Sample Multi Image JSON:');
      console.log(sampleMulti[0].src.substring(0, 300));
    }

    await conn.end();
  } catch (e) {
    console.error(e);
  }
}

main();
