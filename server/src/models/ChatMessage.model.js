const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  personaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Persona',
    required: [true, 'Persona ID is required']
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    index: true
  },
  sender: {
    type: String,
    enum: ['user', 'persona'],
    required: [true, 'Sender type is required']
  },
  text: {
    type: String,
    required: [true, 'Message text is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    responseTime: Number, // ms for persona responses
    confidence: Number, // 0-1 for AI responses
    model: String // which inference model was used
  }
}, {
  timestamps: { createdAt: 'ts', updatedAt: false },
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      delete ret.metadata?.ipAddress; // Privacy
      return ret;
    }
  }
});

// Indexes for efficient queries
chatMessageSchema.index({ personaId: 1, ts: -1 });
chatMessageSchema.index({ sessionId: 1, ts: 1 });
chatMessageSchema.index({ ts: -1 });

// Method to sanitize message for public view
chatMessageSchema.methods.toPublic = function() {
  const obj = this.toObject();
  delete obj.metadata;
  return obj;
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);