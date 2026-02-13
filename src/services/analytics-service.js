const { pool } = require('../config/database');

/**
 * Record a failed search
 */
async function recordFailedSearch(keyword) {
  const keywordLower = keyword.trim().toLowerCase();

  // Check if this failed search already exists
  const existing = await pool.query(
    'SELECT id, search_count FROM failed_searches WHERE keyword_lower = $1',
    [keywordLower]
  );

  if (existing.rows.length > 0) {
    // Increment count and update last_searched_at
    await pool.query(
      'UPDATE failed_searches SET search_count = search_count + 1, last_searched_at = CURRENT_TIMESTAMP WHERE id = $1',
      [existing.rows[0].id]
    );
  } else {
    // Insert new failed search
    await pool.query(
      'INSERT INTO failed_searches (keyword, keyword_lower) VALUES ($1, $2)',
      [keyword.trim(), keywordLower]
    );
  }
}

/**
 * Get top failed searches (popular searches without links)
 */
async function getTopFailedSearches(limit = 10) {
  const result = await pool.query(
    'SELECT * FROM failed_searches ORDER BY search_count DESC, last_searched_at DESC LIMIT $1',
    [limit]
  );

  return result.rows;
}

/**
 * Remove a failed search (when a bookmark is created for it)
 */
async function removeFailedSearch(keyword) {
  const keywordLower = keyword.trim().toLowerCase();

  await pool.query(
    'DELETE FROM failed_searches WHERE keyword_lower = $1',
    [keywordLower]
  );
}

/**
 * Get statistics
 */
async function getStatistics() {
  const totalBookmarksResult = await pool.query('SELECT COUNT(*) as count FROM bookmarks');
  const totalUsageResult = await pool.query('SELECT SUM(usage_count) as total FROM bookmarks');
  const totalFailedSearchesResult = await pool.query('SELECT COUNT(*) as count FROM failed_searches');

  return {
    totalBookmarks: parseInt(totalBookmarksResult.rows[0].count),
    totalUsage: parseInt(totalUsageResult.rows[0].total) || 0,
    totalFailedSearches: parseInt(totalFailedSearchesResult.rows[0].count),
  };
}

module.exports = {
  recordFailedSearch,
  getTopFailedSearches,
  removeFailedSearch,
  getStatistics,
};
