const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const ShareToken = require('../models/ShareToken.model');
const Persona = require('../models/Persona.model');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Public persona view via share token
 * GET /s/:token
 */
router.get('/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  // Find the share token
  const shareToken = await ShareToken.findOne({ token }).populate({
    path: 'personaId',
    populate: {
      path: 'ownerId',
      select: 'name'
    }
  });

  if (!shareToken) {
    return res.status(404).json({
      error: 'Share link not found',
      message: 'This share link does not exist or has been removed'
    });
  }

  // Check if token is valid
  if (!shareToken.isValid()) {
    return res.status(410).json({
      error: 'Share link expired',
      message: 'This share link has expired or reached its visit limit'
    });
  }

  const persona = shareToken.personaId;

  if (!persona) {
    return res.status(404).json({
      error: 'Persona not found',
      message: 'The persona associated with this share link no longer exists'
    });
  }

  // Increment visit count (non-blocking)
  shareToken.incrementVisits().catch(err => 
    logger.warn('Failed to increment share token visits:', err)
  );

  // Increment persona views (non-blocking)
  persona.incrementViews().catch(err => 
    logger.warn('Failed to increment persona views:', err)
  );

  logger.info('Share link accessed:', {
    token,
    personaId: persona._id,
    visits: shareToken.visits + 1,
    ip: req.ip
  });

  res.json({
    persona: persona.toPublic(),
    shareToken: {
      token,
      visits: shareToken.visits,
      expiresAt: shareToken.expiresAt,
      createdAt: shareToken.createdAt
    }
  });
}));

module.exports = router;