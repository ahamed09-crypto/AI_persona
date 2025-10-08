const { verifyJWT } = require('../utils/tokenGenerator');
const User = require('../models/User.model');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate users with JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    // Verify the token
    const decoded = verifyJWT(token);
    
    // Find the user
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'User not found or account deactivated'
      });
    }

    // Update last seen
    user.updateLastSeen().catch(err => 
      logger.warn('Failed to update user last seen:', err)
    );

    // Add user to request object
    req.user = user;
    req.userId = user._id.toString();
    
    next();
  } catch (error) {
    logger.warn('Authentication failed:', error.message);
    
    return res.status(401).json({
      error: 'Invalid token',
      message: error.message || 'Authentication failed'
    });
  }
};

/**
 * Optional authentication - continues even without token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyJWT(token);
      const user = await User.findById(decoded.userId).select('-passwordHash');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id.toString();
        
        // Update last seen (non-blocking)
        user.updateLastSeen().catch(err => 
          logger.warn('Failed to update user last seen:', err)
        );
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth - just log and continue
    logger.debug('Optional auth failed:', error.message);
    next();
  }
};

/**
 * Middleware to require admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Admin access requires authentication'
    });
  }

  if (!req.user.hasRole('admin')) {
    return res.status(403).json({
      error: 'Insufficient permissions',
      message: 'Admin role required for this action'
    });
  }

  next();
};

/**
 * Middleware to check resource ownership
 */
const requireOwnership = (resourceIdParam = 'id', userIdField = 'ownerId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be logged in to access this resource'
        });
      }

      // This middleware assumes the route handler will verify ownership
      // by checking the resource's userIdField matches userId
      req.resourceId = resourceId;
      req.userIdField = userIdField;
      
      next();
    } catch (error) {
      logger.error('Ownership check failed:', error);
      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to verify resource ownership'
      });
    }
  };
};

/**
 * Rate limiting wrapper for authenticated users
 */
const authRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) return next(); // Skip for unauthenticated requests

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (!userRequests.has(userId)) {
      userRequests.set(userId, []);
    }

    const requests = userRequests.get(userId);
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Maximum ${maxRequests} per ${windowMs / 1000 / 60} minutes.`,
        retryAfter: Math.ceil((validRequests[0] - windowStart) / 1000)
      });
    }

    validRequests.push(now);
    userRequests.set(userId, validRequests);
    
    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireAdmin,
  requireOwnership,
  authRateLimit
};