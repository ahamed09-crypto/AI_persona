const express = require('express');
const Joi = require('joi');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const personaController = require('../controllers/persona.controller');

const router = express.Router();

// Validation schemas
const createPersonaSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  avatar: Joi.string().max(10).default('🤖'),
  tagline: Joi.string().max(200).required(),
  traits: Joi.array().items(Joi.string().max(30)).max(10),
  tone: Joi.string().valid('formal', 'casual', 'friendly', 'professional', 'creative', 'analytical').default('friendly'),
  formality: Joi.number().min(0).max(1).default(0.5),
  energy: Joi.number().min(0).max(1).default(0.5),
  emojiStyle: Joi.string().max(100).default('😊 👍 🌟'),
  favoriteWords: Joi.array().items(Joi.string().max(50)).max(20),
  signaturePhrases: Joi.array().items(Joi.string().max(200)).max(10),
  seedText: Joi.string().min(50).max(10000).required(),
  analysisData: Joi.object(),
  meta: Joi.object({
    visibility: Joi.string().valid('private', 'public', 'unlisted').default('private'),
    tags: Joi.array().items(Joi.string().max(20)).max(10)
  }).default({})
});

const updatePersonaSchema = createPersonaSchema.fork(['name', 'tagline', 'seedText'], field => field.optional());

const chatMessageSchema = Joi.object({
  sender: Joi.string().valid('user', 'persona').required(),
  text: Joi.string().min(1).max(1000).required(),
  sessionId: Joi.string().optional(),
  serverReply: Joi.boolean().default(false)
});

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        message: error.details[0].message
      });
    }
    next();
  };
};

// Routes

// Create persona (auth optional - allows anonymous personas)
router.post('/',
  optionalAuth,
  validateRequest(createPersonaSchema),
  asyncHandler(personaController.createPersona)
);

// List personas with filtering
router.get('/',
  optionalAuth,
  asyncHandler(personaController.getPersonas)
);

// Get single persona
router.get('/:id',
  optionalAuth,
  asyncHandler(personaController.getPersona)
);

// Update persona (requires ownership)
router.put('/:id',
  authenticateToken,
  validateRequest(updatePersonaSchema),
  asyncHandler(personaController.updatePersona)
);

// Delete persona (requires ownership)
router.delete('/:id',
  authenticateToken,
  asyncHandler(personaController.deletePersona)
);

// Chat with persona
router.post('/:id/chat',
  optionalAuth,
  validateRequest(chatMessageSchema),
  asyncHandler(personaController.addChatMessage)
);

// Get chat history
router.get('/:id/chat',
  optionalAuth,
  asyncHandler(personaController.getChatHistory)
);

// Create share link
router.post('/:id/share',
  optionalAuth,
  asyncHandler(personaController.createShareLink)
);

// Export persona data
router.get('/:id/export',
  optionalAuth,
  asyncHandler(personaController.exportPersona)
);

// Server-side persona generation (Full mode only)
if (process.env.INFER_MODE === 'rule' || process.env.INFER_MODE === 'tfjs') {
  router.post('/:id/generate',
    optionalAuth,
    asyncHandler(personaController.generateResponse)
  );
}

module.exports = router;