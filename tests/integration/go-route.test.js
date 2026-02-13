const request = require('supertest');
const express = require('express');
const goRoutes = require('../../src/routes/go');
const bookmarkService = require('../../src/services/bookmark-service');
const analyticsService = require('../../src/services/analytics-service');
const { getTestPool, cleanDatabase, createTestUser, closeTestDatabase } = require('../helpers/db-helper');

// Create a minimal express app for testing
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/', goRoutes);
  return app;
}

describe('Go Route Integration Tests', () => {
  let app;
  let testUser;

  beforeAll(() => {
    getTestPool();
    app = createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('GET /go/:keyword', () => {
    it('should redirect to URL for exact keyword match', async () => {
      await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const response = await request(app)
        .get('/go/google')
        .expect(302);

      expect(response.headers.location).toBe('https://google.com');
    });

    it('should handle case-insensitive keywords', async () => {
      await bookmarkService.createBookmark({
        keyword: 'Google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const response = await request(app)
        .get('/go/google')
        .expect(302);

      expect(response.headers.location).toBe('https://google.com');
    });

    it('should handle multi-word keywords with spaces', async () => {
      await bookmarkService.createBookmark({
        keyword: 'Google Maps',
        url: 'https://maps.google.com',
        userId: testUser.id,
      });

      const response = await request(app)
        .get('/go/google%20maps')
        .expect(302);

      expect(response.headers.location).toBe('https://maps.google.com');
    });

    it('should handle multi-word keywords with plus signs', async () => {
      await bookmarkService.createBookmark({
        keyword: 'Google Maps',
        url: 'https://maps.google.com',
        userId: testUser.id,
      });

      const response = await request(app)
        .get('/go/google+maps')
        .expect(302);

      expect(response.headers.location).toBe('https://maps.google.com');
    });

    it('should increment usage count on redirect', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      await request(app).get('/go/google');
      await request(app).get('/go/google');

      const updated = await bookmarkService.getBookmarkById(bookmark.id);
      expect(updated.usage_count).toBe(2);
    });

    it('should handle search operator (?) with search template', async () => {
      await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        searchTemplate: 'https://google.com/search?q={query}',
        userId: testUser.id,
      });

      const response = await request(app)
        .get('/go/google?bing')
        .expect(302);

      expect(response.headers.location).toBe('https://google.com/search?q=bing');
    });

    it('should handle search operator with multi-word query', async () => {
      await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        searchTemplate: 'https://google.com/search?q={query}',
        userId: testUser.id,
      });

      const response = await request(app)
        .get('/go/google?hello%20world')
        .expect(302);

      expect(response.headers.location).toBe('https://google.com/search?q=hello%20world');
    });

    it('should redirect to base URL if search operator used but no template', async () => {
      await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const response = await request(app)
        .get('/go/google?bing')
        .expect(302);

      expect(response.headers.location).toBe('https://google.com');
    });

    it('should handle path operator (/) to append path', async () => {
      await bookmarkService.createBookmark({
        keyword: 'github',
        url: 'https://github.com',
        userId: testUser.id,
      });

      const response = await request(app)
        .get('/go/github/teamm8/Go-gov')
        .expect(302);

      expect(response.headers.location).toBe('https://github.com/teamm8/Go-gov');
    });

    it('should handle path operator with multiple segments', async () => {
      await bookmarkService.createBookmark({
        keyword: 'github',
        url: 'https://github.com',
        userId: testUser.id,
      });

      const response = await request(app)
        .get('/go/github/teamm8/Go-gov/issues/1')
        .expect(302);

      expect(response.headers.location).toBe('https://github.com/teamm8/Go-gov/issues/1');
    });

    it('should handle URL with trailing slash correctly', async () => {
      await bookmarkService.createBookmark({
        keyword: 'github',
        url: 'https://github.com/',
        userId: testUser.id,
      });

      const response = await request(app)
        .get('/go/github/teamm8')
        .expect(302);

      expect(response.headers.location).toBe('https://github.com/teamm8');
    });

    it('should show 404 page for non-existent keyword', async () => {
      const response = await request(app)
        .get('/go/nonexistent')
        .expect(404);

      expect(response.text).toContain('not found');
    });

    it('should record failed search for non-existent keyword', async () => {
      await request(app).get('/go/nonexistent');

      const failedSearches = await analyticsService.getTopFailedSearches(10);
      expect(failedSearches.length).toBeGreaterThan(0);
      expect(failedSearches[0].keyword).toBe('nonexistent');
    });

    it('should show suggestions for similar keywords', async () => {
      await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const response = await request(app)
        .get('/go/gogle')
        .expect(404);

      expect(response.text).toContain('google');
    });
  });

  describe('POST /go (search from landing page)', () => {
    it('should redirect from landing page search', async () => {
      await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const response = await request(app)
        .post('/go')
        .send({ keyword: 'google' })
        .expect(302);

      expect(response.headers.location).toBe('/go/google');
    });

    it('should handle empty search', async () => {
      const response = await request(app)
        .post('/go')
        .send({ keyword: '' })
        .expect(302);

      expect(response.headers.location).toBe('/');
    });
  });
});
