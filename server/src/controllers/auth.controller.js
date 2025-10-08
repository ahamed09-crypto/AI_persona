const User = require('../models/User.model');
const { generateJWT } = require('../utils/tokenGenerator');
const logger = require('../utils/logger');

/**
 * Register new user
 */
const register = async (req, res) => {
  const { email, password, name } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({
      error: 'User already exists',
      message: 'An account with this email already exists'
    });
  }

  // Create new user
  const user = new User({
    email: email.toLowerCase(),
    passwordHash: password, // Will be hashed by pre-save middleware
    name: name.trim()
  });

  await user.save();

  // Generate JWT token
  const token = generateJWT({
    userId: user._id,
    email: user.email,
    roles: user.roles
  });

  logger.info('New user registered:', { email: user.email, userId: user._id });

  res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      createdAt: user.createdAt
    }
  });
};

/**
 * Login user
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for verification
  const user = await User.findOne({ 
    email: email.toLowerCase(), 
    isActive: true 
  });

  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect'
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      error: 'Invalid credentials',
      message: 'Email or password is incorrect'
    });
  }

  // Update last seen
  await user.updateLastSeen();

  // Generate JWT token
  const token = generateJWT({
    userId: user._id,
    email: user.email,
    roles: user.roles
  });

  logger.info('User logged in:', { email: user.email, userId: user._id });

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      lastSeen: user.lastSeen,
      stats: user.stats
    }
  });
};

/**
 * Get current user profile
 */
const getMe = async (req, res) => {
  const user = req.user;

  res.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      lastSeen: user.lastSeen,
      preferences: user.preferences,
      stats: user.stats,
      createdAt: user.createdAt
    }
  });
};

/**
 * Refresh token (placeholder for future implementation)
 */
const refresh = async (req, res) => {
  // This would typically use refresh tokens stored in httpOnly cookies
  // For now, return an error asking user to login again
  res.status(401).json({
    error: 'Token refresh not implemented',
    message: 'Please login again to get a new token'
  });
};

/**
 * Logout user (placeholder - mainly for clearing client-side tokens)
 */
const logout = async (req, res) => {
  // In a more advanced implementation, you might:
  // 1. Add token to blacklist
  // 2. Clear refresh token cookies
  // 3. Update user's last seen time

  const user = req.user;
  await user.updateLastSeen();

  logger.info('User logged out:', { email: user.email, userId: user._id });

  res.json({
    message: 'Logout successful'
  });
};

module.exports = {
  register,
  login,
  getMe,
  refresh,
  logout
};