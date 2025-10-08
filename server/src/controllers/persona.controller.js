const Persona = require('../models/Persona.model');
const ChatMessage = require('../models/ChatMessage.model');
const ShareToken = require('../models/ShareToken.model');
const { generateShareToken, generateSessionId, createExpirationDate } = require('../utils/tokenGenerator');
const logger = require('../utils/logger');

/**
 * Create new persona
 */
const createPersona = async (req, res) => {
  const personaData = req.body;
  
  // Set owner if authenticated
  if (req.userId) {
    personaData.ownerId = req.userId;
    // Increment user stats
    req.user.stats.personasCreated += 1;
    await req.user.save({ validateBeforeSave: false });
  }

  const persona = new Persona(personaData);
  await persona.save();

  logger.info('Persona created:', { 
    personaId: persona._id, 
    ownerId: persona.ownerId,
    name: persona.name 
  });

  res.status(201).json({
    message: 'Persona created successfully',
    persona,
    // Return temporary edit token for anonymous personas
    editToken: !persona.ownerId ? 'temp_' + persona._id : undefined
  });
};

/**
 * Get personas with filtering and pagination
 */
const getPersonas = async (req, res) => {
  const { 
    page = 1, 
    limit = 20, 
    visibility, 
    ownerId, 
    search,
    tags,
    featured 
  } = req.query;

  const query = {};
  
  // Apply visibility filter
  if (visibility) {
    query['meta.visibility'] = visibility;
  } else if (!req.userId) {
    // Anonymous users can only see public personas
    query['meta.visibility'] = 'public';
  } else if (req.userId && !ownerId) {
    // Authenticated users see public and their own
    query.$or = [
      { 'meta.visibility': 'public' },
      { 'meta.visibility': 'unlisted' },
      { ownerId: req.userId }
    ];
  }

  // Filter by owner
  if (ownerId) {
    if (ownerId === req.userId || req.user?.hasRole('admin')) {
      query.ownerId = ownerId;
    } else {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Cannot view personas of other users'
      });
    }
  }

  // Featured filter
  if (featured === 'true') {
    query['meta.featured'] = true;
  }

  // Tags filter
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
    query['meta.tags'] = { $in: tagArray };
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [personas, total] = await Promise.all([
    Persona.find(query)
      .populate('ownerId', 'name')
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Persona.countDocuments(query)
  ]);

  res.json({
    personas: personas.map(p => req.userId || p.meta.visibility === 'public' ? p : p.toPublic()),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};

/**
 * Get single persona
 */
const getPersona = async (req, res) => {
  const { id } = req.params;

  const persona = await Persona.findById(id).populate('ownerId', 'name');
  
  if (!persona) {
    return res.status(404).json({
      error: 'Persona not found',
      message: 'The requested persona does not exist'
    });
  }

  // Check access permissions
  if (!persona.canView(req.userId)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You do not have permission to view this persona'
    });
  }

  // Increment view count (non-blocking)
  persona.incrementViews().catch(err => 
    logger.warn('Failed to increment persona views:', err)
  );

  res.json({
    persona: persona.canEdit(req.userId) ? persona : persona.toPublic()
  });
};

/**
 * Update persona
 */
const updatePersona = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const persona = await Persona.findById(id);
  
  if (!persona) {
    return res.status(404).json({
      error: 'Persona not found',
      message: 'The requested persona does not exist'
    });
  }

  // Check ownership
  if (!persona.canEdit(req.userId)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only edit your own personas'
    });
  }

  // Apply updates
  Object.keys(updates).forEach(key => {
    if (key !== 'ownerId' && key !== '_id') { // Prevent ownership changes
      persona[key] = updates[key];
    }
  });

  await persona.save();

  logger.info('Persona updated:', { 
    personaId: persona._id, 
    ownerId: persona.ownerId 
  });

  res.json({
    message: 'Persona updated successfully',
    persona
  });
};

/**
 * Delete persona
 */
const deletePersona = async (req, res) => {
  const { id } = req.params;

  const persona = await Persona.findById(id);
  
  if (!persona) {
    return res.status(404).json({
      error: 'Persona not found',
      message: 'The requested persona does not exist'
    });
  }

  // Check ownership
  if (!persona.canEdit(req.userId)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You can only delete your own personas'
    });
  }

  // Delete associated data
  await Promise.all([
    ChatMessage.deleteMany({ personaId: id }),
    ShareToken.deleteMany({ personaId: id }),
    Persona.findByIdAndDelete(id)
  ]);

  logger.info('Persona deleted:', { 
    personaId: id, 
    ownerId: persona.ownerId 
  });

  res.json({
    message: 'Persona deleted successfully'
  });
};

/**
 * Add chat message and optionally generate persona response
 */
const addChatMessage = async (req, res) => {
  const { id } = req.params;
  const { sender, text, sessionId, serverReply } = req.body;

  const persona = await Persona.findById(id);
  
  if (!persona) {
    return res.status(404).json({
      error: 'Persona not found',
      message: 'The requested persona does not exist'
    });
  }

  // Check if user can chat with this persona
  if (!persona.canView(req.userId)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You cannot chat with this persona'
    });
  }

  const chatSessionId = sessionId || generateSessionId();

  // Save user message
  const userMessage = new ChatMessage({
    personaId: id,
    sessionId: chatSessionId,
    sender,
    text,
    metadata: {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    }
  });

  await userMessage.save();

  let personaResponse = null;

  // Generate persona response if requested and server inference is enabled
  if (serverReply && (process.env.INFER_MODE === 'rule' || process.env.INFER_MODE === 'tfjs')) {
    const startTime = Date.now();
    
    try {
      const responseText = await generatePersonaResponse(persona, text, chatSessionId);
      
      personaResponse = new ChatMessage({
        personaId: id,
        sessionId: chatSessionId,
        sender: 'persona',
        text: responseText,
        metadata: {
          responseTime: Date.now() - startTime,
          model: process.env.INFER_MODE,
          confidence: 0.8 // Placeholder
        }
      });

      await personaResponse.save();
      
      // Update persona stats
      persona.incrementChats().catch(err => 
        logger.warn('Failed to increment persona chats:', err)
      );

    } catch (error) {
      logger.error('Failed to generate persona response:', error);
      // Continue without server response
    }
  }

  res.status(201).json({
    message: 'Message added successfully',
    userMessage,
    personaResponse,
    sessionId: chatSessionId
  });
};

/**
 * Get chat history for persona
 */
const getChatHistory = async (req, res) => {
  const { id } = req.params;
  const { sessionId, page = 1, limit = 50 } = req.query;

  const persona = await Persona.findById(id);
  
  if (!persona) {
    return res.status(404).json({
      error: 'Persona not found',
      message: 'The requested persona does not exist'
    });
  }

  if (!persona.canView(req.userId)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You cannot view chat history for this persona'
    });
  }

  const query = { personaId: id };
  if (sessionId) {
    query.sessionId = sessionId;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const messages = await ChatMessage.find(query)
    .sort({ ts: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({
    messages: messages.map(m => m.toPublic()),
    sessionId
  });
};

/**
 * Create share link for persona
 */
const createShareLink = async (req, res) => {
  const { id } = req.params;

  const persona = await Persona.findById(id);
  
  if (!persona) {
    return res.status(404).json({
      error: 'Persona not found',
      message: 'The requested persona does not exist'
    });
  }

  // Check if user can share this persona
  if (!persona.canView(req.userId)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You cannot share this persona'
    });
  }

  const token = generateShareToken();
  const expiresAt = createExpirationDate();

  const shareToken = new ShareToken({
    personaId: id,
    token,
    expiresAt,
    createdBy: req.userId || null
  });

  await shareToken.save();

  const shareUrl = `${req.protocol}://${req.get('host')}/s/${token}`;

  logger.info('Share link created:', { 
    personaId: id, 
    token, 
    createdBy: req.userId 
  });

  res.status(201).json({
    message: 'Share link created successfully',
    shareUrl,
    token,
    expiresAt
  });
};

/**
 * Export persona data
 */
const exportPersona = async (req, res) => {
  const { id } = req.params;

  const persona = await Persona.findById(id).populate('ownerId', 'name');
  
  if (!persona) {
    return res.status(404).json({
      error: 'Persona not found',
      message: 'The requested persona does not exist'
    });
  }

  // Check access permissions
  if (!persona.canView(req.userId)) {
    return res.status(403).json({
      error: 'Access denied',
      message: 'You cannot export this persona'
    });
  }

  const exportData = {
    persona: persona.canEdit(req.userId) ? persona : persona.toPublic(),
    exportedAt: new Date().toISOString(),
    exportedBy: req.user?.name || 'Anonymous'
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${persona.name}_persona.json"`);
  
  res.json(exportData);
};

/**
 * Generate persona response using rule-based system
 */
async function generatePersonaResponse(persona, userMessage, sessionId) {
  if (process.env.INFER_MODE === 'rule') {
    return generateRuleBasedResponse(persona, userMessage);
  } else if (process.env.INFER_MODE === 'tfjs') {
    // Placeholder for TensorFlow.js implementation
    return generateRuleBasedResponse(persona, userMessage);
  }
  
  throw new Error('Server-side inference not configured');
}

/**
 * Rule-based response generation
 */
function generateRuleBasedResponse(persona, userMessage) {
  const templates = [
    "That's interesting! ",
    "I see what you mean. ",
    "From my perspective, ",
    "You know what I think? ",
    "That reminds me of "
  ];

  const responses = [
    "it's all about finding the right balance.",
    "there's always more to explore on that topic.",
    "that's something worth thinking about more.",
    "it really depends on how you look at it.",
    "every situation is unique in its own way."
  ];

  const template = templates[Math.floor(Math.random() * templates.length)];
  const response = responses[Math.floor(Math.random() * responses.length)];
  
  let reply = template + response;

  // Apply persona characteristics
  if (persona.energy > 0.7) {
    reply += " I'm excited to discuss this further!";
  }

  if (persona.signaturePhrases && persona.signaturePhrases.length > 0) {
    const phrase = persona.signaturePhrases[Math.floor(Math.random() * persona.signaturePhrases.length)];
    reply += ` ${phrase}`;
  }

  if (persona.emojiStyle && Math.random() > 0.5) {
    const emojis = persona.emojiStyle.split(' ');
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    reply += ` ${emoji}`;
  }

  return reply;
}

module.exports = {
  createPersona,
  getPersonas,
  getPersona,
  updatePersona,
  deletePersona,
  addChatMessage,
  getChatHistory,
  createShareLink,
  exportPersona
};