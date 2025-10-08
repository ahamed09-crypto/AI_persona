const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const Persona = require('../models/Persona.model');
const User = require('../models/User.model');
const ChatMessage = require('../models/ChatMessage.model');
const ShareToken = require('../models/ShareToken.model');
const { Analytics } = require('../models/ShareToken.model');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * Get all personas for moderation
 * GET /api/admin/personas
 */
router.get('/personas', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50, 
    visibility, 
    flagged,
    search 
  } = req.query;

  const query = {};

  if (visibility) {
    query['meta.visibility'] = visibility;
  }

  if (flagged === 'true') {
    query['meta.flagged'] = true;
  }

  if (search) {
    query.$text = { $search: search };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [personas, total] = await Promise.all([
    Persona.find(query)
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Persona.countDocuments(query)
  ]);

  res.json({
    personas,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

/**
 * Update persona visibility/moderation status
 * PATCH /api/admin/personas/:id
 */
router.patch('/personas/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { visibility, featured, flagged, moderatorNote } = req.body;

  const persona = await Persona.findById(id);
  
  if (!persona) {
    return res.status(404).json({
      error: 'Persona not found',
      message: 'The requested persona does not exist'
    });
  }

  // Update moderation fields
  if (visibility) persona.meta.visibility = visibility;
  if (typeof featured === 'boolean') persona.meta.featured = featured;
  if (typeof flagged === 'boolean') persona.meta.flagged = flagged;
  if (moderatorNote) persona.meta.moderatorNote = moderatorNote;

  persona.meta.lastModerated = new Date();
  persona.meta.moderatedBy = req.userId;

  await persona.save();

  res.json({
    message: 'Persona updated successfully',
    persona
  });
}));

/**
 * Get platform statistics
 * GET /api/admin/stats
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalPersonas,
    publicPersonas,
    totalChats,
    totalShares
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastSeen: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
    Persona.countDocuments(),
    Persona.countDocuments({ 'meta.visibility': 'public' }),
    ChatMessage.countDocuments(),
    ShareToken.countDocuments()
  ]);

  // Get recent activity
  const recentPersonas = await Persona.find()
    .populate('ownerId', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name ownerId createdAt meta.visibility');

  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name email createdAt');

  res.json({
    stats: {
      totalUsers,
      activeUsers,
      totalPersonas,
      publicPersonas,
      totalChats,
      totalShares
    },
    recent: {
      personas: recentPersonas,
      users: recentUsers
    }
  });
}));

/**
 * Get user management data
 * GET /api/admin/users
 */
router.get('/users', asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 50,
    search,
    role,
    active
  } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  if (role) {
    query.roles = role;
  }

  if (typeof active === 'boolean') {
    query.isActive = active === 'true';
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    User.countDocuments(query)
  ]);

  res.json({
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
}));

/**
 * Update user status/roles
 * PATCH /api/admin/users/:id
 */
router.patch('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, roles } = req.body;

  if (id === req.userId) {
    return res.status(400).json({
      error: 'Cannot modify own account',
      message: 'You cannot modify your own admin account'
    });
  }

  const user = await User.findById(id).select('-passwordHash');
  
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: 'The requested user does not exist'
    });
  }

  if (typeof isActive === 'boolean') user.isActive = isActive;
  if (Array.isArray(roles)) user.roles = roles;

  await user.save();

  res.json({
    message: 'User updated successfully',
    user
  });
}));

/**
 * Delete persona (admin override)
 * DELETE /api/admin/personas/:id
 */
router.delete('/personas/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const persona = await Persona.findById(id);
  
  if (!persona) {
    return res.status(404).json({
      error: 'Persona not found',
      message: 'The requested persona does not exist'
    });
  }

  // Delete associated data
  await Promise.all([
    ChatMessage.deleteMany({ personaId: id }),
    ShareToken.deleteMany({ personaId: id }),
    Persona.findByIdAndDelete(id)
  ]);

  res.json({
    message: 'Persona deleted successfully'
  });
}));

module.exports = router;