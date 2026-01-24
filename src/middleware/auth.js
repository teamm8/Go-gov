/**
 * Middleware to check if user is authenticated
 */
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/auth/login');
}

/**
 * Middleware to check if user is NOT authenticated (for login/register pages)
 */
function ensureGuest(req, res, next) {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/dashboard');
}

/**
 * Middleware to check if user has admin role
 */
function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).render('pages/error', {
    pageTitle: 'Access Denied',
    error: { message: 'You do not have permission to access this page' },
  });
}

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  ensureAdmin,
};
