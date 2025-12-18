const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  planType: {
    type: String,
    enum: ['bronze', 'silver', 'gold'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['created', 'pending', 'success', 'failed'],
    default: 'created'
  },
  paymentMethod: String,
  paymentDate: Date,
  invoiceUrl: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema);
