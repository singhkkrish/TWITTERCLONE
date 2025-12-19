const User = require('../models/User');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const twilio = require('twilio');

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize Mailgun
const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY
});

const DOMAIN = process.env.MAILGUN_DOMAIN;

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendLanguageOTPEmail = async (email, name, otp, language) => {
  const languageNames = {
    en: 'English',
    es: 'Spanish',
    hi: 'Hindi',
    pt: 'Portuguese',
    zh: 'Chinese',
    fr: 'French'
  };

  try {
    const result = await mg.messages.create(DOMAIN, {
      from: `Twitter Clone <mailgun@${DOMAIN}>`,
      to: [email],
      subject: 'Language Change Verification - OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1DA1F2;">Language Change Verification</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>You requested to change your language to <strong>${languageNames[language]}</strong>.</p>
          <p>Please use the following OTP to verify:</p>
          <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 8px;">
            ${otp}
          </div>
          <p>This OTP will expire in <strong>10 minutes</strong>.</p>
          <p>If you didn't request this change, please ignore this email.</p>
          <br>
          <p style="color: #666;">Best regards,<br>Twitter Clone Team</p>
        </div>
      `
    });

    console.log('✅ Language OTP email sent successfully');
    console.log('📧 Mailgun Message ID:', result.id);
  } catch (error) {
    console.error('❌ Error sending language OTP email:', error);
    throw error;
  }
};

exports.getCurrentLanguage = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('preferredLanguage phoneNumber isPhoneVerified');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({
      success: true,
      language: user.preferredLanguage || 'en',
      hasPhoneNumber: !!user.phoneNumber,
      isPhoneVerified: user.isPhoneVerified || false
    });
  } catch (error) {
    console.error('Get current language error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.requestLanguageChange = async (req, res) => {
  try {
    const { language, phoneNumber } = req.body;
    const userId = req.user.id;

    console.log('📝 Language change request:', { language, phoneNumber });

    const validLanguages = ['en', 'es', 'hi', 'pt', 'zh', 'fr'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid language code' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (language === 'en') {
      user.preferredLanguage = language;
      await user.save();
      
      console.log('✅ Language changed to English (no OTP required)');
      
      return res.json({ 
        success: true,
        requiresOTP: false,
        message: 'Language changed to English successfully',
        language: language
      });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    console.log('🔢 Generated OTP:', otp);

    // French requires EMAIL OTP
    if (language === 'fr') {
      if (!user.email) {
        return res.status(400).json({ 
          success: false,
          message: 'Email not found' 
        });
      }

      console.log('📧 Sending email OTP for French...');

      try {
        await sendLanguageOTPEmail(user.email, user.name, otp, language);
        
        user.languageOTP = {
          code: otp,
          expiresAt: expiresAt,
          type: 'email'
        };
        await user.save();

        console.log('✅ Email OTP sent successfully');

        return res.json({
          success: true,
          requiresOTP: true,
          otpType: 'email',
          message: 'OTP sent to your email',
          language: language
        });
      } catch (emailError) {
        console.error('❌ Email error:', emailError);
        return res.status(500).json({ 
          success: false,
          message: 'Failed to send email OTP: ' + emailError.message
        });
      }
    }

    // Other languages require PHONE OTP
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false,
        message: 'Phone number required for this language',
        requiresPhone: true
      });
    }

    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid phone number format. Use international format: +1234567890' 
      });
    }

    console.log('📱 Sending SMS OTP via Twilio...');
    console.log('📞 Phone number:', phoneNumber);

    try {
      const message = await twilioClient.messages.create({
        body: `Your Twitter Clone language change OTP is: ${otp}. Valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      console.log('✅ SMS sent successfully');
      console.log('📨 Message SID:', message.sid);

      user.phoneNumber = phoneNumber;
      user.languageOTP = {
        code: otp,
        expiresAt: expiresAt,
        type: 'phone'
      };
      await user.save();

      const maskedPhone = phoneNumber.replace(/(\+\d{1,3})\d+(\d{4})/, '$1******$2');

      return res.json({
        success: true,
        requiresOTP: true,
        otpType: 'phone',
        maskedPhone: maskedPhone,
        message: 'OTP sent to your phone',
        language: language
      });
    } catch (twilioError) {
      console.error('❌ Twilio error:', twilioError);
      return res.status(500).json({ 
        success: false,
        message: 'Failed to send SMS. Please check your phone number.' 
      });
    }

  } catch (error) {
    console.error('💥 Request language change error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

exports.verifyLanguageOTP = async (req, res) => {
  try {
    const { otp, language } = req.body;
    const userId = req.user.id;

    console.log('🔐 Verifying OTP:', { otp, language });

    if (!otp || !language) {
      return res.status(400).json({ 
        success: false,
        message: 'OTP and language are required' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (!user.languageOTP || !user.languageOTP.code) {
      return res.status(400).json({ 
        success: false,
        message: 'No OTP request found. Please request a new OTP.' 
      });
    }

    if (new Date() > user.languageOTP.expiresAt) {
      user.languageOTP = undefined;
      await user.save();
      return res.status(400).json({ 
        success: false,
        message: 'OTP expired. Please request a new one.' 
      });
    }

    if (user.languageOTP.code !== otp) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid OTP. Please try again.' 
      });
    }

    console.log('✅ OTP verified successfully');

    user.preferredLanguage = language;
    
    if (user.languageOTP.type === 'phone') {
      user.isPhoneVerified = true;
      console.log('✅ Phone marked as verified');
    }
    
    user.languageOTP = undefined;
    await user.save();

    console.log('✅ Language changed to:', language);

    res.json({
      success: true,
      message: 'Language changed successfully',
      language: language
    });

  } catch (error) {
    console.error('💥 Verify language OTP error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

exports.updatePhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const userId = req.user.id;

    console.log('📱 Updating phone number:', phoneNumber);

    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid phone number format. Use international format: +1234567890' 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    user.phoneNumber = phoneNumber;
    user.isPhoneVerified = false;
    await user.save();

    console.log('✅ Phone number updated');

    res.json({ 
      success: true,
      message: 'Phone number updated successfully',
      phoneNumber: phoneNumber
    });

  } catch (error) {
    console.error('💥 Update phone number error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message
    });
  }
};

module.exports = exports;