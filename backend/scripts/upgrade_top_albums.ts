import * as dotenv from 'dotenv';
dotenv.config({ path: 'c:/Users/Admin/OneDrive/Desktop/Gujarat-Post/Gujaratpost/backend/.env' });

import { v2 as cloudinary } from 'cloudinary';
import mysql from 'mysql2/promise';
import * as fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function upgradeKnownAlbums() {
  const conn = await mysql.createConnection('mysql://gujaratpost:gujaratpost2005@127.0.0.1:3306/gujaratpost');

  // 1. Rakul Preet album (531dd7eb-98de-4600-a085-f6f68ae822f8)
  try {
    console.log('Upgrading Rakul Preet album (531dd7eb-98de-4600-a085-f6f68ae822f8)...');
    const [rRows]: any = await conn.execute('SELECT * FROM gallery_photos WHERE id = ?', ['531dd7eb-98de-4600-a085-f6f68ae822f8']);
    if (rRows.length > 0) {
      const cp = rRows[0];
      const rakulLocal = [
        'C:/Users/Admin/Downloads/www/gujaratpost.co.in/Backup2022/oldImages/gallery/rakul-1.jpg',
        'C:/Users/Admin/Downloads/www/gujaratpost.co.in/Backup2022/oldImages/gallery/rakul-2.jpg',
        'C:/Users/Admin/Downloads/www/gujaratpost.co.in/Backup2022/oldImages/gallery/rakul-3.jpg'
      ];
      const images = [
        {
          src: cp.src.startsWith('[') ? JSON.parse(cp.src)[0].src : cp.src,
          title: cp.captionGu,
          caption: cp.caption,
          captionGu: cp.captionGu,
          description: cp.caption,
          photographer: cp.photographer
        }
      ];

      let sIdx = 1;
      for (const f of rakulLocal) {
        if (!fs.existsSync(f)) continue;
        const pubId = `gallery_${cp.id}_slide_${sIdx}`;
        const res = await cloudinary.uploader.upload(f, {
          folder: 'gujarat-post/gallery',
          public_id: pubId,
          overwrite: true,
          transformation: [{ quality: 'auto', fetch_format: 'auto' }]
        });
        images.push({
          src: res.secure_url,
          title: cp.captionGu,
          caption: cp.caption,
          captionGu: cp.captionGu,
          description: cp.caption,
          photographer: cp.photographer
        });
        sIdx++;
      }

      await conn.execute('UPDATE gallery_photos SET src = ?, updatedAt = NOW() WHERE id = ?', [JSON.stringify(images), cp.id]);
      console.log(`✅ Rakul Preet album updated with ${images.length} photos!`);
    }
  } catch (err: any) {
    console.error('Error on Rakul Preet:', err.message);
  }

  // 2. Sunny Leone album (3ef8ca1e-4eb6-4c7e-a792-b8678ce4d232)
  try {
    console.log('Upgrading Sunny Leone album (3ef8ca1e-4eb6-4c7e-a792-b8678ce4d232)...');
    const [sRows]: any = await conn.execute('SELECT * FROM gallery_photos WHERE id = ?', ['3ef8ca1e-4eb6-4c7e-a792-b8678ce4d232']);
    if (sRows.length > 0) {
      const cp = sRows[0];
      const sunnyLocal = [
        'C:/Users/Admin/Downloads/www/gujaratpost.co.in/Backup2022/oldImages/gallery/sunny-leone-193a.jpg',
        'C:/Users/Admin/Downloads/www/gujaratpost.co.in/Backup2022/oldImages/gallery/sunny-leone-193b.jpg',
        'C:/Users/Admin/Downloads/www/gujaratpost.co.in/Backup2022/oldImages/gallery/sunny-leone-193d.jpg'
      ];
      const images = [
        {
          src: cp.src.startsWith('[') ? JSON.parse(cp.src)[0].src : cp.src,
          title: cp.captionGu,
          caption: cp.caption,
          captionGu: cp.captionGu,
          description: cp.caption,
          photographer: cp.photographer
        }
      ];

      let sIdx = 1;
      for (const f of sunnyLocal) {
        if (!fs.existsSync(f)) continue;
        const pubId = `gallery_${cp.id}_slide_${sIdx}`;
        const res = await cloudinary.uploader.upload(f, {
          folder: 'gujarat-post/gallery',
          public_id: pubId,
          overwrite: true,
          transformation: [{ quality: 'auto', fetch_format: 'auto' }]
        });
        images.push({
          src: res.secure_url,
          title: cp.captionGu,
          caption: cp.caption,
          captionGu: cp.captionGu,
          description: cp.caption,
          photographer: cp.photographer
        });
        sIdx++;
      }

      await conn.execute('UPDATE gallery_photos SET src = ?, updatedAt = NOW() WHERE id = ?', [JSON.stringify(images), cp.id]);
      console.log(`✅ Sunny Leone album updated with ${images.length} photos!`);
    }
  } catch (err: any) {
    console.error('Error on Sunny Leone:', err.message);
  }

  // 3. Disha Patani (eedcbb5b-d9ed-4df0-b70e-6778663f77bc)
  try {
    console.log('Upgrading Disha Patani album (eedcbb5b-d9ed-4df0-b70e-6778663f77bc)...');
    const [dRows]: any = await conn.execute('SELECT * FROM gallery_photos WHERE id = ?', ['eedcbb5b-d9ed-4df0-b70e-6778663f77bc']);
    if (dRows.length > 0) {
      const cp = dRows[0];
      const localFile = 'C:/Users/Admin/Downloads/www/gujaratpost.co.in/Backup2022/oldImages/news/766.jpg';
      if (fs.existsSync(localFile)) {
        const images = [
          {
            src: cp.src.startsWith('[') ? JSON.parse(cp.src)[0].src : cp.src,
            title: cp.captionGu,
            caption: cp.caption,
            captionGu: cp.captionGu,
            description: cp.caption,
            photographer: cp.photographer
          }
        ];
        const pubId = `gallery_${cp.id}_slide_1`;
        const res = await cloudinary.uploader.upload(localFile, {
          folder: 'gujarat-post/gallery',
          public_id: pubId,
          overwrite: true,
          transformation: [{ quality: 'auto', fetch_format: 'auto' }]
        });
        images.push({
          src: res.secure_url,
          title: cp.captionGu,
          caption: cp.caption,
          captionGu: cp.captionGu,
          description: cp.caption,
          photographer: cp.photographer
        });
        await conn.execute('UPDATE gallery_photos SET src = ?, updatedAt = NOW() WHERE id = ?', [JSON.stringify(images), cp.id]);
        console.log(`✅ Disha Patani album updated with ${images.length} photos!`);
      }
    }
  } catch (err: any) {
    console.error('Error on Disha Patani:', err.message);
  }

  await conn.end();
}

upgradeKnownAlbums().catch(console.error);
