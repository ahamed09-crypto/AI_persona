const mongoose = require('mongoose');

const shareTokenSchema = new mongoose.Schema({
  personaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    required: [true, 'Persona ID is required']
  },
  token: {
    type: String,
    required: [true, 'Token is required'],
    unique: true,
    index: true
  },
  visits: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  metadata: {
    maxVisits: { type: Number, default: null }, // null = unlimited
    requireAuth: { type: Boolean, default: false },
    allowedDomains: [String]
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Method to check if token is valid
shareTokenSchema.methods.isValid = function() {
  if (this.expiresAt < new Date()) return false;
  if (this.metadata.maxVisits && this.visits >= this.metadata.maxVisits) return false;
  return true;
};

// Method to increment visit count
shareTokenSchema.methods.incrementVisits = function() {
  this.visits += 1;
  return this.save({ validateBeforeSave: false });
};

module.exports = mongoose.model('ShareToken', shareTokenSchema);

// Analytics model for tracking usage
const analyticsSchema = new mongoose.Schema({
  personaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  metrics: {
    views: { type: Number, default: 0 },
    chats: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    messages: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 }
  },
  // Aggregate weekly/monthly data
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily',
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient time-series queries
analyticsSchema.index({ personaId: 1, date: -1, period: 1 });

module.exports.Analytics = mongoose.model('Analytics', analyticsSchema);