const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true
  },
  resetToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  generatedPassword: {
    type: String,
    required: true
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  requestCount: {
    type: Number,
    default: 1
  },
  lastRequestDate: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }
  }
}, {
  timestamps: true
});

passwordResetSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
