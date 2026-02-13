const bookmarkService = require('../../src/services/bookmark-service');
const { getTestPool, cleanDatabase, createTestUser, closeTestDatabase } = require('../helpers/db-helper');

describe('BookmarkService', () => {
  let testUser;
  let pool;

  beforeAll(() => {
    pool = getTestPool();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('createBookmark', () => {
    it('should create a bookmark with valid data', async () => {
      const bookmarkData = {
        keyword: 'google',
        url: 'https://google.com',
        description: 'Google search engine',
        userId: testUser.id,
      };

      const bookmark = await bookmarkService.createBookmark(bookmarkData);

      expect(bookmark).toBeDefined();
      expect(bookmark.keyword).toBe('google');
      expect(bookmark.keyword_lower).toBe('google');
      expect(bookmark.url).toBe('https://google.com');
      expect(bookmark.description).toBe('Google search engine');
      expect(bookmark.usage_count).toBe(0);
      expect(bookmark.created_by).toBe(testUser.id);
    });

    it('should create a bookmark with multi-word keyword', async () => {
      const bookmarkData = {
        keyword: 'Google Maps',
        url: 'https://maps.google.com',
        userId: testUser.id,
      };

      const bookmark = await bookmarkService.createBookmark(bookmarkData);

      expect(bookmark.keyword).toBe('Google Maps');
      expect(bookmark.keyword_lower).toBe('google maps');
    });

    it('should create a bookmark with search template', async () => {
      const bookmarkData = {
        keyword: 'google',
        url: 'https://google.com',
        searchTemplate: 'https://google.com/search?q={query}',
        userId: testUser.id,
      };

      const bookmark = await bookmarkService.createBookmark(bookmarkData);

      expect(bookmark.search_template).toBe('https://google.com/search?q={query}');
    });

    it('should throw error if keyword already exists (case-insensitive)', async () => {
      await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      await expect(
        bookmarkService.createBookmark({
          keyword: 'Google',
          url: 'https://google.com',
          userId: testUser.id,
        })
      ).rejects.toThrow('Keyword already exists');
    });

    it('should throw error if keyword is empty', async () => {
      await expect(
        bookmarkService.createBookmark({
          keyword: '',
          url: 'https://google.com',
          userId: testUser.id,
        })
      ).rejects.toThrow('Keyword is required');
    });

    it('should throw error if URL is empty', async () => {
      await expect(
        bookmarkService.createBookmark({
          keyword: 'google',
          url: '',
          userId: testUser.id,
        })
      ).rejects.toThrow('URL is required');
    });

    it('should throw error if URL is invalid', async () => {
      await expect(
        bookmarkService.createBookmark({
          keyword: 'google',
          url: 'not-a-valid-url',
          userId: testUser.id,
        })
      ).rejects.toThrow('Invalid URL');
    });

    it('should record creation in bookmark history', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const history = await pool.query(
        'SELECT * FROM bookmark_history WHERE bookmark_id = $1',
        [bookmark.id]
      );

      expect(history.rows).toHaveLength(1);
      expect(history.rows[0].change_type).toBe('created');
      expect(history.rows[0].edited_by).toBe(testUser.id);
    });
  });

  describe('getBookmarkByKeyword', () => {
    it('should find bookmark by exact keyword (case-insensitive)', async () => {
      await bookmarkService.createBookmark({
        keyword: 'Google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const bookmark = await bookmarkService.getBookmarkByKeyword('google');
      expect(bookmark).toBeDefined();
      expect(bookmark.keyword).toBe('Google');
    });

    it('should return null if bookmark not found', async () => {
      const bookmark = await bookmarkService.getBookmarkByKeyword('nonexistent');
      expect(bookmark).toBeNull();
    });

    it('should handle multi-word keywords', async () => {
      await bookmarkService.createBookmark({
        keyword: 'Google Maps',
        url: 'https://maps.google.com',
        userId: testUser.id,
      });

      const bookmark = await bookmarkService.getBookmarkByKeyword('google maps');
      expect(bookmark).toBeDefined();
      expect(bookmark.keyword).toBe('Google Maps');
    });
  });

  describe('updateBookmark', () => {
    it('should update bookmark fields', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const updated = await bookmarkService.updateBookmark(bookmark.id, {
        url: 'https://www.google.com',
        description: 'Updated description',
        userId: testUser.id,
      });

      expect(updated.url).toBe('https://www.google.com');
      expect(updated.description).toBe('Updated description');
    });

    it('should allow changing keyword if new keyword is available', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const updated = await bookmarkService.updateBookmark(bookmark.id, {
        keyword: 'google search',
        userId: testUser.id,
      });

      expect(updated.keyword).toBe('google search');
      expect(updated.keyword_lower).toBe('google search');
    });

    it('should throw error if changing to existing keyword', async () => {
      await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const bookmark2 = await bookmarkService.createBookmark({
        keyword: 'bing',
        url: 'https://bing.com',
        userId: testUser.id,
      });

      await expect(
        bookmarkService.updateBookmark(bookmark2.id, {
          keyword: 'google',
          userId: testUser.id,
        })
      ).rejects.toThrow('Keyword already exists');
    });

    it('should record update in bookmark history', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      await bookmarkService.updateBookmark(bookmark.id, {
        url: 'https://www.google.com',
        userId: testUser.id,
      });

      const history = await pool.query(
        'SELECT * FROM bookmark_history WHERE bookmark_id = $1 ORDER BY edited_at DESC',
        [bookmark.id]
      );

      expect(history.rows.length).toBeGreaterThanOrEqual(2);
      expect(history.rows[0].change_type).toBe('updated');
    });

    it('should throw error if bookmark not found', async () => {
      await expect(
        bookmarkService.updateBookmark(99999, {
          url: 'https://google.com',
          userId: testUser.id,
        })
      ).rejects.toThrow('Bookmark not found');
    });
  });

  describe('deleteBookmark', () => {
    it('should delete bookmark by id', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      await bookmarkService.deleteBookmark(bookmark.id);

      const deleted = await bookmarkService.getBookmarkByKeyword('google');
      expect(deleted).toBeNull();
    });

    it('should delete associated history entries', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      await bookmarkService.deleteBookmark(bookmark.id);

      const history = await pool.query(
        'SELECT * FROM bookmark_history WHERE bookmark_id = $1',
        [bookmark.id]
      );

      expect(history.rows).toHaveLength(0);
    });
  });

  describe('incrementUsageCount', () => {
    it('should increment usage count', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      await bookmarkService.incrementUsageCount(bookmark.id);
      await bookmarkService.incrementUsageCount(bookmark.id);

      const updated = await pool.query('SELECT usage_count FROM bookmarks WHERE id = $1', [bookmark.id]);
      expect(updated.rows[0].usage_count).toBe(2);
    });
  });

  describe('getTopBookmarks', () => {
    it('should return top bookmarks by usage count', async () => {
      const bookmark1 = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const bookmark2 = await bookmarkService.createBookmark({
        keyword: 'bing',
        url: 'https://bing.com',
        userId: testUser.id,
      });

      await bookmarkService.incrementUsageCount(bookmark2.id);
      await bookmarkService.incrementUsageCount(bookmark2.id);
      await bookmarkService.incrementUsageCount(bookmark1.id);

      const topBookmarks = await bookmarkService.getTopBookmarks(10);

      expect(topBookmarks).toHaveLength(2);
      expect(topBookmarks[0].keyword).toBe('bing');
      expect(topBookmarks[0].usage_count).toBe(2);
      expect(topBookmarks[1].keyword).toBe('google');
    });

    it('should limit results to specified count', async () => {
      for (let i = 0; i < 15; i++) {
        await bookmarkService.createBookmark({
          keyword: `test${i}`,
          url: `https://test${i}.com`,
          userId: testUser.id,
        });
      }

      const topBookmarks = await bookmarkService.getTopBookmarks(10);
      expect(topBookmarks).toHaveLength(10);
    });
  });

  describe('getRecentBookmarks', () => {
    it('should return recently created bookmarks', async () => {
      const bookmark1 = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const bookmark2 = await bookmarkService.createBookmark({
        keyword: 'bing',
        url: 'https://bing.com',
        userId: testUser.id,
      });

      const recentBookmarks = await bookmarkService.getRecentBookmarks(10);

      expect(recentBookmarks).toHaveLength(2);
      expect(recentBookmarks[0].keyword).toBe('bing');
      expect(recentBookmarks[1].keyword).toBe('google');
    });
  });

  describe('searchBookmarks', () => {
    it('should find bookmarks with fuzzy matching', async () => {
      await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      await bookmarkService.createBookmark({
        keyword: 'google maps',
        url: 'https://maps.google.com',
        userId: testUser.id,
      });

      const results = await bookmarkService.searchBookmarks('gogle');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].keyword).toContain('google');
    });

    it('should search in descriptions too', async () => {
      await bookmarkService.createBookmark({
        keyword: 'goog',
        url: 'https://google.com',
        description: 'Google search engine',
        userId: testUser.id,
      });

      const results = await bookmarkService.searchBookmarks('search engine');

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('getAllBookmarks', () => {
    it('should return all bookmarks', async () => {
      await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      await bookmarkService.createBookmark({
        keyword: 'bing',
        url: 'https://bing.com',
        userId: testUser.id,
      });

      const bookmarks = await bookmarkService.getAllBookmarks();

      expect(bookmarks).toHaveLength(2);
    });
  });

  describe('getBookmarkHistory', () => {
    it('should return edit history for a bookmark', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      await bookmarkService.updateBookmark(bookmark.id, {
        url: 'https://www.google.com',
        userId: testUser.id,
      });

      const history = await bookmarkService.getBookmarkHistory(bookmark.id);

      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[0].change_type).toBe('updated');
      expect(history[1].change_type).toBe('created');
    });
  });
});
