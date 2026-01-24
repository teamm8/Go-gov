const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { ensureGuest } = require('../middleware/auth');

/**
 * GET /auth/login - Login page
 */
router.get('/login', ensureGuest, (req, res) => {
  res.render('pages/login', {
    pageTitle: 'Sign in to Go-gov',
    errors: [],
  });
});

/**
 * POST /auth/login - Process login
 */
router.post('/login',
  ensureGuest,
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address'),
  body('password').notEmpty().withMessage('Enter your password'),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render('pages/login', {
        pageTitle: 'Sign in to Go-gov',
        errors: errors.array(),
        email: req.body.email,
      });
    }

    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return res.render('pages/login', {
          pageTitle: 'Sign in to Go-gov',
          errors: [{ msg: info.message }],
          email: req.body.email,
        });
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.redirect('/dashboard');
      });
    })(req, res, next);
  }
);

/**
 * GET /auth/register - Registration page
 */
router.get('/register', ensureGuest, (req, res) => {
  res.render('pages/register', {
    pageTitle: 'Create an account',
    errors: [],
  });
});

/**
 * POST /auth/register - Process registration
 */
router.post('/register',
  ensureGuest,
  body('name').trim().notEmpty().withMessage('Enter your full name'),
  body('email').isEmail().normalizeEmail().withMessage('Enter a valid email address'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Password must contain a number')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render('pages/register', {
        pageTitle: 'Create an account',
        errors: errors.array(),
        name: req.body.name,
        email: req.body.email,
        department: req.body.department,
      });
    }

    try {
      const { name, email, password, department } = req.body;

      // Check if user already exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

      if (existingUser.rows.length > 0) {
        return res.render('pages/register', {
          pageTitle: 'Create an account',
          errors: [{ msg: 'An account with this email already exists' }],
          name,
          email,
          department,
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const result = await pool.query(
        'INSERT INTO users (name, email, password_hash, department) VALUES ($1, $2, $3, $4) RETURNING id, name, email, department, role',
        [name, email, passwordHash, department || null]
      );

      const newUser = result.rows[0];

      // Log user in
      req.logIn(newUser, (err) => {
        if (err) {
          console.error('Login error after registration:', err);
          return res.redirect('/auth/login');
        }
        res.redirect('/dashboard');
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.render('pages/register', {
        pageTitle: 'Create an account',
        errors: [{ msg: 'An error occurred during registration. Please try again.' }],
        name: req.body.name,
        email: req.body.email,
        department: req.body.department,
      });
    }
  }
);

/**
 * GET /auth/microsoft - Microsoft OAuth login
 */
router.get('/microsoft', passport.authenticate('microsoft'));

/**
 * GET /auth/microsoft/callback - Microsoft OAuth callback
 */
router.get('/microsoft/callback',
  passport.authenticate('microsoft', { failureRedirect: '/auth/login' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

/**
 * GET /auth/logout - Logout
 */
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/');
  });
});

module.exports = router;
