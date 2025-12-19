const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { Resend } = require('resend');
const loginTrackingService = require('../services/loginTrackingService');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendBrowserOTPEmail = async (email, name, otp, browserName, ipAddress) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Twitter Clone <onboarding@resend.dev>',
      to: [email],
      subject: 'Login Verification - Chrome Browser',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1DA1F2;">🔐 Login Verification Required</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>A login attempt was detected from <strong>${browserName}</strong>.</p>
          <p><strong>IP Address:</strong> ${ipAddress}</p>
          <p>Please use the following OTP to complete your login:</p>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 30px 0; border-radius: 12px; color: white;">
            ${otp}
          </div>
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #1DA1F2; margin: 20px 0;">
            <p style="margin: 0; color: #666;">⏱️ This OTP will expire in <strong>10 minutes</strong></p>
          </div>
          <p style="color: #666; font-size: 14px;">If you didn't attempt to login, please secure your account immediately.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Best regards,<br><strong>Twitter Clone Team</strong>
          </p>
        </div>
      `
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw error;
    }

    console.log('✅ Browser OTP email sent successfully');
  } catch (error) {
    console.error('❌ Error sending browser OTP email:', error);
    throw error;
  }
};

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, name } = req.body;

    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      username,
      email,
      password,
      name
    });

    await user.save();

    const trackingData = loginTrackingService.createLoginTrackingData(req);
    user.addLoginHistory({
      ...trackingData,
      accessGranted: true,
      requiresOTP: false,
      otpVerified: false
    });
    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, clientBrowser } = req.body;

    console.log('\n🔐 ===== LOGIN ATTEMPT =====');
    console.log('📧 Email:', email);
    console.log('📱 Client sent browser:', clientBrowser);

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Invalid password');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('✅ Password verified');

    const trackingData = loginTrackingService.createLoginTrackingData(req);
    const userAgent = req.headers['user-agent'] || '';
    
    const isBrave = clientBrowser === 'Brave' || 
                    loginTrackingService.isBraveBrowser(trackingData.browser.name, userAgent);
    const isMicrosoft = loginTrackingService.isMicrosoftBrowser(trackingData.browser.name, userAgent);
    const isChrome = !isBrave && !isMicrosoft && 
                     loginTrackingService.isChromeBrowser(trackingData.browser.name, userAgent);
    
    if (clientBrowser === 'Brave' && trackingData.browser.name === 'Chrome') {
      trackingData.browser.name = 'Brave';
      trackingData.browser.fullString = trackingData.browser.fullString.replace('Chrome', 'Brave');
    }
    
    const mobileAccessCheck = loginTrackingService.checkMobileAccess(trackingData.device, user);
    
    if (!mobileAccessCheck.allowed) {
      console.log('❌ Mobile access denied - outside allowed hours');
      
      user.addLoginHistory({
        ...trackingData,
        accessGranted: false,
        accessDeniedReason: mobileAccessCheck.reason,
        requiresOTP: false,
        otpVerified: false
      });
      await user.save();

      return res.status(403).json({
        message: mobileAccessCheck.reason,
        code: 'MOBILE_ACCESS_RESTRICTED',
        allowedHours: {
          start: mobileAccessCheck.startHour,
          end: mobileAccessCheck.endHour
        }
      });
    }

    if (isBrave) {
      console.log('✅ Brave browser detected - No OTP required');
      
      user.addLoginHistory({
        ...trackingData,
        accessGranted: true,
        requiresOTP: false,
        otpVerified: false
      });

      user.currentSession = {
        sessionId: trackingData.sessionId,
        loginTime: new Date(),
        ipAddress: trackingData.ipAddress,
        browser: trackingData.browser.name,
        device: trackingData.device,
        lastActivity: new Date()
      };

      await user.save();

      const token = generateToken(user._id);

      console.log('✅ Login successful (Brave - No OTP)');
      console.log('=========================\n');

      return res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          preferredLanguage: user.preferredLanguage
        }
      });
    }
    
    if (isMicrosoft) {
      console.log('✅ Microsoft browser detected - No OTP required');
      
      user.addTrustedDevice({
        deviceFingerprint: trackingData.deviceFingerprint,
        browser: trackingData.browser.name
      });

      user.addLoginHistory({
        ...trackingData,
        accessGranted: true,
        requiresOTP: false,
        otpVerified: false
      });

      user.currentSession = {
        sessionId: trackingData.sessionId,
        loginTime: new Date(),
        ipAddress: trackingData.ipAddress,
        browser: trackingData.browser.name,
        device: trackingData.device,
        lastActivity: new Date()
      };

      await user.save();

      const token = generateToken(user._id);

      console.log('✅ Login successful (Microsoft - No OTP)');
      console.log('=========================\n');

      return res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          profilePicture: user.profilePicture,
          preferredLanguage: user.preferredLanguage
        }
      });
    }
  
    if (isChrome) {
      console.log('🔐 Chrome detected - OTP required');
      
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      console.log('🔢 Generated OTP:', otp);
      console.log('📧 Sending OTP email...');

      try {
        await sendBrowserOTPEmail(
          user.email,
          user.name,
          otp,
          trackingData.browser.fullString,
          trackingData.ipAddress
        );

        user.browserOTP = {
          code: otp,
          expiresAt: expiresAt,
          browser: trackingData.browser.name,
          ipAddress: trackingData.ipAddress,
          device: trackingData.device
        };

        user.addLoginHistory({
          ...trackingData,
          accessGranted: false,
          accessDeniedReason: 'Waiting for OTP verification',
          requiresOTP: true,
          otpVerified: false
        });

        await user.save();

        console.log('✅ OTP email sent');
        console.log('=========================\n');

        return res.json({
          requiresOTP: true,
          message: 'OTP sent to your email',
          userId: user._id,
          browserType: 'chrome'
        });
      } catch (emailError) {
        console.error('❌ Email error:', emailError);
        return res.status(500).json({
          message: 'Failed to send OTP email'
        });
      }
    }

    console.log('✅ Other browser - No OTP required');
    
    user.addLoginHistory({
      ...trackingData,
      accessGranted: true,
      requiresOTP: false,
      otpVerified: false
    });

    user.currentSession = {
      sessionId: trackingData.sessionId,
      loginTime: new Date(),
      ipAddress: trackingData.ipAddress,
      browser: trackingData.browser.name,
      device: trackingData.device,
      lastActivity: new Date()
    };

    await user.save();

    const token = generateToken(user._id);

    console.log('✅ Login successful (Other browser - No OTP)');
    console.log('=========================\n');

    return res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        preferredLanguage: user.preferredLanguage
      }
    });

  } catch (error) {
    console.error('💥 Login error:', error);
    console.log('=========================\n');
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.verifyBrowserOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    console.log('\n🔐 ===== VERIFY BROWSER OTP =====');
    console.log('👤 User ID:', userId);
    console.log('🔢 OTP:', otp);

    if (!userId || !otp) {
      return res.status(400).json({ message: 'User ID and OTP are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.browserOTP || !user.browserOTP.code) {
      return res.status(400).json({ message: 'No OTP found. Please login again.' });
    }

    if (new Date() > user.browserOTP.expiresAt) {
      user.browserOTP = undefined;
      await user.save();
      console.log('❌ OTP expired');
      return res.status(400).json({ message: 'OTP expired. Please login again.' });
    }

    if (user.browserOTP.code !== otp) {
      console.log('❌ Invalid OTP');
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    console.log('✅ OTP verified');

    const trackingData = loginTrackingService.createLoginTrackingData(req);

    user.addLoginHistory({
      ...trackingData,
      accessGranted: true,
      requiresOTP: true,
      otpVerified: true
    });

    user.currentSession = {
      sessionId: trackingData.sessionId,
      loginTime: new Date(),
      ipAddress: trackingData.ipAddress,
      browser: trackingData.browser.name,
      device: trackingData.device,
      lastActivity: new Date()
    };

    user.browserOTP = undefined;
    await user.save();

    const token = generateToken(user._id);

    console.log('✅ Login successful (Chrome - OTP verified)');
    console.log('=========================\n');

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        preferredLanguage: user.preferredLanguage
      }
    });

  } catch (error) {
    console.error('💥 Verify OTP error:', error);
    console.log('=========================\n');
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('followers', 'username name profilePicture')
      .populate('following', 'username name profilePicture');

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getLoginHistory = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('loginHistory currentSession');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const sortedHistory = user.loginHistory.sort((a, b) => 
      new Date(b.loginTime) - new Date(a.loginTime)
    );

    res.json({
      currentSession: user.currentSession,
      loginHistory: sortedHistory,
      totalLogins: sortedHistory.length
    });

  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (user && user.currentSession) {
      if (user.loginHistory.length > 0) {
        const lastLogin = user.loginHistory[user.loginHistory.length - 1];
        if (lastLogin.sessionId === user.currentSession.sessionId) {
          lastLogin.logoutTime = new Date();
        }
      }

      user.currentSession = undefined;
      await user.save();
    }

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;