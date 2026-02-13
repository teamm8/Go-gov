const { pool } = require('../config/database');
const fuzzysort = require('fuzzysort');

/**
 * Validate URL format
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Normalize keyword to lowercase for case-insensitive matching
 */
function normalizeKeyword(keyword) {
  return keyword.trim().toLowerCase();
}

/**
 * Record bookmark change in history
 */
async function recordHistory(bookmarkId, bookmark, userId, changeType) {
  await pool.query(
    `INSERT INTO bookmark_history (bookmark_id, keyword, url, description, search_template, edited_by, change_type)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [bookmarkId, bookmark.keyword, bookmark.url, bookmark.description, bookmark.search_template, userId, changeType]
  );
}

/**
 * Create a new bookmark
 */
async function createBookmark({ keyword, url, description, searchTemplate, userId }) {
  // Validation
  if (!keyword || keyword.trim() === '') {
    throw new Error('Keyword is required');
  }

  if (!url || url.trim() === '') {
    throw new Error('URL is required');
  }

  if (!isValidUrl(url)) {
    throw new Error('Invalid URL');
  }

  const keywordLower = normalizeKeyword(keyword);

  // Check if keyword already exists
  const existing = await pool.query(
    'SELECT id FROM bookmarks WHERE keyword_lower = $1',
    [keywordLower]
  );

  if (existing.rows.length > 0) {
    throw new Error('Keyword already exists');
  }

  // Insert bookmark
  const result = await pool.query(
    `INSERT INTO bookmarks (keyword, keyword_lower, url, description, search_template, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [keyword.trim(), keywordLower, url, description || null, searchTemplate || null, userId]
  );

  const bookmark = result.rows[0];

  // Record in history
  await recordHistory(bookmark.id, bookmark, userId, 'created');

  return bookmark;
}

/**
 * Get bookmark by keyword (case-insensitive)
 */
async function getBookmarkByKeyword(keyword) {
  const keywordLower = normalizeKeyword(keyword);

  const result = await pool.query(
    'SELECT * FROM bookmarks WHERE keyword_lower = $1',
    [keywordLower]
  );

  return result.rows[0] || null;
}

/**
 * Get bookmark by ID
 */
async function getBookmarkById(id) {
  const result = await pool.query(
    'SELECT * FROM bookmarks WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

/**
 * Update bookmark
 */
async function updateBookmark(bookmarkId, { keyword, url, description, searchTemplate, userId }) {
  const existing = await getBookmarkById(bookmarkId);

  if (!existing) {
    throw new Error('Bookmark not found');
  }

  // If keyword is being changed, check it's available
  if (keyword) {
    const keywordLower = normalizeKeyword(keyword);
    if (keywordLower !== existing.keyword_lower) {
      const conflict = await pool.query(
        'SELECT id FROM bookmarks WHERE keyword_lower = $1 AND id != $2',
        [keywordLower, bookmarkId]
      );

      if (conflict.rows.length > 0) {
        throw new Error('Keyword already exists');
      }
    }
  }

  // Validate URL if provided
  if (url && !isValidUrl(url)) {
    throw new Error('Invalid URL');
  }

  // Build update query dynamically
  const updates = [];
  const values = [];
  let paramCount = 1;

  if (keyword) {
    updates.push(`keyword = $${paramCount}`);
    values.push(keyword.trim());
    paramCount++;
    updates.push(`keyword_lower = $${paramCount}`);
    values.push(normalizeKeyword(keyword));
    paramCount++;
  }

  if (url) {
    updates.push(`url = $${paramCount}`);
    values.push(url);
    paramCount++;
  }

  if (description !== undefined) {
    updates.push(`description = $${paramCount}`);
    values.push(description);
    paramCount++;
  }

  if (searchTemplate !== undefined) {
    updates.push(`search_template = $${paramCount}`);
    values.push(searchTemplate);
    paramCount++;
  }

  if (updates.length === 0) {
    return existing;
  }

  values.push(bookmarkId);

  const result = await pool.query(
    `UPDATE bookmarks SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  const updated = result.rows[0];

  // Record in history
  await recordHistory(bookmarkId, updated, userId, 'updated');

  return updated;
}

/**
 * Delete bookmark
 */
async function deleteBookmark(bookmarkId) {
  await pool.query('DELETE FROM bookmarks WHERE id = $1', [bookmarkId]);
}

/**
 * Increment usage count for a bookmark
 */
async function incrementUsageCount(bookmarkId) {
  await pool.query(
    'UPDATE bookmarks SET usage_count = usage_count + 1 WHERE id = $1',
    [bookmarkId]
  );
}

/**
 * Get top bookmarks by usage count
 */
async function getTopBookmarks(limit = 10) {
  const result = await pool.query(
    'SELECT * FROM bookmarks ORDER BY usage_count DESC, created_at DESC LIMIT $1',
    [limit]
  );

  return result.rows;
}

/**
 * Get recently created bookmarks
 */
async function getRecentBookmarks(limit = 10) {
  const result = await pool.query(
    'SELECT * FROM bookmarks ORDER BY created_at DESC LIMIT $1',
    [limit]
  );

  return result.rows;
}

/**
 * Search bookmarks with fuzzy matching
 */
async function searchBookmarks(query, limit = 10) {
  // Get all bookmarks
  const result = await pool.query('SELECT * FROM bookmarks');
  const bookmarks = result.rows;

  if (bookmarks.length === 0) {
    return [];
  }

  // Prepare data for fuzzy search
  const searchTargets = bookmarks.map(b => ({
    bookmark: b,
    searchString: `${b.keyword} ${b.description || ''}`,
  }));

  // Perform fuzzy search
  const results = fuzzysort.go(query, searchTargets, {
    key: 'searchString',
    limit,
    threshold: -10000,
  });

  return results.map(r => r.obj.bookmark);
}

/**
 * Get all bookmarks
 */
async function getAllBookmarks() {
  const result = await pool.query('SELECT * FROM bookmarks ORDER BY keyword_lower ASC');
  return result.rows;
}

/**
 * Get bookmark edit history
 */
async function getBookmarkHistory(bookmarkId) {
  const result = await pool.query(
    `SELECT bh.*, u.name as edited_by_name
     FROM bookmark_history bh
     LEFT JOIN users u ON bh.edited_by = u.id
     WHERE bh.bookmark_id = $1
     ORDER BY bh.edited_at DESC`,
    [bookmarkId]
  );

  return result.rows;
}

module.exports = {
  createBookmark,
  getBookmarkByKeyword,
  getBookmarkById,
  updateBookmark,
  deleteBookmark,
  incrementUsageCount,
  getTopBookmarks,
  getRecentBookmarks,
  searchBookmarks,
  getAllBookmarks,
  getBookmarkHistory,
};
