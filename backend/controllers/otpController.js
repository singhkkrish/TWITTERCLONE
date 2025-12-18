const OTP = require('../models/OTP');
const User = require('../models/User');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

exports.requestOTP = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await OTP.deleteMany({ userId: req.userId, isVerified: false });

    const otp = generateOTP();
    
    const otpRecord = new OTP({
      userId: req.userId,
      email: user.email,
      otp: otp,
      purpose: 'audio_upload',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    await otpRecord.save();

    // Send OTP email
    await sendOTPEmail(user.email, otp, user.name);

    res.json({
      message: 'OTP sent successfully to your email',
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Mask email
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp || otp.length !== 6) {
      return res.status(400).json({ message: 'Invalid OTP format' });
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({
      userId: req.userId,
      otp: otp,
      isVerified: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark OTP as verified
    otpRecord.isVerified = true;
    await otpRecord.save();

    res.json({
      message: 'OTP verified successfully',
      verified: true,
      otpId: otpRecord._id
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Failed to verify OTP', error: error.message });
  }
};

exports.checkOTPVerification = async (req, res) => {
  try {
    const verifiedOTP = await OTP.findOne({
      userId: req.userId,
      isVerified: true,
      expiresAt: { $gt: new Date() }
    });

    res.json({
      verified: !!verifiedOTP,
      otpId: verifiedOTP?._id
    });
  } catch (error) {
    console.error('Check OTP verification error:', error);
    res.status(500).json({ message: 'Failed to check OTP verification', error: error.message });
  }
};