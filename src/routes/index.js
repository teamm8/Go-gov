const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');

/**
 * GET / - Landing page
 */
router.get('/', (req, res) => {
  res.render('pages/index', {
    pageTitle: 'Go-gov - Community Bookmarking for Government',
  });
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
