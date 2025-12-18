const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  planType: {
    type: String,
    enum: ['free', 'bronze', 'silver', 'gold'],
    default: 'free'
  },
  planName: {
    type: String,
    default: 'Free Plan'
  },
  amount: {
    type: Number,
    default: 0
  },
  tweetsLimit: {
    type: Number,
    default: 1
  },
  tweetsUsed: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: function() {
      if (this.planType === 'free') {
        return null;
      }
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  invoiceUrl: String,
  lastPaymentDate: Date
}, {
  timestamps: true
});

subscriptionSchema.methods.isExpired = function() {
  if (!this.endDate) return false;
  return new Date() > this.endDate;
};

subscriptionSchema.methods.canPostTweet = function() {
  if (this.isExpired()) return false;
  if (this.planType === 'gold') return true;
  return this.tweetsUsed < this.tweetsLimit;
};

subscriptionSchema.methods.incrementTweetCount = async function() {
  this.tweetsUsed += 1;
  await this.save();
};

subscriptionSchema.methods.resetToFree = async function() {
  this.planType = 'free';
  this.planName = 'Free Plan';
  this.amount = 0;
  this.tweetsLimit = 1;
  this.tweetsUsed = 0;
  this.isActive = true;
  this.startDate = new Date();
  this.endDate = null;
  this.paymentStatus = 'pending';
  await this.save();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
