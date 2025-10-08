const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const supertest = require('supertest');
const { app } = require('../index');
const User = require('../models/User.model');
const Persona = require('../models/Persona.model');
const { generateJWT, generateShareToken } = require('../utils/tokenGenerator');

describe('Persona API Tests', () => {
  let mongoServer;
  let testUser;
  let authToken;
  let request;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Setup test client
    request = supertest(app);

    // Create test user
    testUser = new User({
      email: 'test@example.com',
      passwordHash: 'testpassword123',
      name: 'Test User',
      roles: ['user']
    });
    await testUser.save();

    // Generate auth token
    authToken = generateJWT({
      userId: testUser._id,
      email: testUser.email,
      roles: testUser.roles
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear personas before each test
    await Persona.deleteMany({});
  });

  describe('POST /api/personas', () => {
    const validPersonaData = {
      name: 'TestBot',
      tagline: 'A test persona for automated testing',
      seedText: 'This is a test persona created during automated testing. It has enough characters to pass validation and demonstrates the persona creation functionality.',
      traits: ['Friendly', 'Helpful'],
      tone: 'friendly',
      formality: 0.5,
      energy: 0.7,
      meta: {
        visibility: 'private'
      }
    };

    it('should create persona for authenticated user', async () => {
      const response = await request
        .post('/api/personas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validPersonaData)
        .expect(201);

      expect(response.body.message).toBe('Persona created successfully');
      expect(response.body.persona.name).toBe('TestBot');
      expect(response.body.persona.ownerId).toBe(testUser._id.toString());
    });

    it('should create anonymous persona without auth', async () => {
      const response = await request
        .post('/api/personas')
        .send(validPersonaData)
        .expect(201);

      expect(response.body.persona.ownerId).toBeNull();
      expect(response.body.editToken).toBeDefined();
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        name: 'A', // Too short
        tagline: 'Test',
        seedText: 'Too short' // Under 50 characters
      };

      await request
        .post('/api/personas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should fail with missing required fields', async () => {
      const incompleteData = {
        name: 'TestBot'
        // Missing tagline and seedText
      };

      await request
        .post('/api/personas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(incompleteData)
        .expect(400);
    });
  });

  describe('GET /api/personas', () => {
    beforeEach(async () => {
      // Create test personas
      await Promise.all([
        new Persona({
          ...{ 
            name: 'PublicBot',
            tagline: 'A public test persona',
            seedText: 'This is a public persona that should be visible to everyone, including anonymous users browsing the platform.',
            ownerId: testUser._id,
            meta: { visibility: 'public' }
          }
        }).save(),
        new Persona({
          name: 'PrivateBot',
          tagline: 'A private test persona',
          seedText: 'This is a private persona that should only be visible to its owner and not appear in public listings.',
          ownerId: testUser._id,
          meta: { visibility: 'private' }
        }).save(),
        new Persona({
          name: 'AnonymousBot',
          tagline: 'An anonymous persona',
          seedText: 'This persona was created without authentication and should have no owner associated with it.',
          ownerId: null,
          meta: { visibility: 'public' }
        }).save()
      ]);
    });

    it('should return public personas for anonymous users', async () => {
      const response = await request
        .get('/api/personas')
        .expect(200);

      expect(response.body.personas).toHaveLength(2);
      response.body.personas.forEach(persona => {
        expect(persona.meta.visibility).toBe('public');
      });
    });

    it('should return public and own personas for authenticated users', async () => {
      const response = await request
        .get('/api/personas')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.personas).toHaveLength(3);
    });

    it('should support pagination', async () => {
      const response = await request
        .get('/api/personas?page=1&limit=2')
        .expect(200);

      expect(response.body.personas).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should filter by visibility', async () => {
      const response = await request
        .get('/api/personas?visibility=public')
        .expect(200);

      response.body.personas.forEach(persona => {
        expect(persona.meta.visibility).toBe('public');
      });
    });
  });

  describe('GET /api/personas/:id', () => {
    let testPersona;

    beforeEach(async () => {
      testPersona = new Persona({
        name: 'TestViewBot',
        tagline: 'A persona for view testing',
        seedText: 'This persona is used to test the individual persona viewing functionality and access permissions.',
        ownerId: testUser._id,
        meta: { visibility: 'private' }
      });
      await testPersona.save();
    });

    it('should return persona for owner', async () => {
      const response = await request
        .get(`/api/personas/${testPersona._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.persona._id).toBe(testPersona._id.toString());
      expect(response.body.persona.seedText).toBeDefined(); // Full data for owner
    });

    it('should deny access to private persona for non-owner', async () => {
      await request
        .get(`/api/personas/${testPersona._id}`)
        .expect(403);
    });

    it('should return 404 for non-existent persona', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request
        .get(`/api/personas/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Share Token Generation', () => {
    it('should generate valid share tokens', () => {
      const token1 = generateShareToken();
      const token2 = generateShareToken();

      expect(token1).toBeDefined();
      expect(token1).toHaveLength(8); // Default length
      expect(token1).not.toBe(token2); // Should be unique
      expect(token1).toMatch(/^[A-Za-z0-9_-]+$/); // URL-safe characters
    });

    it('should generate tokens with custom length', () => {
      const shortToken = generateShareToken(4);
      const longToken = generateShareToken(16);

      expect(shortToken).toHaveLength(4);
      expect(longToken).toHaveLength(16);
    });
  });

  describe('PUT /api/personas/:id', () => {
    let testPersona;

    beforeEach(async () => {
      testPersona = new Persona({
        name: 'UpdateTestBot',
        tagline: 'A persona for update testing',
        seedText: 'This persona will be used to test the update functionality and ensure proper authorization checks.',
        ownerId: testUser._id,
        meta: { visibility: 'private' }
      });
      await testPersona.save();
    });

    it('should update persona for owner', async () => {
      const updates = {
        name: 'UpdatedBot',
        tagline: 'An updated test persona',
        meta: { visibility: 'public' }
      };

      const response = await request
        .put(`/api/personas/${testPersona._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.persona.name).toBe('UpdatedBot');
      expect(response.body.persona.meta.visibility).toBe('public');
    });

    it('should deny update for non-owner', async () => {
      // Create another user
      const otherUser = new User({
        email: 'other@example.com',
        passwordHash: 'password123',
        name: 'Other User',
        roles: ['user']
      });
      await otherUser.save();

      const otherToken = generateJWT({
        userId: otherUser._id,
        email: otherUser.email,
        roles: otherUser.roles
      });

      await request
        .put(`/api/personas/${testPersona._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'HackedBot' })
        .expect(403);
    });

    it('should require authentication', async () => {
      await request
        .put(`/api/personas/${testPersona._id}`)
        .send({ name: 'HackedBot' })
        .expect(401);
    });
  });

  describe('DELETE /api/personas/:id', () => {
    let testPersona;

    beforeEach(async () => {
      testPersona = new Persona({
        name: 'DeleteTestBot',
        tagline: 'A persona for delete testing',
        seedText: 'This persona will be used to test the delete functionality and cleanup of associated data.',
        ownerId: testUser._id,
        meta: { visibility: 'private' }
      });
      await testPersona.save();
    });

    it('should delete persona for owner', async () => {
      await request
        .delete(`/api/personas/${testPersona._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify persona is deleted
      const deletedPersona = await Persona.findById(testPersona._id);
      expect(deletedPersona).toBeNull();
    });

    it('should deny delete for non-owner', async () => {
      // Create another user
      const otherUser = new User({
        email: 'other2@example.com',
        passwordHash: 'password123',
        name: 'Other User 2',
        roles: ['user']
      });
      await otherUser.save();

      const otherToken = generateJWT({
        userId: otherUser._id,
        email: otherUser.email,
        roles: otherUser.roles
      });

      await request
        .delete(`/api/personas/${testPersona._id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);

      // Verify persona still exists
      const existingPersona = await Persona.findById(testPersona._id);
      expect(existingPersona).toBeTruthy();
    });
  });
});