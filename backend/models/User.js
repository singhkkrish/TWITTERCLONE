const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const loginHistorySchema = new mongoose.Schema({
  loginTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  logoutTime: Date,
  ipAddress: {
    type: String,
    required: true
  },
  browser: {
    name: String,
    version: String,
    fullString: String
  },
  os: {
    name: String,
    version: String,
    fullString: String
  },
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown'
  },
  location: {
    country: String,
    city: String,
    region: String,
    timezone: String
  },
  accessGranted: {
    type: Boolean,
    default: true
  },
  accessDeniedReason: String,
  requiresOTP: {
    type: Boolean,
    default: false
  },
  otpVerified: {
    type: Boolean,
    default: false
  },
  sessionId: String,
  userAgent: String
}, {
  timestamps: true
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    default: '',
    maxlength: 160
  },
  profilePicture: {
    type: String,
    default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
  },
  coverPicture: {
    type: String,
    default: ''
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tweets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet'
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet'
  }],
  retweets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tweet'
  }],
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  preferredLanguage: {
    type: String,
    enum: ['en', 'es', 'hi', 'pt', 'zh', 'fr'],
    default: 'en'
  },
  phoneNumber: {
    type: String,
    sparse: true,
    trim: true
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  languageOTP: {
    code: String,
    expiresAt: Date,
    type: {
      type: String,
      enum: ['email', 'phone']
    }
  },
  loginHistory: [loginHistorySchema],
  currentSession: {
    sessionId: String,
    loginTime: Date,
    ipAddress: String,
    browser: String,
    device: String,
    lastActivity: Date
  },
  browserOTP: {
    code: String,
    expiresAt: Date,
    browser: String,
    ipAddress: String,
    device: String
  },
  trustedDevices: [{
    deviceFingerprint: String,
    browser: String,
    addedAt: Date,
    lastUsed: Date
  }],
  securitySettings: {
    requireOTPForChrome: {
      type: Boolean,
      default: true
    },
    mobileAccessRestricted: {
      type: Boolean,
      default: true
    },
    mobileAccessStartHour: {
      type: Number,
      default: 10
    },
    mobileAccessEndHour: {
      type: Number,
      default: 13
    }
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.addLoginHistory = function(loginData) {
  if (this.loginHistory.length >= 50) {
    this.loginHistory.shift();
  }
  this.loginHistory.push(loginData);
};

userSchema.methods.isTrustedDevice = function(deviceFingerprint) {
  return this.trustedDevices.some(device => 
    device.deviceFingerprint === deviceFingerprint
  );
};

userSchema.methods.addTrustedDevice = function(deviceData) {
  const existingDevice = this.trustedDevices.find(
    d => d.deviceFingerprint === deviceData.deviceFingerprint
  );
  
  if (existingDevice) {
    existingDevice.lastUsed = new Date();
  } else {
    this.trustedDevices.push({
      ...deviceData,
      addedAt: new Date(),
      lastUsed: new Date()
    });
  }
};

module.exports = mongoose.model('User', userSchema);
