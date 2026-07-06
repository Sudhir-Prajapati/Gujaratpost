const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const ArticleModel = require('../models/articleModel');
const { slugify } = require('../utils/helpers');

// Helper to extract authenticated user from authorization header (if present) on public endpoints
const getOptionalUser = async (req) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_change_me_in_production');
      return await UserModel.findById(decoded.id);
    } catch (err) {
      // Return null if token is expired/invalid
      return null;
    }
  }
  return null;
};

// @desc    List all articles (with advanced filtering, pagination, and selective visibility)
// @route   GET /api/articles
// @access  Public (Filter changes based on role)
const listArticles = async (req, res, next) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const {
    search,
    category,
    tag,
    is_breaking,
    is_featured,
    is_fact_check,
    status
  } = req.query;

  try {
    const user = await getOptionalUser(req);
    const filters = { limit, offset, search };

    // Apply category & tag slug filters
    if (category) filters.category_slug = category;
    if (tag) filters.tag_slug = tag;

    // Apply flags
    if (is_breaking !== undefined) filters.is_breaking = is_breaking === 'true' || is_breaking === '1';
    if (is_featured !== undefined) filters.is_featured = is_featured === 'true' || is_featured === '1';
    if (is_fact_check !== undefined) filters.is_fact_check = is_fact_check === 'true' || is_fact_check === '1';

    // Selective visibility rules based on authentication state
    if (user) {
      if (['super_admin', 'editor'].includes(user.role)) {
        // Admins and editors can filter by any requested status or get all
        if (status) filters.status = status;
      } else if (user.role === 'reporter') {
        // Reporters in admin dashboard always see ONLY their own articles (all statuses)
        // This ensures they see their drafts, pending, rejected articles
        filters.author_id = user.id;
        // Apply status filter on top if requested
        if (status) filters.status = status;
        // Note: No default status filter — reporters see all their own articles
      } else {
        // Other authenticated users (e.g. photographer) can only see published articles
        filters.status = 'published';
      }
    } else {
      // Non-authenticated visitors can only see published articles
      filters.status = 'published';
    }

    // Retrieve articles and count
    const articles = await ArticleModel.findAll(filters);
    
    // If user is a reporter and wants "all" articles, we also want to inject their own drafts.
    // Let's check if we need to do this. If a reporter wants their own dashboard, they will query author_id and status.
    // So the simple logic above is perfect!

    const total = await ArticleModel.count(filters);

    res.status(200).json({
      success: true,
      data: articles,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single article by ID or Slug
// @route   GET /api/articles/:idOrSlug
// @access  Public (Visibility is authorized per role)
const getArticle = async (req, res, next) => {
  const { id } = req.params;

  try {
    let article = null;
    if (/^\d+$/.test(id)) {
      article = await ArticleModel.findById(Number(id));
    } else {
      article = await ArticleModel.findBySlug(id);
    }

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    // Visibility Authorization Check
    if (article.status !== 'published') {
      const user = await getOptionalUser(req);
      if (!user) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to view this article.'
        });
      }

      const isAuthorized = 
        ['super_admin', 'editor'].includes(user.role) || 
        (user.role === 'reporter' && article.author_id === user.id);

      if (!isAuthorized) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden: You are not authorized to view this article.'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create an article (creates draft by default)
// @route   POST /api/articles
// @access  Private (Requires admin, editor, or reporter role)
const createArticle = async (req, res, next) => {
  const {
    title,
    content,
    excerpt,
    featured_image_id,
    category_id,
    tags, // array of tag IDs: [1, 2, 3]
    is_breaking,
    is_featured,
    is_fact_check,
    scheduled_publish_at
  } = req.body;

  try {
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Article Headline / Title is required.' });
    }
    if (!excerpt || !excerpt.trim()) {
      return res.status(400).json({ success: false, message: 'Short Excerpt / Summary is required.' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Main Article Body Content is required.' });
    }
    if (!category_id) {
      return res.status(400).json({ success: false, message: 'News Category / Location is required.' });
    }
    if (!featured_image_id) {
      return res.status(400).json({ success: false, message: 'Featured Cover Image is required.' });
    }

    // Auto-generate a unique slug
    let baseSlug = slugify(title);
    if (!baseSlug) {
      baseSlug = 'article-' + Date.now();
    }
    
    let finalSlug = baseSlug;
    let isSlugUnique = false;
    let counter = 0;
    while (!isSlugUnique) {
      const checkSlug = counter === 0 ? finalSlug : `${finalSlug}-${counter}`;
      const existing = await ArticleModel.findBySlug(checkSlug);
      if (!existing) {
        isSlugUnique = true;
        if (counter > 0) finalSlug = `${finalSlug}-${counter}`;
      } else {
        counter++;
      }
    }

    let finalStatus = 'draft';
    let publishedAt = null;

    if (['super_admin', 'editor'].includes(req.user.role) && req.body.status) {
      const validStatuses = ['draft', 'pending', 'approved', 'rejected', 'published'];
      if (validStatuses.includes(req.body.status)) {
        finalStatus = req.body.status;
        if (finalStatus === 'published') {
          publishedAt = new Date();
        }
      }
    }

    // Insert article
    const articleId = await ArticleModel.create({
      title,
      slug: finalSlug,
      content,
      excerpt,
      featured_image_id,
      author_id: req.user.id,
      category_id,
      status: finalStatus,
      is_breaking: is_breaking ? 1 : 0,
      is_featured: is_featured ? 1 : 0,
      is_fact_check: is_fact_check ? 1 : 0,
      scheduled_publish_at: scheduled_publish_at ? new Date(scheduled_publish_at) : null,
      published_at: publishedAt
    });

    // Sync tags if provided
    if (tags && Array.isArray(tags)) {
      await ArticleModel.syncTags(articleId, tags);
    }

    const newArticle = await ArticleModel.findById(articleId);

    res.status(201).json({
      success: true,
      message: finalStatus === 'draft' ? 'Article draft created successfully.' : `Article created and saved as ${finalStatus}.`,
      data: newArticle
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an article (handles workflow checks)
// @route   PUT /api/articles/:id
// @access  Private (Requires admin, editor, or reporter role)
const updateArticle = async (req, res, next) => {
  const targetId = Number(req.params.id);
  const {
    title,
    content,
    excerpt,
    featured_image_id,
    category_id,
    tags,
    status,
    is_breaking,
    is_featured,
    is_fact_check,
    scheduled_publish_at
  } = req.body;

  try {
    if (title !== undefined && (!title || !title.trim())) {
      return res.status(400).json({ success: false, message: 'Article Headline / Title cannot be empty.' });
    }
    if (excerpt !== undefined && (!excerpt || !excerpt.trim())) {
      return res.status(400).json({ success: false, message: 'Short Excerpt / Summary cannot be empty.' });
    }
    if (content !== undefined && (!content || !content.trim())) {
      return res.status(400).json({ success: false, message: 'Main Article Body Content cannot be empty.' });
    }
    if (category_id !== undefined && !category_id) {
      return res.status(400).json({ success: false, message: 'News Category / Location is required.' });
    }
    if (featured_image_id !== undefined && !featured_image_id) {
      return res.status(400).json({ success: false, message: 'Featured Cover Image is required.' });
    }

    // 1. Fetch the article
    const article = await ArticleModel.findById(targetId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    const isAuthor = article.author_id === req.user.id;
    const isAdminOrEditor = ['super_admin', 'editor'].includes(req.user.role);

    // 2. Authorization Check:
    // Only author or editor/admin can edit
    if (!isAuthor && !isAdminOrEditor) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to edit this article.'
      });
    }

    const updatedData = {};

    // 3. Apply Editorial State-Machine Workflow Rules
    if (!isAdminOrEditor) {
      // Current user is a REPORTER
      
      // Reporters can only edit articles if they are in 'draft' or 'rejected' status
      if (!['draft', 'rejected'].includes(article.status)) {
        return res.status(400).json({
          success: false,
          message: `You cannot edit this article because it is currently in "${article.status}" status.`
        });
      }

      // Reporters can update basic writing fields
      if (title !== undefined) {
        updatedData.title = title;
        // Generate new slug if title changed
        let baseSlug = slugify(title);
        let finalSlug = baseSlug;
        let isSlugUnique = false;
        let counter = 0;
        while (!isSlugUnique) {
          const checkSlug = counter === 0 ? finalSlug : `${finalSlug}-${counter}`;
          const existing = await ArticleModel.findBySlug(checkSlug);
          if (!existing || existing.id === targetId) {
            isSlugUnique = true;
            if (counter > 0) finalSlug = `${finalSlug}-${counter}`;
          } else {
            counter++;
          }
        }
        updatedData.slug = finalSlug;
      }
      if (content !== undefined) updatedData.content = content;
      if (excerpt !== undefined) updatedData.excerpt = excerpt;
      if (featured_image_id !== undefined) updatedData.featured_image_id = featured_image_id;
      if (category_id !== undefined) updatedData.category_id = category_id;

      // Reporters can only set status to 'draft' or 'pending' (submit for review)
      if (status !== undefined) {
        if (!['draft', 'pending'].includes(status)) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden: Reporters can only save as draft or submit for review (pending).'
          });
        }
        updatedData.status = status;
      }
    } else {
      // Current user is an EDITOR or SUPER ADMIN
      
      // Admins/Editors can update any writing fields at any time
      if (title !== undefined) {
        updatedData.title = title;
        let baseSlug = slugify(title);
        let finalSlug = baseSlug;
        let isSlugUnique = false;
        let counter = 0;
        while (!isSlugUnique) {
          const checkSlug = counter === 0 ? finalSlug : `${finalSlug}-${counter}`;
          const existing = await ArticleModel.findBySlug(checkSlug);
          if (!existing || existing.id === targetId) {
            isSlugUnique = true;
            if (counter > 0) finalSlug = `${finalSlug}-${counter}`;
          } else {
            counter++;
          }
        }
        updatedData.slug = finalSlug;
      }
      if (content !== undefined) updatedData.content = content;
      if (excerpt !== undefined) updatedData.excerpt = excerpt;
      if (featured_image_id !== undefined) updatedData.featured_image_id = featured_image_id;
      if (category_id !== undefined) updatedData.category_id = category_id;

      // Admins/Editors can set flags and scheduling details
      if (is_breaking !== undefined) updatedData.is_breaking = (is_breaking === true || is_breaking === 1 || is_breaking === '1') ? 1 : 0;
      if (is_featured !== undefined) updatedData.is_featured = (is_featured === true || is_featured === 1 || is_featured === '1') ? 1 : 0;
      if (is_fact_check !== undefined) updatedData.is_fact_check = (is_fact_check === true || is_fact_check === 1 || is_fact_check === '1') ? 1 : 0;

      if (scheduled_publish_at !== undefined) {
        // If they clear the schedule publish
        if (scheduled_publish_at === null || scheduled_publish_at === '') {
          updatedData.scheduled_publish_at = null;
        } else {
          updatedData.scheduled_publish_at = new Date(scheduled_publish_at);
        }
      }

      // Admins/Editors can update status
      if (status !== undefined) {
        // Validate status value
        const validStatuses = ['draft', 'pending', 'approved', 'rejected', 'published'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: `Invalid status: ${status}.`
          });
        }
        updatedData.status = status;

        // If status becomes published, update published_at
        if (status === 'published') {
          updatedData.published_at = new Date();
          updatedData.scheduled_publish_at = null; // clear scheduling since it is published now
        }
      }
    }

    // 4. Update DB
    await ArticleModel.update(targetId, updatedData);

    // 5. Sync tags if provided
    if (tags !== undefined && Array.isArray(tags)) {
      await ArticleModel.syncTags(targetId, tags);
    }

    // 6. Fetch updated article and return
    const updatedArticle = await ArticleModel.findById(targetId);

    res.status(200).json({
      success: true,
      message: 'Article updated successfully.',
      data: updatedArticle
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an article
// @route   DELETE /api/articles/:id
// @access  Private (Requires admin, editor, or reporter role)
const deleteArticle = async (req, res, next) => {
  const targetId = Number(req.params.id);

  try {
    const article = await ArticleModel.findById(targetId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    const isAuthor = article.author_id === req.user.id;
    const isAdminOrEditor = ['super_admin', 'editor'].includes(req.user.role);

    // 1. Authorization checks
    if (!isAuthor && !isAdminOrEditor) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You are not authorized to delete this article.'
      });
    }

    // 2. State machine delete checks for reporters
    if (!isAdminOrEditor) {
      // Reporters can only delete their drafts or rejected drafts
      if (!['draft', 'rejected'].includes(article.status)) {
        return res.status(400).json({
          success: false,
          message: `You cannot delete this article because it is currently in "${article.status}" status.`
        });
      }
    }

    // 3. Perform delete
    await ArticleModel.delete(targetId);

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve an article
// @route   PUT /api/articles/:id/approve
// @access  Private (Requires super_admin or editor role)
const approveArticle = async (req, res, next) => {
  const targetId = Number(req.params.id);

  try {
    const article = await ArticleModel.findById(targetId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    await ArticleModel.update(targetId, {
      status: 'approved',
      rejection_reason: null
    });

    const updatedArticle = await ArticleModel.findById(targetId);

    res.status(200).json({
      success: true,
      message: 'Article approved successfully.',
      data: updatedArticle
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject an article
// @route   PUT /api/articles/:id/reject
// @access  Private (Requires super_admin or editor role)
const rejectArticle = async (req, res, next) => {
  const targetId = Number(req.params.id);
  const { rejection_reason } = req.body;

  try {
    const article = await ArticleModel.findById(targetId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    await ArticleModel.update(targetId, {
      status: 'rejected',
      rejection_reason: rejection_reason || 'Revisions required by editor.'
    });

    const updatedArticle = await ArticleModel.findById(targetId);

    res.status(200).json({
      success: true,
      message: 'Article rejected successfully.',
      data: updatedArticle
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Publish an approved article
// @route   PUT /api/articles/:id/publish
// @access  Private (Requires super_admin or editor role)
const publishArticle = async (req, res, next) => {
  const targetId = Number(req.params.id);

  try {
    const article = await ArticleModel.findById(targetId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    await ArticleModel.update(targetId, {
      status: 'published',
      published_at: new Date(),
      scheduled_publish_at: null
    });

    const updatedArticle = await ArticleModel.findById(targetId);

    res.status(200).json({
      success: true,
      message: 'Article published successfully.',
      data: updatedArticle
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unpublish a published article
// @route   PUT /api/articles/:id/unpublish
// @access  Private (Requires super_admin or editor role)
const unpublishArticle = async (req, res, next) => {
  const targetId = Number(req.params.id);

  try {
    const article = await ArticleModel.findById(targetId);
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found.'
      });
    }

    await ArticleModel.update(targetId, {
      status: 'draft',
      published_at: null,
      scheduled_publish_at: null
    });

    const updatedArticle = await ArticleModel.findById(targetId);

    res.status(200).json({
      success: true,
      message: 'Article unpublished and reverted to draft successfully.',
      data: updatedArticle
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  approveArticle,
  rejectArticle,
  publishArticle,
  unpublishArticle
};
