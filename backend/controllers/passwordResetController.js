const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const { generateRandomPassword, generateResetToken } = require('../utils/passwordGenerator');
const { sendPasswordResetEmail } = require('../utils/emailService');
const bcrypt = require('bcryptjs');

exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json({ 
        message: 'If an account with that email exists, a password reset link has been sent.',
        success: true 
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingResetToday = await PasswordReset.findOne({
      userId: user._id,
      createdAt: { $gte: today, $lt: tomorrow }
    }).sort({ createdAt: -1 }); // Get the most recent one

    if (existingResetToday) {
      console.log('Found existing reset request from today:', {
        created: existingResetToday.createdAt,
        isUsed: existingResetToday.isUsed
      });

      return res.status(429).json({ 
        message: 'You have already requested a password reset today. You can only request once per day. Please check your email for the previous reset link or try again tomorrow.',
        canRetry: false,
        nextRetryTime: tomorrow,
        lastRequestTime: existingResetToday.createdAt
      });
    }

    console.log('No existing reset found for today, creating new reset request');

    const generatedPassword = generateRandomPassword(12);
    
    const resetToken = generateResetToken();

    const passwordReset = new PasswordReset({
      userId: user._id,
      email: user.email,
      resetToken: resetToken,
      generatedPassword: generatedPassword,
      lastRequestDate: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await passwordReset.save();

    console.log('Password reset record created:', passwordReset._id);

    await sendPasswordResetEmail(user.email, user.name, generatedPassword, resetToken);

    res.json({
      message: 'Password reset email sent successfully. Please check your inbox.',
      success: true
    });

  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ message: 'Failed to process password reset request', error: error.message });
  }
};

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    const resetRecord = await PasswordReset.findOne({
      resetToken: token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    }).populate('userId', 'email name username');

    if (!resetRecord) {
      return res.status(400).json({ 
        message: 'Invalid or expired reset token',
        valid: false 
      });
    }

    res.json({
      valid: true,
      email: resetRecord.email,
      username: resetRecord.userId.username,
      generatedPassword: resetRecord.generatedPassword
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    res.status(500).json({ message: 'Failed to verify reset token', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword, confirmPassword, useGeneratedPassword } = req.body;

    if (!useGeneratedPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (!useGeneratedPassword && newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const resetRecord = await PasswordReset.findOne({
      resetToken: token,
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetRecord) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = await User.findById(resetRecord.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const passwordToSet = useGeneratedPassword ? resetRecord.generatedPassword : newPassword;

    user.password = passwordToSet;
    await user.save();

    console.log('Password updated for user:', user.email);

    resetRecord.isUsed = true;
    await resetRecord.save();

    console.log('Reset record marked as used');

    res.json({
      message: 'Password reset successfully. You can now login with your new password.',
      success: true
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password', error: error.message });
  }
};

exports.checkResetAvailability = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.json({ canRequest: true, message: 'You can request a password reset' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingResetToday = await PasswordReset.findOne({
      userId: user._id,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    if (existingResetToday) {
      return res.json({ 
        canRequest: false, 
        message: 'You have already requested a password reset today. Please try again tomorrow.',
        nextAvailableTime: tomorrow,
        lastRequestTime: existingResetToday.createdAt
      });
    }

    res.json({ canRequest: true, message: 'You can request a password reset' });

  } catch (error) {
    console.error('Check reset availability error:', error);
    res.status(500).json({ message: 'Failed to check reset availability', error: error.message });
  }
};