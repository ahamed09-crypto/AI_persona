const jwt = require('jsonwebtoken');
const { nanoid } = require('nanoid');
const crypto = require('crypto');

/**
 * Generate JWT token for user authentication
 */
function generateJWT(payload, options = {}) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'ai-persona-writer',
    audience: 'ai-persona-writer-users'
  };

  return jwt.sign(payload, secret, { ...defaultOptions, ...options });
}

/**
 * Verify JWT token
 */
function verifyJWT(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  try {
    return jwt.verify(token, secret, {
      issuer: 'ai-persona-writer',
      audience: 'ai-persona-writer-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Generate secure share token
 */
function generateShareToken(length = null) {
  const tokenLength = length || parseInt(process.env.SHARE_TOKEN_LENGTH) || 8;
  return nanoid(tokenLength);
}

/**
 * Generate session ID for chat sessions
 */
function generateSessionId() {
  return `session_${nanoid(16)}_${Date.now()}`;
}

/**
 * Generate temporary edit token for anonymous personas
 */
function generateEditToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate API key for integrations
 */
function generateAPIKey(prefix = 'apw') {
  const randomPart = crypto.randomBytes(24).toString('hex');
  return `${prefix}_${randomPart}`;
}

/**
 * Hash sensitive data (for storing edit tokens, etc.)
 */
function hashData(data, salt = null) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512').toString('hex');
  return {
    hash,
    salt: actualSalt
  };
}

/**
 * Verify hashed data
 */
function verifyHashedData(data, hash, salt) {
  const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

/**
 * Create expiration date for share tokens
 */
function createExpirationDate(days = null) {
  const expiryDays = days || parseInt(process.env.SHARE_TOKEN_EXPIRES_DAYS) || 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);
  return expiresAt;
}

/**
 * Generate a temporary download token for exports
 */
function generateDownloadToken(personaId, userId = null) {
  const payload = {
    type: 'download',
    personaId,
    userId,
    iat: Date.now()
  };

  return generateJWT(payload, { expiresIn: '1h' });
}

module.exports = {
  generateJWT,
  verifyJWT,
  generateShareToken,
  generateSessionId,
  generateEditToken,
  generateAPIKey,
  hashData,
  verifyHashedData,
  createExpirationDate,
  generateDownloadToken
};