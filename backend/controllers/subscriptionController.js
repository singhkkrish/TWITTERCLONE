const Razorpay = require('razorpay');
const crypto = require('crypto');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendSubscriptionInvoice } = require('../utils/emailService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PLANS = {
  bronze: {
    name: 'Bronze Plan',
    amount: 10000,
    tweetsLimit: 3,
    displayAmount: 100
  },
  silver: {
    name: 'Silver Plan',
    amount: 30000,
    tweetsLimit: 5,
    displayAmount: 300
  },
  gold: {
    name: 'Gold Plan',
    amount: 100000,
    tweetsLimit: -1,
    displayAmount: 1000
  }
};

const isPaymentTimeAllowed = () => {
  const now = new Date();
  const istTimeString = now.toLocaleString('en-US', { 
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  const [hours, minutes] = istTimeString.split(':').map(Number);
  console.log(`Current IST time: ${hours}:${minutes.toString().padStart(2, '0')}`);
  return hours === 11;
};

const getNextAvailableTime = () => {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = istFormatter.formatToParts(now);
  const istParts = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      istParts[part.type] = parseInt(part.value);
    }
  });
  console.log(`Current IST time parts:`, istParts);
  let nextSlotIST;
  if (istParts.hour < 10) {
    nextSlotIST = {
      year: istParts.year,
      month: istParts.month,
      day: istParts.day,
      hour: 10,
      minute: 0
    };
  } else if (istParts.hour === 10) {
    nextSlotIST = {
      year: istParts.year,
      month: istParts.month,
      day: istParts.day,
      hour: 10,
      minute: 0
    };
  } else {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowParts = {};
    istFormatter.formatToParts(tomorrow).forEach(part => {
      if (part.type !== 'literal') {
        tomorrowParts[part.type] = parseInt(part.value);
      }
    });
    nextSlotIST = {
      year: tomorrowParts.year,
      month: tomorrowParts.month,
      day: tomorrowParts.day,
      hour: 10,
      minute: 0
    };
  }
  console.log(`Next slot in IST:`, nextSlotIST);
  const istDateString = `${nextSlotIST.year}-${String(nextSlotIST.month).padStart(2, '0')}-${String(nextSlotIST.day).padStart(2, '0')}T${String(nextSlotIST.hour).padStart(2, '0')}:${String(nextSlotIST.minute).padStart(2, '0')}:00+05:30`;
  const nextAvailableDate = new Date(istDateString);
  console.log(`Next available time (UTC):`, nextAvailableDate.toISOString());
  console.log(`Next available time (IST):`, nextAvailableDate.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  return nextAvailableDate;
};

exports.getUserSubscription = async (req, res) => {
  try {
    let subscription = await Subscription.findOne({ userId: req.userId });
    if (!subscription) {
      subscription = new Subscription({
        userId: req.userId,
        planType: 'free',
        planName: 'Free Plan',
        amount: 0,
        tweetsLimit: 1,
        tweetsUsed: 0
      });
      await subscription.save();
      await User.findByIdAndUpdate(req.userId, { subscription: subscription._id });
    }
    if (subscription.isExpired()) {
      await subscription.resetToFree();
    }
    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Failed to get subscription', error: error.message });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free Plan',
        amount: 0,
        displayAmount: 0,
        tweetsLimit: 1,
        features: ['1 tweet per month', 'Basic features', 'Community support']
      },
      {
        id: 'bronze',
        name: 'Bronze Plan',
        amount: PLANS.bronze.amount,
        displayAmount: PLANS.bronze.displayAmount,
        tweetsLimit: PLANS.bronze.tweetsLimit,
        features: ['3 tweets per month', 'Audio tweets', 'Priority support', '30 days validity']
      },
      {
        id: 'silver',
        name: 'Silver Plan',
        amount: PLANS.silver.amount,
        displayAmount: PLANS.silver.displayAmount,
        tweetsLimit: PLANS.silver.tweetsLimit,
        features: ['5 tweets per month', 'Audio tweets', 'Priority support', 'Advanced analytics', '30 days validity']
      },
      {
        id: 'gold',
        name: 'Gold Plan',
        amount: PLANS.gold.amount,
        displayAmount: PLANS.gold.displayAmount,
        tweetsLimit: -1,
        features: ['Unlimited tweets', 'Audio tweets', 'Priority support', 'Advanced analytics', 'Verified badge', '30 days validity']
      }
    ];
    res.json({ plans, paymentTimeAllowed: isPaymentTimeAllowed() });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Failed to get plans', error: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { planType } = req.body;
    if (!isPaymentTimeAllowed()) {
      return res.status(403).json({ 
        message: 'Payment is only allowed between 10:00 AM - 11:00 AM IST',
        paymentTimeRestriction: true
      });
    }
    if (!PLANS[planType]) {
      return res.status(400).json({ message: 'Invalid plan type' });
    }
    const plan = PLANS[planType];
    const options = {
      amount: plan.amount,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
      notes: {
        userId: req.userId,
        planType: planType,
        planName: plan.name
      }
    };
    const order = await razorpay.orders.create(options);
    const payment = new Payment({
      userId: req.userId,
      orderId: options.receipt,
      razorpayOrderId: order.id,
      planType: planType,
      amount: plan.displayAmount,
      currency: 'INR',
      status: 'created'
    });
    await payment.save();
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentId: payment._id,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      paymentId 
    } = req.body;

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      await Payment.findByIdAndUpdate(paymentId, { status: 'failed' });
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.status = 'success';
    payment.paymentDate = new Date();
    await payment.save();

    let subscription = await Subscription.findOne({ userId: req.userId });
    const plan = PLANS[payment.planType];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    if (subscription) {
      subscription.planType = payment.planType;
      subscription.planName = plan.name;
      subscription.amount = plan.displayAmount;
      subscription.tweetsLimit = plan.tweetsLimit;
      subscription.tweetsUsed = 0;
      subscription.isActive = true;
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.razorpayOrderId = razorpay_order_id;
      subscription.razorpayPaymentId = razorpay_payment_id;
      subscription.razorpaySignature = razorpay_signature;
      subscription.paymentStatus = 'completed';
      subscription.lastPaymentDate = new Date();
      await subscription.save();
    } else {
      subscription = new Subscription({
        userId: req.userId,
        planType: payment.planType,
        planName: plan.name,
        amount: plan.displayAmount,
        tweetsLimit: plan.tweetsLimit,
        tweetsUsed: 0,
        isActive: true,
        startDate: startDate,
        endDate: endDate,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paymentStatus: 'completed',
        lastPaymentDate: new Date()
      });
      await subscription.save();
      await User.findByIdAndUpdate(req.userId, { subscription: subscription._id });
    }

    const user = await User.findById(req.userId);

    try {
      await sendSubscriptionInvoice(
        user.email,
        user.name,
        {
          planType: subscription.planType,
          planName: subscription.planName,
          amount: subscription.amount,
          startDate: subscription.startDate,
          endDate: subscription.endDate,
          tweetsLimit: subscription.tweetsLimit
        },
        {
          orderId: payment.orderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          paymentDate: payment.paymentDate
        }
      );
    } catch (emailError) {
      console.error('Failed to send invoice email:', emailError);
    }

    res.json({
      message: 'Payment verified successfully',
      success: true,
      subscription: subscription
    });

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
};

exports.checkPaymentTime = async (req, res) => {
  try {
    const allowed = isPaymentTimeAllowed();
    const nextAvailable = getNextAvailableTime();
    const now = new Date();
    const istTimeString = now.toLocaleString('en-US', { 
      timeZone: 'Asia/Kolkata',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    res.json({
      paymentAllowed: allowed,
      currentTimeIST: istTimeString,
      nextAvailableTime: nextAvailable.toISOString(),
      message: allowed 
        ? 'Payment is currently available (10:00 AM - 11:00 AM IST)' 
        : 'Payment is only allowed between 10:00 AM - 11:00 AM IST'
    });
  } catch (error) {
    console.error('Check payment time error:', error);
    res.status(500).json({ message: 'Failed to check payment time', error: error.message });
  }
};

module.exports = exports;
