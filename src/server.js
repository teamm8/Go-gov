require('dotenv').config();
const express = require('express');
const nunjucks = require('nunjucks');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const pgSession = require('connect-pg-simple')(session);
const { pool } = require('./config/database');

// Import routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const goRoutes = require('./routes/go');
const bookmarkRoutes = require('./routes/bookmarks');

// Import passport configuration
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Session configuration
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: parseInt(process.env.SESSION_TIMEOUT) || 3600000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
}));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Make user available in all templates
app.use((req, res, next) => {
  res.locals.user = req.user;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

// Configure Nunjucks
const nunjucksEnv = nunjucks.configure(['src/views', 'node_modules/govuk-frontend/dist'], {
  autoescape: true,
  express: app,
  noCache: process.env.NODE_ENV === 'development',
});

// Add custom filters if needed
nunjucksEnv.addGlobal('appUrl', process.env.APP_URL);

// Set view engine
app.set('view engine', 'njk');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use('/govuk', express.static(path.join(__dirname, '../node_modules/govuk-frontend/dist/govuk')));
app.use('/assets', express.static(path.join(__dirname, '../node_modules/govuk-frontend/dist/govuk/assets')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/stylesheets', express.static(path.join(__dirname, 'public/stylesheets')));
app.use('/javascripts', express.static(path.join(__dirname, 'public/javascripts')));

// Routes
app.use('/', goRoutes);
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/bookmarks', bookmarkRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('pages/404', {
    pageTitle: 'Page not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).render('pages/error', {
    pageTitle: 'An error occurred',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Go-gov server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
