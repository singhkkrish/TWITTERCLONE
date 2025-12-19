// Mailgun Email Service - Complete Implementation
// Works on Render with sandbox domain

const formData = require('form-data');
const Mailgun = require('mailgun.js');

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY
});

const DOMAIN = process.env.MAILGUN_DOMAIN;

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, otp, userName) => {
  try {
    const result = await mg.messages.create(DOMAIN, {
      from: `Twitter Clone <mailgun@${DOMAIN}>`,
      to: [email],
      subject: 'Audio Tweet Upload - OTP Verification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1DA1F2; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background-color: white; border: 2px dashed #1DA1F2; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
            .otp { font-size: 32px; font-weight: bold; color: #1DA1F2; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎙️ Audio Tweet Verification</h1>
            </div>
            <div class="content">
              <p>Hello ${userName},</p>
              <p>You requested to upload an audio tweet. Please use the OTP below to verify your request:</p>
              
              <div class="otp-box">
                <div class="otp">${otp}</div>
              </div>
              
              <p><strong>Important:</strong></p>
              <ul>
                <li>This OTP is valid for <strong>10 minutes</strong></li>
                <li>Audio uploads are only allowed between <strong>2:00 PM - 7:00 PM IST</strong></li>
              </ul>
              
              <p>If you didn't request this OTP, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2025 Twitter Clone. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ OTP email sent successfully to:', email);
    console.log('📧 Mailgun Message ID:', result.id);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw new Error('Failed to send OTP email: ' + (error.message || error));
  }
};

const sendPasswordResetEmail = async (email, userName, generatedPassword, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  
  try {
    const result = await mg.messages.create(DOMAIN, {
      from: `Twitter Clone <mailgun@${DOMAIN}>`,
      to: [email],
      subject: 'Password Reset Request - Twitter Clone',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1DA1F2 0%, #0d8bd9 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .password-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; margin: 20px 0; border-radius: 10px; }
            .password { font-size: 28px; font-weight: bold; letter-spacing: 3px; word-break: break-all; }
            .button { display: inline-block; background-color: #1DA1F2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; }
            .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .highlight { background-color: #e3f2fd; padding: 2px 8px; border-radius: 3px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${userName}</strong>,</p>
              <p>We received a request to reset your password. Here is your new temporary password:</p>
              
              <div class="password-box">
                <p style="margin: 0; font-size: 14px; opacity: 0.9;">Your New Password</p>
                <div class="password">${generatedPassword}</div>
              </div>
              
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password Now</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important Security Information:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>This password is temporary and valid for <span class="highlight">24 hours</span></li>
                  <li>You can only request password reset <span class="highlight">once per day</span></li>
                  <li>Please change this password after logging in</li>
                </ul>
              </div>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666;">
                If you didn't request this password reset, please ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Twitter Clone. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ Password reset email sent successfully to:', email);
    console.log('📧 Mailgun Message ID:', result.id);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send password reset email: ' + (error.message || error));
  }
};

const sendSubscriptionInvoice = async (email, userName, subscriptionData, paymentData) => {
  const { planType, planName, amount, startDate, endDate, tweetsLimit } = subscriptionData;
  const { orderId, razorpayPaymentId, paymentDate } = paymentData;
  
  try {
    const result = await mg.messages.create(DOMAIN, {
      from: `Twitter Clone <mailgun@${DOMAIN}>`,
      to: [email],
      subject: `Payment Successful - ${planName} Subscription`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); color: #000; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .invoice-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; margin: 20px 0; border-radius: 10px; }
            .invoice-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.2); }
            .invoice-row:last-child { border-bottom: none; font-weight: bold; font-size: 20px; }
            .plan-features { background-color: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
            .feature-item { padding: 8px 0; display: flex; align-items: center; }
            .checkmark { color: #28a745; margin-right: 10px; font-size: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; background-color: #1DA1F2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Payment Successful!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Welcome to ${planName}</p>
            </div>
            <div class="content">
              <p>Dear <strong>${userName}</strong>,</p>
              <p>Thank you for subscribing to Twitter Clone! Your payment has been processed successfully.</p>
              
              <div class="invoice-box">
                <h2 style="margin: 0 0 20px 0; font-size: 24px;">Invoice Details</h2>
                <div class="invoice-row">
                  <span>Order ID:</span>
                  <span style="font-family: monospace;">${orderId}</span>
                </div>
                <div class="invoice-row">
                  <span>Payment ID:</span>
                  <span style="font-family: monospace;">${razorpayPaymentId || 'N/A'}</span>
                </div>
                <div class="invoice-row">
                  <span>Plan:</span>
                  <span>${planName}</span>
                </div>
                <div class="invoice-row">
                  <span>Payment Date:</span>
                  <span>${new Date(paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div class="invoice-row">
                  <span>Valid Until:</span>
                  <span>${endDate ? new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Never Expires'}</span>
                </div>
                <div class="invoice-row">
                  <span>Amount Paid:</span>
                  <span>₹${amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div class="plan-features">
                <h3 style="margin: 0 0 15px 0; color: #333;">Your Plan Features:</h3>
                <div class="feature-item">
                  <span class="checkmark">✓</span>
                  <span><strong>${tweetsLimit === -1 ? 'Unlimited' : tweetsLimit} tweets</strong> per month</span>
                </div>
                <div class="feature-item">
                  <span class="checkmark">✓</span>
                  <span>Valid for <strong>30 days</strong></span>
                </div>
                <div class="feature-item">
                  <span class="checkmark">✓</span>
                  <span>Audio tweet support</span>
                </div>
                <div class="feature-item">
                  <span class="checkmark">✓</span>
                  <span>Priority support</span>
                </div>
              </div>

              <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <strong>📌 Important Notes:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>Your subscription will automatically expire after 30 days</li>
                  <li>You'll revert to the Free Plan after expiration</li>
                  <li>Renew anytime to continue enjoying premium features</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">Start Tweeting Now</a>
              </div>

              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
                Need help? Contact our support team
              </p>
            </div>
            <div class="footer">
              <p>© 2025 Twitter Clone. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('✅ Subscription invoice sent successfully to:', email);
    console.log('📧 Mailgun Message ID:', result.id);
    return true;
  } catch (error) {
    console.error('❌ Error sending subscription invoice:', error);
    throw new Error('Failed to send subscription invoice: ' + (error.message || error));
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendPasswordResetEmail,
  sendSubscriptionInvoice,
};