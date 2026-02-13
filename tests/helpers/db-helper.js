const { Pool } = require('pg');

let testPool;

/**
 * Get test database pool
 */
function getTestPool() {
  if (!testPool) {
    testPool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/go_gov_test',
      ssl: false,
    });
  }
  return testPool;
}

/**
 * Clean all tables for testing
 */
async function cleanDatabase() {
  const pool = getTestPool();

  await pool.query('DELETE FROM bookmark_history');
  await pool.query('DELETE FROM bookmark_tags');
  await pool.query('DELETE FROM failed_searches');
  await pool.query('DELETE FROM bookmarks');
  await pool.query('DELETE FROM tags');
  await pool.query('DELETE FROM users WHERE email LIKE \'%test%\'');
}

/**
 * Create a test user
 */
async function createTestUser(overrides = {}) {
  const pool = getTestPool();

  const defaultUser = {
    email: `test-${Date.now()}@test.gov.uk`,
    name: 'Test User',
    password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz', // dummy hash
    role: 'user',
    ...overrides,
  };

  const result = await pool.query(
    'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [defaultUser.email, defaultUser.name, defaultUser.password_hash, defaultUser.role]
  );

  return result.rows[0];
}

/**
 * Create a test bookmark
 */
async function createTestBookmark(userId, overrides = {}) {
  const pool = getTestPool();

  const defaultBookmark = {
    keyword: `test-keyword-${Date.now()}`,
    url: 'https://example.com',
    description: 'Test bookmark',
    created_by: userId,
    ...overrides,
  };

  const result = await pool.query(
    'INSERT INTO bookmarks (keyword, url, description, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
    [defaultBookmark.keyword, defaultBookmark.url, defaultBookmark.description, defaultBookmark.created_by]
  );

  return result.rows[0];
}

/**
 * Close test database connection
 */
async function closeTestDatabase() {
  if (testPool) {
    await testPool.end();
    testPool = null;
  }
}

module.exports = {
  getTestPool,
  cleanDatabase,
  createTestUser,
  createTestBookmark,
  closeTestDatabase,
};
