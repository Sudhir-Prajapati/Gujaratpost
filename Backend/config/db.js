const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gujarat_post_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection immediately and ensure schema is up-to-date
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully.');
    
    // Check if is_blocked column exists in users table, add if missing
    const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'is_blocked'");
    if (columns.length === 0) {
      await connection.query("ALTER TABLE users ADD COLUMN is_blocked TINYINT(1) DEFAULT 0 AFTER role_id");
      console.log("Database schema updated: Added 'is_blocked' column to 'users' table.");
    }

    // Check if categories table exists, if not create and seed it
    const [tables] = await connection.query("SHOW TABLES LIKE 'categories'");
    if (tables.length === 0) {
      const createCategoriesTable = `
        CREATE TABLE categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          slug VARCHAR(100) NOT NULL UNIQUE,
          description VARCHAR(255) NULL,
          is_location TINYINT(1) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await connection.query(createCategoriesTable);
      console.log("Database schema updated: Created 'categories' table.");
      
      console.log("Seeding default categories...");
      const defaultCategories = [
        ['Politics', 'politics', 'National and International Politics'],
        ['Business', 'business', 'Financial and business news'],
        ['Sports', 'sports', 'Cricket, Football and other sports updates'],
        ['Entertainment', 'entertainment', 'Movies, music and celebrity updates'],
        ['Technology', 'technology', 'Gadgets, software and internet trends'],
        ['Education', 'education', 'Schools, universities and exams']
      ];
      for (const [name, slug, desc] of defaultCategories) {
        await connection.query(
          "INSERT INTO categories (name, slug, description, is_location) VALUES (?, ?, ?, 0)",
          [name, slug, desc]
        );
      }
      console.log("Default categories seeded successfully.");
    } else {
      // Dynamic patch: check if is_location column exists, if not add it
      const [catCols] = await connection.query("SHOW COLUMNS FROM categories LIKE 'is_location'");
      if (catCols.length === 0) {
        await connection.query("ALTER TABLE categories ADD COLUMN is_location TINYINT(1) DEFAULT 0 AFTER description");
        console.log("Database schema updated: Added 'is_location' column to 'categories' table.");
        // Set default dynamic locations for legacy cities
        await connection.query("UPDATE categories SET is_location = 1 WHERE slug IN ('ahmedabad', 'surat', 'rajkot', 'vadodara', 'bhavnagar')");
      }
    }

    // Check if tags table exists, if not create and seed it
    const [tagTables] = await connection.query("SHOW TABLES LIKE 'tags'");
    if (tagTables.length === 0) {
      const createTagsTable = `
        CREATE TABLE tags (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          slug VARCHAR(100) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await connection.query(createTagsTable);
      console.log("Database schema updated: Created 'tags' table.");
      
      console.log("Seeding default tags...");
      const defaultTags = [
        ['Breaking News', 'breaking-news'],
        ['Trending', 'trending'],
        ['Exclusive', 'exclusive']
      ];
      for (const [name, slug] of defaultTags) {
        await connection.query(
          "INSERT INTO tags (name, slug) VALUES (?, ?)",
          [name, slug]
        );
      }
      console.log("Default tags seeded successfully.");
    }
    // Check if media table exists, if not create it
    const [mediaTables] = await connection.query("SHOW TABLES LIKE 'media'");
    if (mediaTables.length === 0) {
      const createMediaTable = `
        CREATE TABLE media (
          id INT AUTO_INCREMENT PRIMARY KEY,
          filename VARCHAR(255) NOT NULL,
          filepath VARCHAR(255) NOT NULL,
          filetype VARCHAR(50) NOT NULL,
          mime_type VARCHAR(100) NOT NULL,
          size INT NOT NULL,
          user_id INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await connection.query(createMediaTable);
      console.log("Database schema updated: Created 'media' table.");
    }

    // Check if articles table exists, if not create it
    const [articleTables] = await connection.query("SHOW TABLES LIKE 'articles'");
    if (articleTables.length === 0) {
      const createArticlesTable = `
        CREATE TABLE articles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          content TEXT NOT NULL,
          excerpt TEXT NULL,
          featured_image_id INT NULL,
          author_id INT NULL,
          category_id INT NULL,
          status ENUM('draft', 'pending', 'approved', 'rejected', 'published') DEFAULT 'draft',
          rejection_reason VARCHAR(255) NULL,
          is_breaking TINYINT(1) DEFAULT 0,
          is_featured TINYINT(1) DEFAULT 0,
          is_fact_check TINYINT(1) DEFAULT 0,
          scheduled_publish_at TIMESTAMP NULL,
          published_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (featured_image_id) REFERENCES media (id) ON DELETE SET NULL,
          FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL,
          FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await connection.query(createArticlesTable);
      console.log("Database schema updated: Created 'articles' table.");
    } else {
      // Dynamic patch: check if rejection_reason exists, if not add it
      const [artCols] = await connection.query("SHOW COLUMNS FROM articles LIKE 'rejection_reason'");
      if (artCols.length === 0) {
        await connection.query("ALTER TABLE articles ADD COLUMN rejection_reason VARCHAR(255) NULL AFTER status");
        console.log("Database schema updated: Added 'rejection_reason' column to 'articles' table.");
      }
    }

    // Check if article_tags table exists, if not create it
    const [articleTagTables] = await connection.query("SHOW TABLES LIKE 'article_tags'");
    if (articleTagTables.length === 0) {
      const createArticleTagsTable = `
        CREATE TABLE article_tags (
          article_id INT NOT NULL,
          tag_id INT NOT NULL,
          PRIMARY KEY (article_id, tag_id),
          FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE,
          FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await connection.query(createArticleTagsTable);
      console.log("Database schema updated: Created 'article_tags' table.");
    }

    // Check if albums table exists, if not create it
    const [albumTables] = await connection.query("SHOW TABLES LIKE 'albums'");
    if (albumTables.length === 0) {
      const createAlbumsTable = `
        CREATE TABLE albums (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          description TEXT NULL,
          cover_image_id INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (cover_image_id) REFERENCES media (id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await connection.query(createAlbumsTable);
      console.log("Database schema updated: Created 'albums' table.");
    }

    // Check if album_images table exists, if not create it
    const [albumImageTables] = await connection.query("SHOW TABLES LIKE 'album_images'");
    if (albumImageTables.length === 0) {
      const createAlbumImagesTable = `
        CREATE TABLE album_images (
          id INT AUTO_INCREMENT PRIMARY KEY,
          album_id INT NOT NULL,
          media_id INT NOT NULL,
          caption VARCHAR(255) NULL,
          sort_order INT DEFAULT 0,
          FOREIGN KEY (album_id) REFERENCES albums (id) ON DELETE CASCADE,
          FOREIGN KEY (media_id) REFERENCES media (id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await connection.query(createAlbumImagesTable);
      console.log("Database schema updated: Created 'album_images' table.");
    }

    // Check if videos table exists, if not create it
    const [videoTables] = await connection.query("SHOW TABLES LIKE 'videos'");
    if (videoTables.length === 0) {
      const createVideosTable = `
        CREATE TABLE videos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          description TEXT NULL,
          video_type ENUM('youtube', 'local') NOT NULL,
          video_url VARCHAR(255) NOT NULL,
          youtube_video_id VARCHAR(50) NULL,
          thumbnail_image_id INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (thumbnail_image_id) REFERENCES media (id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await connection.query(createVideosTable);
      console.log("Database schema updated: Created 'videos' table.");
    }

    // Check if live_updates table exists, if not create it
    const [liveUpdateTables] = await connection.query("SHOW TABLES LIKE 'live_updates'");
    if (liveUpdateTables.length === 0) {
      const createLiveUpdatesTable = `
        CREATE TABLE live_updates (
          id INT AUTO_INCREMENT PRIMARY KEY,
          time_text VARCHAR(50) NOT NULL,
          title TEXT NOT NULL,
          is_alert TINYINT(1) DEFAULT 0,
          youtube_url VARCHAR(255) NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await connection.query(createLiveUpdatesTable);
      console.log("Database schema updated: Created 'live_updates' table.");

      // Seed default live updates to match mockup
      await connection.query("INSERT INTO live_updates (time_text, title, is_alert) VALUES ('10:45 AM', 'South Gujarat Rain Alert', 1)");
      await connection.query("INSERT INTO live_updates (time_text, title, is_alert) VALUES ('12:05 PM', 'India Beats Pakistan Wins by 64 runs.', 0)");
      await connection.query("INSERT INTO live_updates (time_text, title, is_alert) VALUES ('02:50 PM', 'Viraat Ramayan Mandir Development Project.', 0)");
      await connection.query("INSERT INTO live_updates (time_text, title, is_alert) VALUES ('04:00 PM', 'New Industrial Policy Launched by 2026.', 0)");
      console.log("Default live updates seeded successfully.");
    } else {
      // Check if youtube_url column exists in live_updates table, add if missing
      const [liveUpdateCols] = await connection.query("SHOW COLUMNS FROM live_updates LIKE 'youtube_url'");
      if (liveUpdateCols.length === 0) {
        await connection.query("ALTER TABLE live_updates ADD COLUMN youtube_url VARCHAR(255) NULL AFTER is_alert");
        console.log("Database schema updated: Added 'youtube_url' column to 'live_updates' table.");
      }
    }

    // Check if epapers table exists, if not create it
    const [epaperTables] = await connection.query("SHOW TABLES LIKE 'epapers'");
    if (epaperTables.length === 0) {
      const createEpapersTable = `
        CREATE TABLE epapers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          thumbnail_path VARCHAR(255) NOT NULL,
          pdf_path VARCHAR(255) NOT NULL,
          publish_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await connection.query(createEpapersTable);
      console.log("Database schema updated: Created 'epapers' table.");

      // Seed initial epaper
      await connection.query(`
        INSERT INTO epapers (title, thumbnail_path, pdf_path, publish_date) 
        VALUES ('Gujarat News Hub dt. 15.06.2026', '/viraat_ramayan_mandir.png', '/sample_issue.pdf', '2026-06-15')
      `);
      console.log("Default epapers seeded successfully.");
    }

    // Check if settings table exists, if not create and seed it
    const [settingsTables] = await connection.query("SHOW TABLES LIKE 'settings'");
    if (settingsTables.length === 0) {
      const createSettingsTable = `
        CREATE TABLE settings (
          \`key\` VARCHAR(100) PRIMARY KEY,
          \`value\` VARCHAR(255) NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      await connection.query(createSettingsTable);
      console.log("Database schema updated: Created 'settings' table.");

      const defaultSettings = [
        ['sensex_val', '76,721.08'],
        ['sensex_change', '+852.34 (1.07%)'],
        ['sensex_dir', 'up'],
        ['nifty_val', '24,619.85'],
        ['nifty_change', '+252.15 (1.04%)'],
        ['nifty_dir', 'up'],
        ['gold_val', '72,450'],
        ['gold_change', '-220.00 (0.30%)'],
        ['gold_dir', 'down'],
        ['silver_val', '87,400'],
        ['silver_change', '+450.00 (0.52%)'],
        ['silver_dir', 'up'],
        ['crude_val', '6,850'],
        ['crude_change', '-45.00 (0.65%)'],
        ['crude_dir', 'down'],
        ['copper_val', '785'],
        ['copper_change', '+4.20 (0.54%)'],
        ['copper_dir', 'up'],
        ['whatsapp_followers', '125K +'],
        ['metals_api_key', 'YOUR_ACCESS_KEY'],
        ['exchangerate_api_key', '1920eabe2037fe6d1b2d326e85'],
        ['coingecko_api_key', 'CG-NeqobDSamn6JdF38eVSULW3y'],
        ['youtube_channel_url', 'https://www.youtube.com/@GujaratPost'],
        ['trending_label_en', 'Trending'],
        ['trending_label_gu', 'ટ્રેન્ડિંગ']
      ];
      for (const [key, val] of defaultSettings) {
        await connection.query("INSERT INTO settings (\`key\`, \`value\`) VALUES (?, ?)", [key, val]);
      }
      console.log("Default settings seeded successfully.");
    } else {
      // Ensure default settings are present, specifically youtube_channel_url and trending labels
      const [ytSetting] = await connection.query("SELECT * FROM settings WHERE \`key\` = 'youtube_channel_url'");
      if (ytSetting.length === 0) {
        await connection.query("INSERT INTO settings (\`key\`, \`value\`) VALUES ('youtube_channel_url', 'https://www.youtube.com/@GujaratPost')");
        console.log("Database schema updated: Added default 'youtube_channel_url' setting.");
      }
      const [trendEnSetting] = await connection.query("SELECT * FROM settings WHERE \`key\` = 'trending_label_en'");
      if (trendEnSetting.length === 0) {
        await connection.query("INSERT INTO settings (\`key\`, \`value\`) VALUES ('trending_label_en', 'Trending')");
        console.log("Database schema updated: Added default 'trending_label_en' setting.");
      }
      const [trendGuSetting] = await connection.query("SELECT * FROM settings WHERE \`key\` = 'trending_label_gu'");
      if (trendGuSetting.length === 0) {
        await connection.query("INSERT INTO settings (\`key\`, \`value\`) VALUES ('trending_label_gu', 'ટ્રેન્ડિંગ')");
        console.log("Database schema updated: Added default 'trending_label_gu' setting.");
      }
    }

    // Seed default super_admin user if not exists
    const [roles] = await connection.query("SELECT id FROM roles WHERE name = 'super_admin'");
    let superAdminRoleId = null;
    if (roles.length > 0) {
      superAdminRoleId = roles[0].id;
      const [users] = await connection.query("SELECT id FROM users WHERE email = 'admin@gujaratpost.com'");
      if (users.length === 0) {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await connection.query(
          "INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, ?)",
          ['admin', 'admin@gujaratpost.com', hashedPassword, superAdminRoleId]
        );
        console.log("Default super_admin user (admin@gujaratpost.com / admin123) seeded successfully.");
      }
    }

    // Seed users for all other roles if they do not exist
    const usersToSeed = [
      { username: 'superadmin', email: 'superadmin@gujaratpost.com', password: 'superadmin123', roleName: 'super_admin' },
      { username: 'editor', email: 'editor@gujaratpost.com', password: 'editor123', roleName: 'editor' },
      { username: 'reporter', email: 'reporter@gujaratpost.com', password: 'reporter123', roleName: 'reporter' },
      { username: 'seo', email: 'seo@gujaratpost.com', password: 'seo123', roleName: 'seo' },
      { username: 'advertisement', email: 'adv@gujaratpost.com', password: 'adv123', roleName: 'advertisement' },
      { username: 'photographer', email: 'photo@gujaratpost.com', password: 'photo123', roleName: 'photographer' },
      { username: 'user', email: 'user@gujaratpost.com', password: 'user123', roleName: 'user' }
    ];

    for (const u of usersToSeed) {
      const [rRows] = await connection.query("SELECT id FROM roles WHERE name = ?", [u.roleName]);
      if (rRows.length > 0) {
        const roleId = rRows[0].id;
        const [existing] = await connection.query("SELECT id FROM users WHERE email = ?", [u.email]);
        if (existing.length === 0) {
          const bcrypt = require('bcrypt');
          const hashedPassword = await bcrypt.hash(u.password, 10);
          await connection.query(
            "INSERT INTO users (username, email, password, role_id) VALUES (?, ?, ?, ?)",
            [u.username, u.email, hashedPassword, roleId]
          );
          console.log(`Seeded role user: ${u.username} (${u.email})`);
        }
      }
    }

    // Seed categories that might be missing
    const categoriesToEnsure = [
      ['Religion', 'religion', 'Religious and spiritual updates'],
      ['Rain Alert', 'rain-alert', 'Rain and weather advisories'],
      ['Big News', 'big-news', 'Breaking major headlines'],
      ['India', 'india', 'National news'],
      ['Gujarat', 'gujarat', 'State level news'],
      ['Ahmedabad', 'ahmedabad', 'Ahmedabad local news'],
      ['Surat', 'surat', 'Surat local news'],
      ['Rajkot', 'rajkot', 'Rajkot local news'],
      ['Vadodara', 'vadodara', 'Vadodara local news'],
      ['Bhavnagar', 'bhavnagar', 'Bhavnagar local news']
    ];
    for (const [name, slug, desc] of categoriesToEnsure) {
      const [existing] = await connection.query("SELECT id FROM categories WHERE slug = ?", [slug]);
      if (existing.length === 0) {
        const isLoc = ['ahmedabad', 'surat', 'rajkot', 'vadodara', 'bhavnagar'].includes(slug) ? 1 : 0;
        await connection.query("INSERT INTO categories (name, slug, description, is_location) VALUES (?, ?, ?, ?)", [name, slug, desc, isLoc]);
        console.log(`Ensured category seeded: ${name}`);
      }
    }

    console.log("Checking and seeding default mock media and articles...");
    // Let's find author id (admin user)
    const [adminUsers] = await connection.query("SELECT id FROM users WHERE email = 'admin@gujaratpost.com'");
    const authorId = adminUsers.length > 0 ? adminUsers[0].id : null;

    // Seed mock media library images if they don't exist
    const mediaList = [
      ['viraat_ramayan_mandir.png', '/viraat_ramayan_mandir.png'],
      ['cricket_stadium.png', '/cricket_stadium.png'],
      ['south_gujarat_rain.png', '/south_gujarat_rain.png'],
      ['industrial_policy.png', '/industrial_policy.png']
    ];
    const mediaIds = {};
    for (const [filename, filepath] of mediaList) {
      const [existingMedia] = await connection.query("SELECT id FROM media WHERE filename = ? LIMIT 1", [filename]);
      if (existingMedia.length > 0) {
        mediaIds[filename] = existingMedia[0].id;
      } else {
        const [res] = await connection.query(
          "INSERT INTO media (filename, filepath, filetype, mime_type, size, user_id) VALUES (?, ?, ?, ?, ?, ?)",
          [filename, filepath, 'image', 'image/png', 1024, authorId]
        );
        mediaIds[filename] = res.insertId;
        console.log(`Seeded default media: ${filename}`);
      }
    }

    // Seed Featured articles if they don't exist
    const articlesToSeed = [
      {
        title: 'Viraat Ramayan Mandir Devlopment Project.',
        slug: 'viraat-ramayan-mandir-devlopment-project',
        content: 'Ram-Gita Mandir, Temple, Pilgrimage Corridor, Taj-Shrines / Temples. Tourism & Visitor Infrastructure, Museum & Cultural Halls (Planned)...',
        excerpt: 'Ram-Gita Mandir, Temple, Pilgrimage Corridor, Taj-Shrines / Temples. Tourism & Visitor Infrastructure, Museum & Cultural Halls (Planned)...',
        featured_image_name: 'viraat_ramayan_mandir.png',
        category_slug: 'religion',
        is_featured: 1,
        is_breaking: 0,
        is_fact_check: 0
      },
      {
        title: 'INDIA BEATS PAKISTAN BY 64 RUNS!',
        slug: 'india-beats-pakistan-by-64-runs',
        content: 'Team India posts 141/7 and restricts Pakistan to 77 runs. Superb match performance by Deepti Sharma (Player of the Match, 5 wickets).',
        excerpt: 'Team India posts 141/7 and restricts Pakistan to 77 runs. Superb match performance by Deepti Sharma (Player of the Match, 5 wickets).',
        featured_image_name: 'cricket_stadium.png',
        category_slug: 'sports',
        is_featured: 1,
        is_breaking: 0,
        is_fact_check: 0
      },
      {
        title: 'SOUTH GUJARAT RAIN ALERT',
        slug: 'south-gujarat-rain-alert',
        content: 'Heavy Rain & Thunderstorm Expected in Surat, Navsari, Valsad, Dang, Tapi. Disaster response teams put on high alert.',
        excerpt: 'Heavy Rain & Thunderstorm Expected in Surat, Navsari, Valsad, Dang, Tapi. Disaster response teams put on high alert.',
        featured_image_name: 'south_gujarat_rain.png',
        category_slug: 'rain-alert',
        is_featured: 1,
        is_breaking: 1,
        is_fact_check: 0
      },
      {
        title: 'NEW INDUSTRIAL POLICY 2026 LAUNCHED',
        slug: 'new-industrial-policy-2026-launched',
        content: 'A new era of growth & investment in Gujarat. The government focuses on technology integration, employment, and green energy.',
        excerpt: 'A new era of growth & investment in Gujarat. The government focuses on technology integration, employment, and green energy.',
        featured_image_name: 'industrial_policy.png',
        category_slug: 'big-news',
        is_featured: 1,
        is_breaking: 1,
        is_fact_check: 0
      }
    ];

    for (const art of articlesToSeed) {
      const [existing] = await connection.query("SELECT id FROM articles WHERE slug = ? LIMIT 1", [art.slug]);
      if (existing.length === 0) {
        const [catRows] = await connection.query("SELECT id FROM categories WHERE slug = ?", [art.category_slug]);
        const categoryId = catRows.length > 0 ? catRows[0].id : null;
        const featuredImageId = mediaIds[art.featured_image_name];

        await connection.query(
          `INSERT INTO articles (title, slug, content, excerpt, featured_image_id, author_id, category_id, status, is_breaking, is_featured, is_fact_check, published_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, NOW())`,
          [art.title, art.slug, art.content, art.excerpt, featuredImageId, authorId, categoryId, art.is_breaking, art.is_featured, art.is_fact_check]
        );
        console.log(`Seeded default article: ${art.title}`);
      }
    }

    // Also seed some City News articles for the active tabs if they don't exist
    const cityNewsToSeed = [
      {
        title: 'Waterlogging in Several Areas of Ahmedabad',
        slug: 'waterlogging-in-several-areas-of-ahmedabad',
        content: 'Subway closed and traffic crawls after continuous downpour in multiple zones of the city.',
        category_slug: 'ahmedabad',
        featured_image_name: 'south_gujarat_rain.png'
      },
      {
        title: 'Tapi River Water Level Rises After Heavy Rain',
        slug: 'tapi-river-water-level-rises-after-heavy-rain',
        content: 'Adajan and other low-lying areas monitored closely. Ukai dam inflow records sharp increase.',
        category_slug: 'surat',
        featured_image_name: 'south_gujarat_rain.png'
      },
      {
        title: 'Rajkot Smart City Infrastructure Progress Inspected',
        slug: 'rajkot-smart-city-infrastructure-progress-inspected',
        content: 'Municipal commissioner reviews ongoing construction of lakefront project and advanced drainage network.',
        category_slug: 'rajkot',
        featured_image_name: 'industrial_policy.png'
      }
    ];

    for (const art of cityNewsToSeed) {
      const [existing] = await connection.query("SELECT id FROM articles WHERE slug = ? LIMIT 1", [art.slug]);
      if (existing.length === 0) {
        const [catRows] = await connection.query("SELECT id FROM categories WHERE slug = ?", [art.category_slug]);
        const categoryId = catRows.length > 0 ? catRows[0].id : null;
        const featuredImageId = mediaIds[art.featured_image_name];

        await connection.query(
          `INSERT INTO articles (title, slug, content, excerpt, featured_image_id, author_id, category_id, status, is_breaking, is_featured, is_fact_check, published_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 0, 0, 0, NOW())`,
          [art.title, art.slug, art.content, art.content, featuredImageId, authorId, categoryId]
        );
        console.log(`Seeded default city article: ${art.title}`);
      }
    }

    console.log("Seeding completed successfully.");
    
    connection.release();
  } catch (error) {
    console.error('Database connection or auto-migration failed:', error.message);
  }
})();

// Background Scheduler: auto-publish approved articles when scheduled time has passed
const checkScheduledArticles = async () => {
  try {
    const query = `
      UPDATE articles 
      SET status = 'published', published_at = NOW(), scheduled_publish_at = NULL 
      WHERE status = 'approved' AND scheduled_publish_at <= NOW()
    `;
    const [result] = await pool.execute(query);
    if (result.affectedRows > 0) {
      console.log(`[Scheduler] Auto-published ${result.affectedRows} scheduled articles.`);
    }
  } catch (err) {
    console.error('[Scheduler] Error auto-publishing scheduled articles:', err.message);
  }
};
// Check every 60 seconds
setInterval(checkScheduledArticles, 60 * 1000);

module.exports = pool;
