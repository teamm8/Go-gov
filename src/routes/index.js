const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const bookmarkService = require('../services/bookmark-service');
const analyticsService = require('../services/analytics-service');

/**
 * GET / - Landing page
 */
router.get('/', async (req, res) => {
  try {
    // Fetch statistics for landing page
    const [topBookmarks, recentBookmarks, topFailedSearches, stats] = await Promise.all([
      bookmarkService.getTopBookmarks(10),
      bookmarkService.getRecentBookmarks(10),
      analyticsService.getTopFailedSearches(10),
      analyticsService.getStatistics(),
    ]);

    res.render('pages/index', {
      pageTitle: 'Go-gov - Quick Links for Government',
      topBookmarks,
      recentBookmarks,
      topFailedSearches,
      stats,
    });
  } catch (error) {
    console.error('Landing page error:', error);
    res.render('pages/index', {
      pageTitle: 'Go-gov - Quick Links for Government',
      topBookmarks: [],
      recentBookmarks: [],
      topFailedSearches: [],
      stats: { totalBookmarks: 0, totalUsage: 0, totalFailedSearches: 0 },
    });
  }
});

/**
 * GET /dashboard - User dashboard (protected)
 */
router.get('/dashboard', ensureAuthenticated, (req, res) => {
  res.render('pages/dashboard', {
    pageTitle: 'Dashboard',
  });
});

module.exports = router;
