const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const bcrypt = require('bcrypt');
const { pool } = require('./database');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT id, email, name, department, role FROM users WHERE id = $1', [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error);
  }
});

// Local Strategy (email/password)
passport.use(new LocalStrategy(
  {
    usernameField: 'email',
    passwordField: 'password',
  },
  async (email, password, done) => {
    try {
      // Find user by email
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

      if (result.rows.length === 0) {
        return done(null, false, { message: 'Incorrect email or password' });
      }

      const user = result.rows[0];

      // Check if user is active
      if (!user.is_active) {
        return done(null, false, { message: 'Account is inactive' });
      }

      // Check if user has a password (might be Microsoft-only user)
      if (!user.password_hash) {
        return done(null, false, { message: 'Please sign in with Microsoft' });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password_hash);

      if (!isMatch) {
        return done(null, false, { message: 'Incorrect email or password' });
      }

      // Remove password hash from user object
      delete user.password_hash;

      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Microsoft Strategy (OAuth)
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy(
    {
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: process.env.MICROSOFT_CALLBACK_URL,
      scope: ['user.read'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists with this Microsoft ID
        let result = await pool.query('SELECT * FROM users WHERE microsoft_id = $1', [profile.id]);

        if (result.rows.length > 0) {
          // User exists, return user
          const user = result.rows[0];
          delete user.password_hash;
          return done(null, user);
        }

        // Check if user exists with this email
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;

        if (email) {
          result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);

          if (result.rows.length > 0) {
            // User exists with email, link Microsoft account
            const updateResult = await pool.query(
              'UPDATE users SET microsoft_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
              [profile.id, result.rows[0].id]
            );
            const user = updateResult.rows[0];
            delete user.password_hash;
            return done(null, user);
          }
        }

        // Create new user
        const displayName = profile.displayName || 'User';
        const insertResult = await pool.query(
          'INSERT INTO users (email, name, microsoft_id) VALUES ($1, $2, $3) RETURNING *',
          [email ? email.toLowerCase() : `user_${profile.id}@temp.gov`, displayName, profile.id]
        );

        const newUser = insertResult.rows[0];
        delete newUser.password_hash;
        return done(null, newUser);
      } catch (error) {
        return done(error);
      }
    }
  ));
}

module.exports = passport;
