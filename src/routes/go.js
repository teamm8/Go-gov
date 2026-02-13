const express = require('express');
const router = express.Router();
const bookmarkService = require('../services/bookmark-service');
const analyticsService = require('../services/analytics-service');

/**
 * Parse keyword with operators
 * Returns: { keyword, searchQuery, pathSuffix }
 */
function parseKeyword(fullPath) {
  // Decode the path
  const decoded = decodeURIComponent(fullPath);

  // Check for search operator (?)
  const searchMatch = decoded.match(/^([^?]+)\?(.+)$/);
  if (searchMatch) {
    return {
      keyword: searchMatch[1].trim(),
      searchQuery: searchMatch[2].trim(),
      pathSuffix: null,
    };
  }

  // Check for path operator (/)
  const pathMatch = decoded.match(/^([^/]+)\/(.+)$/);
  if (pathMatch) {
    return {
      keyword: pathMatch[1].trim(),
      searchQuery: null,
      pathSuffix: pathMatch[2].trim(),
    };
  }

  // No operators, just keyword
  return {
    keyword: decoded.trim(),
    searchQuery: null,
    pathSuffix: null,
  };
}

/**
 * Build redirect URL based on bookmark and operators
 */
function buildRedirectUrl(bookmark, searchQuery, pathSuffix) {
  let url = bookmark.url;

  // Handle search operator
  if (searchQuery) {
    if (bookmark.search_template) {
      // Use search template
      return bookmark.search_template.replace('{query}', encodeURIComponent(searchQuery));
    }
    // No template, just redirect to base URL
    return url;
  }

  // Handle path operator
  if (pathSuffix) {
    // Remove trailing slash from URL if present
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    return `${url}/${pathSuffix}`;
  }

  return url;
}

/**
 * GET /go/:keyword - Redirect to bookmark URL
 * Supports operators:
 * - /go/google?query - Search using search_template
 * - /go/github/user/repo - Append path to URL
 */
router.get('/go/:keyword(*)', async (req, res) => {
  try {
    const fullPath = req.params.keyword;

    // Parse keyword and operators
    const { keyword, searchQuery, pathSuffix } = parseKeyword(fullPath);

    // Find bookmark
    const bookmark = await bookmarkService.getBookmarkByKeyword(keyword);

    if (!bookmark) {
      // Record failed search
      await analyticsService.recordFailedSearch(keyword);

      // Try to find similar bookmarks
      const suggestions = await bookmarkService.searchBookmarks(keyword, 5);

      return res.status(404).render('pages/go-not-found', {
        pageTitle: 'Go link not found',
        keyword,
        suggestions,
      });
    }

    // Increment usage count
    await bookmarkService.incrementUsageCount(bookmark.id);

    // Build redirect URL
    const redirectUrl = buildRedirectUrl(bookmark, searchQuery, pathSuffix);

    // Redirect
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Go route error:', error);
    return res.status(500).render('pages/error', {
      pageTitle: 'Error',
      error: { message: 'An error occurred while processing your request' },
    });
  }
});

/**
 * POST /go - Handle search from landing page
 */
router.post('/go', (req, res) => {
  const { keyword } = req.body;

  if (!keyword || keyword.trim() === '') {
    return res.redirect('/');
  }

  // Redirect to GET route
  return res.redirect(`/go/${encodeURIComponent(keyword.trim())}`);
});

module.exports = router;
