const mysql = require('mysql2/promise');
require('dotenv').config();

const initDatabase = async () => {
  try {
    // 1. Connect without database name first to ensure database can be created
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('Connected to MySQL server.');

    // 2. Create database
    const dbName = process.env.DB_NAME || 'gujarat_post_db';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database "${dbName}" checked/created successfully.`);

    // 3. Select database
    await connection.query(`USE \`${dbName}\``);

    // 4. Drop existing tables in reverse order of dependencies (fresh setup)
    console.log('Cleaning up existing tables for fresh schema setup...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('DROP TABLE IF EXISTS album_images');
    await connection.query('DROP TABLE IF EXISTS albums');
    await connection.query('DROP TABLE IF EXISTS videos');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('DROP TABLE IF EXISTS role_permissions');
    await connection.query('DROP TABLE IF EXISTS permissions');
    await connection.query('DROP TABLE IF EXISTS roles');
    await connection.query('DROP TABLE IF EXISTS categories');
    await connection.query('DROP TABLE IF EXISTS tags');
    await connection.query('DROP TABLE IF EXISTS media');
    await connection.query('DROP TABLE IF EXISTS article_tags');
    await connection.query('DROP TABLE IF EXISTS articles');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Cleanup completed.');

    // 5. Create roles table
    const createRolesTable = `
      CREATE TABLE roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(createRolesTable);
    console.log('Table "roles" created successfully.');

    // 6. Create permissions table
    const createPermissionsTable = `
      CREATE TABLE permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(createPermissionsTable);
    console.log('Table "permissions" created successfully.');

    // 7. Create role_permissions junction table
    const createRolePermissionsTable = `
      CREATE TABLE role_permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(createRolePermissionsTable);
    console.log('Table "role_permissions" created successfully.');

    // 8. Create users table
    const createUsersTable = `
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role_id INT,
        is_blocked TINYINT(1) DEFAULT 0,
        refresh_token VARCHAR(255) NULL,
        reset_token VARCHAR(255) NULL,
        reset_token_expires TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(createUsersTable);
    console.log('Table "users" created successfully.');

    // 8.5 Create categories table
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
    console.log('Table "categories" created successfully.');

    // 8.6 Create tags table
    const createTagsTable = `
      CREATE TABLE tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await connection.query(createTagsTable);
    console.log('Table "tags" created successfully.');

    // 8.7 Create media table
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
    console.log('Table "media" created successfully.');

    // 8.8 Create articles table
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
    console.log('Table "articles" created successfully.');

    // 8.9 Create article_tags junction table
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
    console.log('Table "article_tags" created successfully.');

    // 8.10 Create albums table
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
    console.log('Table "albums" created successfully.');

    // 8.11 Create album_images table
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
    console.log('Table "album_images" created successfully.');

    // 8.12 Create videos table
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
    console.log('Table "videos" created successfully.');

    // 9. Seed Roles
    console.log('Seeding roles...');
    const rolesToSeed = [
      ['super_admin', 'Super Administrator with full permissions'],
      ['editor', 'Editor with post management and publishing permissions'],
      ['reporter', 'Reporter with post writing permissions'],
      ['seo', 'SEO Manager with search engine optimization permissions'],
      ['advertisement', 'Ad Manager with advertisement permissions'],
      ['photographer', 'Photographer with image library permissions'],
      ['user', 'Regular reader or subscriber']
    ];
    const roleIds = {};
    for (const [name, desc] of rolesToSeed) {
      const [res] = await connection.query(
        'INSERT INTO roles (name, description) VALUES (?, ?)',
        [name, desc]
      );
      roleIds[name] = res.insertId;
    }
    console.log('Roles seeded successfully.');

    // 10. Seed Permissions
    console.log('Seeding permissions...');
    const permissionsToSeed = [
      ['manage_users', 'Perform user operations (create, update, delete roles)'],
      ['publish_post', 'Publish written news articles or posts'],
      ['create_post', 'Create new news articles or posts'],
      ['edit_post', 'Edit existing news articles or posts'],
      ['delete_post', 'Delete news articles or posts'],
      ['optimize_seo', 'Manage search engine optimization details'],
      ['manage_ads', 'Manage advertisements and banner banners'],
      ['upload_photos', 'Upload and manage photo library assets'],
      ['view_posts', 'View list of news articles or posts']
    ];
    const permissionIds = {};
    for (const [name, desc] of permissionsToSeed) {
      const [res] = await connection.query(
        'INSERT INTO permissions (name, description) VALUES (?, ?)',
        [name, desc]
      );
      permissionIds[name] = res.insertId;
    }
    console.log('Permissions seeded successfully.');

    // 11. Assign Permissions to Roles (Seed role_permissions)
    console.log('Assigning permissions to roles...');
    
    // helper to map permissions list to a role
    const mapPermissionsToRole = async (roleName, permissionNames) => {
      const roleId = roleIds[roleName];
      for (const permName of permissionNames) {
        const permId = permissionIds[permName];
        if (roleId && permId) {
          await connection.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
            [roleId, permId]
          );
        }
      }
    };

    // Super Admin gets all permissions
    await mapPermissionsToRole('super_admin', Object.keys(permissionIds));

    // Editor permissions
    await mapPermissionsToRole('editor', [
      'publish_post',
      'create_post',
      'edit_post',
      'delete_post',
      'view_posts'
    ]);

    // Reporter permissions
    await mapPermissionsToRole('reporter', [
      'create_post',
      'edit_post',
      'view_posts'
    ]);

    // SEO permissions
    await mapPermissionsToRole('seo', [
      'edit_post',
      'optimize_seo',
      'view_posts'
    ]);

    // Advertisement permissions
    await mapPermissionsToRole('advertisement', [
      'manage_ads',
      'view_posts'
    ]);

    // Photographer permissions
    await mapPermissionsToRole('photographer', [
      'upload_photos',
      'view_posts'
    ]);

    // User permissions
    await mapPermissionsToRole('user', [
      'view_posts'
    ]);

    console.log('Role permissions assigned successfully.');

    // 12. Seed Categories
    console.log('Seeding categories...');
    const categoriesToSeed = [
      ['Politics', 'politics', 'National and International Politics'],
      ['Business', 'business', 'Financial and business news'],
      ['Sports', 'sports', 'Cricket, Football and other sports updates'],
      ['Entertainment', 'entertainment', 'Movies, music and celebrity updates'],
      ['Technology', 'technology', 'Gadgets, software and internet trends'],
      ['Education', 'education', 'Schools, universities and exams']
    ];
    for (const [name, slug, desc] of categoriesToSeed) {
      await connection.query(
        'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
        [name, slug, desc]
      );
    }
    console.log('Categories seeded successfully.');

    // 13. Seed Tags
    console.log('Seeding tags...');
    const tagsToSeed = [
      ['Breaking News', 'breaking-news'],
      ['Trending', 'trending'],
      ['Exclusive', 'exclusive']
    ];
    for (const [name, slug] of tagsToSeed) {
      await connection.query(
        'INSERT INTO tags (name, slug) VALUES (?, ?)',
        [name, slug]
      );
    }
    console.log('Tags seeded successfully.');

    await connection.end();
    console.log('Database initialization and seeding completed successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  }
};

initDatabase();
