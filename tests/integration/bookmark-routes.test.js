const request = require('supertest');
const express = require('express');
const session = require('express-session');
const bookmarkRoutes = require('../../src/routes/bookmarks');
const bookmarkService = require('../../src/services/bookmark-service');
const { getTestPool, cleanDatabase, createTestUser, closeTestDatabase } = require('../helpers/db-helper');

// Create a minimal express app for testing
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session middleware for auth
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
  }));

  // Mock authentication
  app.use((req, res, next) => {
    if (req.session && req.session.userId) {
      req.user = { id: req.session.userId, role: req.session.userRole || 'user' };
      req.isAuthenticated = () => true;
    } else {
      req.isAuthenticated = () => false;
    }
    next();
  });

  app.use('/bookmarks', bookmarkRoutes);

  // Mock view engine
  app.set('view engine', 'njk');
  app.engine('njk', (path, options, callback) => {
    callback(null, JSON.stringify(options));
  });

  return app;
}

describe('Bookmark Routes Integration Tests', () => {
  let app;
  let testUser;
  let adminUser;

  beforeAll(() => {
    getTestPool();
    app = createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase();
    testUser = await createTestUser({ role: 'user' });
    adminUser = await createTestUser({ email: 'admin@test.gov.uk', role: 'admin' });
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  describe('GET /bookmarks', () => {
    it('should list all bookmarks', async () => {
      await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const agent = request.agent(app);
      agent.session = { userId: testUser.id };

      const response = await agent
        .get('/bookmarks')
        .expect(200);

      const data = JSON.parse(response.text);
      expect(data.bookmarks).toBeDefined();
      expect(data.bookmarks.length).toBeGreaterThan(0);
    });
  });

  describe('GET /bookmarks/new', () => {
    it('should show create form for authenticated users', async () => {
      const agent = request.agent(app);
      agent.session = { userId: testUser.id };

      const response = await agent
        .get('/bookmarks/new')
        .expect(200);

      expect(response.text).toContain('pageTitle');
    });

    it('should pre-fill keyword from query param', async () => {
      const agent = request.agent(app);
      agent.session = { userId: testUser.id };

      const response = await agent
        .get('/bookmarks/new?keyword=google')
        .expect(200);

      const data = JSON.parse(response.text);
      expect(data.keyword).toBe('google');
    });
  });

  describe('POST /bookmarks', () => {
    it('should create a new bookmark', async () => {
      const agent = request.agent(app);
      agent.session = { userId: testUser.id };

      const response = await agent
        .post('/bookmarks')
        .send({
          keyword: 'google',
          url: 'https://google.com',
          description: 'Google search',
        })
        .expect(302);

      expect(response.headers.location).toMatch(/\/bookmarks\/\d+/);

      const bookmark = await bookmarkService.getBookmarkByKeyword('google');
      expect(bookmark).toBeDefined();
      expect(bookmark.url).toBe('https://google.com');
    });

    it('should validate required fields', async () => {
      const agent = request.agent(app);
      agent.session = { userId: testUser.id };

      const response = await agent
        .post('/bookmarks')
        .send({
          keyword: '',
          url: '',
        })
        .expect(400);

      const data = JSON.parse(response.text);
      expect(data.errors).toBeDefined();
    });

    it('should reject invalid URLs', async () => {
      const agent = request.agent(app);
      agent.session = { userId: testUser.id };

      const response = await agent
        .post('/bookmarks')
        .send({
          keyword: 'test',
          url: 'not-a-url',
        })
        .expect(400);

      const data = JSON.parse(response.text);
      expect(data.errors).toBeDefined();
    });
  });

  describe('GET /bookmarks/:id', () => {
    it('should show bookmark details', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const agent = request.agent(app);
      agent.session = { userId: testUser.id };

      const response = await agent
        .get(`/bookmarks/${bookmark.id}`)
        .expect(200);

      const data = JSON.parse(response.text);
      expect(data.bookmark.keyword).toBe('google');
    });

    it('should return 404 for non-existent bookmark', async () => {
      const agent = request.agent(app);
      agent.session = { userId: testUser.id };

      await agent
        .get('/bookmarks/99999')
        .expect(404);
    });
  });

  describe('GET /bookmarks/:id/edit', () => {
    it('should show edit form for authenticated users', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const agent = request.agent(app);
      agent.session = { userId: testUser.id };

      const response = await agent
        .get(`/bookmarks/${bookmark.id}/edit`)
        .expect(200);

      const data = JSON.parse(response.text);
      expect(data.bookmark.keyword).toBe('google');
    });
  });

  describe('POST /bookmarks/:id', () => {
    it('should update bookmark', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const agent = request.agent(app);
      agent.session = { userId: testUser.id };

      const response = await agent
        .post(`/bookmarks/${bookmark.id}`)
        .send({
          url: 'https://www.google.com',
          description: 'Updated description',
        })
        .expect(302);

      const updated = await bookmarkService.getBookmarkById(bookmark.id);
      expect(updated.url).toBe('https://www.google.com');
      expect(updated.description).toBe('Updated description');
    });

    it('should allow changing keyword', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const agent = request.agent(app);
      agent.session = { userId: testUser.id };

      await agent
        .post(`/bookmarks/${bookmark.id}`)
        .send({
          keyword: 'google search',
        })
        .expect(302);

      const updated = await bookmarkService.getBookmarkById(bookmark.id);
      expect(updated.keyword).toBe('google search');
    });
  });

  describe('POST /bookmarks/:id/delete', () => {
    it('should allow admin to delete bookmark', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const agent = request.agent(app);
      agent.session = { userId: adminUser.id, userRole: 'admin' };

      await agent
        .post(`/bookmarks/${bookmark.id}/delete`)
        .expect(302);

      const deleted = await bookmarkService.getBookmarkById(bookmark.id);
      expect(deleted).toBeNull();
    });

    it('should prevent non-admin from deleting bookmark', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      const agent = request.agent(app);
      agent.session = { userId: testUser.id };

      await agent
        .post(`/bookmarks/${bookmark.id}/delete`)
        .expect(403);

      const stillExists = await bookmarkService.getBookmarkById(bookmark.id);
      expect(stillExists).toBeDefined();
    });
  });

  describe('GET /bookmarks/:id/history', () => {
    it('should show bookmark edit history', async () => {
      const bookmark = await bookmarkService.createBookmark({
        keyword: 'google',
        url: 'https://google.com',
        userId: testUser.id,
      });

      await bookmarkService.updateBookmark(bookmark.id, {
        url: 'https://www.google.com',
        userId: testUser.id,
      });

      const agent = request.agent(app);
      agent.session = { userId: testUser.id };

      const response = await agent
        .get(`/bookmarks/${bookmark.id}/history`)
        .expect(200);

      const data = JSON.parse(response.text);
      expect(data.history.length).toBeGreaterThanOrEqual(2);
    });
  });
});
