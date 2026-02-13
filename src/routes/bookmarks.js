const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bookmarkService = require('../services/bookmark-service');
const analyticsService = require('../services/analytics-service');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/auth');

/**
 * GET /bookmarks - List all bookmarks
 */
router.get('/', async (req, res) => {
  try {
    const bookmarks = await bookmarkService.getAllBookmarks();

    res.render('pages/bookmarks/list', {
      pageTitle: 'All Go Links',
      bookmarks,
    });
  } catch (error) {
    console.error('List bookmarks error:', error);
    res.status(500).render('pages/error', {
      pageTitle: 'Error',
      error: { message: 'Failed to load bookmarks' },
    });
  }
});

/**
 * GET /bookmarks/new - Show create form
 */
router.get('/new', ensureAuthenticated, (req, res) => {
  res.render('pages/bookmarks/new', {
    pageTitle: 'Create Go Link',
    keyword: req.query.keyword || '',
    errors: [],
  });
});

/**
 * POST /bookmarks - Create new bookmark
 */
router.post('/',
  ensureAuthenticated,
  body('keyword').trim().notEmpty().withMessage('Keyword is required'),
  body('url').trim().notEmpty().withMessage('URL is required').isURL().withMessage('Invalid URL'),
  body('description').optional().trim(),
  body('searchTemplate').optional().trim(),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).render('pages/bookmarks/new', {
        pageTitle: 'Create Go Link',
        errors: errors.array(),
        keyword: req.body.keyword,
        url: req.body.url,
        description: req.body.description,
        searchTemplate: req.body.searchTemplate,
      });
    }

    try {
      const { keyword, url, description, searchTemplate } = req.body;

      const bookmark = await bookmarkService.createBookmark({
        keyword,
        url,
        description,
        searchTemplate,
        userId: req.user.id,
      });

      // Remove from failed searches if it was there
      await analyticsService.removeFailedSearch(keyword);

      return res.redirect(`/bookmarks/${bookmark.id}`);
    } catch (error) {
      console.error('Create bookmark error:', error);

      return res.status(400).render('pages/bookmarks/new', {
        pageTitle: 'Create Go Link',
        errors: [{ msg: error.message }],
        keyword: req.body.keyword,
        url: req.body.url,
        description: req.body.description,
        searchTemplate: req.body.searchTemplate,
      });
    }
  }
);

/**
 * GET /bookmarks/:id - Show bookmark details
 */
router.get('/:id', async (req, res) => {
  try {
    const bookmark = await bookmarkService.getBookmarkById(req.params.id);

    if (!bookmark) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Bookmark not found',
      });
    }

    res.render('pages/bookmarks/show', {
      pageTitle: `Go Link: ${bookmark.keyword}`,
      bookmark,
    });
  } catch (error) {
    console.error('Show bookmark error:', error);
    res.status(500).render('pages/error', {
      pageTitle: 'Error',
      error: { message: 'Failed to load bookmark' },
    });
  }
});

/**
 * GET /bookmarks/:id/edit - Show edit form
 */
router.get('/:id/edit', ensureAuthenticated, async (req, res) => {
  try {
    const bookmark = await bookmarkService.getBookmarkById(req.params.id);

    if (!bookmark) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Bookmark not found',
      });
    }

    res.render('pages/bookmarks/edit', {
      pageTitle: `Edit: ${bookmark.keyword}`,
      bookmark,
      errors: [],
    });
  } catch (error) {
    console.error('Edit form error:', error);
    res.status(500).render('pages/error', {
      pageTitle: 'Error',
      error: { message: 'Failed to load bookmark' },
    });
  }
});

/**
 * POST /bookmarks/:id - Update bookmark
 */
router.post('/:id',
  ensureAuthenticated,
  body('keyword').optional().trim().notEmpty(),
  body('url').optional().trim().isURL().withMessage('Invalid URL'),
  body('description').optional().trim(),
  body('searchTemplate').optional().trim(),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const bookmark = await bookmarkService.getBookmarkById(req.params.id);

      return res.status(400).render('pages/bookmarks/edit', {
        pageTitle: `Edit: ${bookmark.keyword}`,
        errors: errors.array(),
        bookmark: { ...bookmark, ...req.body },
      });
    }

    try {
      const { keyword, url, description, searchTemplate } = req.body;

      await bookmarkService.updateBookmark(req.params.id, {
        keyword,
        url,
        description,
        searchTemplate,
        userId: req.user.id,
      });

      return res.redirect(`/bookmarks/${req.params.id}`);
    } catch (error) {
      console.error('Update bookmark error:', error);

      const bookmark = await bookmarkService.getBookmarkById(req.params.id);

      return res.status(400).render('pages/bookmarks/edit', {
        pageTitle: `Edit: ${bookmark.keyword}`,
        errors: [{ msg: error.message }],
        bookmark: { ...bookmark, ...req.body },
      });
    }
  }
);

/**
 * POST /bookmarks/:id/delete - Delete bookmark (admin only)
 */
router.post('/:id/delete', ensureAdmin, async (req, res) => {
  try {
    await bookmarkService.deleteBookmark(req.params.id);
    return res.redirect('/bookmarks');
  } catch (error) {
    console.error('Delete bookmark error:', error);
    return res.status(500).render('pages/error', {
      pageTitle: 'Error',
      error: { message: 'Failed to delete bookmark' },
    });
  }
});

/**
 * GET /bookmarks/:id/history - Show bookmark edit history
 */
router.get('/:id/history', async (req, res) => {
  try {
    const bookmark = await bookmarkService.getBookmarkById(req.params.id);

    if (!bookmark) {
      return res.status(404).render('pages/404', {
        pageTitle: 'Bookmark not found',
      });
    }

    const history = await bookmarkService.getBookmarkHistory(req.params.id);

    res.render('pages/bookmarks/history', {
      pageTitle: `History: ${bookmark.keyword}`,
      bookmark,
      history,
    });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).render('pages/error', {
      pageTitle: 'Error',
      error: { message: 'Failed to load history' },
    });
  }
});

module.exports = router;
