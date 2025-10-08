const mongoose = require('mongoose');

const personaSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Allow anonymous personas
  },
  name: {
    type: String,
    required: [true, 'Persona name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  avatar: {
    type: String,
    default: '🤖'
  },
  tagline: {
    type: String,
    required: [true, 'Tagline is required'],
    trim: true,
    maxlength: [200, 'Tagline cannot exceed 200 characters']
  },
  // Core personality traits
  traits: [{
    type: String,
    maxlength: [30, 'Trait cannot exceed 30 characters']
  }],
  // Communication style properties
  tone: {
    type: String,
    enum: ['formal', 'casual', 'friendly', 'professional', 'creative', 'analytical'],
    default: 'friendly'
  },
  formality: {
    type: Number,
    min: [0, 'Formality must be between 0 and 1'],
    max: [1, 'Formality must be between 0 and 1'],
    default: 0.5
  },
  energy: {
    type: Number,
    min: [0, 'Energy must be between 0 and 1'],
    max: [1, 'Energy must be between 0 and 1'],
    default: 0.5
  },
  // Language and expression
  emojiStyle: {
    type: String,
    maxlength: [100, 'Emoji style cannot exceed 100 characters'],
    default: '😊 👍 🌟'
  },
  favoriteWords: [{
    type: String,
    maxlength: [50, 'Word cannot exceed 50 characters']
  }],
  signaturePhrases: [{
    type: String,
    maxlength: [200, 'Phrase cannot exceed 200 characters']
  }],
  // Training data and context
  seedText: {
    type: String,
    required: [true, 'Seed text is required for persona generation'],
    minlength: [50, 'Seed text must be at least 50 characters'],
    maxlength: [10000, 'Seed text cannot exceed 10,000 characters']
  },
  // Analysis metadata
  analysisData: {
    wordCount: Number,
    sentenceCount: Number,
    sentiment: {
      polarity: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        default: 'neutral'
      },
      strength: {
        type: Number,
        min: 0,
        max: 1,
        default: 0.5
      }
    },
    topics: [{
      type: String,
      enum: ['technology', 'creativity', 'business', 'lifestyle', 'entertainment', 'education']
    }],
    vocabularyRichness: {
      type: Number,
      min: 0,
      max: 1
    }
  },
  // Visibility and sharing
  meta: {
    visibility: {
      type: String,
      enum: ['private', 'public', 'unlisted'],
      default: 'private'
    },
    featured: {
      type: Boolean,
      default: false
    },
    tags: [{
      type: String,
      lowercase: true,
      trim: true,
      maxlength: [20, 'Tag cannot exceed 20 characters']
    }]
  },
  // Usage statistics
  stats: {
    views: { type: Number, default: 0 },
    chats: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    lastUsed: { type: Date, default: Date.now },
    totalMessages: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance and queries
personaSchema.index({ ownerId: 1, createdAt: -1 });
personaSchema.index({ 'meta.visibility': 1, createdAt: -1 });
personaSchema.index({ 'meta.featured': 1, 'meta.visibility': 1 });
personaSchema.index({ 'meta.tags': 1 });
personaSchema.index({ name: 'text', tagline: 'text' }); // Text search

// Virtual for public URL
personaSchema.virtual('publicUrl').get(function() {
  return `/personas/${this._id}`;
});

// Method to check if persona is viewable by user
personaSchema.methods.canView = function(userId) {
  if (this.meta.visibility === 'public') return true;
  if (this.meta.visibility === 'unlisted') return true;
  if (this.ownerId && userId && this.ownerId.toString() === userId.toString()) return true;
  return false;
};

// Method to check if persona can be edited by user
personaSchema.methods.canEdit = function(userId) {
  if (!userId) return false;
  if (this.ownerId && this.ownerId.toString() === userId.toString()) return true;
  return false;
};

// Method to increment view count
personaSchema.methods.incrementViews = function() {
  this.stats.views += 1;
  this.stats.lastUsed = new Date();
  return this.save({ validateBeforeSave: false });
};

// Method to increment chat count
personaSchema.methods.incrementChats = function() {
  this.stats.chats += 1;
  this.stats.lastUsed = new Date();
  return this.save({ validateBeforeSave: false });
};

// Method to sanitize for public view
personaSchema.methods.toPublic = function() {
  const obj = this.toObject();
  
  // Remove sensitive data for public view
  if (obj.meta.visibility !== 'public') {
    delete obj.seedText;
    delete obj.analysisData;
  }
  
  return obj;
};

// Static method to find public personas
personaSchema.statics.findPublic = function(options = {}) {
  const query = { 'meta.visibility': 'public' };
  
  if (options.featured) {
    query['meta.featured'] = true;
  }
  
  if (options.tags && options.tags.length > 0) {
    query['meta.tags'] = { $in: options.tags };
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Static method to search personas
personaSchema.statics.search = function(searchTerm, options = {}) {
  const query = {
    $text: { $search: searchTerm },
    'meta.visibility': { $in: ['public', 'unlisted'] }
  };
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(options.limit || 20);
};

module.exports = mongoose.model('Persona', personaSchema);