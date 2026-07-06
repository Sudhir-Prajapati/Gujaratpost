const db = require('../config/db');

class ArticleModel {
  /**
   * Helper to retrieve tag objects for an article
   * @param {number} articleId
   * @returns {Promise<Object[]>} Tags associated with article
   */
  static async getTagsByArticleId(articleId) {
    try {
      const query = `
        SELECT t.* 
        FROM tags t
        INNER JOIN article_tags at ON t.id = at.tag_id
        WHERE at.article_id = ?
        ORDER BY t.name ASC
      `;
      const [rows] = await db.execute(query, [articleId]);
      return rows;
    } catch (error) {
      console.error('Error in ArticleModel.getTagsByArticleId:', error.message);
      return [];
    }
  }

  /**
   * Sync junction table for article tags
   * @param {number} articleId
   * @param {number[]} tagIds
   */
  static async syncTags(articleId, tagIds = []) {
    try {
      // 1. Delete existing associations
      await db.execute('DELETE FROM article_tags WHERE article_id = ?', [articleId]);

      // 2. Insert new associations
      if (tagIds.length > 0) {
        // Build values and placeholders dynamically to execute in one statement
        const placeholders = tagIds.map(() => '(?, ?)').join(', ');
        const values = [];
        tagIds.forEach(tagId => {
          values.push(articleId, tagId);
        });

        const query = `INSERT INTO article_tags (article_id, tag_id) VALUES ${placeholders}`;
        await db.execute(query, values);
      }
    } catch (error) {
      console.error('Error in ArticleModel.syncTags:', error.message);
      throw error;
    }
  }

  /**
   * Create a new article
   * @param {Object} articleData
   * @returns {Promise<number>} Inserted article ID
   */
  static async create({
    title,
    slug,
    content,
    excerpt = null,
    featured_image_id = null,
    author_id,
    category_id = null,
    status = 'draft',
    is_breaking = 0,
    is_featured = 0,
    is_fact_check = 0,
    scheduled_publish_at = null,
    published_at = null
  }) {
    try {
      const query = `
        INSERT INTO articles (
          title, slug, content, excerpt, featured_image_id, author_id, category_id,
          status, is_breaking, is_featured, is_fact_check, scheduled_publish_at, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const [result] = await db.execute(query, [
        title, slug, content, excerpt, featured_image_id, author_id, category_id,
        status, is_breaking, is_featured, is_fact_check, scheduled_publish_at, published_at
      ]);
      return result.insertId;
    } catch (error) {
      console.error('Error in ArticleModel.create:', error.message);
      throw error;
    }
  }

  /**
   * Update article details dynamically
   * @param {number|string} id
   * @param {Object} articleData
   * @returns {Promise<boolean>} True if updated
   */
  static async update(id, data) {
    try {
      const fields = [];
      const values = [];

      const keys = [
        'title', 'slug', 'content', 'excerpt', 'featured_image_id', 'category_id',
        'status', 'rejection_reason', 'is_breaking', 'is_featured', 'is_fact_check', 
        'scheduled_publish_at', 'published_at'
      ];

      keys.forEach(key => {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(data[key]);
        }
      });

      if (fields.length === 0) return false;

      values.push(id);
      const query = `UPDATE articles SET ${fields.join(', ')} WHERE id = ?`;
      const [result] = await db.execute(query, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in ArticleModel.update:', error.message);
      throw error;
    }
  }

  /**
   * Delete an article
   * @param {number|string} id
   * @returns {Promise<boolean>} True if deleted
   */
  static async delete(id) {
    try {
      const query = 'DELETE FROM articles WHERE id = ?';
      const [result] = await db.execute(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in ArticleModel.delete:', error.message);
      throw error;
    }
  }

  /**
   * Find article by ID, including joints
   * @param {number|string} id
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    try {
      const query = `
        SELECT a.*, 
               u.username AS author_name, 
               c.name AS category_name, c.slug AS category_slug,
               m.filepath AS featured_image_path
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN media m ON a.featured_image_id = m.id
        WHERE a.id = ? LIMIT 1
      `;
      const [rows] = await db.execute(query, [id]);
      if (rows.length === 0) return null;

      const article = rows[0];
      article.tags = await this.getTagsByArticleId(article.id);
      return article;
    } catch (error) {
      console.error('Error in ArticleModel.findById:', error.message);
      throw error;
    }
  }

  /**
   * Find article by Slug
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  static async findBySlug(slug) {
    try {
      const query = `
        SELECT a.*, 
               u.username AS author_name, 
               c.name AS category_name, c.slug AS category_slug,
               m.filepath AS featured_image_path
        FROM articles a
        LEFT JOIN users u ON a.author_id = u.id
        LEFT JOIN categories c ON a.category_id = c.id
        LEFT JOIN media m ON a.featured_image_id = m.id
        WHERE a.slug = ? LIMIT 1
      `;
      const [rows] = await db.execute(query, [slug]);
      if (rows.length === 0) return null;

      const article = rows[0];
      article.tags = await this.getTagsByArticleId(article.id);
      return article;
    } catch (error) {
      console.error('Error in ArticleModel.findBySlug:', error.message);
      throw error;
    }
  }

  /**
   * Helper to compile query SQL with filters dynamically
   */
  static buildFilterQuery(filters = {}) {
    let selectSql = `
      SELECT DISTINCT a.*, 
             u.username AS author_name, 
             c.name AS category_name, c.slug AS category_slug,
             m.filepath AS featured_image_path
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN media m ON a.featured_image_id = m.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
    `;
    let countSql = `
      SELECT COUNT(DISTINCT a.id) AS total 
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN article_tags at ON a.id = at.article_id
      LEFT JOIN tags t ON at.tag_id = t.id
    `;

    const whereClauses = [];
    const values = [];

    // Filter by status
    if (filters.status) {
      whereClauses.push('a.status = ?');
      values.push(filters.status);
    }

    // Filter by author
    if (filters.author_id) {
      whereClauses.push('a.author_id = ?');
      values.push(filters.author_id);
    }

    // Filter by category slug or ID
    if (filters.category_slug) {
      whereClauses.push('c.slug = ?');
      values.push(filters.category_slug);
    } else if (filters.category_id) {
      whereClauses.push('a.category_id = ?');
      values.push(filters.category_id);
    }

    // Filter by tag slug or ID
    if (filters.tag_slug) {
      whereClauses.push('t.slug = ?');
      values.push(filters.tag_slug);
    } else if (filters.tag_id) {
      whereClauses.push('at.tag_id = ?');
      values.push(filters.tag_id);
    }

    // Filter by breaking/featured/fact-check flags
    if (filters.is_breaking !== undefined) {
      whereClauses.push('a.is_breaking = ?');
      values.push(filters.is_breaking ? 1 : 0);
    }
    if (filters.is_featured !== undefined) {
      whereClauses.push('a.is_featured = ?');
      values.push(filters.is_featured ? 1 : 0);
    }
    if (filters.is_fact_check !== undefined) {
      whereClauses.push('a.is_fact_check = ?');
      values.push(filters.is_fact_check ? 1 : 0);
    }

    // Search query (title or content)
    if (filters.search) {
      whereClauses.push('(a.title LIKE ? OR a.content LIKE ?)');
      const term = `%${filters.search}%`;
      values.push(term, term);
    }

    const whereSection = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
    
    selectSql += whereSection;
    countSql += whereSection;

    // Order by published date (if published) or created date
    selectSql += ' ORDER BY COALESCE(a.published_at, a.created_at) DESC';

    // Pagination limits
    if (filters.limit !== undefined) {
      selectSql += ' LIMIT ?';
      values.push(Number(filters.limit));
      
      if (filters.offset !== undefined) {
        selectSql += ' OFFSET ?';
        values.push(Number(filters.offset));
      }
    }

    return { selectSql, countSql, values };
  }

  /**
   * List all articles with optional filters and pagination
   * @param {Object} filters
   * @returns {Promise<Object[]>}
   */
  static async findAll(filters = {}) {
    try {
      const { selectSql, values } = this.buildFilterQuery(filters);
      const [rows] = await db.query(selectSql, values);

      // Load tags for each article
      for (const article of rows) {
        article.tags = await this.getTagsByArticleId(article.id);
      }
      return rows;
    } catch (error) {
      console.error('Error in ArticleModel.findAll:', error.message);
      throw error;
    }
  }

  /**
   * Count articles matching filters
   * @param {Object} filters
   * @returns {Promise<number>}
   */
  static async count(filters = {}) {
    try {
      // Remove pagination limits from filters for counting
      const countFilters = { ...filters };
      delete countFilters.limit;
      delete countFilters.offset;

      const { countSql, values } = this.buildFilterQuery(countFilters);
      const [rows] = await db.query(countSql, values);
      return rows[0].total;
    } catch (error) {
      console.error('Error in ArticleModel.count:', error.message);
      throw error;
    }
  }
}

module.exports = ArticleModel;
